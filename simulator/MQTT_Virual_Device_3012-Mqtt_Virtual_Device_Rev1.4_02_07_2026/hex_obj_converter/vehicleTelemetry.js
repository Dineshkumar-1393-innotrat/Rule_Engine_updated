// hex_decoder.js - DECODE ANY CanDataMessage HEX
const fs = require('fs');
const protobuf = require('protobufjs');

async function decodeHex(hexString) {
  console.log(' Loading Protobufs...');
  
  const root = await protobuf.load([
    'Jeep_Proto/jeep_candata_message.proto',
    'Jeep_Proto/jeep_candata.proto', 
    'Jeep_Proto/jeep_common.proto',
    'Jeep_Proto/timestamp.proto'
  ]);

  const CanDataMessage = root.lookupType('stla.cvip.jeep.CANDataMessage');
  
  console.log('\n FIELDS:', CanDataMessage.fieldsArray.map(f => f.name));
  
  try {
    // Convert hex string to Buffer
    const buf = Buffer.from(hexString, 'hex');
    console.log(` Input: ${buf.length} bytes`);
    console.log('Pretty:', '<Buffer ' + hexString.match(/.{1,4}/g).join(' ') + '>');

    // Decode
    const msg = CanDataMessage.decode(buf);
    const obj = CanDataMessage.toObject(msg, {
      longs: String,
      enums: String,
      bytes: String
    });

    console.log('\n DECODED CanDataMessage:');
    console.log(JSON.stringify(obj, null, 2));
    
    // Detailed breakdown
    console.log('\n STRUCTURE BREAKDOWN:');
    if (obj.messageId) console.log('- messageId:', obj.messageId);
    if (obj.tboxOperatingState !== undefined) console.log('- tboxOperatingState:', obj.tboxOperatingState);
    if (obj.eTboxApplicationState !== undefined) console.log('- eTboxApplicationState:', obj.eTboxApplicationState);
    if (obj.tboxEsimState !== undefined) console.log('- tboxEsimState:', obj.tboxEsimState);
    if (obj.version) console.log('- version:', obj.version);
    if (obj.timeStamp) {
      console.log('- timeStamp:', new Date(parseInt(obj.timeStamp.seconds) * 1000).toLocaleString());
    }
    if (obj.canDataPayload?.canData?.canDataPacket) {
      console.log('- canDataPackets:', obj.canDataPayload.canData.canDataPacket.length);
      obj.canDataPayload.canData.canDataPacket.forEach((pkt, i) => {
        console.log(`  Packet ${i+1}: ID=${pkt.identifier} DLC=${pkt.dlc}`);
        if (pkt.cData && pkt.cData[0]) {
          const pduHex = Buffer.from(pkt.cData[0].pdu, 'base64').toString('hex');
          console.log(`    PDU: ${pduHex} (Fuel: ${parseInt(pduHex.slice(0,2), 16)} = ${(parseInt(pduHex.slice(0,2), 16)*100/255).toFixed(1)}%)`);
        }
      });
    }

    return { success: true, decoded: obj };
  } catch (e) {
    console.error(' DECODE ERROR:', e.message);
    return { success: false, error: e.message };
  }
}

// USAGE: Paste your hex here
//const YOUR_HEX = '0A0E7665682D313737313332383739332A05322E302E30320C0899AAD1CC0610B0BFB9AF033A090A07120508E00E1A00';
            //  const YOUR_HEX = '0A0E7665682D313737303436373837322A05322E302E30320C08A0E49CCC061084B8A9AD023A150A13121108FF0F10081A0A0A08302030302030300D'
const YOUR_HEX = '0a2464643532626162312d633634612d343331622d613934352d313630326632366539663465180420012a05322e302e30320b088ec189d20610c0aea7563aa1010a9e01129b0108ec0810081a170a0800001111007e0000120b088ec189d2061080b3e4561a170a0800001111000c0000120b088ec189d2061080b3e4561a170a0800001111000c0000120b088ec189d2061080b3e4561a170a0800001111000c0000120b088ec189d2061080b3e4561a170a0800001111000c0000120b088ec189d2061080b3e4561a170a0800001111007e0000120b088ec189d2061080b3e456';
            decodeHex(YOUR_HEX).catch(console.error);

// COMMAND LINE USAGE:
// node hex_decoder.js "your_hex_here"
if (process.argv[2]) {
  decodeHex(process.argv[2]);
}
