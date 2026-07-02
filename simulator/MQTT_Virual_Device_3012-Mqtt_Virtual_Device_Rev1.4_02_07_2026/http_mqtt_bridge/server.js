/**
 * HTTP-to-MQTT Bridge Server
 * 
 * Hardware sends HTTP POST → This server → MQTT broker (cvipiot-preprod)
 * MQTT response is returned in the HTTP response (with timeout).
 * 
 * Usage: node server.js
 * Port:  3000 (change HTTP_PORT in .env)
 */

require('dotenv').config();
const http = require('http');
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const HTTP_PORT = process.env.HTTP_PORT || 3000;
const BROKER     = process.env.BROKER    || 'mqtts://cvipiot-preprod.fca-india.com:18883';
const CERTS_DIR  = process.env.CERTS_DIR || path.join(__dirname, 'certs');
const RSP_TIMEOUT_MS = parseInt(process.env.RSP_TIMEOUT_MS || '15000', 10);

// ─── MQTT client (single persistent connection) ───────────────────────────────

const mqttClient = mqtt.connect(BROKER, {
  clientId: process.env.CLIENT_ID || process.env.IMEI,
  clean: true,
  keepalive: 30,
  username: 'guest',
  password: Buffer.alloc(0),
  protocolVersion: 4,
  connectTimeout: 10000,
  rejectUnauthorized: false,
  ca:   fs.readFileSync(path.join(CERTS_DIR, 'cvipcabundle.pem')),
  cert: fs.readFileSync(path.join(CERTS_DIR, 'ping-cert.pem')),
  key:  fs.readFileSync(path.join(CERTS_DIR, 'ping-key.pem')),
});

let mqttReady = false;

// pendingRequests: topic → array of { resolve, reject, timer }
const pendingRequests = new Map();

mqttClient.on('connect', () => {
  mqttReady = true;
  console.log('[MQTT] Connected to broker:', BROKER);
});

mqttClient.on('error',     (e) => console.error('[MQTT] Error:', e.message));
mqttClient.on('close',     ()  => { mqttReady = false; console.warn('[MQTT] Disconnected'); });
mqttClient.on('reconnect', ()  => console.log('[MQTT] Reconnecting...'));

mqttClient.on('message', (topic, buf) => {
  console.log(`[MQTT] ← Received on ${topic} (${buf.length} bytes)`);

  const waiters = pendingRequests.get(topic);
  if (waiters && waiters.length > 0) {
    const { resolve, timer } = waiters.shift();
    if (waiters.length === 0) pendingRequests.delete(topic);
    clearTimeout(timer);
    resolve({ topic, payload: buf.toString('hex').toUpperCase(), raw: buf });
  }
});

// ─── Helper: publish and wait for response ────────────────────────────────────

function publishAndWait(pubTopic, payload, rspTopic) {
  return new Promise((resolve, reject) => {

    // Subscribe to response topic (idempotent)
    mqttClient.subscribe(rspTopic, { qos: 1 }, (err) => {
      if (err) return reject(new Error('Subscribe failed: ' + err.message));
    });

    const timer = setTimeout(() => {
      // remove waiter on timeout
      const waiters = pendingRequests.get(rspTopic) || [];
      const idx = waiters.findIndex(w => w.timer === timer);
      if (idx !== -1) waiters.splice(idx, 1);
      reject(new Error(`Timeout: no response on ${rspTopic} within ${RSP_TIMEOUT_MS}ms`));
    }, RSP_TIMEOUT_MS);

    if (!pendingRequests.has(rspTopic)) pendingRequests.set(rspTopic, []);
    pendingRequests.get(rspTopic).push({ resolve, reject, timer });

    // Publish
    const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload));
    mqttClient.publish(pubTopic, buf, { qos: 1 }, (err) => {
      if (err) {
        clearTimeout(timer);
        const waiters = pendingRequests.get(rspTopic) || [];
        const idx = waiters.findIndex(w => w.timer === timer);
        if (idx !== -1) waiters.splice(idx, 1);
        reject(new Error('Publish failed: ' + err.message));
      } else {
        console.log(`[MQTT] → Published to ${pubTopic} (${buf.length} bytes)`);
      }
    });
  });
}

