
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
    BROKER: process.env.BROKER || 'mqtts://lb2.cvip-preprod.citroen.in:48883',
    STATIC_MESSAGE_ID: 'dd52bab1-c64a-431b-a945-a546528f68df'
};

function getTimestamp() {
    const now = new Date();
    return {
        seconds: Math.floor(now.getTime() / 1000),
        nanos: (now.getTime() % 1000) * 1000000
    };
}


async function sendExactLocationTelemetry() {
    console.log('Loading Protobufs...');
    const root = await protobuf.load([
        'Jeep_Proto/jeep_locationtelemetry_message.proto',
        'Jeep_Proto/jeep_locationtelemetry.proto',
        'Jeep_Proto/jeep_common.proto',
        'Jeep_Proto/timestamp.proto'
    ]);
    const LocationTelemetryMessage = root.lookupType('stla.cvip.jeep.LocationTelemetryMessage');
    const LocationTelemetryPayload = root.lookupType('stla.cvip.jeep.LocationTelemetryPayload');
    const LocationTelemetry = root.lookupType('stla.cvip.jeep.LocationTelemetry');
    const eTboxApplicationState = root.lookupEnum('stla.cvip.jeep.eTboxApplicationState');
    const eTboxeSimState = root.lookupEnum('stla.cvip.jeep.eTboxeSimState');

    console.log('LocationTelemetryMessage   fields:', Object.keys(LocationTelemetryMessage.fields));
    console.log("LocationTelemetry", Object.keys(LocationTelemetry.fields));
    console.log("LocationTelemetryPayload", LocationTelemetryPayload.fieldsArray.map(f => f.name));


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
            eTboxApplicationState: eTboxApplicationState.values.customer,
             tboxEsimState: eTboxeSimState.values.normalsim,
            version: '2.0.0',
            signalStrength: 30,
            locationPayload: 
                {
                locationData:[ {
                    timeStamp: getTimestamp(),
                gpsLat: 146.37778917295014,
                gpsLong: -103.84493212237936,
                gpsCourseAngle: 337.1260520799143,
                gpsSignalQuality: 97.36062286424145,
                gpsFixedStatus: 1,
                speed: 25
                }]
            }
        };

        console.log('\n 1. JSON BEFORE encoding:');
        console.log(JSON.stringify(payload, null, 2));

        const errMsg = LocationTelemetryMessage.verify(payload);
        if (errMsg) {
            console.error(' VERIFY FAILED:', errMsg);
            client.end();
            return;
        }
        console.log(' protobuf VALID');

        const msg = LocationTelemetryMessage.create(payload);
        const buf = LocationTelemetryMessage.encode(msg).finish();

        console.log('\n 2. HEX protobuf:');
        console.log(buf.toString('hex').toUpperCase());
        console.log(` Size: ${buf.length} bytes`);

        const decoded = LocationTelemetryMessage.toObject(LocationTelemetryMessage.decode(buf), { longs: String });
        console.log('\n 3. DECODED:');
        console.log(JSON.stringify(decoded, null, 2));

        const topic = `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/locationTelemetry/history`;
        client.publish(topic, buf, { qos: 1 }, (err) => {
            if (err) console.error(' PUBLISH ERROR:', err);
            else console.log(`\n location Telemetry SENT (${buf.length} bytes)`);
            setTimeout(() => client.end(), 1000);
        });
    });

    client.on('error', (err) => console.error(' MQTT ERROR:', err));
    client.on('close', () => console.log(' Closed'));
}

sendExactLocationTelemetry().catch(console.error);
