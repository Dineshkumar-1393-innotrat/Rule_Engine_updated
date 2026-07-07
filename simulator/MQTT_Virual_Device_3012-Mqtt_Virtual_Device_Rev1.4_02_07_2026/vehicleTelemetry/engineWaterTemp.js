
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
  BROKER:process.env.BROKER || 'mqtts://cvipiot.fca-india.com:18883',
 // BROKER: process.env.BROKER || 'mqtts://lb2.cvip-preprod.citroen.in:48883'
 //  BROKER:process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883',
};
let sendCount = 0;
let connectCount = 0;


function getTimestamp() {
  const now = new Date();
  return {
    seconds: Math.floor(now.getTime() / 1000),
    nanos: (now.getTime() % 1000) * 1000000
  };
}

function encodeJsonToHex(jsonObj, MessageType) {
  const errMsg = MessageType.verify(jsonObj);
  if (errMsg) throw new Error("Invalid payload: " + errMsg);

  const msg = MessageType.create(jsonObj);
  console.log("Encoded CanDataMessage (internal):");
  console.log(JSON.stringify(msg, null, 2));

  const buf = MessageType.encode(msg).finish();
  const hex = Buffer.from(buf).toString("hex");
  return {
    buf,
    prettyHex: "<Buffer " + hex.match(/.{1,4}/g).join(" ") + ">",
    rawHex: hex
  };
}

