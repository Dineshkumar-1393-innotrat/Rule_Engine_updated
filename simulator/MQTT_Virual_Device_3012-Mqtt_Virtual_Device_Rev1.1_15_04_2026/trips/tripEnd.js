// ✅ FIXED tripEnd.js - Exact match to your proto & sample payload

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
  BROKER: 'mqtts://lb2.cvip-preprod.citroen.in:48883',
  STATIC_MESSAGE_ID: 'dd52bab1-c64a-431b-a945-a546528f68df'
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

function getExactTripEndData(tripId) {
  return [{
    tripId: tripId,
    currentTime: getTimestamp(),                 // current_time (field 2)
    currentDate: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 10),
    gnssinfocurrent: {                           // gnssinfocurrent (field 4)
      currentlocationData: {                     // LocationData
        gpsLat: 13.084534,
        gpsLong: 80.270718,
        gpsAlt: 21.5,
        gpsAccLat: 5.0,
        gpsAccLon: 5.0,
        gpsAccAlt: 10.0,
        gpsCourseAngle: 337.126,
        gpsSignalQuality: 0.9736,
        gpsFixedStatus: 1
      }
    },
    tripDistance: 56.0,
    drivingScore: 80.0,
    tripTime: 45,
    idleDuration: 20,           
    idlingCnt: 5,
    hardBrakeCnt: 2,
    harshTurnCnt: 4,
    avgSpeed: 75.0,
    topSpeed: 86.0
  }];
}

async function sendExactTripEnd() {
  console.log('Loading Protobufs...');
  const root = await protobuf.load([
    'Jeep_Proto/jeep_trip_message.proto',
    'Jeep_Proto/jeep_trip.proto',
    'Jeep_Proto/jeep_common.proto',
    'Jeep_Proto/timestamp.proto'
  ]);
  const TripEndPayloadData=root.lookupType('stla.cvip.jeep.TripEndedPayload');
 const TripEndedData = root.lookupType('stla.cvip.jeep.TripEndedData');
 const LocationData=root.lookupType('stla.cvip.jeep.LocationData');
  const TripMessage = root.lookupType('stla.cvip.jeep.TripMessage');
  const eTboxOperatingState = root.lookupEnum('stla.cvip.jeep.eTboxOperatingState');
  const eTboxApplicationState = root.lookupEnum('stla.cvip.jeep.eTboxApplicationState');
  const eTboxeSimState = root.lookupEnum('stla.cvip.jeep.eTboxeSimState');
console.log("TripMessage",Object.keys(TripMessage.fields));

 console.log('TripEndedData fields:', TripEndedData.fieldsArray.map(f => f.name));
 console.log("locationData",Object.keys(LocationData.fields));
 console.log("TripEndPayloadData",TripEndPayloadData.fieldsArray.map(f=>f.name));
 
  const tripId = getTripIdFromTimestamp(getTimestamp());
  console.log('tripId:', tripId);
  const tripEndData = getExactTripEndData(tripId);

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

    const payload = {
      messageId: CONFIG.STATIC_MESSAGE_ID,
      tboxOperatingState: eTboxOperatingState.values.normal,           // normal (0)
      eTboxApplicationState: eTboxApplicationState.values.customer,
      tboxEsimState: eTboxeSimState.values.normalsim,                  // normalsim (1)
      version: '2.0.0',
      timeStamp: getTimestamp(),
      tripPayload: {
        tripendedpayload: {              
          tripendeddata: tripEndData       
        }
      }
    };

    console.log('\n 1. JSON BEFORE encoding:');
    console.log(JSON.stringify(payload, null, 2));

    const errMsg = TripMessage.verify(payload);
    if (errMsg) {
      console.error(' VERIFY FAILED:', errMsg);
      client.end();
      return;
    }
    console.log(' protobuf VALID');

    const msg = TripMessage.create(payload);
    const buf = TripMessage.encode(msg).finish();

    console.log('\n 2. HEX protobuf:');
    console.log(buf.toString('hex').toUpperCase());
    console.log(` Size: ${buf.length} bytes`);

    const decoded = TripMessage.toObject(TripMessage.decode(buf), { longs: String });
    console.log('\n 3. DECODED:');
    console.log(JSON.stringify(decoded, null, 2));

    const topic = `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripEnd`;
    client.publish(topic, buf, { qos: 1 }, (err) => {
      if (err) console.error(' PUBLISH ERROR:', err);
      else console.log(`\n TripEnd SENT (${buf.length} bytes)`);
      setTimeout(() => client.end(), 1000);
    });
  });

  client.on('error', (err) => console.error(' MQTT ERROR:', err));
  client.on('close', () => console.log(' Closed'));
}

sendExactTripEnd().catch(console.error);
