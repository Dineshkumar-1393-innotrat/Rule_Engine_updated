// location_hex_decoder.js - DECODE ANY LocationTelemetry HEX

const fs = require('fs');
const protobuf = require('protobufjs');

async function decodeLocationHex(hexString) {
  console.log(' Loading Location Protobufs...');

  const root = await protobuf.load([
    'Jeep_Proto/jeep_locationtelemetry_message.proto',
    'Jeep_Proto/jeep_locationtelemetry.proto',
    'Jeep_Proto/jeep_common.proto',
    'Jeep_Proto/timestamp.proto'
  ]);

  const LocationTelemetryMessage =
    root.lookupType('stla.cvip.jeep.LocationTelemetryMessage');

  console.log('\n FIELDS:',
    LocationTelemetryMessage.fieldsArray.map(f => f.name)
  );

  try {
    const buf = Buffer.from(hexString, 'hex');

    console.log(`\n Input Size: ${buf.length} bytes`);
    console.log('Pretty:',
      '<Buffer ' + hexString.match(/.{1,4}/g).join(' ') + '>'
    );

    // Decode
    const msg = LocationTelemetryMessage.decode(buf);

    const obj = LocationTelemetryMessage.toObject(msg, {
      longs: String,
      enums: String
    });

    console.log('\n DECODED LocationTelemetryMessage:');
    console.log(JSON.stringify(obj, null, 2));

    // -------- Detailed Breakdown --------

    console.log('\n STRUCTURE BREAKDOWN:');

    if (obj.messageId)
      console.log('- messageId:', obj.messageId);

    if (obj.version)
      console.log('- version:', obj.version);

    if (obj.signalStrength !== undefined)
      console.log('- signalStrength:', obj.signalStrength);

    if (obj.eTboxApplicationState !== undefined)
      console.log('- eTboxApplicationState:', obj.eTboxApplicationState);

    if (obj.tboxEsimState !== undefined)
      console.log('- tboxEsimState:', obj.tboxEsimState);

    if (obj.locationPayload?.locationData?.length) {
      console.log('\n LOCATION DATA COUNT:',
        obj.locationPayload.locationData.length
      );

      obj.locationPayload.locationData.forEach((loc, i) => {
        console.log(`\n   Location ${i + 1}:`);

        if (loc.timeStamp?.seconds) {
          const date = new Date(parseInt(loc.timeStamp.seconds) * 1000);
          console.log('     Time:', date.toLocaleString());
        }

        console.log('     Latitude :', loc.gpsLat);
        console.log('     Longitude:', loc.gpsLong);
        console.log('     Speed    :', loc.speed, 'km/h');
        console.log('     Course   :', loc.gpsCourseAngle);
        console.log('     SignalQ  :', loc.gpsSignalQuality);
        console.log('     Fixed    :', loc.gpsFixedStatus);
      });
    }

    return { success: true, decoded: obj };

  } catch (e) {
    console.error(' DECODE ERROR:', e.message);
    return { success: false, error: e.message };
  }
}


//const YOUR_HEX = '0A2464643532626162312D633634612D343331622D613934352D61353436353238663638646618042A05322E302E303A370A350A0C08A5DACACC061080C8D981011152D351D9164C624019643D2E5E13F659C0452290A8434DA4B8C2425001590000000000003940410000000000003E40';
const YOUR_HEX='0A0E6C6F632D313737333232393238382A05322E302E30320C08E8A9C5CD0610E79A8DEC013A240A220A0C08E8A9C5CD0610E79A8DEC0111628731E9EFE5294019BD546CCCEB0E54405001410000000000001440'
decodeLocationHex(YOUR_HEX).catch(console.error);


// CLI usage
if (process.argv[2]) {
  decodeLocationHex(process.argv[2]);
}
