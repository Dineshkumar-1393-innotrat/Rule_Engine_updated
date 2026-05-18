// ✅ EXACT TripCurrent.js matching your received payload structure
const mqtt = require('mqtt');
const fs = require('fs');
const protobuf = require('protobufjs');
require('dotenv').config();
['VIN', 'IMEI', 'TBOX_SERIAL', 'CLIENT_ID'].forEach((k) => {
  if (!process.env[k]) {
    throw new Error(` Missing ENV variable: ${k}`);
  }
});
const CONFIG = {
  IMEI: process.env.IMEI,
  VIN: process.env.VIN,
  BROKER:'mqtts://cvipiot-preprod.fca-india.com:18883',
//  BROKER: 'mqtts://lb2.cvip-preprod.citroen.in:48883',
  STATIC_MESSAGE_ID: 'dd52bab1-c64a-431b-a945-a546528f68df'  // Updated
};

function getTimestamp() {
  const now = new Date();
  return {
    seconds: Math.floor(now.getTime() / 1000),
    nanos: (now.getTime() % 1000) * 1000000
  };
}

function getTripIdFromTimestamp(ts) {
  const d = new Date(ts.seconds * 1000 + ts.nanos / 1e6);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear() % 100).padStart(2, '0');
  return parseInt(`${day}${month}${year}03`, 10);
}

function getExactTripProgressData(tripId) {
  return [{
    // ✅ EXACT MATCH to your received payload structure
    tripId: tripId,
    currenttime: getTimestamp(),
    currentdate: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 10),
    gnssinfocurrent: {
      currentlocationData: {
        gpsLat: 13.084534,           // Realistic Chennai coords
        gpsLong: 80.270718,
        gpsAlt: 21.5,
        gpsAccLat: 5.0,
        gpsAccLon: 5.0,
        gpsAccAlt: 10.0,
        gpsCourseAngle: 337.126,     // Matches your sample
        gpsSignalQuality: 0.9736     // Matches your sample format
      }
    },
    tripDistance: 56.0,              // Exact match
    tripTime: 45,                    // Exact match  
    tripType: 'Active',              // Exact match
    hardBrakeCnt: 2,                 // Exact match
    harshAccCnt: 1,                  // From 2nd entry
    highSpeedCnt: 2,                 // From 2nd entry
    harshTurnCnt: 4,                 // Exact match
    avgSpeed: 75.0,                  // Exact match
    topSpeed: 86.0                   // Exact match
  }];
}

async function sendExactTripCurrent() {
  console.log('Loading Protobufs...');
  const root = await protobuf.load([
    'Jeep_Proto/jeep_event_message.proto',
    'Jeep_Proto/jeep_event.proto',
    'Jeep_Proto/jeep_trip_message.proto',
    'Jeep_Proto/jeep_trip.proto',
    'Jeep_Proto/jeep_common.proto',
    'Jeep_Proto/timestamp.proto'
  ]);
const TripInProgressData = root.lookupType('stla.cvip.jeep.TripInProgressData');
const TripInProgressPayloadData=root.lookupType('stla.cvip.jeep.TripInProgressPayload');
 const LocationData=root.lookupType('stla.cvip.jeep.LocationData');
  const TripMessage = root.lookupType('stla.cvip.jeep.TripMessage');
  const eTboxOperatingState = root.lookupEnum('stla.cvip.jeep.eTboxOperatingState');
  const eTboxApplicationState = root.lookupEnum('stla.cvip.jeep.eTboxApplicationState');
  const eTboxeSimState = root.lookupEnum('stla.cvip.jeep.eTboxeSimState');

 console.log('TripInProgressData fields:', TripInProgressData.fieldsArray.map(f => f.name));
 console.log("locationData",Object.keys(LocationData.fields));
 console.log("TripInProgressPayloadData",TripInProgressPayloadData.fieldsArray.map(f=>f.name));
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
    console.log('🚀 MQTT CONNECTED');

    const currentTime = getTimestamp();
    const tripId = getTripIdFromTimestamp(currentTime);
    const tripDataArray = getExactTripProgressData(tripId);  // Returns array of 1

    const payload = {
      messageId: CONFIG.STATIC_MESSAGE_ID,
      tboxOperatingState: eTboxOperatingState.values.normal,
      eTboxApplicationState: eTboxApplicationState.values.customer,  // Matches your sample
      tboxEsimState: eTboxeSimState.values.normal_sim,
      version: '2.0.0',
      timeStamp: currentTime,
      tripPayload: {
        tripinprogresspayload: {
          tripinprogressdata: tripDataArray  // ✅ Array with exact values
        }
      }
    };

    console.log('\n📄 1. JSON BEFORE protobuf encoding:\n', JSON.stringify(payload, null, 2));

    const errMsg = TripMessage.verify(payload);
    if (errMsg) {
      console.error('❌ VERIFY FAILED:', errMsg);
      client.end();
      return;
    }
    console.log('✅ COMPLETE protobuf VALID - EXACT MATCH');

    const msg = TripMessage.create(payload);
    const buf = TripMessage.encode(msg).finish();

    console.log('\n🔢 2. FULL HEX encoded protobuf:');
    console.log(buf.toString('hex').toUpperCase());
    console.log(`📦 Size: ${buf.length} bytes`);

    const decoded = TripMessage.toObject(TripMessage.decode(buf), { longs: String });
    console.log('\n🔍 3. DECODED (matches your sample):\n', JSON.stringify(decoded, null, 2));

    const topic = `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripCurrent`;
    client.publish(topic, buf, { qos: 1 }, (err) => {
      if (err) console.error('❌ PUBLISH ERROR:', err.message);
      else console.log(`\n✅ EXACT TripCurrent SENT! (${buf.length} bytes)`);
      setTimeout(() => client.end(), 1000);
    });
  });

  client.on('error', (err) => console.error('❌ MQTT ERROR:', err.message));
  client.on('close', () => console.log('🔌 Closed'));
}

sendExactTripCurrent().catch(console.error);
