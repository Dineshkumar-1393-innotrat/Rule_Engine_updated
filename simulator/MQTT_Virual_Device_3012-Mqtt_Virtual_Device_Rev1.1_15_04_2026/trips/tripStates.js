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
  STATIC_MESSAGE_ID: 'dd52bab1-c64a-431b-a945-1602f26e9f4e',
  MIN_TRIP_DISTANCE: 10,    // Minimum distance in meters to activate trip
  MIN_IGN_OFF_TIME: 24      // Minimum ignition OFF time in seconds to end trip
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

function getTripId(ts) {
  const d = new Date(ts.seconds * 1000 + ts.nanos / 1e6);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear() % 100).padStart(2, '0');
  return parseInt(`${day}${month}${year}03`, 10);
}

function getTimestamp() {
  const now = new Date();
  return {
    seconds: Math.floor(now.getTime() / 1000),
    nanos: (now.getTime() % 1000) * 1000000
  };
}

async function startTripTelemetry() {
  console.log('Loading Protobuf definitions from proto files');
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

  console.log('Protobuf definitions loaded successfully');

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
    console.log('Connected to MQTT broker. Starting Trip State Machine every 5 seconds');
    processTripState(client, TripMessage, EventMessage, eTboxOperatingState, eTboxApplicationState, eTboxeSimState, IgnitionPropertyType);

    setInterval(() => {
      if (client.connected) {
        processTripState(client, TripMessage, EventMessage, eTboxOperatingState, eTboxApplicationState, eTboxeSimState, IgnitionPropertyType);
      }
    }, 5000);
  });

  client.on('packetsend', (packet) => {
    if (packet.cmd === 'publish') {
      console.log('Published to topic:', packet.topic, 'Size:', packet.payload.length, 'bytes');
    }
  });

  client.on('error', (err) => {
    console.error('MQTT connection error:', err.message);
  });
}

