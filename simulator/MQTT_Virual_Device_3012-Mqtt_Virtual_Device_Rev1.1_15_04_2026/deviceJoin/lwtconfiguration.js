require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');

console.log('CVIP deviceJoin - MQTT DEBUG');

// Validate ENV
['VIN', 'IMEI', 'TBOX_SERIAL', 'CLIENT_ID'].forEach((k) => {
  if (!process.env[k]) {
    throw new Error(`Missing ENV variable: ${k}`);
  }
});

// Config
const CONFIG = {
  IMEI: process.env.IMEI,
  VIN: process.env.VIN,
  TBOX_SERIAL: process.env.TBOX_SERIAL,
  CLIENT_ID: process.env.CLIENT_ID,

  BROKER: 'mqtts://cvipiot-preprod.fca-india.com:18883',

  TOPIC_PUB: `/dongle/${process.env.VIN}/MQTTPROTOBUF/deviceJoined`,
  TOPIC_RSP: `/dongle/${process.env.VIN}/MQTTPROTOBUF/deviceJoinedRsp`,
  TOPIC_CMD: `/dongle/${process.env.VIN}/MQTTPROTOBUF/command`
};

// MQTT CONNECT (with LWT)
const client = mqtt.connect(CONFIG.BROKER, {
  clientId: CONFIG.CLIENT_ID,
  clean: true,
  keepalive: 30,
  username: 'guest',
  password: Buffer.alloc(0),
  protocolId: 'MQTT',
  protocolVersion: 4,
  connectTimeout: 10000,
  rejectUnauthorized: false,

  ca: fs.readFileSync('./certs/ca.crt'),
  cert: fs.readFileSync('./certs/client.crt'),
  key: fs.readFileSync('./certs/client.key'),

  //  LWT CONFIGURATION
  will: {
    topic: CONFIG.TOPIC_PUB,
    payload: JSON.stringify({
      vehicleId: CONFIG.VIN,
      tboxSerialNum: CONFIG.TBOX_SERIAL,
      imeiNo: CONFIG.IMEI,
      protocolVersion: '2.0.0',
      tboxOperatingState: 'DISCONNECTED',
      tboxApplicationState: 'CUSTOMER',
      tboxeSimState: 'NORMAL_SIM'
    }),
    qos: 1,
    retain: false
  }
});

// Debug packets (optional)
client.on('packetsend', (packet) => {
  // console.log('SEND:', packet.cmd, packet.topic || packet.messageId || '');
});

client.on('packetreceive', (packet) => {
  console.log('RECV:', packet.cmd, packet.reasonCode || '');
});

// On connect
client.on('connect', () => {
  console.log('CONNECTED');

  client.subscribe(
    [CONFIG.TOPIC_RSP, CONFIG.TOPIC_CMD],
    { qos: 1 },
    (err, granted) => {
      if (err) {
        console.error('SUBSCRIBE ERROR:', err.message);
        return;
      }

      console.log(
        'SUBSCRIBED:',
        granted.map(g => `${g.topic} qos=${g.qos}`).join(', ')
      );

      //  deviceJoined payload (NORMAL state)
      const payload = JSON.stringify({
        vehicleId: CONFIG.VIN,
        tboxSerialNum: CONFIG.TBOX_SERIAL,
        imeiNo: CONFIG.IMEI,
        protocolVersion: '2.0.0',
        tboxOperatingState: 'NORMAL',
        tboxApplicationState: 'CUSTOMER',
        tboxeSimState: 'NORMAL_SIM',
        NAD_SW_Version: 'ND0.00.11',
        MCU_SW_Version: 'MD0.00.03'
      });

      console.log('PUBLISHING deviceJoined...');
      console.log(payload);

      client.publish(CONFIG.TOPIC_PUB, payload, { qos: 1, retain: false }, (err2) => {
        if (err2) {
          console.error('PUBLISH ERROR:', err2.message);
          return;
        }
        console.log('deviceJoined SENT');
      });
    }
  );
});

// Receive messages
client.on('message', (topic, msg) => {
  console.log('\n MESSAGE RECEIVED');
  console.log('TOPIC:', topic);
  console.log('PAYLOAD:', msg.toString());
  console.log('--------------------------------');
});

// Events
client.on('error', err => console.error('ERROR:', err.message));
client.on('close', () => console.log('CLOSED (connection lost)'));
client.on('reconnect', () => console.log('RECONNECTING...'));
client.on('offline', () => console.log('OFFLINE'));

//  IMPORTANT: Handle CTRL+C (for LWT testing)
process.on('SIGINT', () => {
  console.log('\n Force exit triggered (LWT should fire)');
  process.exit(0); // Do NOT call client.end()
});