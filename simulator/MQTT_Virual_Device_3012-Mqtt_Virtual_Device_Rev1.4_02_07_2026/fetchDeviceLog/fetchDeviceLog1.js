// require('dotenv').config();
// const mqtt = require('mqtt');
// const fs = require('fs');
// const protobuf = require('protobufjs');
// const axios = require('axios');

// ['VIN', 'IMEI', 'MESSAGE_ID', 'CORRELATION_ID'].forEach(k => {
//     if (!process.env[k]) throw new Error(`Missing ENV variable: ${k}`);
// });

// const CONFIG = {
//     VIN: process.env.VIN,
//     IMEI: process.env.IMEI,
//     MESSAGE_ID: process.env.MESSAGE_ID,
//     CORRELATION_ID: process.env.CORRELATION_ID,
//     BROKER: process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883'
// };

// let sendCount = 0;
// let dynamicCorrelationId = null;
// let isSubscribed = false;
// let protoObjects = null;
// let commandReceived = false;

// function getTimestamp() {
//     const now = Date.now();
//     return {
//         seconds: Math.floor(now / 1000),
//         nanos: (now % 1000) * 1000000
//     };
// }

// //////////////////////////////////////////
// // FILE UPLOAD FUNCTION
// //////////////////////////////////////////
// async function uploadFile(url, token) {
//     try {
//         console.log('\nUploading file to server...');

//         const fileData = fs.readFileSync('./device.zip'); // or .zip file

//         const res = await axios.put(url, fileData, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 'Content-Type': 'application/octet-stream'
//             },
//             timeout: 15000
//         });

//         console.log('Upload success:', res.status);
//         return true;

//     } catch (err) {
//         console.error('Upload failed:', err.message);
//         return false;
//     }
// }

// //////////////////////////////////////////
// // SEND COMMAND RESPONSE
// //////////////////////////////////////////
// async function sendCommandResponse(client) {
//     sendCount++;

//     const obj = {
//         messageId: CONFIG.MESSAGE_ID,
//         correlationId: dynamicCorrelationId || CONFIG.CORRELATION_ID,
//         subtype: protoObjects.commandResponseSubType.values.FetchLogsCommandResponse,
//         tboxOperatingState: protoObjects.eTboxOperatingState.values.normal,
//         eTboxApplicationState: protoObjects.eTboxApplicationState.values.customer,
//         tboxEsimState: protoObjects.eTboxeSimState.values.normal_sim,
//         version: "2.0.0",
//         timeStamp: getTimestamp(),
//         commandResponsePayload: {
//             fetchlogsCommandResponsePayload: {
//                 commandStatus: protoObjects.CommandStatus.values.success
//             }
//         }
//     };

//     console.log(`\nSending CommandResponse #${sendCount}`);
//     console.log("Payload:", JSON.stringify(obj, null, 2));

//     try {
//         const errMsg = protoObjects.CommandResponseMessage.verify(obj);
//         if (errMsg) throw new Error(errMsg);

//         const msg = protoObjects.CommandResponseMessage.create(obj);
//         const buf = protoObjects.CommandResponseMessage.encode(msg).finish();

//         client.publish(`/dongle/${CONFIG.VIN}/MQTTPROTOBUF/commandResponse`, buf, { qos: 1 });

//         console.log('Response sent');

//     } catch (e) {
//         console.error('PROTO ERROR:', e.message);
//     }
// }

// //////////////////////////////////////////
// // MAIN FUNCTION
// //////////////////////////////////////////
// async function startCommandResponse() {
//     console.log('Loading Protobufs for CommandResponse...');

//     const root = await protobuf.load([
//         "Jeep_Proto/jeep_command_message.proto",
//         "Jeep_Proto/jeep_commandresponse_message.proto",
//         "Jeep_Proto/jeep_common.proto",
//         "Jeep_Proto/timestamp.proto",
//         "Jeep_Proto/jeep_ota_command.proto"
//     ]);

//     protoObjects = {
//         CommandMessage: root.lookupType("stla.cvip.jeep.CommandMessage"),
//         commandSubType: root.lookupEnum("stla.cvip.jeep.commandSubType"),

//         CommandResponseMessage: root.lookupType("stla.cvip.jeep.CommandResponseMessage"),
//         commandResponseSubType: root.lookupEnum("stla.cvip.jeep.commandResponseSubType"),
//         eTboxOperatingState: root.lookupEnum("stla.cvip.jeep.eTboxOperatingState"),
//         eTboxApplicationState: root.lookupEnum("stla.cvip.jeep.eTboxApplicationState"),
//         eTboxeSimState: root.lookupEnum("stla.cvip.jeep.eTboxeSimState"),
//         CommandStatus: root.lookupEnum("stla.cvip.jeep.CommandStatus"),
//         TBOXState: root.lookupEnum("stla.cvip.jeep.TBOXState")
//     };

//     console.log('Protobuf LOADED');

