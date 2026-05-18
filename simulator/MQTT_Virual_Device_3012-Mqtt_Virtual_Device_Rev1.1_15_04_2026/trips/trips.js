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
  // IMEI: '356741396798765',
  // VIN: 'T123ZTZT867656663',
   IMEI: process.env.IMEI,
  VIN: process.env.VIN,
 // BROKER: 'mqtts://lb2.cvip-preprod.citroen.in:48883',
    BROKER:'mqtts://cvipiot-preprod.fca-india.com:18883',
  STATIC_MESSAGE_ID: 'dd52bab1-c64a-431b-a945-1602f26e9f4e',
  // MIN_TRIP_DISTANCE: 50,   // meters
  // MIN_IGN_OFF_TIME: 120,   // seconds
  MIN_TRIP_DISTANCE: 10,   // 10m instead of 50m (faster PENDING→ACTIVE)

  MIN_IGN_OFF_TIME: 24,

};


let sendCount = 0;
let currentTripState = 'TRIP_IDLE';
let tripStartTime = null;
let tripId = null;
let accumulatedDistance = 0;
let ignOffStartTime = null;
let lastIgnRaw = null;
let lastSpeed = 0;


function getSimulatedIgnitionRaw() {
  const enumValues = [1, 3, 4, 5, 7];
  return enumValues[Math.floor(Math.random() * enumValues.length)];
}


function getIgnitionState(rawValue) {
  return (rawValue === 4 || rawValue === 5) ? 'ON' : 'OFF';
}


function getSimulatedGps() {
  return {
    gpsLat: 13.084534 + (Math.random() - 0.5) * 0.001,
    gpsLong: 80.270718 + (Math.random() - 0.5) * 0.001,
    gpsAlt: 20.0 + Math.random() * 5,
    gpsAccLat: 5.0,
    gpsAccLon: 5.0,
    gpsAccAlt: 10.0,
    gpsCourseAngle: Math.random() * 360,
    gpsSignalQuality: 0.95 + Math.random() * 0.05,
    gpsFixedStatus: 1,
    speed: Math.random() * 120
  };
}


// function getTripId() {
//   const now = new Date();
//   const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear() % 100}`;
//   return `${dateStr}01`;
// }


function getTripId(ts) {
  const d = new Date(ts.seconds * 1000 + ts.nanos / 1e6);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear() % 100).padStart(2, '0');
  return parseInt(`${day}${month}${year}03`, 10);  // int64, so fine
}


function getTimestamp() {
  const now = new Date();
  return {
    seconds: Math.floor(now.getTime() / 1000),
    nanos: (now.getTime() % 1000) * 1000000
  };
}


async function startTripTelemetry() {
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
  const EventMessage = root.lookupType('stla.cvip.jeep.EventMessage');
  const eTboxOperatingState = root.lookupEnum('stla.cvip.jeep.eTboxOperatingState');
  const eTboxApplicationState = root.lookupEnum('stla.cvip.jeep.eTboxApplicationState');
  const eTboxeSimState = root.lookupEnum('stla.cvip.jeep.eTboxeSimState');
  const IgnitionPropertyType = root.lookupEnum('stla.cvip.jeep.IgnitionPropertyType');
 
const TripStartData = root.lookupType('stla.cvip.jeep.TripStartData');
const TripStartPayloadData=root.lookupType('stla.cvip.jeep.TripStartPayload');
 const LocationData=root.lookupType('stla.cvip.jeep.LocationData');
 console.log('TripStartData fields:', TripStartData.fieldsArray.map(f => f.name));
 console.log("locationData",Object.keys(LocationData.fields));
 console.log("TripStartPayloadData",TripStartPayloadData.fieldsArray.map(f=>f.name));
  console.log('Protobufs LOADED');
  console.log('IgnitionPropertyType:', Object.keys(IgnitionPropertyType.values));
  console.log('eTboxOperatingState:', Object.keys(eTboxOperatingState.values));
  console.log('eTboxApplicationState:', Object.keys(eTboxApplicationState.values));
  console.log('eTboxeSimState:', Object.keys(eTboxeSimState.values));

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
    console.log('MQTT CONNECTED - Starting Trip FSM');
    processTripState(
      client,
      TripMessage,
      EventMessage,
      eTboxOperatingState,
      eTboxApplicationState,
      eTboxeSimState,
      IgnitionPropertyType
    );

    setInterval(() => {
      if (client.connected) {
        processTripState(
          client,
          TripMessage,
          EventMessage,
          eTboxOperatingState,
          eTboxApplicationState,
          eTboxeSimState,
          IgnitionPropertyType
        );
      }
    }, 5000);
  });

  client.on('packetsend', (packet) => {
    if (packet.cmd === 'publish') {
      console.log('SENT:', packet.topic, '(' + packet.payload.length + ' bytes)');
    }
  });

  client.on('error', (err) => {
    console.error('MQTT ERROR:', err.message);
  });
}


