require('dotenv').config();
const fs = require('fs');
const protobuf = require('protobufjs');
const CONFIG = {
  IMEI: process.env.IMEI,
  VIN: process.env.VIN,
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

async function generateHexToFile() {
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
  const IgnitionPropertyType = root.lookupEnum('stla.cvip.jeep.IgnitionPropertyType');

  console.log('Protobuf LOADED');
  console.log('EventMessage fields:', EventMessage.fieldsArray.map(f => f.name));
  
  console.log('eTboxOperatingState:', Object.keys(eTboxOperatingState.values));
  console.log('eTboxApplicationState:', Object.keys(eTboxApplicationState.values));
  console.log('eTboxeSimState:', Object.keys(eTboxeSimState.values));
  console.log('IgnitionPropertyType:', Object.keys(IgnitionPropertyType.values));

  const NORMAL_SIM = eTboxeSimState.values.normal_sim;
  const CUSTOMER = eTboxApplicationState.values.customer;
  const START = IgnitionPropertyType.values.START;
  console.log("START:", START);

  const eventObj = {
    messageId: CONFIG.STATIC_MESSAGE_ID,
    eTboxApplicationState: CUSTOMER,
    tboxEsimState: NORMAL_SIM,
    version: "2.0.0",
    eventPayload: { 
      EventsData: [{
        timeStamp: getTimestamp(),
        IgnitionStatus: {
          IgnitionState: START 
        }
      }]
    }
  };
  console.log("eventObj:", eventObj);

  try {
    const errMsg = EventMessage.verify(eventObj);
    if (errMsg) throw new Error("VERIFY FAILED: " + errMsg);

    const msg = EventMessage.create(eventObj);
    const buf = EventMessage.encode(msg).finish();
    const hex = buf.toString('hex').toUpperCase();

    sendCount++;

    console.log('\n HEX #' + sendCount + ' GENERATED');
    console.log(' SIZE:', buf.length, 'bytes');
    console.log(' FULL HEX:', hex);
    console.log(' WRITING TO: candata1.txt');

    // Write hex data to file (append mode)
    fs.appendFileSync('candata1.txt', hex + '\n');
    console.log(' ✅ WRITTEN TO candata1.txt');

    // Also log full payload for verification
    console.log(' FULL PAYLOAD:', JSON.stringify(msg, null, 2));

  } catch (e) {
    console.error(' ERROR:', e.message);
    console.error('Payload that failed:', JSON.stringify(eventObj, null, 2));
  }
}

// Generate once and write to file (no MQTT, no interval)
generateHexToFile().catch(console.error);
