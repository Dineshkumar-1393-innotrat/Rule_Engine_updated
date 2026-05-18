#!/usr/bin/env node
/**
 * sync-certs.js
 * ---------------------------------------------------------------------------
 * Run this script ONCE after downloading certificates from the dashboard.
 * It reads the cert bundle JSON saved by the dashboard and writes every file
 * to the ./certs/ folder so the simulator scripts can use them immediately.
 *
 * Usage:
 *   node sync-certs.js
 *
 * Expects a file named `cert-bundle.json` in the same directory (exported
 * from the React Dashboard via "Sync to Simulator" button).
 * ---------------------------------------------------------------------------
 */

const fs   = require('fs');
const path = require('path');

const BUNDLE_FILE = path.join(__dirname, 'cert-bundle.json');
const CERTS_DIR   = path.join(__dirname, 'certs');
const ENV_FILE    = path.join(__dirname, '.env');

if (!fs.existsSync(BUNDLE_FILE)) {
  console.error('❌  cert-bundle.json not found!');
  console.error('    Export it from the MQTT Virtual Device dashboard first.');
  process.exit(1);
}

const bundle = JSON.parse(fs.readFileSync(BUNDLE_FILE, 'utf8'));

// ── 1. Write certificate files ────────────────────────────────────────────
fs.mkdirSync(CERTS_DIR, { recursive: true });

const files = {
  'device-key.key':     bundle.privateKeyPem,
  'device.csr':        bundle.csrPem,
  'device-cert.crt':   bundle.certPem,
  'cvip-ca-bundle.crt':bundle.bundlePem,
};

for (const [filename, content] of Object.entries(files)) {
  if (!content) { console.warn(`⚠  Skipping ${filename} (empty)`); continue; }
  const dest = path.join(CERTS_DIR, filename);
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`✓  Written: certs/${filename}`);
}

// ── 2. Write device_join_payload.json ─────────────────────────────────────
if (bundle.deviceJoinPayload) {
  const joinFile = path.join(__dirname, 'deviceJoin', 'device_join_payload.json');
  fs.writeFileSync(joinFile, bundle.deviceJoinPayload, 'utf8');
  console.log('✓  Written: deviceJoin/device_join_payload.json');
}

// ── 3. Patch .env with device identifiers ─────────────────────────────────
if (bundle.config) {
  const { vin, imei, tboxSerial } = bundle.config;

  let envContent = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';

  const set = (key, value) => {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(envContent)) {
      envContent = envContent.replace(re, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  };

  set('VIN',         vin);
  set('IMEI',        imei);
  set('TBOX_SERIAL', tboxSerial);
  set('CLIENT_ID',   vin);

  fs.writeFileSync(ENV_FILE, envContent, 'utf8');
  console.log(`✓  Updated .env  →  VIN=${vin}  IMEI=${imei}  TBOX_SERIAL=${tboxSerial}`);
}

console.log('\n🎉  Sync complete! You can now run:');
console.log('    node deviceJoin/deviceJoin.js');
console.log('    node vehicleTelemetry/vehicleTelemetryFuelLevel.js');