function processTripState(
  client,
  TripMessage,
  EventMessage,
  eTboxOperatingState,
  eTboxApplicationState,
  eTboxeSimState,
  IgnitionPropertyType
) {
  sendCount++;

  const ignRaw = getSimulatedIgnitionRaw();
  const ignState = getIgnitionState(ignRaw);
  const gps = getSimulatedGps();
  lastSpeed = gps.speed;

  if (currentTripState === 'TRIP_PENDING') {
    // speed (km/h) → m in 5s: v(km/h) * (1000 m / 1 km) * (5 s / 3600 s)
    accumulatedDistance += gps.speed * 0.00138889 * 5;
  }
  console.log(`  → Added ${(gps.speed * 0.00138889 * 5).toFixed(1)}m this loop`);

  console.log(
    `#${sendCount} IGN_RAW=${ignRaw}(${ignState}), ` +
    `Speed: ${gps.speed.toFixed(1)}kmh, Dist: ${accumulatedDistance.toFixed(0)}m, State: ${currentTripState}`
  );

  const now = Date.now() / 1000;

  // if (ignRaw !== lastIgnRaw) {
  //   console.log(`IGNITION ${lastIgnRaw || 'null'} → ${ignRaw} (${ignState})`);
  //   if (ignState === 'ON') {
  //     if (!tripStartTime) tripStartTime = now;
  //     ignOffStartTime = null;
  //   } else {
  //     ignOffStartTime = now;
  //   }
  //   lastIgnRaw = ignRaw;
  // }
  if (ignRaw !== lastIgnRaw) {
    console.log(`IGNITION ${lastIgnRaw || 'null'} → ${ignRaw} (${ignState})`);
    if (ignState === 'ON') {
      if (!tripStartTime) tripStartTime = now;
      ignOffStartTime = null;  // Reset OFF timer only on ON
    } else if (!ignOffStartTime) {  // Set ONLY if not already timing
      ignOffStartTime = now;
    }
    lastIgnRaw = ignRaw;
  }

  let stateChanged = false;
  let tripPayload = null;

  switch (currentTripState) {
    case 'TRIP_IDLE':
      if (ignState === 'ON') {
        currentTripState = 'TRIP_PENDING';
        const startTime = getTimestamp();
        tripId = getTripId(startTime);
        tripStartTime = now;
        accumulatedDistance = 0;
        stateChanged = true;
        console.log(`TRIP_PENDING (TripID: ${tripId}) [IGN=${ignRaw}]`);
      }
      break;

    case 'TRIP_PENDING':
      console.log(`PENDING: Dist=${accumulatedDistance.toFixed(0)}m / ${CONFIG.MIN_TRIP_DISTANCE}m`);

      if (accumulatedDistance >= CONFIG.MIN_TRIP_DISTANCE) {
        currentTripState = 'TRIP_ACTIVE';
        stateChanged = true;
        tripPayload = createTripStartPayload(tripId, tripStartTime, gps, ignRaw, eTboxOperatingState, eTboxApplicationState, eTboxeSimState);
        console.log(`TRIP_ACTIVE! Dist: ${accumulatedDistance.toFixed(0)}m`);
      } else if (
        ignState === 'OFF' &&
        ignOffStartTime &&
        (now - ignOffStartTime) > CONFIG.MIN_IGN_OFF_TIME
      ) {
        currentTripState = 'TRIP_IDLE';
        resetTrip();
        console.log('BACK TO IDLE (timeout)');
        stateChanged = true;
      }
      break;

    case 'TRIP_ACTIVE':
      tripPayload = createTripProgressPayload(
        tripId,
        tripStartTime,
        gps,
        accumulatedDistance,
        ignRaw, eTboxOperatingState, eTboxApplicationState, eTboxeSimState
      );

      if (
        ignState === 'OFF' &&
        ignOffStartTime &&
        (now - ignOffStartTime) > CONFIG.MIN_IGN_OFF_TIME
      ) {
        currentTripState = 'TRIP_IDLE';
        stateChanged = true;
        tripPayload = createTripEndPayload(
          tripId,
          tripStartTime,
          gps,
          accumulatedDistance,
          ignRaw,eTboxOperatingState, eTboxApplicationState, eTboxeSimState
        );
        console.log(`TRIP END! Dist: ${accumulatedDistance.toFixed(0)}m`);
        resetTrip();
      }
      break;
  }

  if (tripPayload) {
    sendTripPayload(client, TripMessage, tripPayload);
  }

  if (stateChanged) {
    sendStateEvent(
      client,
      EventMessage,
      eTboxOperatingState,
      eTboxApplicationState,
      eTboxeSimState,
      IgnitionPropertyType,
      currentTripState
    );
  }
}

