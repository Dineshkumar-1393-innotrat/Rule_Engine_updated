require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');

console.log('CVIP remoteSMSWakeup WAIT MODE');

['VIN', 'IMEI', 'TBOX_SERIAL', 'CLIENT_ID'].forEach((k) => {
  if (!process.env[k]) {
    throw new Error(`Missing ENV variable: ${k}`);
  }
});

const CONFIG = {
  IMEI: process.env.IMEI,
  VIN: process.env.VIN,
  TBOX_SERIAL: process.env.TBOX_SERIAL,
  CLIENT_ID: process.env.CLIENT_ID,

  //BROKER: process.env.BROKER || 'mqtts://lb2.cvip-preprod.citroen.in:48883',
  BROKER: process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883',
  TOPIC_PUB: `/dongle/${process.env.VIN}/MQTTPROTOBUF/remoteSMSWakeup`,
  TOPIC_RSP: `/dongle/${process.env.VIN}/MQTTPROTOBUF/remoteSMSWakeupRsp`,
  TOPIC_CMD: `/dongle/${process.env.VIN}/MQTTPROTOBUF/command`
};

let commandReceived = false;

const client = mqtt.connect(CONFIG.BROKER, {
  clientId: CONFIG.CLIENT_ID,
  clean: true,
  keepalive: 30,
  username: 'guest',
  password: Buffer.alloc(0),
  protocolVersion: 4,
  rejectUnauthorized: false,

  ca: fs.readFileSync('./certs/ca.crt'),
  cert: fs.readFileSync('./certs/client.crt'),
  key: fs.readFileSync('./certs/client.key')
});

function sendRemoteSMSWakeup() {

  const payload = JSON.stringify({
    vehicleId: CONFIG.VIN,
    tboxSerialNum: CONFIG.TBOX_SERIAL,
    imeiNo: CONFIG.IMEI,
    protocolVersion: '2.0.0',
    tboxOperatingState: 'NORMAL',
    tboxApplicationState: 'CUSTOMER',
    tboxeSimState: 'NORMAL_SIM',
    NAD_SW_Version: 'ND0.02.03',
    MCU_SW_Version: 'MD0.02.03'
  });

  console.log('SENDING remoteSMSWakeup...');

  client.publish(
    CONFIG.TOPIC_PUB,
    payload,
    { qos: 1 },
    () => {
      console.log('remoteSMSWakeup SENT');
    }
  );
}

client.on('connect', () => {

  console.log('CONNECTED');

  client.subscribe(CONFIG.TOPIC_CMD, { qos: 1 }, (err) => {

    if (err) {
      console.log('SUB CMD ERROR');
      return;
    }

    console.log('SUBSCRIBED COMMAND');

    client.subscribe(CONFIG.TOPIC_RSP, { qos: 1 }, (err2) => {

      if (err2) {
        console.log('SUB RSP ERROR');
        return;
      }

      console.log('SUBSCRIBED RSP');

      console.log('WAITING FOR COMMAND...');
    });

  });

});

client.on('message', (topic, msg) => {

  console.log('\nMESSAGE ON:', topic);

  if (topic === CONFIG.TOPIC_CMD) {

    console.log('COMMAND RECEIVED');
    commandReceived = true;

    sendRemoteSMSWakeup();
  }

  if (topic === CONFIG.TOPIC_RSP) {

    console.log('ACK RECEIVED');
    console.log(msg.toString());
  }

});

client.on('error', err => console.log('ERROR', err.message));
client.on('close', () => console.log('CLOSED'));
client.on('reconnect', () => console.log('RECONNECTING'));
client.on('offline', () => console.log('OFFLINE'));