async function startTelemetry() {
  console.log('Loading Vehicle Telemetry Protobufs...');

  const root = await protobuf.load([
    'Jeep_Proto/jeep_candata_message.proto',
    'Jeep_Proto/jeep_candata.proto',
    'Jeep_Proto/jeep_common.proto',
    'Jeep_Proto/timestamp.proto'
  ]);

  const CanDataMessage = root.lookupType('stla.cvip.jeep.CANDataMessage');
  const eTboxApplicationState = root.lookupEnum('stla.cvip.jeep.eTboxApplicationState');
  const eTboxeSimState = root.lookupEnum('stla.cvip.jeep.eTboxeSimState');
const eTboxOperatingState = root.lookupEnum('stla.cvip.jeep.eTboxOperatingState'); 
  console.log('\n=== ACTUAL FIELD NAMES FROM PROTO ===');
  CanDataMessage.fieldsArray.forEach(f => {
    console.log(`Field ${f.id}: "${f.name}" (type: ${f.type})`);
  });

  console.log('Protobuf loaded - CANDataMessage ready');
  console.log('Topic:', `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/vehicleTelemetry`);
  console.log('Broker:', CONFIG.BROKER);
  console.log('ClientID:', CONFIG.IMEI);

  const client = mqtt.connect(CONFIG.BROKER, {
    clientId: CONFIG.IMEI,
    clean: true,
    keepalive: 30,
    rejectUnauthorized: false,
    // ca: fs.readFileSync('./certs/cvipcabundle.pem'),
    // cert: fs.readFileSync('./certs/ping-cert.pem'),
    // key: fs.readFileSync('./certs/ping-key.pem'),
      ca: fs.existsSync('./certs/cacert.pem') ? fs.readFileSync('./certs/cacert.pem') : (fs.existsSync('./certs/ca.crt') ? fs.readFileSync('./certs/ca.crt') : fs.existsSync('./certs/cacert.pem') ? fs.readFileSync('./certs/cacert.pem') : (fs.existsSync('./certs/ca.crt') ? fs.readFileSync('./certs/ca.crt') : fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/cacert.pem'))),
      cert: fs.existsSync('./certs/client.pem') ? fs.readFileSync('./certs/client.pem') : (fs.existsSync('./certs/client.crt') ? fs.readFileSync('./certs/client.crt') : fs.existsSync('./certs/client.pem') ? fs.readFileSync('./certs/client.pem') : (fs.existsSync('./certs/client.crt') ? fs.readFileSync('./certs/client.crt') : fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/client.pem'))),
      key: fs.existsSync('./certs/device-key.key') ? fs.readFileSync('./certs/device-key.key') : (fs.existsSync('./certs/client.key') ? fs.readFileSync('./certs/client.key') : fs.existsSync('./certs/device-key.key') ? fs.readFileSync('./certs/device-key.key') : (fs.existsSync('./certs/client.key') ? fs.readFileSync('./certs/client.key') : fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/device-key.key'))),
           
    protocolVersion: 4
  });

  client.on('connect', () => {
    connectCount++;
    console.log('\nCONNECTION #' + connectCount + ' SUCCESS - Client ID: ' + CONFIG.IMEI);
    console.log('Starting Vehicle Telemetry (60s interval)...');
    console.log('Status: CONNECTED');

    sendVehicleTelemetry(client, CanDataMessage, eTboxApplicationState, eTboxeSimState,eTboxOperatingState);
    setInterval(() => {
      if (client.connected) {
        console.log('\n60s TIMER FIRED - Sending telemetry...');
        sendVehicleTelemetry(client, CanDataMessage, eTboxApplicationState, eTboxeSimState,eTboxOperatingState);
      } else {
        console.log('60s TIMER - DISCONNECTED');
      }
    }, 60 * 1000);
  });

  client.on('message', (topic, message) => {
    console.log('\nSERVER REPLY [' + topic + '] (' + message.length + ' bytes)');
  });

  client.on('packetsend', (packet) => {
    if (packet.cmd === 'publish') {
      console.log('PACKET SENT: ' + packet.topic + ' (' + packet.payload.length + ' bytes)');
    }
  });

  client.on('error', err => {
    console.error('MQTT ERROR: ' + err.message);
    console.error('Check: certs, network, broker availability');
  });

  client.on('close', () => {
    console.log('DISCONNECTED - Will auto-reconnect');
    console.log('Status: DISCONNECTED');
  });

  client.on('reconnect', () => {
    console.log('RECONNECTING... (attempt in 1s)');
  });

  client.on('offline', () => {
    console.log('OFFLINE - No network');
  });

  setInterval(() => {
    const status = client.connected ? 'CONNECTED' : 'DISCONNECTED';
    console.log('\nSTATUS CHECK: ' + status + ' | Sends: ' + sendCount + ' | Time: ' + new Date().toLocaleTimeString());
  }, 30 * 1000);
}

function sendVehicleTelemetry(client, CanDataMessage, eTboxApplicationState, eTboxeSimState,eTboxOperatingState) {
  sendCount++;
  console.log('\nSEND #' + sendCount + ' - Building telemetry...');
// const PDU_OCTAL = "\x000\x000\x000\x002\x002\x200\x000\x000";
  const telemetryObj = {
    
    messageId: "dd52bab1-c64a-431b-a945-1602f26e9f4e",                            
    eTboxApplicationState: eTboxApplicationState.values.customer,
    tboxEsimState: eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    // Tbox_operating_state: 0,
    // e_Tbox_application_state: eTboxApplicationState.values.customer,
    // Tbox_esim_state: eTboxeSimState.values.normal_sim,
    // version: "2.0.0",
    // time_stamp: getTimestamp(),
    canDataPayload: {
      canData: {
        canDataPacket: [
          {
            identifier: 994,
            dlc: 8,
  
            cData: [
              {
                 pdu: Buffer.from([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
                //pdu: Buffer.from(PDU_OCTAL, "latin1"),
                timestamp: getTimestamp()
              },
              {
                 pdu: Buffer.from([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
                 //  pdu: Buffer.from([0x00, 0x00, 0x00, 0x02, 0x02, 0x80, 0x00, 0x00]),
                //  pdu: Buffer.from(PDU_OCTAL, "latin1"),
                timestamp: getTimestamp()
              },
              {
                pdu: Buffer.from([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
                 //  pdu: Buffer.from([0x00, 0x00, 0x00, 0x02, 0x02, 0x80, 0x00, 0x00]),
                //  pdu: Buffer.from(PDU_OCTAL, "latin1"),
                timestamp: getTimestamp()
              },
              {
             pdu: Buffer.from([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
                 //  pdu: Buffer.from([0x00, 0x00, 0x00, 0x02, 0x02, 0x80, 0x00, 0x00]),
                //  pdu: Buffer.from(PDU_OCTAL, "latin1"),
                timestamp: getTimestamp()
              },
              {
                pdu: Buffer.from([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
                 //  pdu: Buffer.from([0x00, 0x00, 0x00, 0x02, 0x02, 0x80, 0x00, 0x00]),
                //  pdu: Buffer.from(PDU_OCTAL, "latin1"),
                timestamp: getTimestamp()
              },
              {
               pdu: Buffer.from([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
                 //  pdu: Buffer.from([0x00, 0x00, 0x00, 0x02, 0x02, 0x80, 0x00, 0x00]),
                //  pdu: Buffer.from(PDU_OCTAL, "latin1"),
                timestamp: getTimestamp()
              }
            ]
          }
        ]
      }
    }
  };

  console.log("telemetryObj:", JSON.stringify(telemetryObj, null, 2));

  try {
    const { buf, prettyHex, rawHex } = encodeJsonToHex(telemetryObj, CanDataMessage);

    console.log("\n---------------------------");
    console.log("FULL CanDataMessage HEX:");
    console.log("---------------------------");
    console.log(prettyHex);
    console.log("---------------------------\n");

    console.log("RAW HEX (MQTT payload):");
    console.log(rawHex);

    const topic = `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/vehicleTelemetry`;
    console.log('Encoded: ' + buf.length + ' bytes | Hex: ' + rawHex.slice(0, 48) + '...');

    client.publish(topic, buf, { qos: 1 }, (err) => {
      if (err) {
        console.error('PUBLISH FAILED: ' + err.message);
      } else {
        console.log('TELEMETRY #' + sendCount + ' SENT SUCCESS [' + rawHex.slice(0, 23) + '...] -> ' + topic);
        console.log('Total sends: ' + sendCount + ' | Size: ' + buf.length + ' bytes | QoS: 1');
      }
    });
  } catch (e) {
    console.error('ENCODE ERROR: ' + e.message);
    console.error('Check proto files in proto_new/ folder');
  }
}

startTelemetry().catch(err => {
  console.error('FATAL STARTUP ERROR: ' + err.message);
  console.error('Missing files? Check proto_new/ and certs/ folders');
});