function processTripState(client, TripMessage, EventMessage, eTboxOperatingState, eTboxApplicationState, eTboxeSimState, IgnitionPropertyType) {
  sendCount++;
  const ignRaw = getSimulatedIgnitionRaw();
  const ignState = getIgnitionState(ignRaw);
  const gps = getSimulatedGps();
  lastSpeed = gps.speed;

  if (currentTripState === 'TRIP_PENDING') {
    const distanceThisLoop = gps.speed * 0.00138889 * 5;  // Convert kmh to meters over 5s
    accumulatedDistance += distanceThisLoop;
    console.log('Distance added this cycle:', distanceThisLoop.toFixed(1), 'meters. Total:', accumulatedDistance.toFixed(0), 'meters');
  }

  console.log('Cycle', sendCount, '- IGN:', ignRaw, '(', ignState, '), Speed:', gps.speed.toFixed(1), 'kmh, Current distance:', accumulatedDistance.toFixed(0), 'm, State:', currentTripState);

  const now = Date.now() / 1000;

  if (ignRaw !== lastIgnRaw) {
    console.log('Ignition changed from', lastIgnRaw || 'none', 'to', ignRaw, '(', ignState, ')');
    if (ignState === 'ON') {
      if (!tripStartTime) tripStartTime = now;
      ignOffStartTime = null;
      console.log('Ignition ON - Reset ignition OFF timer');
    } else if (!ignOffStartTime) {
      ignOffStartTime = now;
      console.log('Ignition OFF - Started ignition OFF timer');
    }
    lastIgnRaw = ignRaw;
  }

  let stateChanged = false;
  let tripPayload = null;

  switch (currentTripState) {
    case 'TRIP_IDLE':
      if (ignState === 'ON') {
        console.log('Ignition ON detected. Minimum trip distance required:', CONFIG.MIN_TRIP_DISTANCE, 'meters');
        currentTripState = 'TRIP_PENDING';
        const startTime = getTimestamp();
        tripId = getTripId(startTime);
        tripStartTime = now;
        accumulatedDistance = 0;
        stateChanged = true;
        console.log('Entered TRIP_PENDING state. Trip ID:', tripId);
      }
      break;

    case 'TRIP_PENDING':
      console.log('TRIP_PENDING - Current distance:', accumulatedDistance.toFixed(0), 'm vs minimum required:', CONFIG.MIN_TRIP_DISTANCE, 'm');
      
      if (accumulatedDistance >= CONFIG.MIN_TRIP_DISTANCE) {
        console.log('Minimum trip distance', CONFIG.MIN_TRIP_DISTANCE, 'm reached. Current distance:', accumulatedDistance.toFixed(0), 'm');
        currentTripState = 'TRIP_ACTIVE';
        stateChanged = true;
        tripPayload = createTripStartPayload(tripId, tripStartTime, gps, ignRaw, eTboxOperatingState, eTboxApplicationState, eTboxeSimState);
        console.log('Entered TRIP_ACTIVE state');
      } else if (ignState === 'OFF' && ignOffStartTime && (now - ignOffStartTime) > CONFIG.MIN_IGN_OFF_TIME) {
        const elapsedIgnOff = now - ignOffStartTime;
        console.log('Ignition OFF for', elapsedIgnOff.toFixed(0), 'seconds > minimum required', CONFIG.MIN_IGN_OFF_TIME, 'seconds');
        currentTripState = 'TRIP_IDLE';
        resetTrip();
        console.log('Returned to TRIP_IDLE due to ignition OFF timeout');
        stateChanged = true;
      }
      break;

    case 'TRIP_ACTIVE':
      tripPayload = createTripProgressPayload(tripId, tripStartTime, gps, accumulatedDistance, ignRaw, eTboxOperatingState, eTboxApplicationState, eTboxeSimState);

      if (ignState === 'OFF' && ignOffStartTime && (now - ignOffStartTime) > CONFIG.MIN_IGN_OFF_TIME) {
        const elapsedIgnOff = now - ignOffStartTime;
        console.log('Ignition OFF for', elapsedIgnOff.toFixed(0), 'seconds > minimum required', CONFIG.MIN_IGN_OFF_TIME, 'seconds');
        currentTripState = 'TRIP_IDLE';
        stateChanged = true;
        tripPayload = createTripEndPayload(tripId, tripStartTime, gps, accumulatedDistance, ignRaw, eTboxOperatingState, eTboxApplicationState, eTboxeSimState);
        console.log('Trip ended. Total distance:', accumulatedDistance.toFixed(0), 'meters');
        resetTrip();
      }
      break;
  }

  if (tripPayload) {
    sendTripPayload(client, TripMessage, tripPayload);
  }

  if (stateChanged) {
    sendStateEvent(client, EventMessage, eTboxOperatingState, eTboxApplicationState, eTboxeSimState, IgnitionPropertyType, currentTripState);
  }
}

function createTripStartPayload(tripId, startTime, gps, ignRaw, eTboxOperatingState, eTboxApplicationState, eTboxeSimState) {
  const startTimeStamp = getTimestamp();
  const startDate = parseInt(new Date(startTimeStamp.seconds * 1000).toISOString().slice(0, 10).replace(/-/g, ''), 10);
  
  return {
    messageId: CONFIG.STATIC_MESSAGE_ID,
    tboxOperatingState: eTboxOperatingState.values.normal,
    eTboxApplicationState: eTboxApplicationState.values.customer,
    tboxEsimState: eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    tripPayload: {
      tripstartpayload: {
        tripstartdata: [{
          tripId: tripId,
          startTime: startTimeStamp,
          startDate: startDate,
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
        }]
      }
    }
  };
}

