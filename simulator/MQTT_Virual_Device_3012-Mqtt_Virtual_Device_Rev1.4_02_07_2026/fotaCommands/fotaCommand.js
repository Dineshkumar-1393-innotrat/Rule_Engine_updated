// require('dotenv').config();
// const mqtt = require('mqtt');
// const fs = require('fs');
// const protobuf = require('protobufjs');

// ['VIN','IMEI','MESSAGE_ID','CORRELATION_ID'].forEach(k => {
//   if (!process.env[k]) throw new Error(`Missing ENV variable: ${k}`);
// });

// const CONFIG = {
//   VIN: process.env.VIN,
//   IMEI: process.env.IMEI,
//   MESSAGE_ID: process.env.MESSAGE_ID,
//   CORRELATION_ID: process.env.CORRELATION_ID,
//   //BROKER: process.env.BROKER || 'mqtts://lb2.cvip-preprod.citroen.in:48883',
//   BROKER:process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883'
// };

// let protoObjects;
// let dynamicCorrelationId = null;
// let sendCount = 0;
// let commandReceived = false;

// /* ------------------ UTIL ------------------ */

// function getTimestamp() {
//   const now = Date.now();
//   return {
//     seconds: Math.floor(now / 1000),
//     nanos: (now % 1000) * 1000000
//   };
// }

// function enumName(enumObj, value) {
//   return Object.keys(enumObj.values).find(k => enumObj.values[k] === value);
// }

// /* ------------------ SEND RESPONSE ------------------ */

// async function sendCommandResponse(client) {
//   sendCount++;

//   const responsePayload = {
//     messageId: CONFIG.MESSAGE_ID,
//     correlationId: dynamicCorrelationId || CONFIG.CORRELATION_ID,
//     subtype: protoObjects.FotaCommandSubType.values.FirmwareDownloadCommandResponse,
//     tboxOperatingState: protoObjects.eTboxOperatingState.values.normal,
//     eTboxApplicationState: protoObjects.TBOXState.values.CUSTOMER,
//     tboxEsimState: protoObjects.eTboxeSimState.values.normal_sim,
//     version: "2.0.0",
//     timeStamp: getTimestamp(),
//     fotacommandResponsePayload: {
//       firmwareDownloadCommandResponse: {
//         downloadAndInstallFirmwareCommandState:protoObjects.DownloadAndInstallFirmwareCommandState.values.NAD_Download_Successful,
//       //  returnFailureCode:protoObjects.FotaFailureCode.values.DownloadInProgressVMCUDownloadRetryFailure
//       }
//     }
//   };

//   console.log(`\n SENDING FOTA COMMAND RESPONSE #${sendCount}`);
//   console.log(JSON.stringify(responsePayload, null, 2));

//   const err = protoObjects.FotaCommandResponseMessage.verify(responsePayload);
//   if (err) throw new Error(err);

//   const msg =
//     protoObjects.FotaCommandResponseMessage.create(responsePayload);

//   const buf =
//     protoObjects.FotaCommandResponseMessage.encode(msg).finish();

//   console.log(' RESPONSE HEX:', buf.toString('hex').toUpperCase());

//   client.publish(
//     `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/fotaCommandResponse`,
//     buf,
//     { qos: 1 }
//   );
// }

// /* ------------------ MAIN ------------------ */

// async function start() {
//   console.log('Loading protobufs...');

//   const root = await protobuf.load([
//     "Jeep_Proto/jeep_fota_command_message.proto",
//     "Jeep_Proto/jeep_fota_command.proto",
//     "Jeep_Proto/jeep_fota_commandresponse_message.proto",
//     "Jeep_Proto/timestamp.proto",
//     "Jeep_Proto/jeep_ota_command.proto",
//     "Jeep_Proto/jeep_common.proto"
//   ]);

//   protoObjects = {
//     FotaFailureCode:
//       root.lookupEnum("stla.cvip.jeep.FotaFailureCode"),
//     FotaCommandMessage:
//       root.lookupType("stla.cvip.jeep.fotaCommandMessage"),
//     FotaCommandSubType:
//       root.lookupEnum("stla.cvip.jeep.fotacommandResponseSubType"),
//     FotaCommandResponseMessage:
//       root.lookupType("stla.cvip.jeep.fotaCommandResponseMessage"),
//     DownloadAndInstallFirmwareCommandState:
//       root.lookupEnum("stla.cvip.jeep.DownloadAndInstallFirmwareCommandState"),
//     eTboxOperatingState:
//       root.lookupEnum("stla.cvip.jeep.eTboxOperatingState"),
//     eTboxeSimState:
//       root.lookupEnum("stla.cvip.jeep.eTboxeSimState"),
//     TBOXState:
//       root.lookupEnum("stla.cvip.jeep.TBOXState")
//   };

//   console.log('Protobufs loaded');

