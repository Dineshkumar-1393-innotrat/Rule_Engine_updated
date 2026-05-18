const fs = require('fs');
const protobuf = require('protobufjs');
const CONFIG = {
  IMEI: '356741396798765',
  VIN: 'T123ZTZT867656663'
};
let sendCount = 0;

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
  const hex = Buffer.from(buf).toString("hex").toUpperCase();
  return {
    buf,
    prettyHex: "<Buffer " + hex.match(/.{1,4}/g).join(" ") + ">",
    rawHex: hex
  };
}

async function generateFuelDataHex() {
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
  console.log('Topic would be:', `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/vehicleTelemetry`);

  sendCount++;
  console.log('\nSEND #' + sendCount + ' - Building telemetry...');

  const telemetryObj = {
    messageId: "dd52bab1-c64a-431b-a945-1602f26e9f4e",                  
    eTboxApplicationState: eTboxApplicationState.values.customer,
    tboxEsimState: eTboxeSimState.values.normal_sim,
    version: "2.0.0",
    timeStamp: getTimestamp(),
    canDataPayload: {
      canData: {
        canDataPacket: [
          {
            identifier: 854,
            dlc: 8,
            cData: [
              {
                pdu: Buffer.from([0x5B, 0x0B, 0x80, 0x09, 0x04, 0x00, 0x00, 0x02]),
                timestamp: getTimestamp()
              },
              {
                pdu: Buffer.from([0x5B, 0x0B, 0x80, 0x09, 0x04, 0x00, 0x00, 0x02]),
                timestamp: getTimestamp()
              },
              {
                pdu: Buffer.from([0x5B, 0x0B, 0x80, 0x09, 0x04, 0x00, 0x00, 0x02]),
                timestamp: getTimestamp()
              },
              {
                pdu: Buffer.from([0x5B, 0x0B, 0x80, 0x09, 0x04, 0x00, 0x00, 0x02]),
                timestamp: getTimestamp()
              },
              {
                pdu: Buffer.from([0x5B, 0x0B, 0x80, 0x09, 0x04, 0x00, 0x00, 0x02]),
                timestamp: getTimestamp()
              },
              {
                pdu: Buffer.from([0x5B, 0x0B, 0x80, 0x09, 0x04, 0x00, 0x00, 0x02]),
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

    console.log("RAW HEX (for candata_fuel.txt):");
    console.log(rawHex);

    console.log("Encoded: " + buf.length + " bytes");

    // Write hex data to candata_fuel.txt (append mode)
    fs.appendFileSync('candata_fuel.txt', rawHex.toUpperCase() + '\n');
    console.log('  HEX WRITTEN TO candata_fuel.txt (' + rawHex.length + ' chars)');
    console.log('Total generated: ' + sendCount);

  } catch (e) {
    console.error('ENCODE ERROR: ' + e.message);
    console.error('Check proto files in Jeep_Proto/ folder');
  }
}

// Generate once and write to file
generateFuelDataHex().catch(err => {
  console.error('FATAL ERROR: ' + err.message);
});