//     const client = mqtt.connect(CONFIG.BROKER, {
//         clientId: CONFIG.IMEI,
//         clean: true,
//         keepalive: 30,
//         rejectUnauthorized: false,
//         // ca: fs.readFileSync('./certs/cvipcabundle.pem'),
//         // cert: fs.readFileSync('./certs/ping-cert.pem'),
//         // key: fs.readFileSync('./certs/ping-key.pem'),
//          ca: fs.readFileSync('./certs/ca.crt'),
//           cert: fs.readFileSync('./certs/client.crt'),
//           key: fs.readFileSync('./certs/client.key'),
//         protocolVersion: 4
//     });

//     //////////////////////////////////////////
//     // MESSAGE HANDLER (FIXED)
//     //////////////////////////////////////////
//     client.on('message', async (topic, message) => {
//         console.log('\nRECEIVED COMMAND:');
//         console.log('Topic:', topic);

//         try {
//             const decoded = protoObjects.CommandMessage.decode(message);
//             console.log('Decoded Command:', JSON.stringify(decoded, null, 2));

//             dynamicCorrelationId = decoded.messageId;
//             commandReceived = true;

//             if (decoded.subtype === protoObjects.commandSubType.values.FetchLogsCommand) {

//                 // FIXED PAYLOAD PATH
//                 const payload = decoded.commandPayload?.fetchlogsCommandPayload;

//                 const url = payload?.url;
//                 const accessToken = payload?.accessToken;

//                 console.log('URL:', url);
//                 console.log('AccessToken:', accessToken);

//                 if (url && accessToken) {

//                     // STEP 1: Upload file
//                     const uploadSuccess = await uploadFile(url, accessToken);

//                     console.log('Upload Result:', uploadSuccess ? 'SUCCESS' : 'FAIL');

//                     // STEP 2: Send response AFTER upload
//                     sendCommandResponse(client);

//                 } else {
//                     console.error('Missing URL or AccessToken in command');
//                 }
//             }

//         } catch (err) {
//             console.error('DECODE ERROR:', err.message);
//         }
//     });

//     //////////////////////////////////////////
//     // CONNECT
//     //////////////////////////////////////////
//     client.on('connect', () => {
//         console.log('MQTT CONNECTED');

//         const commandTopic = `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/command`;

//         client.subscribe(commandTopic, { qos: 1 }, (err) => {
//             if (!err) {
//                 console.log(`SUBSCRIBED to: ${commandTopic}`);
//                 isSubscribed = true;
//             } else {
//                 console.error('SUBSCRIBE ERROR:', err.message);
//             }
//         });
//     });

//     client.on('error', err => console.error('MQTT ERROR:', err.message));
// }

// startCommandResponse().catch(console.error);



require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const protobuf = require('protobufjs');
const axios = require('axios');
const https = require('https');

['VIN', 'IMEI', 'MESSAGE_ID', 'CORRELATION_ID'].forEach(k => {
    if (!process.env[k]) {
        throw new Error(`Missing ENV variable: ${k}`);
    }
});

const CONFIG = {
    VIN: process.env.VIN,
    IMEI: process.env.IMEI,
    MESSAGE_ID: process.env.MESSAGE_ID,
    CORRELATION_ID: process.env.CORRELATION_ID,
    BROKER: process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883'
};

let sendCount = 0;
let dynamicCorrelationId = null;
let protoObjects = null;

//////////////////////////////////////////
// TIMESTAMP
//////////////////////////////////////////
function getTimestamp() {
    const now = Date.now();

    return {
        seconds: Math.floor(now / 1000),
        nanos: (now % 1000) * 1000000
    };
}

//////////////////////////////////////////
// FILE UPLOAD FUNCTION (POST API)
//////////////////////////////////////////
const FormData = require('form-data');

async function uploadFile(url, token) {

    try {

        console.log('\nUploading file to server...');
        console.log('Upload URL:', url);

        // Create multipart form
        const form = new FormData();

        // IMPORTANT:
        // key name should match Postman
        form.append(
            'files',
            fs.createReadStream('./Tboxlogs.zip')
        );

        // HTTPS Agent
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });

        // API CALL
        const response = await axios.post(
            url,
            form,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...form.getHeaders()
                },

                httpsAgent,
                timeout: 30000,
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        );

        console.log('\nUPLOAD SUCCESS');
        console.log('Status:', response.status);
        console.log('Response:', response.data);

        return true;

    } catch (err) {

        console.error('\nUPLOAD FAILED');

        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error(err.message);
        }

        return false;
    }
}

