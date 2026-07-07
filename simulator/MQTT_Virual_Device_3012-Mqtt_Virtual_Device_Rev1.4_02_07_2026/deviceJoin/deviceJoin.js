require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');

console.log('CVIP deviceJoin - MQTTX PACKET DEBUG');

['VIN', 'IMEI', 'TBOX_SERIAL', 'CLIENT_ID'].forEach((k) => {
  if (!process.env[k]) {
    throw new Error(` Missing ENV variable: ${k}`);
  }
});

const CONFIG = {
  IMEI: process.env.IMEI,
  VIN: process.env.VIN,
  TBOX_SERIAL: process.env.TBOX_SERIAL,
  CLIENT_ID: process.env.CLIENT_ID,
  BROKER:process.env.BROKER || 'mqtts://cvipiot.fca-india.com:18883',
 // BROKER:process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883',
  // BROKER: process.env.BROKER || 'mqtts://lb2.cvip-preprod.citroen.in:48883',

  //BROKER: process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883',
  TOPIC_PUB: `/dongle/${process.env.VIN}/MQTTPROTOBUF/deviceJoined`,
TOPIC_RSP: `/dongle/${process.env.VIN}/MQTTPROTOBUF/deviceJoinedRsp`,
  TOPIC_CMD: `/dongle/${process.env.VIN}/MQTTPROTOBUF/command`  
};
console.log("Current Directory:", process.cwd());


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

  // ca: fs.readFileSync('./certs/ca.crt'),
  // cert: fs.readFileSync('./certs/client.crt'),
  // key: fs.readFileSync('./certs/client.key')


  // ca: fs.readFileSync('./certs/cvipcabundle.pem'),
    // cert: fs.readFileSync('./certs/ping-cert.pem'),
    // key: fs.readFileSync('./certs/ping-key.pem'),
  //  ca: fs.readFileSync('./JeepCommonCertificates_May05/ca.crt'),
  // cert: fs.readFileSync('./JeepCommonCertificates_May05/client.crt'),
  // key: fs.readFileSync('./JeepCommonCertificates_May05/client.key')
  ca: fs.existsSync('./certs/cacert.pem') ? fs.readFileSync('./certs/cacert.pem') : (fs.existsSync('./certs/ca.crt') ? fs.readFileSync('./certs/ca.crt') : fs.existsSync('./certs/cacert.pem') ? fs.readFileSync('./certs/cacert.pem') : (fs.existsSync('./certs/ca.crt') ? fs.readFileSync('./certs/ca.crt') : fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/cacert.pem'))),
  cert: fs.existsSync('./certs/client.pem') ? fs.readFileSync('./certs/client.pem') : (fs.existsSync('./certs/client.crt') ? fs.readFileSync('./certs/client.crt') : fs.existsSync('./certs/client.pem') ? fs.readFileSync('./certs/client.pem') : (fs.existsSync('./certs/client.crt') ? fs.readFileSync('./certs/client.crt') : fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/client.pem'))),
  key: fs.existsSync('./certs/device-key.key') ? fs.readFileSync('./certs/device-key.key') : (fs.existsSync('./certs/client.key') ? fs.readFileSync('./certs/client.key') : fs.existsSync('./certs/device-key.key') ? fs.readFileSync('./certs/device-key.key') : (fs.existsSync('./certs/client.key') ? fs.readFileSync('./certs/client.key') : fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/device-key.key')))
});


client.on('packetsend', (packet) => {
  // console.log(' SEND:', packet.cmd, packet.topic || packet.messageId || '');
});

client.on('packetreceive', (packet) => {
  console.log(' RECV:', packet.cmd, packet.reasonCode || packet.reasonString || '');
});

client.on('connect', () => {
  console.log(' CONNECTED - subscribing first');

  client.subscribe(
    [CONFIG.TOPIC_RSP, CONFIG.TOPIC_CMD],
    { qos: 1 },
    (err, granted) => {
      if (err) {
        console.error(' SUBSCRIBE ERROR:', err.message);
        return;
      }

      console.log(
        ' SUBSCRIBED:',
        granted.map(g => `${g.topic} qos=${g.qos}`).join(', ')
      );
     
      const payload = JSON.stringify({
        vehicleId: CONFIG.VIN,
        tboxSerialNum: CONFIG.TBOX_SERIAL,
        imeiNo: CONFIG.IMEI,
        protocolVersion: '2.0.0',
        tboxOperatingState: 'NORMAL',
        tboxApplicationState: 'CUSTOMER',
        tboxeSimState: 'NORMAL_SIM',
        NAD_SW_Version: 'LF0.00.01',
        MCU_SW_Version: 'TF0.00.01'
        // FOTAID:'4c95d27f-3a5e-11f1-8ed7-d1918ae1e475',
        // status:'NADInstallationSuccess',
        // releaseVersion:'8318.0'
      });

      console.log(' PUBLISHING deviceJoined JSON...');
      client.publish(CONFIG.TOPIC_PUB, payload, { qos: 1, retain: false }, (err2) => {
        if (err2) {
          console.error(' PUBLISH ERROR:', err2.message);
          return;
        }
        console.log(' PUBLISHED deviceJoined after subscribe');
      });
    }
  );
});

client.on('message', (topic, msg) => {
  console.log(' MESSAGE ON:', topic);
  console.log('Remote Address:', client.stream.remoteAddress);
  console.log(' PAYLOAD:', msg.toString());
  console.log('---');
});

client.on('error', err => console.error(' ERROR:', err.message));
client.on('close', () => console.log(' CLOSED - CVIP rejected'));
client.on('reconnect', () => console.log(' RECONNECTING...'));
client.on('offline', () => console.log(' OFFLINE'));
