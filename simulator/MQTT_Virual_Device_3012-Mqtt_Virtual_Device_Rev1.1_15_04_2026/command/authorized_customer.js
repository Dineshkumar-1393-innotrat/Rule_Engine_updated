const protobuf = require("protobufjs");

function getCurrentTimestamp() {
  const now = new Date();
  const seconds = Math.floor(now.getTime() / 1000);
  const nanos = (now.getTime() % 1000) * 1000000;
  return { seconds, nanos };
}

function encodeJsonToHex(jsonObj, MessageType, TBOXState) {
  const errMsg = MessageType.verify(jsonObj);
  if (errMsg) throw new Error("Invalid payload: " + errMsg);

  const msg = MessageType.create(jsonObj);
  
  msg.eTboxApplicationState = "AUTHORIZED";
  
  console.log(" Encoded CommandResponseMessage (internal):");
  console.log(JSON.stringify(msg, null, 2));

  const buf = MessageType.encode(msg).finish();
  const hex = Buffer.from(buf).toString("hex");
  return "<Buffer " + hex.match(/.{1,4}/g).join(" ") + ">";
}

async function main() {
  console.log(" Loading Protobuf...");

  const root = await protobuf.load([
    "Jeep_Proto/jeep_commandresponse_message.proto",
    "Jeep_Proto/jeep_common.proto",
    "Jeep_Proto/timestamp.proto",
    "Jeep_Proto/jeep_ota_command.proto"
  ]);

  const CommandResponseMessage = root.lookupType("stla.cvip.jeep.CommandResponseMessage");
  console.log("FIELDS:", CommandResponseMessage.fieldsArray.map(f => f.name));

  const commandResponseSubType = root.lookupEnum("stla.cvip.jeep.commandResponseSubType");
  const eTboxOperatingState = root.lookupEnum("stla.cvip.jeep.eTboxOperatingState");
  const eTboxApplicationState = root.lookupEnum("stla.cvip.jeep.eTboxApplicationState");
  const eTboxeSimState = root.lookupEnum("stla.cvip.jeep.eTboxeSimState");
  const eReturnCode = root.lookupEnum("stla.cvip.jeep.eReturnCode");
  const CommandStatus = root.lookupEnum("stla.cvip.jeep.CommandStatus");
  const TBOXState = root.lookupEnum("stla.cvip.jeep.TBOXState");
  console.log("TBOXState enum values:", TBOXState.values);

  const currentTime = getCurrentTimestamp();
  console.log(" CURRENT SYSTEM TIMESTAMP:", currentTime);

  const obj = {
    // messageId: "dd52bab1-c64a-431b-a945-1602f26e9f4e",
     messageId: "dd52bab1-c64a-431b-a945-1602f26e9f4e",
    correlationId: "9b2e3f4c-6a78-4d1b-8e9f-3c4d5a6b7e81",
    subtype: commandResponseSubType.values.TBOXStateUpdateCommandResponse,

    tboxOperatingState: eTboxOperatingState.values.normal,
    eTboxApplicationState: TBOXState.values.AUTHORIZED,  // = 1 (numeric value)
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

  const hexStr = encodeJsonToHex(obj, CommandResponseMessage, TBOXState);

  console.log("\n---------------------------");
  console.log(" FULL CommandResponseMessage HEX:");
  console.log("---------------------------");
  console.log(hexStr);
  console.log("---------------------------\n");

  const rawHex = hexStr.replace(/<Buffer |>/g, "").replace(/\s+/g, "");
  console.log(" RAW HEX (MQTT payload):");
  console.log(rawHex);
}

main().catch(console.error);