//console.log("tripId, startTime, gps, ignRaw",tripId, startTime, gps, ignRaw);
 const startTime = getTimestamp();
const startDate = parseInt(
      new Date(startTime.seconds * 1000).toISOString().slice(0, 10).replace(/-/g, ''),
      10
    );
function createTripStartPayload(tripId, startTime, gps, ignRaw, eTboxOperatingState, eTboxApplicationState, eTboxeSimState) {
  return {
    messageId: CONFIG.STATIC_MESSAGE_ID,
    tboxOperatingState: eTboxOperatingState.values.normal,        // 0
    eTboxApplicationState: eTboxApplicationState.values.customer, // 4
    tboxEsimState: eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    tripPayload: {
      tripstartpayload: {
        tripstartdata: [{
          tripId: tripId,
          startTime: getTimestamp(),
          startDate: startDate,
          // ignitionState: ignRaw,
          gnssinfostart: {
            startlocationData: {
              gpsLat: gps.gpsLat,
              gpsLong: gps.gpsLong,
              gpsAlt: gps.gpsAlt,
              gpsAccLat: gps.gpsAccLat,
              gpsAccLon: gps.gpsAccLon,
              gpsAccAlt: gps.gpsAccAlt,
              gpsCourseAngle: gps.gpsCourseAngle,
              gpsSignalQuality: gps.gpsSignalQuality,

            }
          },
          gpsFixedStatus: 1
        }
        ]
      }
    }
  };
}


function createTripProgressPayload(tripId, startTime, gps, distance, ignRaw, eTboxOperatingState, eTboxApplicationState, eTboxeSimState) {
  return {
    messageId: CONFIG.STATIC_MESSAGE_ID,
    tboxOperatingState: eTboxOperatingState.values.normal,        // 0
    eTboxApplicationState: eTboxApplicationState.values.customer, // 4
    tboxEsimState: eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    tripPayload: {
      tripinprogresspayload: {
        tripinprogressdata: [{
          tripId: tripId,
          currenttime: getTimestamp(),
          currentdate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
          // ignitionState: ignRaw,
          gnssinfocurrent: {
            currentlocationData: {
              gpsLat: gps.gpsLat,
              gpsLong: gps.gpsLong,
              gpsAlt: gps.gpsAlt,
              gpsAccLat: gps.gpsAccLat,
              gpsAccLon: gps.gpsAccLon,
              gpsAccAlt: gps.gpsAccAlt,
              gpsCourseAngle: 337.126,     // Matches your sample
              gpsSignalQuality: 0.9736
            }
          },
          tripDistance: distance,
          tripTime: Math.floor((Date.now() / 1000 - startTime) / 60),
          tripType: gps.speed > 5 ? 'Active' : 'Idle',
          hardBrakeCnt: 2,                 // Exact match
          harshAccCnt: 1,                  // From 2nd entry
          highSpeedCnt: 2,                 // From 2nd entry
          harshTurnCnt: 4,                 // Exact match
          avgSpeed: 75.0,                  // Exact match
          topSpeed: 86.0
        }
        ]
      }
    }
  };
}


