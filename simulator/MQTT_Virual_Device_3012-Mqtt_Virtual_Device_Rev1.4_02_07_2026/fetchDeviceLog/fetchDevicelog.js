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
 // BROKER: process.env.BROKER || 'mqtts://lb2.cvip-preprod.citroen.in:48883'
  BROKER:process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883'
};

let sendCount = 0;
let dynamicCorrelationId = null;
let isSubscribed = false;
let protoObjects = null;
let commandReceived = false;  // NEW: Track if command was received

function getTimestamp() {
  const now = Date.now();
  return {
    seconds: Math.floor(now / 1000),
    nanos: (now % 1000) * 1000000
  };
}

async function sendCommandResponse(client) {
  sendCount++;

  const obj = {
    messageId: CONFIG.MESSAGE_ID,
    correlationId: dynamicCorrelationId || CONFIG.CORRELATION_ID,  // Uses extracted ID if available
    subtype: protoObjects.commandResponseSubType.values.FetchLogsCommandResponse,
    tboxOperatingState: protoObjects.eTboxOperatingState.values.normal,
    eTboxApplicationState: protoObjects.eTboxApplicationState.values.customer,
    tboxEsimState: protoObjects.eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    commandResponsePayload: {
      fetchlogsCommandResponsePayload: {
        commandStatus: protoObjects.CommandStatus.values.success,
      //  fetchlogserrorcode: protoObjects.FetchLogsErrorCode.values.invalidErrorCode
      }
    }
  };

  console.log(`\n Sending CommandResponse #${sendCount}`);
  console.log("Payload:", JSON.stringify(obj, null, 2));

  try {
    const errMsg = protoObjects.CommandResponseMessage.verify(obj);
    if (errMsg) throw new Error(errMsg);

    const msg = protoObjects.CommandResponseMessage.create(obj);
    const buf = protoObjects.CommandResponseMessage.encode(msg).finish();
    const hex = buf.toString('hex').toUpperCase();
    console.log('\n SEND #' + sendCount + ' SUCCESS');
    console.log('SIZE:', buf.length, 'bytes');
    console.log('FULL HEX:', hex);
    console.log('TOPIC:', `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/commandResponse`);

    client.publish(`/dongle/${CONFIG.VIN}/MQTTPROTOBUF/commandResponse`, buf, { qos: 1 });
  } catch (e) {
    console.error(' PROTO ERROR:', e.message);
  }
}

async function startCommandResponse() {
  console.log('Loading Protobufs for CommandResponse...');

  const root = await protobuf.load([
    "Jeep_Proto/jeep_commandresponse_message.proto",
    "Jeep_Proto/jeep_common.proto",
    "Jeep_Proto/timestamp.proto",
    "Jeep_Proto/jeep_ota_command.proto"
  ]);

  protoObjects = {
    CommandResponseMessage: root.lookupType("stla.cvip.jeep.CommandResponseMessage"),
    commandResponseSubType: root.lookupEnum("stla.cvip.jeep.commandResponseSubType"),
    eTboxOperatingState: root.lookupEnum("stla.cvip.jeep.eTboxOperatingState"),
    eTboxApplicationState: root.lookupEnum("stla.cvip.jeep.eTboxApplicationState"),
    eTboxeSimState: root.lookupEnum("stla.cvip.jeep.eTboxeSimState"),
    CommandStatus: root.lookupEnum("stla.cvip.jeep.CommandStatus"),
    TBOXState: root.lookupEnum("stla.cvip.jeep.TBOXState")
  };

  console.log(' Protobuf LOADED');

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

  // Message handler (always active)
  client.on('message', (topic, message) => {
    console.log('\n RECEIVED COMMAND:');
    console.log('Topic:', topic);
    console.log('Hex:', message.toString('hex'));
    
    const hex = message.toString('hex');
    if (hex.startsWith('0a24')) {
      const uuidHex = hex.substring(4, 76);
      dynamicCorrelationId = Buffer.from(uuidHex, 'hex').toString('utf8');
      console.log(' CORRELATION_ID EXTRACTED:', dynamicCorrelationId);
      commandReceived = true;
      
      // IMMEDIATELY send response with extracted correlationId
      sendCommandResponse(client);
    }
  });

  client.on('connect', () => {
    console.log(' MQTT CONNECTED');

    // 1. SUBSCRIBE FIRST
    const commandTopic = `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/command`;
    client.subscribe(commandTopic, { qos: 1 }, (err) => {
      if (!err) {
        console.log(` SUBSCRIBED to: ${commandTopic}`);
        isSubscribed = true;
        
        console.log(' WAITING FOR FIRST COMMAND...');
        
        // 2. Wait indefinitely for first command, then start periodic publishing
        const checkCommandInterval = setInterval(() => {
          if (commandReceived) {
            console.log(' FIRST COMMAND RECEIVED - Starting periodic publishes...');
            clearInterval(checkCommandInterval);
            
            // Start periodic publishes after first command
            setTimeout(() => {
              setInterval(() => {
                if (client.connected) {
                  sendCommandResponse(client);
                }
              }, 60000);
            }, 1000);
          }
        }, 500); // Check every 500ms
        
      } else {
        console.error(' SUBSCRIBE ERROR:', err.message);
      }
    });
  });

  client.on('packetsend', packet => {
    if (packet.cmd === 'publish') {
      console.log(' SENT:', packet.topic, `(${packet.payload.length} bytes)`);
    }
  });

  client.on('error', err => console.error(' MQTT ERROR:', err.message));
}

startCommandResponse().catch(console.error);