//   const client = mqtt.connect(CONFIG.BROKER, {
//     clientId: CONFIG.IMEI,
//     clean: true,
//     keepalive: 30,
//     rejectUnauthorized: false,
//     ca: fs.readFileSync('./certs/cvipcabundle.pem'),
//     cert: fs.readFileSync('./certs/ping-cert.pem'),
//     key: fs.readFileSync('./certs/ping-key.pem'),
//     protocolVersion: 4
//   });

//   /* -------- RECEIVE & DECODE -------- */

//   client.on('message', (topic, message) => {
//     console.log('\n RECEIVED FOTA COMMAND');
//     console.log(' Topic:', topic);
//     console.log(' HEX  :', message.toString('hex').toUpperCase());

//     try {
//       const decoded =
//         protoObjects.FotaCommandMessage.decode(message);

//       const payload =
//         protoObjects.FotaCommandMessage.toObject(decoded, {
//           longs: String,
//           enums: Number,
//           defaults: true
//         });

//       console.log('\n DECODED FOTA COMMAND');
//       console.log(JSON.stringify(payload, null, 2));

//       dynamicCorrelationId = payload.messageId;
//       commandReceived = true;

//       const subtypeName = enumName(
//         protoObjects.FotaCommandSubType,
//         payload.subtype
//       );

//       console.log('\n COMMAND DETAILS');
//       console.log(' CorrelationId:', payload.correlationId);
//       console.log(' SubType      :', subtypeName);
//       console.log(' Version      :', payload.version);

//       const fw =
//         payload.fotacommandPayload?.firmwareDownloadCommandPayload;

//       if (fw) {
//         console.log('\n FIRMWARE ARTIFACTS');
//         fw.firmwareDownloadArtifacts.forEach((f, i) => {
//           console.log(`\n  Artifact ${i + 1}`);
//           console.log('  FileType       :', f.fileType === 1 ? 'MCU' : 'NAD');
//           console.log('  ReleaseVersion :', f.releaseVersion);
//           console.log('  DownloadURL    :', f.downloadUrl);
//           console.log('  Checksum       :', f.checksum);
//         });
//       }

//       sendCommandResponse(client);

//     } catch (e) {
//       console.error('PROTOBUF DECODE ERROR:', e.message);
//     }
//   });

//   /* -------- CONNECT -------- */

//   client.on('connect', () => {
//     console.log('MQTT CONNECTED');

//     const topic =
//       `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/fotaCommand`;

//     client.subscribe(topic, { qos: 1 }, () => {
//       console.log('SUBSCRIBED:', topic);
//       console.log('WAITING FOR FOTA COMMAND...');
//     });
//   });

//   client.on('error', err =>
//     console.error('MQTT ERROR:', err.message)
//   );
// }

// start().catch(console.error);



require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const protobuf = require('protobufjs');

['VIN', 'IMEI', 'MESSAGE_ID', 'CORRELATION_ID'].forEach((k) => {
  if (!process.env[k]) throw new Error(`Missing ENV variable: ${k}`);
});

const CONFIG = {
  VIN: process.env.VIN,
  IMEI: process.env.IMEI,
  MESSAGE_ID: process.env.MESSAGE_ID,
  CORRELATION_ID: process.env.CORRELATION_ID,
  BROKER: process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883'
};

let root;
let protoObjects;
let dynamicCorrelationId = null;
let sendCount = 0;

/* ------------------ UTIL ------------------ */

function getTimestamp() {
  const now = Date.now();
  return {
    seconds: Math.floor(now / 1000),
    nanos: (now % 1000) * 1000000
  };
}

function enumName(enumObj, value) {
  return Object.keys(enumObj.values).find(
    (k) => enumObj.values[k] === value
  );
}

/* Get enum value from the exact field type used by message */
function getFieldEnumValue(messageType, fieldName, enumKey) {
  const field = messageType.fields[fieldName];
  if (!field) throw new Error(`Field not found: ${fieldName}`);

  const resolved = field.resolvedType;
  if (!resolved || !resolved.values) {
    throw new Error(`Field ${fieldName} is not enum type`);
  }

  if (!(enumKey in resolved.values)) {
    throw new Error(
      `Enum key "${enumKey}" not found in field ${fieldName}`
    );
  }

  return resolved.values[enumKey];
}

/* ------------------ SEND RESPONSE ------------------ */

