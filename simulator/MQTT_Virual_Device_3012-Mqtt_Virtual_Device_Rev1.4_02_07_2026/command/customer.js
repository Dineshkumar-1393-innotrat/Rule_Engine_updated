require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const protobuf = require('protobufjs');

// ENV validation (like provisioned.js)
['IMEI', 'VIN'].forEach(k => {
  if (!process.env[k]) throw new Error(`Missing ENV variable: ${k}`);
});

const CONFIG = {
  IMEI: process.env.IMEI,
  VIN: process.env.VIN,
   BROKER:process.env.BROKER || 'mqtts://cvipiot.fca-india.com:18883',
  // BROKER:process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883',
 // BROKER: process.env.BROKER || 'mqtts://lb2.cvip-preprod.citroen.in:48883',
  MESSAGE_ID: process.env.MESSAGE_ID,  
  CORRELATION_ID: process.env.CORRELATION_ID 
};
let sendCount = 0;

function getCurrentTimestamp() {
  const now = new Date();
  const seconds = Math.floor(now.getTime() / 1000);
  const nanos = (now.getTime() % 1000) * 1000000;
  return { seconds, nanos };
}

async function startCommandResponse() {
  console.log('Loading Protobufs for CommandResponse...');
  
  const root = await protobuf.load([
    "Jeep_Proto/jeep_commandresponse_message.proto",
    "Jeep_Proto/jeep_common.proto",
    "Jeep_Proto/timestamp.proto",
    "Jeep_Proto/jeep_ota_command.proto"
  ]);

  const CommandResponseMessage = root.lookupType("stla.cvip.jeep.CommandResponseMessage");
  const commandResponseSubType = root.lookupEnum("stla.cvip.jeep.commandResponseSubType");
  const eTboxOperatingState = root.lookupEnum("stla.cvip.jeep.eTboxOperatingState");
  const eTboxApplicationState = root.lookupEnum("stla.cvip.jeep.eTboxApplicationState");
  const eTboxeSimState = root.lookupEnum("stla.cvip.jeep.eTboxeSimState");
  const eReturnCode = root.lookupEnum("stla.cvip.jeep.eReturnCode");
  const CommandStatus = root.lookupEnum("stla.cvip.jeep.CommandStatus");
  const TBOXState = root.lookupEnum("stla.cvip.jeep.TBOXState");

  console.log('CommandResponseMessage fields:', CommandResponseMessage.fieldsArray.map(f => f.name));
  console.log('TBOXState enum values:', TBOXState.values);
  console.log('Protobuf LOADED');

  const client = mqtt.connect(CONFIG.BROKER, {
    clientId: CONFIG.IMEI,
    clean: true,
    keepalive: 30,
    rejectUnauthorized: false,
    // ca: fs.readFileSync('./certs/cvipcabundle.pem'),
    // cert: fs.readFileSync('./certs/ping-cert.pem'),
    // key: fs.readFileSync('./certs/ping-key.pem'),
    //  ca: fs.readFileSync('./certs/ca.crt'),
    //   cert: fs.readFileSync('./certs/client.crt'),
    //   key: fs.readFileSync('./certs/client.key'),
    //  ca: fs.readFileSync('./JeepCommonCertificates_May05/ca.crt'),
    //   cert: fs.readFileSync('./JeepCommonCertificates_May05/client.crt'),
    //   key: fs.readFileSync('./JeepCommonCertificates_May05/client.key'),
        ca: fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/cacert.pem'),
        cert: fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/client.pem'),
        key: fs.readFileSync('./T123ZTZT867677788_Modified/T123ZTZT867677788_Modified/device-key.key'),
    protocolVersion: 4
  });

  client.on('connect', () => {
    console.log('MQTT CONNECTED');
    
    sendCommandResponse(client, CommandResponseMessage, commandResponseSubType, eTboxOperatingState, 
                       eTboxApplicationState, eTboxeSimState, CommandStatus, TBOXState);
    
    setInterval(() => {
      if (client.connected) {
        sendCommandResponse(client, CommandResponseMessage, commandResponseSubType, eTboxOperatingState, 
                           eTboxApplicationState, eTboxeSimState, CommandStatus, TBOXState);
      }
    }, 60000);
  });

  client.on('packetsend', (packet) => {
    if (packet.cmd === 'publish') {
      console.log('SENT:', packet.topic, '(' + packet.payload.length + ' bytes)');
    }
  });
}

function sendCommandResponse(client, CommandResponseMessage, commandResponseSubType, eTboxOperatingState, 
                           eTboxApplicationState, eTboxeSimState, CommandStatus, TBOXState) {
  sendCount++;

  const currentTime = getCurrentTimestamp();

  // EXACT SAME PAYLOAD FROM YOUR LATEST CODE - NO CHANGES
  const obj = {
    messageId: process.env.MESSAGE_ID,
    correlationId: process.env.CORRELATION_ID,
    subtype: commandResponseSubType.values.TBOXStateUpdateCommandResponse,
    tboxOperatingState: eTboxOperatingState.values.normal,
    eTboxApplicationState: TBOXState.values.AUTHORIZED,  // Changed to TBOXState (numeric = 1)
    tboxEsimState: eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: currentTime,
    commandResponsePayload: {
      tboxStateUpdateCommandResponsePayload: {
        commandStatus: CommandStatus.values.success,
        currentTboxState: TBOXState.values.CUSTOMER
      }
    }
  };

  console.log("Sending CommandResponse #", sendCount);
  console.log("CURRENT SYSTEM TIMESTAMP:", currentTime);
  console.log("Payload:", JSON.stringify(obj, null, 2));

  try {
    const errMsg = CommandResponseMessage.verify(obj);
    if (errMsg) throw new Error("VERIFY FAILED: " + errMsg);

    const msg = CommandResponseMessage.create(obj);
    
    // Note: Removed the manual override of eTboxApplicationState since payload is correct
    // msg.eTboxApplicationState = "AUTHORIZED";  // This was overriding enum value
    
    const buf = CommandResponseMessage.encode(msg).finish();
    const hex = Buffer.from(buf).toString('hex');
    const rawHex = hex.replace(/\s+/g, "");

    console.log('\nSEND #' + sendCount + ' SUCCESS');
    console.log(' Encoded CommandResponseMessage (internal):');
    console.log(JSON.stringify(msg, null, 2));
    console.log('SIZE:', buf.length, 'bytes');
    console.log('FULL HEX:', "<Buffer " + hex.match(/.{1,4}/g).join(" ") + ">");
    console.log('RAW HEX (MQTT payload):', rawHex);
    console.log('TOPIC:', `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/commandResponse`);

    client.publish(`/dongle/${CONFIG.VIN}/MQTTPROTOBUF/commandResponse`, buf, { qos: 1 });
    
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('Payload that failed:', JSON.stringify(obj, null, 2));
  }
}

startCommandResponse().catch(console.error);
