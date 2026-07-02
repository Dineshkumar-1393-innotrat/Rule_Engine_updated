

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
    BROKER: process.env.BROKER || 'mqtts://lb2.cvip-preprod.citroen.in:48883',
    STATIC_MESSAGE_ID: process.env.STATIC_MESSAGE_ID
};

function getTimestamp() {
    const now = new Date();
    return {
        seconds: Math.floor(now.getTime() / 1000),
        nanos: (now.getTime() % 1000) * 1000000
    };
}


async function sendExactAlerts() {
    console.log('Loading Protobufs...');
    const root = await protobuf.load([
        'Jeep_Proto/jeep_alert_message.proto',
        'Jeep_Proto/jeep_alert.proto',
        'Jeep_Proto/jeep_common.proto',
        'Jeep_Proto/timestamp.proto',
    ]);
    const AlertMessage = root.lookupType('stla.cvip.jeep.AlertMessage');
    const Alerts = root.lookupType('stla.cvip.jeep.Alerts');
    const eTboxApplicationState = root.lookupEnum('stla.cvip.jeep.eTboxApplicationState');
    const eTboxeSimState = root.lookupEnum('stla.cvip.jeep.eTboxeSimState');
    const SpeedAlertPayload = root.lookupType('stla.cvip.jeep.SpeedAlertPayload');
    const GPSPayload = root.lookupType('stla.cvip.jeep.GPSPayload');
    const alertType = root.lookupEnum('stla.cvip.jeep.AlertType');
    const AlertState = root.lookupEnum('stla.cvip.jeep.AlertState');
    const AlertPayload = root.lookupType('stla.cvip.jeep.AlertPayload');
    const ParkingDisturbance= root.lookupEnum('stla.cvip.jeep.ParkingDisturbance');
    console.log('AlertMessage   fields:', Object.keys(AlertMessage.fields));
    console.log("Alerts", Alerts.fieldsArray.map(f => f.name));
    console.log("SpeedAlertPayload", SpeedAlertPayload.fieldsArray.map(f => f.name));

    console.log("GPSPayload", GPSPayload.fieldsArray.map(f => f.name));
    console.log('AlertType:', Object.keys(alertType.values));
    console.log('AlertState:', Object.keys(AlertState.values));
    console.log("AlertPayload", AlertPayload.fieldsArray.map(f => f.name));
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
    const alertTypeValue = alertType.values.RemoteMobilizationAlert;
    const alertStateValue = AlertState.values.alsAlert;
    client.on('connect', () => {
        console.log(' MQTT CONNECTED');

        const payload = {
            messageId: CONFIG.STATIC_MESSAGE_ID,
            eTboxApplicationState: eTboxApplicationState.values.customer,
            tboxEsimState: eTboxeSimState.values.normalsim,
            version: '2.0.0',
            timeStamp: getTimestamp(),
            alertPayload: {
                AlertsData: [{
                    timeStamp: getTimestamp(),
                    alertState: alertStateValue,
                    alertType: alertTypeValue,
                    alertID: CONFIG.STATIC_MESSAGE_ID,
                    isLive: true,
                    RemoteMobilizationAlert: {
                        rotationalspeedinZdirection:12.3,
                        gpsPayload: 
                            {
                                gpsLat: 12.971598,
                                gpsLong: 77.594566,
                                gpsAlt: 920.5,
                                gpsAccLat: 1.2,
                                gpsAccLon: 1.3,
                                gpsAccAlt: 2.0,
                                gpsCourseAngle: 180.0,
                                gpsSignalQuality: 4.5,
                                gpsFixedStatus: 1,
                            }
                        
                    }
                }]
            }
        };

        console.log('\n 1. JSON BEFORE encoding:');
        console.log(JSON.stringify(payload, null, 2));

        const errMsg = AlertMessage.verify(payload);
        if (errMsg) {
            console.error(' VERIFY FAILED:', errMsg);
            client.end();
            return;
        }
        console.log(' protobuf VALID');

        const msg = AlertMessage.create(payload);
        const buf = AlertMessage.encode(msg).finish();

        console.log('\n 2. HEX protobuf:');
        console.log(buf.toString('hex').toUpperCase());
        console.log(` Size: ${buf.length} bytes`);

        const decoded = AlertMessage.toObject(AlertMessage.decode(buf), { longs: String });
        console.log('\n 3. DECODED:');
        console.log(JSON.stringify(decoded, null, 2));

        const topic = `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/alerts`;
        client.publish(topic, buf, { qos: 1 }, (err) => {
            if (err) console.error(' PUBLISH ERROR:', err);
            else console.log(`\n alerts SENT (${buf.length} bytes)`);
            setTimeout(() => client.end(), 1000);
        });
    });

    client.on('error', (err) => console.error(' MQTT ERROR:', err));
    client.on('close', () => console.log(' Closed'));
}

sendExactAlerts().catch(console.error);