function createTripProgressPayload(tripId, startTime, gps, distance, ignRaw, eTboxOperatingState, eTboxApplicationState, eTboxeSimState) {
  return {
    messageId: CONFIG.STATIC_MESSAGE_ID,
    tboxOperatingState: eTboxOperatingState.values.normal,
    eTboxApplicationState: eTboxApplicationState.values.customer,
    tboxEsimState: eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    tripPayload: {
      tripinprogresspayload: {
        tripinprogressdata: [{
          tripId: tripId,
          currenttime: getTimestamp(),
          currentdate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
          gnssinfocurrent: {
            currentlocationData: {
              gpsLat: gps.gpsLat,
              gpsLong: gps.gpsLong,
              gpsAlt: gps.gpsAlt,
              gpsAccLat: gps.gpsAccLat,
              gpsAccLon: gps.gpsAccLon,
              gpsAccAlt: gps.gpsAccAlt,
              gpsCourseAngle: 337.126,
              gpsSignalQuality: 0.9736
            }
          },
          tripDistance: distance,
          tripTime: Math.floor((Date.now() / 1000 - startTime) / 60),
          tripType: gps.speed > 5 ? 'Active' : 'Idle',
          hardBrakeCnt: 2,
          harshAccCnt: 1,
          highSpeedCnt: 2,
          harshTurnCnt: 4,
          avgSpeed: 75.0,
          topSpeed: 86.0
        }]
      }
    }
  };
}

function createTripEndPayload(tripId, startTime, gps, distance, ignRaw, eTboxOperatingState, eTboxApplicationState, eTboxeSimState) {
  return {
    messageId: CONFIG.STATIC_MESSAGE_ID,
    tboxOperatingState: eTboxOperatingState.values.normal,
    eTboxApplicationState: eTboxApplicationState.values.customer,
    tboxEsimState: eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    tripPayload: {
      tripendedpayload: {
        tripendeddata: [{
          tripId: tripId,
          currentTime: getTimestamp(),
          currentDate: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 10),
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
        }]
      }
    }
  };
}

function resetTrip() {
  console.log('Resetting trip variables');
  accumulatedDistance = 0;
  tripId = null;
  tripStartTime = null;
  ignOffStartTime = null;
}

function sendTripPayload(client, TripMessage, payload) {
  try {
    const errMsg = TripMessage.verify(payload);
    if (errMsg) throw new Error("Protobuf verification failed: " + errMsg);

    const msg = TripMessage.create(payload);
    const buf = TripMessage.encode(msg).finish();
    
    console.log('Protobuf encoded successfully. Size:', buf.length, 'bytes');
    console.log('HEX:', buf.toString('hex').toUpperCase());
    
    const payloadType = Object.keys(payload.tripPayload)[0];
    const topicMap = {
      tripstartpayload: `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripStart`,
      tripinprogresspayload: `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripCurrent`,
      tripendedpayload: `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/tripEnd`
    };
    const topic = topicMap[payloadType];
    
    client.publish(topic, buf, { qos: 1 });
  } catch (e) {
    console.error('Trip payload send error:', e.message);
  }
}

function sendStateEvent(client, EventMessage, eTboxOperatingState, eTboxApplicationState, eTboxeSimState, IgnitionPropertyType, tripState) {
  const NORMAL = eTboxOperatingState.values.normal;
  const CUSTOMER = eTboxApplicationState.values.customer;
  const NORMAL_SIM = eTboxeSimState.values.normal_sim;
  const START = IgnitionPropertyType.values.START;

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

  try {
    const errMsg = EventMessage.verify(eventObj);
    if (errMsg) throw new Error("State event verification failed: " + errMsg);

    const msg = EventMessage.create(eventObj);
    const buf = EventMessage.encode(msg).finish();

    client.publish(`/dongle/${CONFIG.VIN}/MQTTPROTOBUF/events`, buf, { qos: 1 });
    console.log('State event sent for trip state:', tripState);
  } catch (e) {
    console.error('State event send error:', e.message);
  }
}

startTripTelemetry().catch(console.error);