// publish fire-and-forget (for telemetry/alerts/trips/events that don't get a response)
function publishOnly(pubTopic, payload) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload));
    mqttClient.publish(pubTopic, buf, { qos: 1 }, (err) => {
      if (err) reject(new Error('Publish failed: ' + err.message));
      else {
        console.log(`[MQTT] → Published to ${pubTopic} (${buf.length} bytes)`);
        resolve({ published: true, topic: pubTopic, bytes: buf.length });
      }
    });
  });
}

// ─── Route table ─────────────────────────────────────────────────────────────
//
//  Each route: { pubTopic(vin), rspTopic(vin)|null }
//  rspTopic = null  → fire-and-forget, returns { published: true }
//  rspTopic = fn    → wait for MQTT reply and return hex payload + topic
//
const ROUTES = {
  // ── Device lifecycle ──────────────────────────────────────────────────────
  'POST /api/:vin/deviceJoin': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/deviceJoined`,
    rspTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/deviceJoinedRsp`,
  },
  'POST /api/:vin/lwtConfiguration': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/lwtConfiguration`,
    rspTopic: null,
  },

  // ── Telemetry ─────────────────────────────────────────────────────────────
  'POST /api/:vin/locationTelemetry': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/locationTelemetry`,
    rspTopic: null,
  },
  'POST /api/:vin/vehicleTelemetry': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/vehicleTelemetry`,
    rspTopic: null,
  },

  // ── Events ────────────────────────────────────────────────────────────────
  'POST /api/:vin/events': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/events`,
    rspTopic: null,
  },

  // ── Alerts ────────────────────────────────────────────────────────────────
  'POST /api/:vin/alerts': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/alerts`,
    rspTopic: null,
  },

  // ── Trips ─────────────────────────────────────────────────────────────────
  'POST /api/:vin/tripStart': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/tripStart`,
    rspTopic: null,
  },
  'POST /api/:vin/tripEnd': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/tripEnd`,
    rspTopic: null,
  },
  'POST /api/:vin/tripCurrent': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/tripCurrent`,
    rspTopic: null,
  },

  // ── Commands (bidirectional: we wait for command, send response back) ─────
  'POST /api/:vin/commandResponse': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/commandResponse`,
    rspTopic: null,   // hardware sends command response → no reply expected
  },
  // Hardware polls: "did a command arrive for my VIN?"
  'GET /api/:vin/command': {
    rspTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/command`,
    pubTopic: null,   // subscribe-only; waits for server to push a command
  },

  // ── FOTA ──────────────────────────────────────────────────────────────────
  'POST /api/:vin/fotaCommand': {
    pubTopic: (vin) => `/dongle/${vin}/MQTTPROTOBUF/fotaCommand`,
    rspTopic: null,
  },
};

// ─── Route matching ───────────────────────────────────────────────────────────

