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
 // BROKER: process.env.BROKER || 'mqtts://lb2.cvip-preprod.citroen.in:48883',
    BROKER:process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883',
  STATIC_MESSAGE_ID: 'dd52bab1-c64a-431b-a945-1602f26e9f4e'
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
  return parseInt(`${day}${month}${year}03`, 10);  // int64, so fine
}

function getSimulatedGnssInfo() {
  return {
    gpsLat: 13.084534 + (Math.random() - 0.5) * 0.001,
    gpsLong: 80.270718 + (Math.random() - 0.5) * 0.001,
    gpsAlt: 20.0 + Math.random() * 5,
    gpsAccLat: 5.0,
    gpsAccLon: 5.0,
    gpsAccAlt: 10.0,
    gpsCourseAngle: Math.random() * 360,
    gpsSignalQuality: 0.97
  };
}

async function sendSingleTripStart() {
  console.log('Loading Protobufs...');
  const root = await protobuf.load([
    'Jeep_Proto/jeep_event_message.proto',
    'Jeep_Proto/jeep_event.proto',
    'Jeep_Proto/jeep_trip_message.proto',
    'Jeep_Proto/jeep_trip.proto',
    'Jeep_Proto/jeep_common.proto',
    'Jeep_Proto/timestamp.proto'
  ]);

  const TripMessage = root.lookupType('stla.cvip.jeep.TripMessage');
  const eTboxOperatingState = root.lookupEnum('stla.cvip.jeep.eTboxOperatingState');
  const eTboxApplicationState = root.lookupEnum('stla.cvip.jeep.eTboxApplicationState');
  const eTboxeSimState = root.lookupEnum('stla.cvip.jeep.eTboxeSimState');
const TripStartData = root.lookupType('stla.cvip.jeep.TripStartData');
const TripStartPayloadData=root.lookupType('stla.cvip.jeep.TripStartPayload');
 const LocationData=root.lookupType('stla.cvip.jeep.LocationData');

 console.log('TripStartData fields:', TripStartData.fieldsArray.map(f => f.name));
 console.log("locationData",Object.keys(LocationData.fields));
 console.log("TripStartPayloadData",TripStartPayloadData.fieldsArray.map(f=>f.name));
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

    const startTime = getTimestamp();
    const tripId = getTripIdFromTimestamp(startTime);
    const gnss = getSimulatedGnssInfo();
    const startDate = parseInt(
      new Date(startTime.seconds * 1000).toISOString().slice(0, 10).replace(/-/g, ''),
      10
    );

    //  EXACT STRUCTURE FROM jeep_trip_message.proto + jeep_trip.proto [file:24][file:21]
    const jsonBeforeEncode = {
      messageId: CONFIG.STATIC_MESSAGE_ID,
      tboxOperatingState: eTboxOperatingState.values.normal,        // 0
      eTboxApplicationState: eTboxApplicationState.values.customer, // 4
      tboxEsimState: eTboxeSimState.values.normal_sim,              // 1
      version: '2.0.0',
      timeStamp: startTime,

      // TripPayload (oneof tripPayload -> TripStartPayload.tripstartpayload)
      tripPayload: {
        // field name is "tripstartpayload" (camelCase in JS)
        tripstartpayload: {
          // TripStartPayload.tripstartdata = repeated TripStartData
          tripstartdata: [  // array with 1 element
            {
              // TripStartData fields EXACTLY:
              tripId: tripId,           // int64
              startTime: startTime,     // Timestamp (note: lowercase!)
              startDate: startDate,     // int64
              gnssinfostart: {
                // gnssInfoStart.startlocationData = LocationData
                startlocationData: {
                  // LocationData EXACT fields + types:
                  gpsLat: gnss.gpsLat,        // double
                  gpsLong: gnss.gpsLong,      // double
                  gpsAlt: gnss.gpsAlt,        // float
                  gpsAccLat: gnss.gpsAccLat,  // float
                  gpsAccLon: gnss.gpsAccLon,  // float
                  gpsAccAlt: gnss.gpsAccAlt,  // float
                  gpsCourseAngle: gnss.gpsCourseAngle, // float
                  gpsSignalQuality: gnss.gpsSignalQuality // float
                }
              },
              gpsFixedStatus: 1  // int32
            }
          ]
        }
      }
    };

    console.log('\n 1. JSON BEFORE protobuf encoding:');
    console.log(JSON.stringify(jsonBeforeEncode, null, 2));

    const errMsg = TripMessage.verify(jsonBeforeEncode);
    if (errMsg) {
      console.error(' VERIFY FAILED:', errMsg);
      client.end();
      return;
    }
    console.log(' COMPLETE protobuf VALID');

    const msg = TripMessage.create(jsonBeforeEncode);
    const buf = TripMessage.encode(msg).finish();

    console.log('\n 2. FULL HEX encoded protobuf (COMPLETE):');
    console.log(buf.toString('hex').toUpperCase());
    console.log(` FULL Size: ${buf.length} bytes`);

    const decodedMsg = TripMessage.decode(buf);
    console.log('\n 3. JSON AFTER protobuf decode (COMPLETE):');
    console.log(JSON.stringify(decodedMsg, null, 2));

    const topic = `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripStart`;
    client.publish(topic, buf, { qos: 1 }, (err) => {
      if (err) {
        console.error(' PUBLISH ERROR:', err.message);
      } else {
        console.log(`\n FULL TripStart SENT! (${buf.length} bytes)`);
      }
      setTimeout(() => client.end(), 1000);
    });
  });

  client.on('error', (err) => console.error(' MQTT ERROR:', err.message));
  client.on('close', () => console.log(' Closed'));
}

sendSingleTripStart().catch(console.error);
