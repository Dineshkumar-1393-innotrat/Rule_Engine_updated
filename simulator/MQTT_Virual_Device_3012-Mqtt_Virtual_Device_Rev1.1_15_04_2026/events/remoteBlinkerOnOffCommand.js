require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const protobuf = require('protobufjs');


['VIN', 'IMEI', 'TBOX_SERIAL', 'CLIENT_ID'].forEach((k) => {
  if (!process.env[k]) {
    throw new Error(` Missing ENV variable: ${k}`);
  }
});
const CONFIG = {
  // IMEI: '356741396798769',
  // VIN: 'T123ZTZT867657777',
  IMEI: process.env.IMEI,
  VIN: process.env.VIN,
  TBOX_SERIAL: process.env.TBOX_SERIAL,
  CLIENT_ID: process.env.CLIENT_ID,
  BROKER: 'mqtts://lb2.cvip-preprod.citroen.in:48883',
  STATIC_MESSAGE_ID: 'dd52bab1-c64a-431b-a945-1602f26e9f4e'  
};
let sendCount = 0;

function getTimestamp() {
  const now = new Date();
  return {
    seconds: Math.floor(now.getTime() / 1000),
    nanos: (now.getTime() % 1000) * 1000000
  };
}

async function startEventTelemetry() {
  console.log('Loading Protobufs...');
  
  const root = await protobuf.load([
    'Jeep_Proto/jeep_event_message.proto',
    'Jeep_Proto/jeep_event.proto', 
    'Jeep_Proto/jeep_common.proto',
    'Jeep_Proto/timestamp.proto'
  ]);

  const EventMessage = root.lookupType('stla.cvip.jeep.EventMessage');
  const eTboxOperatingState = root.lookupEnum('stla.cvip.jeep.eTboxOperatingState');
  const eTboxApplicationState = root.lookupEnum('stla.cvip.jeep.eTboxApplicationState');
  const eTboxeSimState = root.lookupEnum('stla.cvip.jeep.eTboxeSimState');
  const RemoteBlinkerEventType = root.lookupEnum('stla.cvip.jeep.RemoteBlinkerEventType');

  console.log('Protobuf LOADED');
  console.log('EventMessage fields:', EventMessage.fieldsArray.map(f => f.name));
  
  console.log('eTboxOperatingState:', Object.keys(eTboxOperatingState.values));
  console.log('eTboxApplicationState:', Object.keys(eTboxApplicationState.values));
  console.log('eTboxeSimState:', Object.keys(eTboxeSimState.values));
  console.log('RemoteBlinkerEventType:', Object.keys(RemoteBlinkerEventType.values));

  const client = mqtt.connect(CONFIG.BROKER, {
    clientId: CONFIG.IMEI,
    clean: true,
    keepalive: 30,
    rejectUnauthorized: false,
    ca: fs.readFileSync('./certs/cvipcabundle.pem'),
    cert: fs.readFileSync('./certs/ping-cert.pem'),
    key: fs.readFileSync('./certs/ping-key.pem'),
    protocolVersion: 4
  });
  client.on('connect', () => {
    console.log(' MQTT CONNECTED');
    sendVehicleEvent(client, EventMessage, eTboxOperatingState, eTboxApplicationState, eTboxeSimState, RemoteBlinkerEventType);
    
    setInterval(() => {
      if (client.connected) sendVehicleEvent(client, EventMessage, eTboxOperatingState, eTboxApplicationState, eTboxeSimState, RemoteBlinkerEventType);
    }, 60000);
  });

  client.on('packetsend', (packet) => {
    if (packet.cmd === 'publish') {
      console.log(' SENT:', packet.topic, '(' + packet.payload.length + ' bytes)');
    }
  });
}

function sendVehicleEvent(client, EventMessage, eTboxOperatingState, eTboxApplicationState, eTboxeSimState, RemoteBlinkerEventType) {
  sendCount++;

  const NORMAL = eTboxOperatingState.values.normal;
  const CUSTOMER = eTboxApplicationState.values.customer;
  const NORMAL_SIM = eTboxeSimState.values.normal_sim;
  const TurnBlinkers_off = RemoteBlinkerEventType.values.TurnBlinkers_off;
console.log("STARTSTART",TurnBlinkers_off);

  const eventObj = {
    messageId: CONFIG.STATIC_MESSAGE_ID,                  
    //tboxOperatingState: NORMAL,                            
    eTboxApplicationState: CUSTOMER,                    
    tboxEsimState: NORMAL_SIM,                         
    version: "2.0.0",                                   
   // timeStamp: getTimestamp(),                         
    eventPayload: {                                    
      EventsData: [{
        timeStamp: getTimestamp(),
        //RemoteDoorLockUnlockCommandEventStatus
        RemoteBlinkerOnOffCommandEventStatus: {
          RemoteBlinkerEventState: TurnBlinkers_off                           
        }
      }]
    }
  };
console.log("eventObj",eventObj);

  try {
    const errMsg = EventMessage.verify(eventObj);
    if (errMsg) throw new Error("VERIFY FAILED: " + errMsg);

    const msg = EventMessage.create(eventObj);
    const buf = EventMessage.encode(msg).finish();
    const hex = buf.toString('hex').toUpperCase();

    console.log('\n SEND #' + sendCount + ' SUCCESS');
    console.log(' FULL PAYLOAD:', JSON.stringify(msg, null, 2));
    console.log(' SIZE:', buf.length, 'bytes');           // Now 120+ bytes!
    console.log(' FULL HEX:', hex);                       // Now 240+ chars!
    console.log(' TOPIC: /dongle/' + CONFIG.VIN + '/MQTTPROTOBUF/events');

    client.publish(`/dongle/${CONFIG.VIN}/MQTTPROTOBUF/events`, buf, { qos: 1 });
    
  } catch (e) {
    console.error(' ERROR:', e.message);
    console.error('Payload that failed:', JSON.stringify(eventObj, null, 2));
  }
}

startEventTelemetry().catch(console.error);
