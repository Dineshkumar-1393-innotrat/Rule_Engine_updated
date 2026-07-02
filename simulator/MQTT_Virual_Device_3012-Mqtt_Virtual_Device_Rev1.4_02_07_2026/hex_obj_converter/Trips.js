const protobuf = require("protobufjs");

async function decodeHex() {

  const root = await protobuf.load([
    "Jeep_Proto/jeep_event_message.proto",
    "Jeep_Proto/jeep_event.proto",
    "Jeep_Proto/jeep_trip_message.proto",
    "Jeep_Proto/jeep_trip.proto",
    "Jeep_Proto/jeep_common.proto",
    "Jeep_Proto/timestamp.proto"
  ]);

  const TripMessage = root.lookupType("stla.cvip.jeep.TripMessage");

  const hex =
    "0A2464643532626162312D633634612D343331622D613934352D3136303266323665396634651000180420012A05322E302E30320C089FE5C0CD0610C0CBFABF023A520A500A4E08DBABE404120C089FE5C0CD0610C0CBFABF0218D6CBD40922320A30092F63656C7B2B2A401126F830135B1154401DF899A641250000A0402D0000A04035000020413DED45B94245B6257A3F2801";

  try {

    // HEX → Buffer

    
    const buf = Buffer.from(hex, "hex");

    console.log("Buffer size:", buf.length);

    // Buffer → protobuf message
    const decodedMessage = TripMessage.decode(buf);

    // protobuf → normal object
    const obj = TripMessage.toObject(decodedMessage, {
      longs: String,
      enums: String,
      defaults: true
    });

    console.log(" DECODED OBJECT:");
    console.log(JSON.stringify(obj, null, 2));

  } catch (err) {
    console.error(" Decode failed:", err.message);
  }
}

decodeHex();