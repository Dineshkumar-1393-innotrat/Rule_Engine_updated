const protobuf = require("protobufjs");

function encodeJsonToHex(jsonObj, MessageType) {
  const errMsg = MessageType.verify(jsonObj);
  if (errMsg) throw new Error("Invalid payload: " + errMsg);

  const msg = MessageType.create(jsonObj);
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
  const now = new Date();
  const seconds = Math.floor(now.getTime() / 1000);
  const nanos = (now.getTime() % 1000) * 1000000;
const obj = {
  messageId: "dd52bab1-c64a-431b-a945-1602f26e9f4e",
  correlationId: "45ee3134-8c28-4735-b208-c1g8bae52534",

  subtype: commandResponseSubType.values.TBOXStateUpdateCommandResponse,

  tboxOperatingState: eTboxOperatingState.values.normal,
  eTboxApplicationState: eTboxApplicationState.values.provisioned,
  tboxEsimState: eTboxeSimState.values.normal_sim,

  version: "2.0.0",

  timeStamp: {
    seconds, nanos
  },

  //returnCode: eReturnCode.values.succeeded,

  commandResponsePayload: {
    tboxStateUpdateCommandResponsePayload: {
      commandStatus: CommandStatus.values.success,
      currentTboxState: TBOXState.values.AUTHORIZED
    }
  }
};

console.log("obj",obj);

  const hexStr = encodeJsonToHex(obj, CommandResponseMessage);

  console.log("\n---------------------------");
  console.log(" FULL CommandResponseMessage HEX:");
  console.log("---------------------------");
  console.log(hexStr);
  console.log("---------------------------\n");
}

main().catch(console.error);