//////////////////////////////////////////
// SEND COMMAND RESPONSE
//////////////////////////////////////////
async function sendCommandResponse(client, status) {

    sendCount++;

    const obj = {
        messageId: CONFIG.MESSAGE_ID,

        correlationId:
            dynamicCorrelationId || CONFIG.CORRELATION_ID,

        subtype:
            protoObjects.commandResponseSubType.values.FetchLogsCommandResponse,

        tboxOperatingState:
            protoObjects.eTboxOperatingState.values.normal,

        eTboxApplicationState:
            protoObjects.eTboxApplicationState.values.customer,

        tboxEsimState:
            protoObjects.eTboxeSimState.values.normal_sim,

        version: "2.0.0",

        timeStamp: getTimestamp(),

        commandResponsePayload: {
            fetchlogsCommandResponsePayload: {

                // success / failure
                commandStatus: status
                    ? protoObjects.CommandStatus.values.success
                    : protoObjects.CommandStatus.values.failure
            }
        }
    };

    console.log(`\nSending CommandResponse #${sendCount}`);
    console.log(JSON.stringify(obj, null, 2));

    try {

        const errMsg =
            protoObjects.CommandResponseMessage.verify(obj);

        if (errMsg) {
            throw new Error(errMsg);
        }

        const msg =
            protoObjects.CommandResponseMessage.create(obj);

        const buffer =
            protoObjects.CommandResponseMessage
                .encode(msg)
                .finish();

        client.publish(
            `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/commandResponse`,
            buffer,
            { qos: 1 }
        );

        console.log('CommandResponse SENT');

    } catch (err) {
        console.error('PROTO ERROR:', err.message);
    }
}

//////////////////////////////////////////
// MAIN FUNCTION
//////////////////////////////////////////
async function start() {

    console.log('Loading Protobufs...');

    const root = await protobuf.load([
        "Jeep_Proto/jeep_command_message.proto",
        "Jeep_Proto/jeep_commandresponse_message.proto",
        "Jeep_Proto/jeep_common.proto",
        "Jeep_Proto/timestamp.proto",
        "Jeep_Proto/jeep_ota_command.proto"
    ]);

    protoObjects = {

        CommandMessage:
            root.lookupType("stla.cvip.jeep.CommandMessage"),

        commandSubType:
            root.lookupEnum("stla.cvip.jeep.commandSubType"),

        CommandResponseMessage:
            root.lookupType("stla.cvip.jeep.CommandResponseMessage"),

        commandResponseSubType:
            root.lookupEnum("stla.cvip.jeep.commandResponseSubType"),

        eTboxOperatingState:
            root.lookupEnum("stla.cvip.jeep.eTboxOperatingState"),

        eTboxApplicationState:
            root.lookupEnum("stla.cvip.jeep.eTboxApplicationState"),

        eTboxeSimState:
            root.lookupEnum("stla.cvip.jeep.eTboxeSimState"),

        CommandStatus:
            root.lookupEnum("stla.cvip.jeep.CommandStatus")
    };

    console.log('PROTOBUF LOADED');

    //////////////////////////////////////////
    // MQTT CONNECT
    //////////////////////////////////////////
    const client = mqtt.connect(CONFIG.BROKER, {

        clientId: CONFIG.IMEI,

        clean: true,

        keepalive: 30,

        protocolVersion: 4,

        rejectUnauthorized: false,

        ca: fs.readFileSync('./certs/ca.crt'),
        cert: fs.readFileSync('./certs/client.crt'),
        key: fs.readFileSync('./certs/client.key')
    });

    //////////////////////////////////////////
    // CONNECT
    //////////////////////////////////////////
    client.on('connect', () => {

        console.log('MQTT CONNECTED');

        const topic =
            `/dongle/${CONFIG.VIN}/MQTTPROTOBUF/command`;

        client.subscribe(topic, { qos: 1 }, (err) => {

            if (err) {
                console.error('SUBSCRIBE ERROR:', err.message);
                return;
            }

            console.log('SUBSCRIBED:', topic);
        });
    });

    //////////////////////////////////////////
    // MESSAGE
    //////////////////////////////////////////
    client.on('message', async (topic, message) => {

        console.log('\nCOMMAND RECEIVED');
        console.log('Topic:', topic);

        try {

            const decoded =
                protoObjects.CommandMessage.decode(message);

            console.log(
                JSON.stringify(decoded, null, 2)
            );

            dynamicCorrelationId = decoded.messageId;

            //////////////////////////////////////////
            // FETCH LOGS COMMAND
            //////////////////////////////////////////
            if (
                decoded.subtype ===
                protoObjects.commandSubType.values.FetchLogsCommand
            ) {

                const payload =
                    decoded.commandPayload?.fetchlogsCommandPayload;

                const url = payload?.url;
                const accessToken = payload?.accessToken;

                console.log('\nURL:', url);
                console.log('TOKEN:', accessToken);

                if (!url || !accessToken) {
                    console.error('Missing URL/TOKEN');
                    return;
                }

                //////////////////////////////////////////
                // FILE UPLOAD
                //////////////////////////////////////////
                const uploadResult =
                    await uploadFile(url, accessToken);

                console.log(
                    '\nFINAL UPLOAD RESULT:',
                    uploadResult ? 'SUCCESS' : 'FAILED'
                );

                //////////////////////////////////////////
                // SEND RESPONSE
                //////////////////////////////////////////
                await sendCommandResponse(
                    client,
                    uploadResult
                );
            }

        } catch (err) {

            console.error('\nMESSAGE ERROR');
            console.error(err.message);
        }
    });

    //////////////////////////////////////////
    // MQTT ERROR
    //////////////////////////////////////////
    client.on('error', (err) => {
        console.error('MQTT ERROR:', err.message);
    });
}

start().catch(console.error);