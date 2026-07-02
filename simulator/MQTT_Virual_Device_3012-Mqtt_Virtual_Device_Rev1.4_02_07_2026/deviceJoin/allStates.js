require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const protobuf = require('protobufjs');

console.log('CVIP COMPLETE FLOW STARTED');

['VIN', 'IMEI', 'TBOX_SERIAL', 'CLIENT_ID'].forEach((k) => {
  if (!process.env[k]) {
    throw new Error(`Missing ENV variable: ${k}`);
  }
});

const CONFIG = {
  VIN: process.env.VIN,
  IMEI: process.env.IMEI,
  TBOX_SERIAL: process.env.TBOX_SERIAL,
  CLIENT_ID: process.env.CLIENT_ID,

  BROKER: process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883',

  TOPIC_DEVICE_JOIN:
    `/dongle/${process.env.VIN}/MQTTPROTOBUF/deviceJoined`,

  TOPIC_DEVICE_JOIN_RSP:
    `/dongle/${process.env.VIN}/MQTTPROTOBUF/deviceJoinedRsp`,

  TOPIC_COMMAND:
    `/dongle/${process.env.VIN}/MQTTPROTOBUF/command`,

  TOPIC_COMMAND_RESPONSE:
    `/dongle/${process.env.VIN}/MQTTPROTOBUF/commandResponse`
};

function getTimestamp() {
  const now = Date.now();

  return {
    seconds: Math.floor(now / 1000),
    nanos: (now % 1000) * 1000000
  };
}

async function start() {

  console.log('Loading protobuf files...');

  const root = await protobuf.load([
    "Jeep_Proto/jeep_command_message.proto",
    "Jeep_Proto/jeep_commandresponse_message.proto",
    "Jeep_Proto/jeep_common.proto",
    "Jeep_Proto/timestamp.proto",
    "Jeep_Proto/jeep_ota_command.proto"
  ]);

  const CommandMessage =
    root.lookupType("stla.cvip.jeep.CommandMessage");

  const CommandResponseMessage =
    root.lookupType("stla.cvip.jeep.CommandResponseMessage");

  const commandSubType =
    root.lookupEnum("stla.cvip.jeep.commandSubType");

  const commandResponseSubType =
    root.lookupEnum("stla.cvip.jeep.commandResponseSubType");

  const eTboxOperatingState =
    root.lookupEnum("stla.cvip.jeep.eTboxOperatingState");

  const eTboxApplicationState =
    root.lookupEnum("stla.cvip.jeep.eTboxApplicationState");

  const eTboxeSimState =
    root.lookupEnum("stla.cvip.jeep.eTboxeSimState");

  const CommandStatus =
    root.lookupEnum("stla.cvip.jeep.CommandStatus");

  const TBOXState =
    root.lookupEnum("stla.cvip.jeep.TBOXState");

  console.log('PROTOBUF LOADED');

  const client = mqtt.connect(CONFIG.BROKER, {

    clientId: CONFIG.CLIENT_ID,

    clean: true,

    keepalive: 30,

    rejectUnauthorized: false,

    protocolVersion: 4,

    ca: fs.readFileSync('./certs/ca.crt'),
    cert: fs.readFileSync('./certs/client.crt'),
    key: fs.readFileSync('./certs/client.key')
  });

  client.on('connect', () => {

    console.log('MQTT CONNECTED');

    client.subscribe([
      CONFIG.TOPIC_DEVICE_JOIN_RSP,
      CONFIG.TOPIC_COMMAND
    ], { qos: 1 }, (err) => {

      if (err) {
        console.error('SUBSCRIBE ERROR:', err.message);
        return;
      }

      console.log('SUBSCRIBED SUCCESS');

      sendProvisionedDeviceJoin(client);
    });
  });

  client.on('message', async (topic, payload) => {

    console.log('\nMESSAGE RECEIVED');
    console.log('TOPIC:', topic);

    try {

      // DEVICE JOIN RESPONSE
      if (topic === CONFIG.TOPIC_DEVICE_JOIN_RSP) {

        console.log('deviceJoinedRsp =>',
          payload.toString());

        console.log('Waiting for AUTHORIZED command...');
      }

      // COMMAND TOPIC
      if (topic === CONFIG.TOPIC_COMMAND) {

        console.log('COMMAND RECEIVED');

        const decoded =
          CommandMessage.decode(payload);

        console.log(
          JSON.stringify(decoded, null, 2)
        );

        const subtype = decoded.subtype;

        if (
          subtype ===
          commandSubType.values.TBOXStateUpdateCommand
        ) {

          const requestedState =
            decoded.commandPayload
              ?.tboxStateUpdateCommandPayload
              ?.tboxState;

          console.log(
            'REQUESTED STATE:',
            requestedState
          );

          // AUTHORIZED
          if (
            requestedState ===
            TBOXState.values.AUTHORIZED
          ) {

            console.log(
              'SENDING AUTHORIZED RESPONSE'
            );

            sendCommandResponse(
              client,
              CommandResponseMessage,
              commandResponseSubType,
              eTboxOperatingState,
              eTboxApplicationState,
              eTboxeSimState,
              CommandStatus,
              TBOXState,
              decoded.messageId,
              "AUTHORIZED"
            );
          }

          // CUSTOMER
          else if (
            requestedState ===
            TBOXState.values.CUSTOMER
          ) {

            console.log(
              'SENDING CUSTOMER RESPONSE'
            );

            sendCommandResponse(
              client,
              CommandResponseMessage,
              commandResponseSubType,
              eTboxOperatingState,
              eTboxApplicationState,
              eTboxeSimState,
              CommandStatus,
              TBOXState,
              decoded.messageId,
              "CUSTOMER"
            );
          }
        }
      }

    } catch (err) {

      console.error(
        'MESSAGE PROCESS ERROR:',
        err.message
      );
    }
  });

  client.on('error', err => {
    console.error('MQTT ERROR:', err.message);
  });

  client.on('close', () => {
    console.log('MQTT CLOSED');
  });
}