function matchRoute(method, urlPath) {
  for (const [pattern, handler] of Object.entries(ROUTES)) {
    const [pMethod, pPath] = pattern.split(' ');
    if (pMethod !== method) continue;

    const regex = new RegExp('^' + pPath.replace(/:([^/]+)/g, '(?<$1>[^/]+)') + '$');
    const m = urlPath.match(regex);
    if (m) return { handler, params: m.groups || {} };
  }
  return null;
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────

function sendJson(res, status, body) {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const urlObj  = new URL(req.url, `http://localhost`);
  const method  = req.method.toUpperCase();
  const urlPath = urlObj.pathname;

  console.log(`[HTTP] ${method} ${urlPath}`);

  // ── Health check ──────────────────────────────────────────────────────────
  if (method === 'GET' && urlPath === '/health') {
    return sendJson(res, 200, { status: 'ok', mqttConnected: mqttReady });
  }

  // ── API docs ──────────────────────────────────────────────────────────────
  if (method === 'GET' && urlPath === '/') {
    const routes = Object.keys(ROUTES).map(r => {
      const [m, p] = r.split(' ');
      return { method: m, path: p };
    });
    return sendJson(res, 200, { message: 'HTTP-to-MQTT Bridge', routes });
  }

  // ── Route match ───────────────────────────────────────────────────────────
  const match = matchRoute(method, urlPath);
  if (!match) {
    return sendJson(res, 404, { error: 'Route not found', path: urlPath });
  }

  if (!mqttReady) {
    return sendJson(res, 503, { error: 'MQTT broker not connected' });
  }

  const { handler, params } = match;
  const { vin } = params;

  try {
    const bodyBuf = await readBody(req);

    // ── GET /command → subscribe-only, wait for incoming command ─────────
    if (method === 'GET' && handler.rspTopic && !handler.pubTopic) {
      const rspTopic = handler.rspTopic(vin);
      console.log(`[Bridge] Waiting for command on ${rspTopic}...`);
      const result = await new Promise((resolve, reject) => {
        mqttClient.subscribe(rspTopic, { qos: 1 }, (err) => {
          if (err) return reject(new Error('Subscribe failed: ' + err.message));
        });
        const timer = setTimeout(() => reject(new Error(`Timeout: no command on ${rspTopic}`)), RSP_TIMEOUT_MS);
        if (!pendingRequests.has(rspTopic)) pendingRequests.set(rspTopic, []);
        pendingRequests.get(rspTopic).push({ resolve, reject, timer });
      });

      return sendJson(res, 200, {
        success: true,
        vin,
        mqttTopic: result.topic,
        responseHex: result.payload,
        responseBytes: result.raw.length,
      });
    }

    // ── POST with response topic → publish + wait for reply ───────────────
    if (handler.rspTopic) {
      const pubTopic = handler.pubTopic(vin);
      const rspTopic = handler.rspTopic(vin);
      console.log(`[Bridge] ${pubTopic} → waiting for reply on ${rspTopic}`);

      const payload = bodyBuf.length > 0 ? bodyBuf : Buffer.alloc(0);
      const result  = await publishAndWait(pubTopic, payload, rspTopic);

      return sendJson(res, 200, {
        success: true,
        vin,
        published: { topic: pubTopic, bytes: payload.length },
        mqttResponse: {
          topic: result.topic,
          hex:   result.payload,
          bytes: result.raw.length,
        },
      });
    }

    // ── POST fire-and-forget → publish only ───────────────────────────────
    const pubTopic = handler.pubTopic(vin);
    const payload  = bodyBuf.length > 0 ? bodyBuf : Buffer.alloc(0);
    const result   = await publishOnly(pubTopic, payload);

    return sendJson(res, 200, {
      success: true,
      vin,
      published: { topic: pubTopic, bytes: payload.length },
    });

  } catch (err) {
    console.error('[Bridge] Error:', err.message);
    const status = err.message.startsWith('Timeout') ? 504 : 500;
    return sendJson(res, status, { error: err.message });
  }
});

server.listen(HTTP_PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║        HTTP-to-MQTT Bridge Server                ║`);
  console.log(`╠══════════════════════════════════════════════════╣`);
  console.log(`║  HTTP  → http://localhost:${HTTP_PORT}                  ║`);
  console.log(`║  MQTT  → ${BROKER.substring(0, 40)}  ║`);
  console.log(`║  Certs → ${CERTS_DIR.substring(0, 40)}  ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
  console.log('Available endpoints:');
  Object.keys(ROUTES).forEach(r => console.log(' ', r));
  console.log('\nWaiting for hardware HTTP calls...\n');
});
