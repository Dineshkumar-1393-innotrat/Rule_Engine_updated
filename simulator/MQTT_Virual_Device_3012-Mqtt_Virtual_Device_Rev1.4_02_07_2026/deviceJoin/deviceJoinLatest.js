require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const axios = require('axios');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');

console.log(' CVIP FULL DEVICE FLOW STARTED');

/* ================= ENV VALIDATION ================= */
['VIN', 'IMEI', 'TBOX_SERIAL'].forEach((k) => {
  if (!process.env[k]) {
    throw new Error(`Missing ENV variable: ${k}`);
  }
});

/* ================= CONFIG ================= */
const CONFIG = {
  VIN: process.env.VIN,
  IMEI: process.env.IMEI,
  TBOX_SERIAL: process.env.TBOX_SERIAL,

  BROKER_CSR: process.env.BROKER ? process.env.BROKER.replace(':18883', ':28883') : 'mqtts://cvipiot-preprod.fca-india.com:28883',
  BROKER_DEVICE: process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883',

  TOKEN_REQ: `/dongle/${process.env.IMEI}/MQTTPROTOBUF/csrAccessTokenReq`,
  TOKEN_RSP: `/dongle/${process.env.IMEI}/MQTTPROTOBUF/csrAccessTokenRsp`,

  DEVICE_JOIN: `/dongle/${process.env.VIN}/MQTTPROTOBUF/deviceJoined`,
  DEVICE_JOIN_RSP: `/dongle/${process.env.VIN}/MQTTPROTOBUF/deviceJoinedRsp`
};

/* ================= PATHS ================= */

const CERT_DIR = path.join(__dirname, '..', 'device_certs');

const PATHS = {
  key: path.join(CERT_DIR, 'device.key'),
  csr: path.join(CERT_DIR, 'device.csr'),
  crt: path.join(CERT_DIR, 'device.crt')
};

const OPENSSL = `"C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe"`;

/* ================= CREATE CVIP BUNDLE ================= */

function createBundleIfNotExists() {
  const bundlePath = path.join(__dirname, '..', 'certs', 'cvip_bundle.crt');

  if (fs.existsSync(bundlePath)) {
    console.log(' CVIP bundle already exists');
    return bundlePath;
  }

  console.log(' Creating CVIP bundle (ROOT + ICA)...');

  const files = [
    path.join(__dirname, '..', 'certs', 'ca.crt'),
    path.join(__dirname, '..', 'certs', 'CVIP_Tbox_PReprod_ICA_2.crt')
  ];

  let bundle = '';

  files.forEach(file => {
    if (fs.existsSync(file)) {
      bundle += fs.readFileSync(file, 'utf8') + '\n';
    } else {
      console.warn(' Missing:', file);
    }
  });

  fs.writeFileSync(bundlePath, bundle);
  console.log(' CVIP bundle created');

  return bundlePath;
}

const BUNDLE_PATH = createBundleIfNotExists();
const CVIP_BUNDLE = fs.readFileSync(BUNDLE_PATH);

/* ================= HTTPS AGENT ================= */

const httpsAgent = new https.Agent({
  ca: CVIP_BUNDLE,
  rejectUnauthorized: true
});

let accessToken = null;

/* ================= STEP 1: CONNECT USING COMMON CERT ================= */

console.log(' Connecting with COMMON CERT (28883)...');

const client = mqtt.connect(CONFIG.BROKER_CSR, {
  clientId: CONFIG.IMEI,
  clean: false,
  keepalive: 600,
  protocolVersion: 4,

  ca: CVIP_BUNDLE,
  cert: fs.readFileSync('./certs/client.crt'),
  key: fs.readFileSync('./certs/client.key')
});

/* ================= MQTT EVENTS ================= */

client.on('connect', () => {
  console.log(' Connected (COMMON CERT)');

  client.subscribe(CONFIG.TOKEN_RSP, { qos: 1 });

  console.log(' Requesting CSR Access Token...');
  client.publish(CONFIG.TOKEN_REQ, JSON.stringify({
    imei: CONFIG.IMEI
  }), { qos: 1 });
});

client.on('message', async (topic, msg) => {
  console.log(' Message received on:', topic);

  const data = JSON.parse(msg.toString());

  if (topic === CONFIG.TOKEN_RSP) {
    accessToken = data.accessToken;
    console.log(' Access Token:', accessToken);

    client.end();

    try {
      await generateCSR();
      await requestCertificate();
      reconnectWithDeviceCert();
    } catch (err) {
      console.error(' FLOW ERROR:', err.message);
    }
  }
});

client.on('error', err => console.error(' MQTT ERROR:', err.message));

/* ================= STEP 2: GENERATE CSR ================= */

async function generateCSR() {
  console.log(' Generating ECC CSR...');

  if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
  }

  execSync(`${OPENSSL} ecparam -name prime256v1 -genkey -noout -out "${PATHS.key}"`);

  execSync(`${OPENSSL} req -new -key "${PATHS.key}" -out "${PATHS.csr}" -subj "/CN=${CONFIG.IMEI}-${CONFIG.TBOX_SERIAL}/O=MyOrg/C=IN"`);

  console.log(' CSR Generated at:', PATHS.csr);
}

/* ================= STEP 3: CALL CERT API ================= */

async function requestCertificate() {
  console.log(' Requesting Device Certificate...');

  const csr = fs.readFileSync(PATHS.csr, 'utf8');

  try {
    const response = await axios.post(
      `https://${(process.env.BROKER || 'mqtts://cvipiot-preprod.fca-india.com:18883').replace('mqtts://', '').split(':')[0]}:40543/csr/createCertificate`,
      {
        csr: csr,
        commonName: `${CONFIG.IMEI}-${CONFIG.TBOX_SERIAL}`
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        httpsAgent
      }
    );

    fs.writeFileSync(PATHS.crt, response.data.certificate);

    console.log(' Device Certificate Received');
  } catch (err) {
    console.error(' Certificate API Error:', err.response?.data || err.message);
    throw err;
  }
}

/* ================= STEP 4: RECONNECT USING DEVICE CERT ================= */

function reconnectWithDeviceCert() {
  console.log(' Reconnecting with DEVICE CERT (18883)...');

  const client2 = mqtt.connect(CONFIG.BROKER_DEVICE, {
    clientId: CONFIG.VIN,
    clean: false,
    keepalive: 600,
    protocolVersion: 4,

    ca: CVIP_BUNDLE,
    cert: fs.readFileSync(PATHS.crt),
    key: fs.readFileSync(PATHS.key),

    will: {
      topic: CONFIG.DEVICE_JOIN,
      payload: JSON.stringify({
        vehicleId: CONFIG.VIN,
        tboxSerialNum: CONFIG.TBOX_SERIAL,
        imeiNo: CONFIG.IMEI,
        tboxOperatingState: 'DISCONNECTED'
      }),
      qos: 1,
      retain: false
    }
  });

  client2.on('connect', () => {
    console.log(' Connected with DEVICE CERT');

    client2.subscribe(CONFIG.DEVICE_JOIN_RSP, { qos: 1 });

    sendDeviceJoin(client2);
  });

  client2.on('message', (topic, msg) => {
    console.log(' DEVICE RESPONSE:', msg.toString());
  });

  client2.on('error', err => console.error(' DEVICE MQTT ERROR:', err.message));
}

/* ================= STEP 5: SEND DEVICE JOIN ================= */

function sendDeviceJoin(client) {
  console.log(' Sending deviceJoined...');

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

  client.publish(CONFIG.DEVICE_JOIN, JSON.stringify(payload), { qos: 1 });

  console.log(' deviceJoined sent');
}