async function sendCommandResponse(client) {
  sendCount++;

  const responseType = protoObjects.FotaCommandResponseMessage;

  const responsePayload = {
    messageId: CONFIG.MESSAGE_ID,
    correlationId: dynamicCorrelationId || CONFIG.CORRELATION_ID,

    subtype: getFieldEnumValue(
      responseType,
      'subtype',
      'FirmwareDownloadCommandResponse'
    ),

    tboxOperatingState: getFieldEnumValue(
      responseType,
      'tboxOperatingState',
      'normal'
    ),

    eTboxApplicationState: getFieldEnumValue(
      responseType,
      'eTboxApplicationState',
      'customer'
    ),

    tboxEsimState: getFieldEnumValue(
      responseType,
      'tboxEsimState',
      'normal_sim'
    ),

    version: '2.0.0',
    timeStamp: getTimestamp(),

    fotacommandResponsePayload: {
      firmwareDownloadCommandResponse: {
        downloadAndInstallFirmwareCommandState:
          protoObjects
            .DownloadAndInstallFirmwareCommandState
            .values
            .NAD_Download_Successful
      }
    }
  };

  console.log(`\nSENDING FOTA COMMAND RESPONSE #${sendCount}`);
  console.log(JSON.stringify(responsePayload, null, 2));

  const err = responseType.verify(responsePayload);
  if (err) throw new Error(err);

  const msg = responseType.create(responsePayload);
  const buf = responseType.encode(msg).finish();

  console.log('RESPONSE HEX:', buf.toString('hex').toUpperCase());

  client.publish(
    `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/fotaCommandResponse`,
    buf,
    { qos: 1 },
    (err) => {
      if (err) console.error('PUBLISH ERROR:', err.message);
      else console.log('RESPONSE PUBLISHED SUCCESSFULLY');
    }
  );
}

/* ------------------ MAIN ------------------ */

async function start() {
  console.log('Loading protobufs...');

  root = await protobuf.load([
    'Jeep_Proto/jeep_fota_command_message.proto',
    'Jeep_Proto/jeep_fota_command.proto',
    'Jeep_Proto/jeep_fota_commandresponse_message.proto',
    'Jeep_Proto/timestamp.proto',
    'Jeep_Proto/jeep_ota_command.proto',
    'Jeep_Proto/jeep_common.proto'
  ]);

  protoObjects = {
    FotaFailureCode: root.lookupEnum(
      'stla.cvip.jeep.FotaFailureCode'
    ),

    FotaCommandMessage: root.lookupType(
      'stla.cvip.jeep.fotaCommandMessage'
    ),

    FotaCommandSubType: root.lookupEnum(
      'stla.cvip.jeep.fotacommandResponseSubType'
    ),

    FotaCommandResponseMessage: root.lookupType(
      'stla.cvip.jeep.fotaCommandResponseMessage'
    ),

    DownloadAndInstallFirmwareCommandState:
      root.lookupEnum(
        'stla.cvip.jeep.DownloadAndInstallFirmwareCommandState'
      )
  };

  console.log('Protobufs loaded');

  console.log(
    'Actual enum used by eTboxApplicationState:',
    protoObjects
      .FotaCommandResponseMessage
      .fields
      .eTboxApplicationState
      .resolvedType
      .values
  );

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

  /* -------- CONNECT -------- */

  client.on('connect', () => {
    console.log('MQTT CONNECTED');

    const topic =
      `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/fotaCommand`;

    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) {
        console.error('SUBSCRIBE ERROR:', err.message);
        return;
      }

      console.log('SUBSCRIBED:', topic);
      console.log('WAITING FOR FOTA COMMAND...');
    });
  });

  /* -------- RECEIVE -------- */

  client.on('message', async (topic, message) => {
    console.log('\nRECEIVED FOTA COMMAND');
    console.log('TOPIC:', topic);
    console.log('HEX  :', message.toString('hex').toUpperCase());

    try {
      const decoded =
        protoObjects.FotaCommandMessage.decode(message);

      const payload =
        protoObjects.FotaCommandMessage.toObject(decoded, {
          longs: String,
          enums: Number,
          defaults: true
        });

      console.log('\nDECODED FOTA COMMAND');
      console.log(JSON.stringify(payload, null, 2));

      dynamicCorrelationId =
        payload.messageId || CONFIG.CORRELATION_ID;

      console.log('\nCOMMAND DETAILS');
      console.log('MessageId     :', payload.messageId);
      console.log('CorrelationId :', payload.correlationId);
      console.log('Subtype       :', payload.subtype);
      console.log('Version       :', payload.version);

      const files =
        payload?.fotaCommandPayload
          ?.firmwareDownloadCommand
          ?.firmwareDownloadPayload || [];

      if (files.length) {
        console.log('\nFIRMWARE FILES');

        files.forEach((f, i) => {
          console.log(`\nArtifact ${i + 1}`);
          console.log('Type           :', f.firmwareType);
          console.log('URL            :', f.url);
          console.log('ReleaseVersion :', f.releaseVersion);
          console.log('Checksum       :', f.rawCheckSum);
          console.log('Size           :', f.softwareSize);
        });
      }

      await sendCommandResponse(client);

    } catch (e) {
      console.error('PROTOBUF ERROR:', e.message);
    }
  });

  client.on('error', (err) => {
    console.error('MQTT ERROR:', err.message);
  });

  client.on('close', () => {
    console.log('MQTT CONNECTION CLOSED');
  });
}

start().catch(console.error);