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
  BROKER:process.env.BROKER || 'mqtts://cvipiot.fca-india.com:18883',
  //BROKER:process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883'
  // BROKER: process.env.BROKER || 'mqtts://lb2.cvip-preprod.citroen.in:48883'
};

let sendCount = 0;

function getTimestamp() {
  const now = Date.now();
  return {
    seconds: Math.floor(now / 1000),
    nanos: (now % 1000) * 1000000
  };
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
  const CommandStatus = root.lookupEnum("stla.cvip.jeep.CommandStatus");
  const TBOXState = root.lookupEnum("stla.cvip.jeep.TBOXState");

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
    console.log('Remote Address:', client.stream.remoteAddress);
    sendCommandResponse(client, CommandResponseMessage, commandResponseSubType,
      eTboxOperatingState, eTboxApplicationState, eTboxeSimState, CommandStatus, TBOXState);

    setInterval(() => {
      if (client.connected) {
        sendCommandResponse(client, CommandResponseMessage, commandResponseSubType,
          eTboxOperatingState, eTboxApplicationState, eTboxeSimState, CommandStatus, TBOXState);
      }
    }, 60000);
  });

  client.on('packetsend', packet => {
    if (packet.cmd === 'publish') {
      console.log('SENT:', packet.topic, `(${packet.payload.length} bytes)`);
    }
  });

  client.on('error', err => console.error('MQTT ERROR:', err.message));
}

function sendCommandResponse(client, CommandResponseMessage, commandResponseSubType,
  eTboxOperatingState, eTboxApplicationState, eTboxeSimState, CommandStatus, TBOXState) {

  sendCount++;

  const obj = {
    messageId: CONFIG.MESSAGE_ID,
    correlationId: CONFIG.CORRELATION_ID,
    subtype: commandResponseSubType.values.TBOXStateUpdateCommandResponse,
    tboxOperatingState: eTboxOperatingState.values.normal,
    eTboxApplicationState: eTboxApplicationState.values.provisioned,
    tboxEsimState: eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    commandResponsePayload: {
      tboxStateUpdateCommandResponsePayload: {
        commandStatus: CommandStatus.values.success,
        currentTboxState: TBOXState.values.AUTHORIZED
      }
    }
  };

  console.log(`\nSending CommandResponse #${sendCount}`);
 console.log("Payload:", JSON.stringify(obj, null, 2));

  try {
    const errMsg = CommandResponseMessage.verify(obj);
    if (errMsg) throw new Error(errMsg);

    const msg = CommandResponseMessage.create(obj);
    const buf = CommandResponseMessage.encode(msg).finish();
    const hex = buf.toString('hex').toUpperCase();
    console.log('\nSEND #' + sendCount + ' SUCCESS');
    console.log('SIZE:', buf.length, 'bytes');
    console.log('FULL HEX:', hex);
    console.log('TOPIC:', `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/commandResponse`);
 
    // Publish to YOUR SPECIFIED TOPIC
    client.publish(`/dongle/${CONFIG.VIN}/MQTTPROTOBUF/commandResponse`, buf, { qos: 1 });
    

  } catch (e) {
    console.error('PROTO ERROR:', e.message);
  }
}

startCommandResponse().catch(console.error);