function sendProvisionedDeviceJoin(client) {

  const payload = {

    vehicleId: CONFIG.VIN,

    tboxSerialNum: CONFIG.TBOX_SERIAL,

    imeiNo: CONFIG.IMEI,

    protocolVersion: '2.0.0',

    tboxOperatingState: 'NORMAL',

    tboxApplicationState: 'PROVISIONED',

    tboxeSimState: 'NORMAL_SIM',

    NAD_SW_Version: 'ND0.00.96',

    MCU_SW_Version: 'MD0.00.04'
  };

  console.log('\nSENDING DEVICE JOIN');
  console.log(JSON.stringify(payload, null, 2));

  client.publish(
    CONFIG.TOPIC_DEVICE_JOIN,
    JSON.stringify(payload),
    { qos: 1 },
    (err) => {

      if (err) {
        console.error(
          'DEVICE JOIN FAILED:',
          err.message
        );
        return;
      }

      console.log('DEVICE JOIN SENT');
    }
  );
}

function sendCommandResponse(
  client,
  CommandResponseMessage,
  commandResponseSubType,
  eTboxOperatingState,
  eTboxApplicationState,
  eTboxeSimState,
  CommandStatus,
  TBOXState,
  correlationId,
  currentState
) {

  const currentEnumState =
    currentState === "AUTHORIZED"
      ? TBOXState.values.AUTHORIZED
      : TBOXState.values.CUSTOMER;

  const applicationState =
    currentState === "AUTHORIZED"
      ? eTboxApplicationState.values.authorized
      : eTboxApplicationState.values.customer;

  const obj = {

    messageId: process.env.MESSAGE_ID,

    correlationId: correlationId,

    subtype:
      commandResponseSubType.values
        .TBOXStateUpdateCommandResponse,

    tboxOperatingState:
      eTboxOperatingState.values.normal,

    eTboxApplicationState:
      applicationState,

    tboxEsimState:
      eTboxeSimState.values.normal_sim,

    version: "2.0.0",

    timeStamp: getTimestamp(),

    commandResponsePayload: {

      tboxStateUpdateCommandResponsePayload: {

        commandStatus:
          CommandStatus.values.success,

        currentTboxState:
          currentEnumState
      }
    }
  };

  try {

    const err =
      CommandResponseMessage.verify(obj);

    if (err) {
      throw new Error(err);
    }

    const message =
      CommandResponseMessage.create(obj);

    const buffer =
      CommandResponseMessage
        .encode(message)
        .finish();

    console.log('\nPUBLISHING RESPONSE');
    console.log('STATE:', currentState);

    client.publish(
      CONFIG.TOPIC_COMMAND_RESPONSE,
      buffer,
      { qos: 1 },
      () => {

        console.log(
          `${currentState} RESPONSE SENT`
        );
      }
    );

  } catch (e) {

    console.error(
      'COMMAND RESPONSE ERROR:',
      e.message
    );
  }
}

start().catch(console.error);