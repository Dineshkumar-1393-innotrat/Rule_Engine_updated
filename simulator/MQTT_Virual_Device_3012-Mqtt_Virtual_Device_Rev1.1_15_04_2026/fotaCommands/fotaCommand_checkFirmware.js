require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const protobuf = require('protobufjs');

['VIN','IMEI','MESSAGE_ID','CORRELATION_ID'].forEach(k => {
  if (!process.env[k]) throw new Error(`Missing ENV variable: ${k}`);
});

const CONFIG = {
  VIN: process.env.VIN,
  IMEI: process.env.IMEI,
  MESSAGE_ID: process.env.MESSAGE_ID,
  CORRELATION_ID: process.env.CORRELATION_ID,
  BROKER: 'mqtts://lb2.cvip-preprod.citroen.in:48883'
};

let protoObjects;
let dynamicCorrelationId = null;
let sendCount = 0;
let commandReceived = false;

/* ------------------ UTIL ------------------ */

function getTimestamp() {
  const now = Date.now();
  return {
    seconds: Math.floor(now / 1000),
    nanos: (now % 1000) * 1000000
  };
}

function enumName(enumObj, value) {
  return Object.keys(enumObj.values).find(k => enumObj.values[k] === value);
}

/* ------------------ SEND RESPONSE ------------------ */

async function sendCommandResponse(client) {
  sendCount++;

  const responsePayload = {
    messageId: CONFIG.MESSAGE_ID,
    correlationId: dynamicCorrelationId || CONFIG.CORRELATION_ID,
    subtype: protoObjects.FotaCommandSubType.values.FirmwareDownloadCommand,
    tboxOperatingState: protoObjects.eTboxOperatingState.values.normal,
    eTboxApplicationState: protoObjects.TBOXState.values.AUTHORIZED,
    tboxEsimState: protoObjects.eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    fotacommandResponsePayload: {
      remoteFirmwareCheckCommandResponse: {
        ecuCode:protoObjects.ECUCode.values.TBOX,
        CCPUVersion:protoObjects.CCPUVersion.values,
        VMCUVersion:protoObjects.VMCUVersion.values
      }
    }
  };

  console.log(`\n SENDING FOTA COMMAND RESPONSE #${sendCount}`);
  console.log(JSON.stringify(responsePayload, null, 2));

  const err = protoObjects.FotaCommandResponseMessage.verify(responsePayload);
  if (err) throw new Error(err);

  const msg =
    protoObjects.FotaCommandResponseMessage.create(responsePayload);

  const buf =
    protoObjects.FotaCommandResponseMessage.encode(msg).finish();

  console.log(' RESPONSE HEX:', buf.toString('hex').toUpperCase());

  client.publish(
    `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/fotaCommandResponse`,
    buf,
    { qos: 1 }
  );
}

/* ------------------ MAIN ------------------ */

async function start() {
  console.log('Loading protobufs...');

  const root = await protobuf.load([
    "Jeep_Proto/jeep_fota_command_message.proto",
    "Jeep_Proto/jeep_fota_command.proto",
    "Jeep_Proto/jeep_fota_commandresponse_message.proto",
    "Jeep_Proto/timestamp.proto",
    "Jeep_Proto/jeep_ota_command.proto",
    "Jeep_Proto/jeep_common.proto"
  ]);

  protoObjects = {
    FotaCommandMessage:
      root.lookupType("stla.cvip.jeep.fotaCommandMessage"),
    FotaCommandSubType:
      root.lookupEnum("stla.cvip.jeep.fotacommandSubType"),
    FotaCommandResponseMessage:
      root.lookupType("stla.cvip.jeep.fotaCommandResponseMessage"),
    remoteFirmwareCheckCommandResponse:
      root.lookupEnum("stla.cvip.jeep.remoteFirmwareCheckCommandResponse"),
    eTboxOperatingState:
      root.lookupEnum("stla.cvip.jeep.eTboxOperatingState"),
    eTboxeSimState:
      root.lookupEnum("stla.cvip.jeep.eTboxeSimState"),
    TBOXState:
      root.lookupEnum("stla.cvip.jeep.TBOXState")
  };

  console.log('Protobufs loaded');

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

  /* -------- RECEIVE & DECODE -------- */

  client.on('message', (topic, message) => {
    console.log('\n RECEIVED FOTA COMMAND');
    console.log(' Topic:', topic);
    console.log(' HEX  :', message.toString('hex').toUpperCase());

    try {
      const decoded =
        protoObjects.FotaCommandMessage.decode(message);

      const payload =
        protoObjects.FotaCommandMessage.toObject(decoded, {
          longs: String,
          enums: Number,
          defaults: true
        });

      console.log('\n DECODED FOTA COMMAND');
      console.log(JSON.stringify(payload, null, 2));

      dynamicCorrelationId = payload.messageId;
      commandReceived = true;

      const subtypeName = enumName(
        protoObjects.FotaCommandSubType,
        payload.subtype
      );

      console.log('\n COMMAND DETAILS');
      console.log(' CorrelationId:', payload.correlationId);
      console.log(' SubType      :', subtypeName);
      console.log(' Version      :', payload.version);

      const fw =
        payload.fotacommandPayload?.firmwareDownloadCommandPayload;

      if (fw) {
        console.log('\n FIRMWARE ARTIFACTS');
        fw.firmwareDownloadArtifacts.forEach((f, i) => {
          console.log(`\n  Artifact ${i + 1}`);
          console.log('  FileType       :', f.fileType === 1 ? 'MCU' : 'NAD');
          console.log('  ReleaseVersion :', f.releaseVersion);
          console.log('  DownloadURL    :', f.downloadUrl);
          console.log('  Checksum       :', f.checksum);
        });
      }

      sendCommandResponse(client);

    } catch (e) {
      console.error('PROTOBUF DECODE ERROR:', e.message);
    }
  });

  /* -------- CONNECT -------- */

  client.on('connect', () => {
    console.log('MQTT CONNECTED');

    const topic =
      `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/fotaCommand`;

    client.subscribe(topic, { qos: 1 }, () => {
      console.log('SUBSCRIBED:', topic);
      console.log('WAITING FOR FOTA COMMAND...');
    });
  });

  client.on('error', err =>
    console.error('MQTT ERROR:', err.message)
  );
}

start().catch(console.error);