function createTripEndPayload(tripId, startTime, gps, distance, ignRaw,eTboxOperatingState, eTboxApplicationState, eTboxeSimState) {
  return {
    messageId: CONFIG.STATIC_MESSAGE_ID,
    tboxOperatingState: eTboxOperatingState.values.normal,        // 0
    eTboxApplicationState: eTboxApplicationState.values.customer, // 4
    tboxEsimState: eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    tripPayload: {
      tripendedpayload: {
        tripendeddata: [{
          tripId: tripId,
          currentTime: getTimestamp(),
          currentDate: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 10),
          // ignitionState: ignRaw,
          gnssinfocurrent: {
            currentlocationData: {
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
        }
        ]
      }
    }
  };
}


function resetTrip() {
  accumulatedDistance = 0;
  tripId = null;
  tripStartTime = null;
  ignOffStartTime = null;
}


function sendTripPayload(client, TripMessage, payload) {
  try {
    const errMsg = TripMessage.verify(payload);
    if (errMsg) throw new Error("VERIFY FAILED: " + errMsg);

    const msg = TripMessage.create(payload);
    const buf = TripMessage.encode(msg).finish();
    console.log("msg",msg);
    
    console.log(' FULL HEX encoded protobuf (COMPLETE):');
    console.log(buf.toString('hex').toUpperCase());
    console.log(`📦 FULL Size: ${buf.length} bytes`);
    const payloadType = Object.keys(payload.tripPayload)[0];
    // const topicMap = {
    //   tripStartPayload: `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripStart`,
    //   tripInProgressPayload: `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripCurrent`,
    //   tripEndPayload: `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripEnd`
    // };
// In sendTripPayload(), replace entire topicMap:
const topicMap = {
  tripstartpayload: `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripStart`,
  tripinprogresspayload: `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripCurrent`,
  tripendedpayload: `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripEnd`
};

    const topic = topicMap[payloadType];
  
    client.publish(topic, buf, { qos: 1 });
  } catch (e) {
    console.error('TRIP SEND ERROR:', e.message);
  }
}


// UPDATED: use enum values from protobuf (same pattern as standalone event script)
function sendStateEvent(
  client,
  EventMessage,
  eTboxOperatingState,
  eTboxApplicationState,
  eTboxeSimState,
  IgnitionPropertyType,
  tripState
) {
  const NORMAL = eTboxOperatingState.values.normal;
  const CUSTOMER = eTboxApplicationState.values.customer;
  const NORMAL_SIM = eTboxeSimState.values.normal_sim;
  const START = IgnitionPropertyType.values.START;

  const eventObj = {
    messageId: CONFIG.STATIC_MESSAGE_ID,
    // Uncomment if the proto has this field:
    // tboxOperatingState: NORMAL,
    eTboxApplicationState: CUSTOMER,
    tboxEsimState: NORMAL_SIM,
    version: "2.0.0",
    eventPayload: {
      EventsData: [
        {
          timeStamp: getTimestamp(),
          IgnitionStatus: {
            IgnitionState: START
          }
        }
      ]
    }
  };

  try {
    const errMsg = EventMessage.verify(eventObj);
    if (errMsg) throw new Error("VERIFY FAILED: " + errMsg);

    const msg = EventMessage.create(eventObj);
    const buf = EventMessage.encode(msg).finish();

    client.publish(
      `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/events`,
      buf,
      { qos: 1 }
    );
    console.log(`STATE EVENT: ${tripState}`);
  } catch (e) {
    console.error('STATE EVENT ERROR:', e.message);
    console.error('Payload that failed:', JSON.stringify(eventObj, null, 2));
  }
}


startTripTelemetry().catch(console.error);
