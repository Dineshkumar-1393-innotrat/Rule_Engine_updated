// import React, { useState, useEffect } from "react";
// import { Box } from "@chakra-ui/react";
// import { AnimatePresence, motion } from "framer-motion";
// import { v4 as uuidv4 } from "uuid";

// import { useMQTTState } from "../mqtt/useMQTTState";
// import { mqttTheme } from "../mqtt/theme";
// import { DeviceHeader } from "../mqtt/DeviceHeader";
// import { TopConfigTabs } from "../mqtt/TopConfigTabs";
// import { DynamicWorkspace } from "../mqtt/DynamicWorkspace";

// // Module Views
// import { DeviceIdentityView } from "../mqtt/DeviceIdentityView";
// import { ConnectionProfileView } from "../mqtt/ConnectionProfileView";
// import { CertificatesView } from "../mqtt/CertificatesView";
// import { PlatformStateView } from "../mqtt/PlatformStateView";
// import { MQTTConnectionView } from "../mqtt/MQTTConnectionView";

// const ToastContainer = ({ toasts, dispatch }) => (
//   <Box position="fixed" bottom="20px" right="20px" zIndex={10000} display="flex" flexDirection="column-reverse" gap={2}>
//     <AnimatePresence>
//       {toasts.map(toast => (
//         <motion.div
//           key={toast.id}
//           initial={{ x: 120, opacity: 0, scale: 0.85 }}
//           animate={{ x: 0, opacity: 1, scale: 1 }}
//           exit={{ x: 120, opacity: 0, scale: 0.85 }}
//           style={{
//             background: toast.type === "error" ? `${mqttTheme.danger}22` : `${mqttTheme.success}22`,
//             border: `1px solid ${toast.type === "error" ? mqttTheme.danger : mqttTheme.success}`,
//             color: toast.type === "error" ? mqttTheme.danger : mqttTheme.success,
//             padding: "10px 18px",
//             borderRadius: "8px",
//             fontFamily: "monospace",
//             fontSize: "12px",
//             minWidth: "220px",
//             cursor: "pointer",
//             backdropFilter: "blur(4px)"
//           }}
//           onClick={() => dispatch({ type: "REMOVE_TOAST", id: toast.id })}
//         >
//           {toast.message}
//         </motion.div>
//       ))}
//     </AnimatePresence>
//   </Box>
// );

// export default function MQTTVirtualDeviceDashboard() {
//   const { state, dispatch } = useMQTTState();
//   const [activeTab, setActiveTab] = useState("mqtt");

//   const handleConnect = () => {
//     dispatch({ type: "SET_CONNECTION", payload: { status: "CONNECTING" } });
//     setTimeout(() => {
//       dispatch({ type: "SET_CONNECTION", payload: { status: "CONNECTED", connectedAt: new Date().toISOString() } });
//       dispatch({ type: "ADD_TOAST", toast: { id: uuidv4(), message: "✓ MQTT Connected", type: "success" } });
//     }, 800);
//   };

//   const handleDisconnect = () => {
//     dispatch({ type: "SET_CONNECTION", payload: { status: "DISCONNECTED", connectedAt: null, uptimeSeconds: 0 } });
//     dispatch({ type: "ADD_TOAST", toast: { id: uuidv4(), message: "MQTT Disconnected", type: "error" } });
//   };

//   const handlePublish = (topic, type, value) => {
//     dispatch({
//       type: "ADD_LOG",
//       entry: {
//         id: uuidv4(),
//         timestamp: new Date().toISOString(),
//         direction: "PUB",
//         messageType: type,
//         topic: topic,
//         status: "SUCCESS",
//       }
//     });
//   };

//   useEffect(() => {
//     let timer;
//     if (state.connection.status === "CONNECTED") {
//       timer = setInterval(() => {
//         dispatch({ type: "SET_CONNECTION", payload: { uptimeSeconds: state.connection.uptimeSeconds + 1 } });
//       }, 1000);
//     }
//     return () => clearInterval(timer);
//   }, [state.connection.status, state.connection.uptimeSeconds, dispatch]);

//   const renderActiveView = () => {
//     switch (activeTab) {
//       case "identity":
//         return <DeviceIdentityView state={state} dispatch={dispatch} />;
//       case "connection":
//         return <ConnectionProfileView state={state} />;
//       case "certificates":
//         return <CertificatesView state={state} dispatch={dispatch} />;
//       case "platform":
//         return <PlatformStateView state={state} dispatch={dispatch} />;
//       case "mqtt":
//       default:
//         return <MQTTConnectionView state={state} dispatch={dispatch} handlePublish={handlePublish} />;
//     }
//   };

//   return (
//     <Box minH="calc(100vh - 80px)" bg={mqttTheme.bg} overflow="hidden" display="flex" flexDirection="column">
//       <ToastContainer toasts={state.toasts} dispatch={dispatch} />

//       {/* Header Row */}
//       <DeviceHeader 
//         state={state} 
//         handleConnect={handleConnect} 
//         handleDisconnect={handleDisconnect} 
//       />

//       {/* Configuration Navigation Row */}
//       <TopConfigTabs activeTab={activeTab} setActiveTab={setActiveTab} />

//       {/* Single Main Workspace Content Area */}
//       <DynamicWorkspace activeTab={activeTab}>
//         {renderActiveView()}
//       </DynamicWorkspace>
//     </Box>
//   );
// }


/**
 * MQTTVirtualDeviceDashboard.jsx
 * Fully functional MQTT Virtual Device Dashboard
 * Simulates a connected vehicle TBOX device communicating over MQTT
 * Uses Framer Motion for all physics-spring animations
 * Dark industrial telemetry UI theme
 */

import React, {
  useState,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence, useSpring, useTransform, animate } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import protobuf from "protobufjs";

// ─────────────────────────────────────────────
// SPRING CONFIGS (Antigravity / Framer Motion)
// ─────────────────────────────────────────────
const SPRINGS = {
  logEntry: { type: "spring", stiffness: 300, damping: 28 },
  telemetryNum: { type: "spring", stiffness: 180, damping: 22 },
  buttonPop: { type: "spring", stiffness: 500, damping: 30 },
  toast: { type: "spring", stiffness: 400, damping: 20 },
  commandSlide: { type: "spring", stiffness: 260, damping: 26 },
  gpsPin: { type: "spring", stiffness: 120, damping: 18 },
  errorShake: { type: "spring", stiffness: 800, damping: 10 },
  logScatter: { type: "spring", stiffness: 100, damping: 8 },
  panelCollapse: { type: "spring", stiffness: 350, damping: 30 },
  cardGlow: { type: "spring", stiffness: 150, damping: 25 },
};

// ─────────────────────────────────────────────
// THEME / DESIGN TOKENS
// ─────────────────────────────────────────────
const T = {
  bgPrimary: "#f9fafb", // Matches gray.50
  bgCard: "#ffffff",
  bgCardHov: "#f3f4f6",
  border: "#e2e8f0", // Matches gray.200
  accent: "#3182ce", // matches blue.500
  accentDim: "#ebf8ff", // matches blue.50
  pub: "#38a169", // matches green.500
  sub: "#3182ce", // matches blue.500
  error: "#e53e3e", // matches red.500
  textPri: "#1a202c", // matches gray.800
  textMut: "#718096", // matches gray.500
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

// ─────────────────────────────────────────────
// GLOBAL STATE REDUCER
// ─────────────────────────────────────────────
const initialState = {
  config: {
    vin: "T123ZTZT867657777",
    imei: "356741396798769",
    tboxSerial: "T123ZTZT1396798769",
    clientId: "T123ZTZT867657777",
    messageId: "dd52bab1-c64a-431b-a945-1602f26e9f4e",
    correlationId: "9b2e3f4c-6a78-4d1b-8e9f-3c4d5a6b7e81",
    broker: "mqtts://cvipiot-preprod.fca-india.com:18883",
    protocolVersion: "5.0.0",
    selectedProtocol: "5.0", // "5.0" (Binary) or "2.0.0" (JSON)
  },
  protoState: {
    status: "IDLE", // "IDLE", "LOADING", "READY", "ERROR"
    error: null,
  },
  connection: {
    status: "DISCONNECTED",
    publishCount: 0,
    receiveCount: 0,
    uptimeSeconds: 0,
    lastPublishAt: null,
    lastReceiveAt: null,
    connectedAt: null,
  },
  telemetry: {
    fuelLevel: 64,
    engineSpeed: 2800,
    engineWaterTemp: 90,
    batteryVoltage: 12.6,
    odometer: 45230,
    gpsLat: 13.084534,
    gpsLong: 80.270718,
    gpsAlt: 20.0,
    speed: 0,
  },
  telemetryHistory: {
    fuelLevel: [64],
    engineSpeed: [2800],
    engineWaterTemp: [90],
    batteryVoltage: [12.6],
    odometer: [45230],
  },
  fota: {
    status: "IDLE",
    progress: 0,
    artifacts: [],
    correlationId: null,
    currentStep: null,
    isProcessing: false,
  },
  diagnostics: {
    logStatus: "IDLE", // IDLE, UPLOADING, SUCCESS
    lastResetAt: null,
  },
  log: [],
  commandInbox: [],
  toasts: [],
  activePublishTab: "vehicleTelemetry",
  autoDriveActive: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_CONFIG":
      return { ...state, config: { ...state.config, ...action.payload } };
    case "SET_CONFIG_FIELD":
      return { ...state, config: { ...state.config, [action.field]: action.value } };
    case "SET_PROTO_STATE":
      return { ...state, protoState: { ...state.protoState, ...action.payload } };
    case "SET_CONNECTION":
      return { ...state, connection: { ...state.connection, ...action.payload } };
    case "SET_TELEMETRY": {
      const key = action.key;
      const val = action.value;
      const hist = state.telemetryHistory[key] || [];
      const newHist = [...hist.slice(-9), val];
      return {
        ...state,
        telemetry: { ...state.telemetry, [key]: val },
        telemetryHistory: { ...state.telemetryHistory, [key]: newHist },
      };
    }
    case "SET_TELEMETRY_BULK":
      return { ...state, telemetry: { ...state.telemetry, ...action.payload } };
    case "ADD_LOG": {
      const logs = [action.entry, ...state.log].slice(0, 200);
      return { ...state, log: logs };
    }
    case "CLEAR_LOG":
      return { ...state, log: [] };
    case "ADD_COMMAND": {
      const cmds = [action.cmd, ...state.commandInbox];
      return { ...state, commandInbox: cmds };
    }
    case "UPDATE_COMMAND": {
      const updated = state.commandInbox.map((c) =>
        c.id === action.id ? { ...c, ...action.payload } : c
      );
      return { ...state, commandInbox: updated };
    }
    case "ADD_TOAST": {
      const toasts = [action.toast, ...state.toasts].slice(0, 5);
      return { ...state, toasts };
    }
    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "SET_ACTIVE_TAB":
      return { ...state, activePublishTab: action.tab };
    case "INCREMENT_PUBLISH":
      return {
        ...state,
        connection: {
          ...state.connection,
          publishCount: state.connection.publishCount + 1,
          lastPublishAt: new Date().toISOString(),
        },
      };
    case "INCREMENT_RECEIVE":
      return {
        ...state,
        connection: {
          ...state.connection,
          receiveCount: state.connection.receiveCount + 1,
          lastReceiveAt: new Date().toISOString(),
        },
      };
    case "SET_AUTO_DRIVE":
      return { ...state, autoDriveActive: action.value };
    case "UPDATE_FOTA":
      return { ...state, fota: { ...state.fota, ...action.payload } };
    case "UPDATE_DIAG":
      return { ...state, diagnostics: { ...state.diagnostics, ...action.payload } };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function makeTimestamp() {
  const now = Date.now();
  const ts = { seconds: Math.floor(now / 1000), nanos: (now % 1000) * 1000000 };
  return { ...ts, time_stamp: ts, timeStamp: ts }; // Support both naming styles
}

function formatTimestamp(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function formatUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function buildMockHex(type, data) {
  const str = JSON.stringify({ type, ...data, ts: makeTimestamp() });
  return Buffer
    ? Buffer.from(str).toString("hex")
    : Array.from(str).map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

function mockHex(label, obj) {
  const raw = JSON.stringify({ label, ...obj });
  return raw.split("").map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').slice(0, 96) + "...";
}

function getTrendArrow(hist) {
  if (!hist || hist.length < 2) return "→";
  const last = hist[hist.length - 1];
  const prev = hist[hist.length - 2];
  if (last > prev) return "↑";
  if (last < prev) return "↓";
  return "→";
}

function getTripId() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear() % 100).padStart(2, "0");
  return `${day}${month}${year}03`;
}

// ─────────────────────────────────────────────
// MICRO-COMPONENTS
// ─────────────────────────────────────────────

// Badge
function Badge({ children, color = T.textMut, bg = T.bgCard }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 6px",
      borderRadius: 4,
      background: bg,
      color,
      fontSize: 10,
      fontFamily: T.mono,
      letterSpacing: "0.05em",
      border: `1px solid ${color}33`,
    }}>
      {children}
    </span>
  );
}

// Label
function Label({ children }) {
  return (
    <div style={{
      fontSize: 11,
      color: T.textMut,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      marginBottom: 5,
      fontWeight: 700,
    }}>
      {children}
    </div>
  );
}

// Section Header
function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 13,
      fontWeight: 800,
      color: T.accent,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: 12,
      borderBottom: `1px solid ${T.border}`,
      paddingBottom: 7,
    }}>
      {children}
    </div>
  );
}

// PressButton - Spring scale pop on click
function PressButton({ onClick, children, style = {}, color = T.accent, disabled = false }) {
  const [pressing, setPressing] = useState(false);
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.03 }}
      transition={SPRINGS.buttonPop}
      onClick={() => { if (!disabled) { setPressing(true); setTimeout(() => setPressing(false), 200); onClick?.(); } }}
      style={{
        background: disabled ? "#333" : `${color}22`,
        border: `1px solid ${disabled ? "#555" : color}`,
        color: disabled ? "#555" : color,
        padding: "7px 16px",
        borderRadius: 6,
        fontFamily: T.mono,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        letterSpacing: "0.08em",
        transition: "background 0.15s",
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

// Input field
function Field({ label, value, onChange, type = "text", disabled, options, isSelect }) {
  const common = {
    background: T.bgPrimary,
    border: `1px solid ${T.border}`,
    color: T.textPri,
    padding: "8px 10px",
    borderRadius: 6,
    fontFamily: T.mono,
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    lineHeight: "1.4",
  };
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <Label>{label}</Label>}
      {isSelect ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={common} disabled={disabled}>
          {options?.map(o => (
            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          style={{ ...common, opacity: disabled ? 0.5 : 1 }}
        />
      )}
    </div>
  );
}

// Card wrapper
function Card({ children, style = {}, glowing = false }) {
  return (
    <motion.div
      animate={{ boxShadow: glowing ? `0 0 18px ${T.accent}44` : "0 0 0px transparent" }}
      transition={SPRINGS.cardGlow}
      style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: 16,
        marginBottom: 8,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// Pulsing connection dot
function ConnectionDot({ status }) {
  const colors = {
    CONNECTED: T.pub,
    CONNECTING: T.accent,
    DISCONNECTED: T.textMut,
    ERROR: T.error,
  };
  const col = colors[status] || T.textMut;
  const isAnimated = status === "CONNECTED" || status === "CONNECTING";
  return (
    <span style={{ position: "relative", display: "inline-block", width: 12, height: 12, marginRight: 8 }}>
      <motion.span
        style={{
          display: "block",
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: col,
          position: "absolute",
        }}
        animate={isAnimated ? {
          scale: [1, 1.5, 1],
          opacity: [1, 0.5, 1],
        } : {}}
        transition={isAnimated ? {
          duration: status === "CONNECTED" ? 2 : 0.9,
          repeat: Infinity,
          ease: "easeInOut",
          ...SPRINGS[status === "ERROR" ? "errorShake" : "gpsPin"],
        } : {}}
      />
    </span>
  );
}

// Toast notification
function ToastContainer({ toasts, dispatch }) {
  return (
    <div style={{
      position: "fixed",
      top: 56,
      right: 20,
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ x: 120, opacity: 0, scale: 0.85 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 120, opacity: 0, scale: 0.85 }}
            transition={SPRINGS.toast}
            style={{
              background: toast.type === "error" ? `${T.error}22` : `${T.pub}22`,
              border: `1px solid ${toast.type === "error" ? T.error : T.pub}`,
              color: toast.type === "error" ? T.error : T.pub,
              padding: "10px 18px",
              borderRadius: 8,
              fontFamily: T.mono,
              fontSize: 12,
              minWidth: 220,
              cursor: "pointer",
            }}
            onClick={() => dispatch({ type: "REMOVE_TOAST", id: toast.id })}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION 1 — DEVICE IDENTITY
// ─────────────────────────────────────────────
function DeviceIdentityPanel({ state, dispatch }) {
  const [open, setOpen] = useState(true);

  const mockDevices = [
    { value: "", label: "-- Select a Mock Device --" },
    { value: "Mock Device 1", label: "Mock Device 1 (356741360383500)", imei: "356741360383500", vin: "MOCKVIN123ABC0001", tboxSerial: "2g123abc", clientId: "MOCKVIN123ABC0001" },
    { value: "Mock Device 2", label: "Mock Device 2 (356741360383501)", imei: "356741360383501", vin: "MOCKVIN124ABC0002", tboxSerial: "2g124abc", clientId: "MOCKVIN124ABC0002" },
    { value: "Mock Device 3", label: "Mock Device 3 (356741360383502)", imei: "356741360383502", vin: "MOCKVIN125ABC0003", tboxSerial: "2g125abc", clientId: "MOCKVIN125ABC0003" },
    { value: "Mock Device 4", label: "Mock Device 4 (356741360383503)", imei: "356741360383503", vin: "MOCKVIN126ABC0004", tboxSerial: "2g126abc", clientId: "MOCKVIN126ABC0004" },
    { value: "Mock Device 5", label: "Mock Device 5 (356741360383504)", imei: "356741360383504", vin: "MOCKVIN127ABC0005", tboxSerial: "2g127abc", clientId: "MOCKVIN127ABC0005" },
  ];

  const handleLoadMock = (val) => {
    if (!val) return;
    const device = mockDevices.find(d => d.value === val);
    if (device) {
      dispatch({
        type: "SET_CONFIG", payload: {
          vin: device.vin,
          imei: device.imei,
          tboxSerial: device.tboxSerial,
          clientId: device.clientId,
        }
      });
      dispatch({ type: "ADD_TOAST", toast: { id: uuidv4(), message: `Loaded ${val}`, type: "success" } });
    }
  };

  const handleChange = (field, value) => {
    dispatch({ type: "SET_CONFIG_FIELD", field, value });
  };

  const handleProtocolChange = (pId) => {
    dispatch({
      type: "SET_CONFIG", payload: {
        selectedProtocol: pId,
        protocolVersion: pId === "5.0" ? "5.0.0" : "2.0.0"
      }
    });
  };

  const handleGenerateUUIDs = () => {
    dispatch({ type: "SET_CONFIG", payload: { messageId: uuidv4(), correlationId: uuidv4() } });
    dispatch({ type: "ADD_TOAST", toast: { id: uuidv4(), message: "UUIDs Generated", type: "success" } });
  };

  const brokerOptions = [
    { value: "mqtts://cvipiot-preprod.fca-india.com:18883", label: "FCA India Preprod" },
    { value: "mqtts://lb2.cvip-preprod.citroen.in:48883", label: "Citroen Preprod" },
  ];

  return (
    <Card>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: open ? 12 : 0 }}
        onClick={() => setOpen(o => !o)}
      >
        <SectionHeader>⚙ Device Identity</SectionHeader>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={SPRINGS.panelCollapse}
          style={{ color: T.accent, fontSize: 16, marginTop: -6 }}
        >▼</motion.span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="identity-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRINGS.panelCollapse}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "8px", background: `${T.accent}11`, border: `1px solid ${T.accent}`, borderRadius: "8px", marginBottom: "12px" }}>
              <Field label="Load Mock Preset" value={""} onChange={handleLoadMock} isSelect options={mockDevices} />
            </div>

            <Field label="VIN" value={state.config.vin} onChange={v => handleChange("vin", v)} />
            <Field label="IMEI" value={state.config.imei} onChange={v => handleChange("imei", v)} />
            <Field label="TBOX Serial" value={state.config.tboxSerial} onChange={v => handleChange("tboxSerial", v)} />
            <Field label="Client ID" value={state.config.clientId} onChange={v => handleChange("clientId", v)} />
            <Field label="Message ID" value={state.config.messageId} onChange={v => handleChange("messageId", v)} />
            <Field label="Correlation ID" value={state.config.correlationId} onChange={v => handleChange("correlationId", v)} />
            <Field label="Broker URL" value={state.config.broker} onChange={v => handleChange("broker", v)} isSelect options={brokerOptions} />

            <div style={{ marginBottom: 16 }}>
              <Label>Protocol Implementation</Label>
              <div style={{ display: "flex", gap: 4, background: T.bgPrimary, padding: 4, borderRadius: 8, border: `1px solid ${T.border}` }}>
                {[
                  { id: "5.0", label: "v5.0 (Binary)", color: T.pub },
                  { id: "2.0.0", label: "v2.0.0 (JSON)", color: T.accent },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProtocolChange(p.id)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 6,
                      border: "none",
                      background: state.config.selectedProtocol === p.id ? `${p.color}22` : "transparent",
                      color: state.config.selectedProtocol === p.id ? p.color : T.textMut,
                      fontFamily: T.mono,
                      fontSize: 11,
                      fontWeight: state.config.selectedProtocol === p.id ? 800 : 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 9, color: T.textMut, marginTop: 6, fontFamily: T.mono, opacity: 0.8 }}>
                {state.config.selectedProtocol === "5.0"
                  ? "↑ Real-time Protobuf encoding enabled"
                  : "↑ Mock JSON structure enabled"}
              </div>
            </div>

            <Field label="Protocol Version string" value={state.config.protocolVersion} onChange={v => handleChange("protocolVersion", v)} />

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <PressButton
                onClick={handleGenerateUUIDs}
                color={T.sub}
                style={{ flex: 1 }}
              >
                ↻ Generate UUIDs
              </PressButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─────────────────────────────────────────────
// SECTION 1B — DEVICE CERTIFICATE CREATION
// ─────────────────────────────────────────────
function CertificatePanel({ state, dispatch }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0); // 0=idle, 1=genKey, 2=createCSR, 3=callAPI, 4=done, -1=error
  const [privateKeyPem, setPrivateKeyPem] = useState('');
  const [csrPem, setCsrPem] = useState('');
  const [certPem, setCertPem] = useState('');
  const [certB64, setCertB64] = useState('');
  const [deviceJoinPayload, setDeviceJoinPayload] = useState('');
  const [error, setError] = useState('');
  const [certLog, setCertLog] = useState([]);

  const addLog = (msg) => setCertLog(l => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const { vin, imei, tboxSerial } = state.config;
  const commonName = `${imei}-${tboxSerial}`;

  const toPem = (buffer, type) => {
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const lines = b64.match(/.{1,64}/g).join('\n');
    return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----\n`;
  };

  const buildCsr = async (privateKey, publicKey) => {
    const spkiDer = await crypto.subtle.exportKey('spki', publicKey);
    const encode = (str) => new TextEncoder().encode(str);

    const tlv = (tag, value) => {
      const arr = Array.isArray(value) ? value : Array.from(value);
      const len = arr.length;
      if (len < 128) return new Uint8Array([tag, len, ...arr]);
      if (len < 256) return new Uint8Array([tag, 0x81, len, ...arr]);
      return new Uint8Array([tag, 0x82, (len >> 8) & 0xff, len & 0xff, ...arr]);
    };

    // Attribute builder: SET(SEQUENCE(OID, PrintableString/UTF8String))
    const attr = (oid, val, tag = 0x13) => tlv(0x31, tlv(0x30, [...tlv(0x06, oid), ...tlv(tag, encode(val))]));

    // OIDs as seen in collection: C, O, CN
    const OID_C = [0x55, 0x04, 0x06];
    const OID_O = [0x55, 0x04, 0x0a];
    const OID_CN = [0x55, 0x04, 0x03];

    // Build subject attributes in order as seen in collection example: C, O, CN
    const subject = tlv(0x30, [
      ...attr(OID_C, 'IN'),
      ...attr(OID_O, 'Tbox_cert'),
      ...attr(OID_CN, commonName, 0x0c) // CN as UTF8String
    ]);

    const version = new Uint8Array([0x02, 0x01, 0x00]);
    const spki = new Uint8Array(spkiDer);
    const attrs = new Uint8Array([0xa0, 0x00]);
    const certRequestInfo = tlv(0x30, [...version, ...subject, ...spki, ...attrs]);

    const sig = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, certRequestInfo);
    const algoId = new Uint8Array([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b, 0x05, 0x00]);
    const bitString = tlv(0x03, [0x00, ...new Uint8Array(sig)]);
    const csr = tlv(0x30, [...certRequestInfo, ...algoId, ...bitString]);
    return csr.buffer;
  };

  const handleGenerate = async () => {
    setStep(1); setError(''); setCertLog([]);
    setPrivateKeyPem(''); setCsrPem(''); setCertPem(''); setCertB64(''); setDeviceJoinPayload('');
    try {
      addLog('Generating RSA-2048 key pair...');
      const keyPair = await crypto.subtle.generateKey(
        { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true, ['sign', 'verify']
      );
      const privDer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privPem = toPem(privDer, 'PRIVATE KEY');
      setPrivateKeyPem(privPem);
      addLog('✓ Private key generated (RSA-2048)');

      setStep(2);
      addLog(`Building CSR for CN=${commonName}...`);
      const csrDer = await buildCsr(keyPair.privateKey, keyPair.publicKey);

      // Extract raw base64 as seen in Postman Collection
      const csrBase64 = btoa(String.fromCharCode(...new Uint8Array(csrDer)));
      const csrP = toPem(csrDer, 'CERTIFICATE REQUEST');
      setCsrPem(csrP);
      addLog('✓ CSR created');

      setStep(3);
      addLog('Calling CVIP Certificate API...');
      const { TraxoApi } = await import('../../utils/TraxoApi');

      // Sending raw base64 as per collection example
      const apiResp = await TraxoApi.createTboxCertificate(commonName, csrBase64);
      addLog('✓ API responded');

      setStep(4);
      const certRaw = apiResp?.message || apiResp?.certificate || apiResp?.cert || '';
      if (!certRaw) throw new Error(`No certificate in API response. Keys: ${Object.keys(apiResp || {}).join(', ')}`);
      const certBytes = Uint8Array.from(atob(certRaw), c => c.charCodeAt(0));
      const certPemStr = toPem(certBytes.buffer, 'CERTIFICATE');
      setCertPem(certPemStr); setCertB64(certRaw);
      addLog('✓ Certificate extracted and converted to PEM');

      const ts = Date.now();
      const joinPayload = {
        vehicleId: vin, TboxSerialNum: tboxSerial, imeiNo: imei,
        protocolVersion: "2.0.0", TboxOperatingState: "NORMAL",
        TboxApplicationState: "FACTORY", TboxeSimState: "NORMAL_SIM",
        CCPUVersion: "MD0.00.01", VMCUVersion: "MD0.00.01",
        timestamp: ts, certificate: certRaw
      };
      setDeviceJoinPayload(JSON.stringify(joinPayload, null, 2));
      addLog('✓ deviceJoin payload built');
      addLog('🎉 Certificate creation complete!');
      dispatch({ type: 'ADD_TOAST', toast: { id: Date.now().toString(), message: '✓ Certificate Created', type: 'success' } });
    } catch (e) {
      setStep(-1); setError(e.message || String(e));
      addLog(`❌ Error: ${e.message}`);
    }
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const stepLabels = ['Idle', 'Key Gen', 'CSR', 'API Call', 'Done'];
  const stepColors = ['#718096', '#f59e0b', '#3182ce', '#9333ea', '#38a169'];

  return (
    <Card>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: open ? 12 : 0 }}
        onClick={() => setOpen(o => !o)}
      >
        <SectionHeader>🔐 Device Certificate</SectionHeader>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={SPRINGS.panelCollapse} style={{ color: T.accent, fontSize: 16, marginTop: -6 }}>▼</motion.span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="cert-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRINGS.panelCollapse} style={{ overflow: 'hidden' }}>
            <div style={{ background: `${T.accent}11`, border: `1px solid ${T.accent}33`, borderRadius: 8, padding: 10, marginBottom: 12, fontFamily: T.mono, fontSize: 11 }}>
              <div style={{ color: T.textMut, marginBottom: 4 }}>VIN: <span style={{ color: T.textPri, fontWeight: 700 }}>{vin}</span></div>
              <div style={{ color: T.textMut, marginBottom: 4 }}>IMEI: <span style={{ color: T.textPri, fontWeight: 700 }}>{imei}</span></div>
              <div style={{ color: T.textMut }}>CN: <span style={{ color: T.accent, fontWeight: 700 }}>{commonName}</span></div>
            </div>

            <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
              {stepLabels.map((label, i) => (
                <div key={i} style={{
                  flex: 1, textAlign: 'center', fontSize: 9, fontFamily: T.mono, fontWeight: 700,
                  padding: '4px 2px', borderRadius: 4,
                  background: step === i ? `${stepColors[i]}22` : step > i ? `${T.pub}11` : 'transparent',
                  color: step === i ? stepColors[i] : step > i ? T.pub : T.textMut,
                  border: `1px solid ${step === i ? stepColors[i] : step > i ? T.pub : T.border}`,
                }}>
                  {step > i ? '✓' : i + 1} {label}
                </div>
              ))}
            </div>

            <PressButton onClick={handleGenerate} color={step === 4 ? T.pub : T.accent} disabled={step > 0 && step < 4 && step !== -1} style={{ width: '100%', marginBottom: 10 }}>
              {step === 0 ? '🔐 Generate Certificate' : step === 4 ? '↻ Regenerate' : step === -1 ? '↻ Retry' : '⟳ Working...'}
            </PressButton>

            {certLog.length > 0 && (
              <div style={{ background: '#0d1117', borderRadius: 6, padding: 8, marginBottom: 10, fontFamily: T.mono, fontSize: 10, color: '#7ee787', maxHeight: 100, overflowY: 'auto', lineHeight: 1.6 }}>
                {certLog.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            )}

            {error && (
              <div style={{ background: `${T.error}11`, border: `1px solid ${T.error}`, borderRadius: 6, padding: 8, marginBottom: 10, fontFamily: T.mono, fontSize: 10, color: T.error }}>{error}</div>
            )}

            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <PressButton color={T.pub} style={{ width: '100%' }} onClick={() => downloadFile(privateKeyPem, 'device_private.key')}>↓ Private Key (.key)</PressButton>
                <PressButton color={T.pub} style={{ width: '100%' }} onClick={() => downloadFile(csrPem, 'device.csr')}>↓ CSR (.csr)</PressButton>
                <PressButton color={T.pub} style={{ width: '100%' }} onClick={() => downloadFile(certPem, 'device_cert.pem')}>↓ Certificate PEM</PressButton>
                <PressButton color="#9333ea" style={{ width: '100%' }} onClick={() => downloadFile(deviceJoinPayload, 'device_join_payload.json')}>↓ deviceJoin Payload (.json)</PressButton>
                <div style={{ marginTop: 6 }}>
                  <Label>deviceJoin Payload Preview</Label>
                  <textarea readOnly value={deviceJoinPayload} style={{ width: '100%', height: 140, background: '#0d1117', color: '#e6edf3', fontFamily: T.mono, fontSize: 10, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─────────────────────────────────────────────
// SECTION 2 — MQTT CONNECTION
// ─────────────────────────────────────────────
function ConnectionPanel({ state, dispatch }) {
  const { status, publishCount, receiveCount, uptimeSeconds, lastPublishAt, lastReceiveAt } = state.connection;
  const timerRef = useRef(null);

  // ─────────────────────────────────────────────
  // PERSISTENCE (Antigravity Integration)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const persistData = {
      vin: state.config.vin,
      telemetry: state.telemetry,
      connectionStatus: state.connection.status,
      log: state.log.slice(0, 50), // Persist last 50 messages for dashboard fallback
      lastUpdate: new Date().toISOString()
    };
    localStorage.setItem(`mqtt_virtual_device_data_${state.config.vin}`, JSON.stringify(persistData));
    // Also update a global list of mapped VINs for easy lookup
    const mappedVins = JSON.parse(localStorage.getItem("mqtt_mapped_vins") || "[]");
    if (!mappedVins.includes(state.config.vin)) {
      mappedVins.push(state.config.vin);
      localStorage.setItem("mqtt_mapped_vins", JSON.stringify(mappedVins));
    }
  }, [state.telemetry, state.config.vin, state.connection.status, state.log]);

  useEffect(() => {
    if (status === "CONNECTED") {
      timerRef.current = setInterval(() => {
        dispatch({ type: "SET_CONNECTION", payload: { uptimeSeconds: state.connection.uptimeSeconds + 1 } });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  const handleToggle = () => {
    if (status === "CONNECTED") {
      dispatch({ type: "SET_CONNECTION", payload: { status: "DISCONNECTED", connectedAt: null, uptimeSeconds: 0 } });
      dispatch({ type: "ADD_TOAST", toast: { id: uuidv4(), message: "MQTT Disconnected", type: "error" } });
    } else if (status === "DISCONNECTED" || status === "ERROR") {
      dispatch({ type: "SET_CONNECTION", payload: { status: "CONNECTING" } });
      setTimeout(() => {
        dispatch({ type: "SET_CONNECTION", payload: { status: "CONNECTED", connectedAt: new Date().toISOString() } });
        dispatch({ type: "ADD_TOAST", toast: { id: uuidv4(), message: "✓ MQTT Connected", type: "success" } });
      }, 850);
    }
  };

  const statusColor = {
    CONNECTED: T.pub,
    CONNECTING: T.accent,
    DISCONNECTED: T.textMut,
    ERROR: T.error,
  }[status] || T.textMut;

  return (
    <Card>
      <SectionHeader>◎ MQTT Connection</SectionHeader>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <ConnectionDot status={status} />
        <motion.span
          key={status}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRINGS.logEntry}
          style={{ color: statusColor, fontFamily: T.mono, fontSize: 13, fontWeight: 700 }}
        >
          {status}
        </motion.span>
      </div>

      <motion.div whileTap={{ scale: 0.95 }} transition={SPRINGS.buttonPop}>
        <button
          onClick={handleToggle}
          disabled={status === "CONNECTING"}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: `2px solid ${status === "CONNECTED" ? T.error : T.pub}`,
            background: status === "CONNECTED" ? `${T.error}18` : `${T.pub}18`,
            color: status === "CONNECTED" ? T.error : T.pub,
            fontFamily: T.mono,
            fontSize: 14,
            fontWeight: 700,
            cursor: status === "CONNECTING" ? "not-allowed" : "pointer",
            letterSpacing: "0.1em",
            marginBottom: 14,
          }}
        >
          {status === "CONNECTED" ? "⏹ DISCONNECT" : status === "CONNECTING" ? "⟳ CONNECTING..." : "▶ CONNECT"}
        </button>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Published", value: publishCount, color: T.pub },
          { label: "Received", value: receiveCount, color: T.sub },
          { label: "Uptime", value: formatUptime(uptimeSeconds), color: T.textPri },
          { label: "Last Pub", value: formatTimestamp(lastPublishAt), color: T.pub },
        ].map(item => (
          <div key={item.label} style={{
            background: T.bgPrimary,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: "8px 10px",
          }}>
            <Label>{item.label}</Label>
            <div style={{ color: item.color, fontFamily: T.mono, fontSize: 13, fontWeight: 700 }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// ANIMATED NUMBER — for telemetry values
// ─────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 0, suffix = "", isHex = true }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const ctrl = animate(prevRef.current, value, {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (v) => setDisplay(parseFloat(v.toFixed(decimals))),
    });
    prevRef.current = value;
    return ctrl.stop;
  }, [value, decimals]);

  let formatted;
  if (isHex) {
    const intVal = decimals > 0 ? Math.round(display * Math.pow(10, decimals)) : Math.round(display);
    formatted = "0x" + intVal.toString(16).toUpperCase();
  } else {
    formatted = display.toLocaleString();
  }

  return <span>{formatted}{suffix}</span>;
}

// ─────────────────────────────────────────────
// SECTION 5 — LIVE TELEMETRY CARDS
// ─────────────────────────────────────────────
function TelemetryCards({ state }) {
  const [open, setOpen] = useState(true);
  const { telemetry: tel, telemetryHistory: hist } = state;
  const cards = [
    { key: "fuelLevel", label: "Fuel Level", value: tel.fuelLevel, suffix: " %", decimals: 0, color: "#f59e0b", isHex: true },
    { key: "engineSpeed", label: "Engine Speed", value: tel.engineSpeed, suffix: " RPM", decimals: 0, color: "#10b981", isHex: true },
    { key: "engineWaterTemp", label: "Water Temp", value: tel.engineWaterTemp, suffix: " °C", decimals: 0, color: "#f43f5e", isHex: true },
    { key: "batteryVoltage", label: "Battery", value: tel.batteryVoltage, suffix: " V", decimals: 1, color: "#38bdf8", isHex: true },
    { key: "odometer", label: "Odometer", value: tel.odometer, suffix: " km", decimals: 0, color: "#a78bfa", isHex: true },
    { key: "gpsLat", label: "GPS Lat", value: tel.gpsLat, suffix: "°", decimals: 5, color: "#34d399", isHex: true },
  ];

  return (
    <Card>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: open ? 12 : 0 }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ flex: 1, marginRight: 16 }}>
          <SectionHeader>⊙ Live Telemetry</SectionHeader>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={SPRINGS.panelCollapse}
          style={{ color: T.accent, fontSize: 16, marginTop: -6 }}
        >▼</motion.span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRINGS.panelCollapse}
            style={{ overflow: "hidden" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {cards.map((card, i) => {
                const history = hist[card.key] || [];
                const trend = getTrendArrow(history);
                const trendColor = trend === "↑" ? T.pub : trend === "↓" ? T.error : T.textMut;
                const isUpdated = history.length >= 2 && history[history.length - 1] !== history[history.length - 2];
                return (
                  <motion.div
                    key={card.key}
                    animate={{ boxShadow: isUpdated ? `0 0 14px ${card.color}55` : "0 0 0px transparent" }}
                    transition={SPRINGS.cardGlow}
                    style={{
                      background: T.bgCard,
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <Label>{card.label}</Label>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{
                        color: card.color,
                        fontFamily: T.mono,
                        fontSize: 18,
                        fontWeight: 700,
                      }}>
                        <AnimatedNumber value={card.value} decimals={card.decimals} isHex={card.isHex} />
                        <span style={{ fontSize: 11, color: T.textMut }}>{card.suffix}</span>
                      </span>
                      <motion.span
                        key={trend}
                        initial={{ y: -4, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={SPRINGS.telemetryNum}
                        style={{ color: trendColor, fontSize: 14, fontWeight: 700 }}
                      >
                        {trend}
                      </motion.span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─────────────────────────────────────────────
// SECTION 3 — PUBLISH TABS
// ─────────────────────────────────────────────

// Vehicle Telemetry Tab
function VehicleTelemetryTab({ state, dispatch, onPublish }) {
  const [telType, setTelType] = useState("fuelLevel");
  const [value, setValue] = useState("64");
  const [appState, setAppState] = useState("customer");
  const [esimState, setEsimState] = useState("normal_sim");
  const [opState, setOpState] = useState("normal");
  const [interval, setIntervalVal] = useState("60");
  const [autoRepeat, setAutoRepeat] = useState(false);
  const autoRef = useRef(null);

  const telTypeIdentifiers = {
    fuelLevel: 854,
    engineSpeed: 998,
    engineWaterTemp: 994,
    batteryVoltage: 1132,
    odometer: 1888
  };

  const telTypes = [
    { value: "fuelLevel", label: "Fuel Level (identifier:854)", unit: "%" },
    { value: "engineSpeed", label: "Engine Speed (identifier:998)", unit: "RPM" },
    { value: "engineWaterTemp", label: "Engine Water Temp (identifier:994)", unit: "°C" },
    { value: "batteryVoltage", label: "Battery Voltage (identifier:1132)", unit: "V" },
    { value: "odometer", label: "Odometer (identifier:1888)", unit: "km" },
  ];

  const currentUnit = telTypes.find(t => t.value === telType)?.unit || "";

  const handlePublish = useCallback(() => {
    const numVal = parseFloat(value);
    const ts = makeTimestamp();
    const mockPayload = {
      messageId: state.config.messageId,
      eTboxApplicationState: appState,
      tboxEsimState: esimState,
      tboxOperatingState: opState,
      version: state.config.protocolVersion,
      timeStamp: ts,
      canDataPayload: {
        canData: {
          canDataPacket: [{
            identifier: telTypeIdentifiers[telType] || 100,
            dlc: 8,
            cData: [{ pdu: "0x" + numVal.toString(16).padStart(16, "0"), timestamp: ts }],
          }],
        },
      },
    };

    dispatch({ type: "SET_TELEMETRY", key: telType, value: numVal });
    onPublish({
      direction: "PUB",
      messageType: "vehicleTelemetry",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/vehicleTelemetry`,
      status: "SUCCESS",
      payloadBytes: JSON.stringify(mockPayload).length,
      payloadJson: mockPayload,
      hexPayload: mockHex("vehicleTelemetry", mockPayload),
    });
  }, [state.config, value, telType, appState, esimState, opState, onPublish, dispatch]);

  useEffect(() => {
    if (autoRepeat) {
      autoRef.current = setInterval(handlePublish, parseInt(interval) * 1000 || 60000);
    }
    return () => clearInterval(autoRef.current);
  }, [autoRepeat, interval, handlePublish]);

  return (
    <div>
      <Label>Telemetry Type</Label>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 14,
          overflowX: "auto",
          paddingBottom: 8,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {telTypes.map(t => {
          const isActive = telType === t.value;
          return (
            <motion.button
              key={t.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTelType(t.value)}
              style={{
                padding: "6px 12px",
                whiteSpace: "nowrap",
                borderRadius: 20,
                fontSize: 11,
                fontFamily: T.mono,
                fontWeight: 700,
                cursor: "pointer",
                background: isActive ? `${T.accent}22` : T.bgPrimary,
                border: `1px solid ${isActive ? T.accent : T.border}`,
                color: isActive ? T.accent : T.textMut,
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              {t.label}
            </motion.button>
          );
        })}
      </div>
      <div style={{ marginBottom: 10 }}>
        <Label>Value ({currentUnit})</Label>
        <input
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          style={{
            background: T.bgPrimary, border: `1px solid ${T.border}`, color: T.textPri,
            padding: "6px 10px", borderRadius: 6, fontFamily: T.mono, fontSize: 12,
            width: "100%", boxSizing: "border-box", outline: "none",
          }}
        />
      </div>
      <Field label="App State" value={appState} onChange={setAppState} isSelect options={[
        "customer", "provisioned", "authorized_customer", "provisioned_authorized"
      ].map(v => ({ value: v, label: v }))} />
      <Field label="eSIM State" value={esimState} onChange={setEsimState} isSelect options={[
        "normal_sim", "no_sim", "roaming_sim"
      ].map(v => ({ value: v, label: v }))} />
      <Field label="Operating State" value={opState} onChange={setOpState} isSelect options={[
        "normal", "sleep", "full_sleep", "boot"
      ].map(v => ({ value: v, label: v }))} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Interval (sec)" value={interval} onChange={setIntervalVal} type="number" />
        </div>
        <div style={{ flex: 1, marginTop: 14 }}>
          <PressButton
            onClick={() => setAutoRepeat(a => !a)}
            color={autoRepeat ? T.error : T.sub}
            style={{ width: "100%" }}
          >
            {autoRepeat ? "⏹ Stop" : "⟳ Auto"}
          </PressButton>
        </div>
      </div>
      <PressButton onClick={handlePublish} color={T.pub} style={{ width: "100%" }}>
        ↑ Publish Vehicle Telemetry
      </PressButton>
    </div>
  );
}

// Location Telemetry Tab (with mini-map)
function LocationTelemetryTab({ state, dispatch, onPublish }) {
  const [lat, setLat] = useState("13.084534");
  const [lng, setLng] = useState("80.270718");
  const [alt, setAlt] = useState("20.0");
  const [course, setCourse] = useState("180.0");
  const [sig, setSig] = useState("97.0");
  const [fixed, setFixed] = useState("1");
  const [speed, setSpeed] = useState("25");
  const [strength, setStrength] = useState("30");

  // Map pin position — normalized 0-1 within bounds
  const pinX = useSpring((parseFloat(lng) + 180) / 360, SPRINGS.gpsPin);
  const pinY = useSpring((90 - parseFloat(lat)) / 180, SPRINGS.gpsPin);

  useEffect(() => {
    const lngVal = parseFloat(lng);
    const latVal = parseFloat(lat);
    if (!isNaN(lngVal)) pinX.set(Math.max(0, Math.min(1, (lngVal + 180) / 360)));
    if (!isNaN(latVal)) pinY.set(Math.max(0, Math.min(1, (90 - latVal) / 180)));
  }, [lat, lng]);

  const handlePublish = () => {
    const payload = {
      messageId: state.config.messageId,
      eTboxApplicationState: "customer",
      tboxEsimState: "normal_sim",
      version: state.config.protocolVersion,
      signalStrength: parseInt(strength),
      timeStamp: makeTimestamp(),
      locationPayload: {
        locationData: [{
          timeStamp: makeTimestamp(),
          gpsLat: parseFloat(lat),
          gpsLong: parseFloat(lng),
          gpsAlt: parseFloat(alt),
          gpsCourseAngle: parseFloat(course),
          gpsSignalQuality: parseFloat(sig),
          gpsFixedStatus: parseInt(fixed),
          speed: parseFloat(speed),
        }],
      },
    };
    dispatch({
      type: "SET_TELEMETRY_BULK", payload: {
        gpsLat: parseFloat(lat), gpsLong: parseFloat(lng),
        gpsAlt: parseFloat(alt), speed: parseFloat(speed),
      }
    });
    onPublish({
      direction: "PUB",
      messageType: "locationTelemetry",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/locationTelemetry`,
      status: "SUCCESS",
      payloadBytes: JSON.stringify(payload).length,
      payloadJson: payload,
      hexPayload: mockHex("locationTelemetry", payload),
    });
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="GPS Latitude" value={lat} onChange={setLat} type="number" />
        <Field label="GPS Longitude" value={lng} onChange={setLng} type="number" />
        <Field label="Altitude (m)" value={alt} onChange={setAlt} type="number" />
        <Field label="Course Angle (°)" value={course} onChange={setCourse} type="number" />
        <Field label="Signal Quality" value={sig} onChange={setSig} type="number" />
        <Field label="GPS Fixed" value={fixed} onChange={setFixed} isSelect options={[{ value: "1", label: "Fixed (1)" }, { value: "0", label: "No Fix (0)" }]} />
        <Field label="Speed (km/h)" value={speed} onChange={setSpeed} type="number" />
        <Field label="Signal Strength" value={strength} onChange={setStrength} type="number" />
      </div>

      {/* Mini Map */}
      <div style={{
        width: "100%", height: 180,
        background: "linear-gradient(135deg, #0d1117 0%, #111827 50%, #0a1628 100%)",
        borderRadius: 8,
        border: `1px solid ${T.border}`,
        position: "relative",
        overflow: "hidden",
        marginBottom: 12,
      }}>
        {/* Grid lines */}
        {[...Array(6)].map((_, i) => (
          <div key={`h${i}`} style={{ position: "absolute", top: `${(i + 1) * 14.28}%`, left: 0, right: 0, height: 1, background: `${T.border}55` }} />
        ))}
        {[...Array(8)].map((_, i) => (
          <div key={`v${i}`} style={{ position: "absolute", left: `${(i + 1) * 11.11}%`, top: 0, bottom: 0, width: 1, background: `${T.border}55` }} />
        ))}
        {/* Map label */}
        <div style={{
          position: "absolute", top: 8, left: 10,
          fontSize: 9, color: T.textMut, fontFamily: T.mono, letterSpacing: "0.1em"
        }}>GPS MAP PREVIEW</div>
        {/* Coordinates */}
        <div style={{
          position: "absolute", bottom: 8, left: 10,
          fontSize: 9, color: T.sub, fontFamily: T.mono,
        }}>{parseFloat(lat).toFixed(4)}°, {parseFloat(lng).toFixed(4)}°</div>
        {/* Animated Pin */}
        <motion.div
          style={{
            position: "absolute",
            x: useTransform(pinX, [0, 1], ["0%", "calc(100% - 12px)"]),
            y: useTransform(pinY, [0, 1], ["0%", "calc(100% - 20px)"]),
            width: 12,
            height: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{
            width: 12, height: 12,
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
            background: T.accent,
            boxShadow: `0 0 10px ${T.accent}99`,
          }} />
          <div style={{ width: 2, height: 8, background: T.accent, opacity: 0.6 }} />
        </motion.div>
      </div>

      <PressButton onClick={handlePublish} color={T.pub} style={{ width: "100%" }}>
        ↑ Publish Location Telemetry
      </PressButton>
    </div>
  );
}

// Events Tab
function EventsTab({ state, onPublish }) {
  const [eventType, setEventType] = useState("IgnitionStatus:START");
  const [ignState, setIgnState] = useState("START");
  const [appState, setAppState] = useState("customer");
  const [esimState, setEsimState] = useState("normal_sim");

  const eventTypes = [
    "IgnitionStatus:START", "IgnitionStatus:STOP", "RemoteBlinkerOn", "RemoteBlinkerOff",
    "RemoteDoorLock", "RemoteDoorUnlock", "RemoteHonkStatus", "VehicleMobilizationStatus",
    "TBoxInFullSleep", "VehicleMobilization",
  ];

  const handlePublish = () => {
    const payload = {
      messageId: state.config.messageId,
      eTboxApplicationState: appState,
      tboxEsimState: esimState,
      version: state.config.protocolVersion,
      eventPayload: {
        EventsData: [{
          timeStamp: makeTimestamp(),
          IgnitionStatus: { IgnitionState: ignState },
          eventType: eventType,
        }],
      },
    };
    onPublish({
      direction: "PUB",
      messageType: "events",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/events`,
      status: "SUCCESS",
      payloadBytes: JSON.stringify(payload).length,
      payloadJson: payload,
      hexPayload: mockHex("events", payload),
    });
  };

  return (
    <div>
      <Field label="Event Type" value={eventType} onChange={setEventType} isSelect options={eventTypes.map(v => ({ value: v, label: v }))} />
      <Field label="Ignition State" value={ignState} onChange={setIgnState} isSelect options={["START", "STOP", "ACC"].map(v => ({ value: v, label: v }))} />
      <Field label="App State" value={appState} onChange={setAppState} isSelect options={["customer", "provisioned", "authorized_customer", "provisioned_authorized"].map(v => ({ value: v, label: v }))} />
      <Field label="eSIM State" value={esimState} onChange={setEsimState} isSelect options={["normal_sim", "no_sim", "roaming_sim"].map(v => ({ value: v, label: v }))} />
      <PressButton onClick={handlePublish} color={T.pub} style={{ width: "100%" }}>
        ↑ Publish Event
      </PressButton>
    </div>
  );
}

// Alerts Tab
function AlertsTab({ state, onPublish }) {
  const [alertType, setAlertType] = useState("SpeedAlert");
  const [alertState, setAlertState] = useState("alsAlert");
  const [alertId, setAlertId] = useState(state.config.messageId);
  const [isLive, setIsLive] = useState(true);
  const [vSpeed, setVSpeed] = useState("120.5");
  const [lat, setLat] = useState("12.971598");
  const [lng, setLng] = useState("77.594566");

  const alertTypes = [
    "SpeedAlert", "HarshAcceleration", "HarshBraking", "SharpTurns", "EngineIdling",
    "ParkingDisturbance", "TowAway", "DongleStatus", "RemoteImmobilization", "RemoteMobilization",
  ];

  const handlePublish = () => {
    const alertObj = {
      messageId: state.config.messageId,
      correlationId: state.config.correlationId,
      eTboxApplicationState: "customer",
      tboxEsimState: "normal_sim",
      version: state.config.protocolVersion,
      timeStamp: makeTimestamp(),
      alertPayload: {
        AlertsData: [{
          timeStamp: makeTimestamp(),
          alertState: alertState,
          alertType: alertType,
          alertID: alertId,
          isLive: isLive,
          ...(alertType === "SpeedAlert" ? {
            SpeedAlert: {
              vehicleSpeed: parseFloat(vSpeed),
              gpsPayload: { gpsLat: parseFloat(lat), gpsLong: parseFloat(lng), gpsFixedStatus: 1 },
            },
          } : {}),
        }],
      },
    };
    onPublish({
      direction: "PUB",
      messageType: "alerts",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/alerts`,
      status: "SUCCESS",
      payloadBytes: JSON.stringify(alertObj).length,
      payloadJson: alertObj,
      hexPayload: mockHex("alerts", alertObj),
    });
  };

  return (
    <div>
      <Field label="Alert Type" value={alertType} onChange={setAlertType} isSelect options={alertTypes.map(v => ({ value: v, label: v }))} />
      <Field label="Alert State" value={alertState} onChange={setAlertState} isSelect options={["alsAlert", "alsNormal", "alsUnknown"].map(v => ({ value: v, label: v }))} />
      <Field label="Alert ID" value={alertId} onChange={setAlertId} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <Label>Is Live</Label>
        <input type="checkbox" checked={isLive} onChange={e => setIsLive(e.target.checked)} style={{ accentColor: T.accent }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="GPS Latitude" value={lat} onChange={setLat} type="number" />
        <Field label="GPS Longitude" value={lng} onChange={setLng} type="number" />
      </div>
      {alertType === "SpeedAlert" && (
        <Field label="Vehicle Speed (km/h)" value={vSpeed} onChange={setVSpeed} type="number" />
      )}
      <PressButton onClick={handlePublish} color={T.error} style={{ width: "100%" }}>
        ↑ Publish Alert
      </PressButton>
    </div>
  );
}

// Trips Tab
function TripsTab({ state, onPublish }) {
  const [subTab, setSubTab] = useState("tripStart");
  const [tripId] = useState(getTripId());
  const [startDate] = useState(new Date().toISOString().slice(0, 10));
  const [lat, setLat] = useState("13.084534");
  const [lng, setLng] = useState("80.270718");
  const [alt, setAlt] = useState("20.0");
  const [course, setCourse] = useState("180.0");
  const [sig, setSig] = useState("0.97");
  const [distSoFar, setDistSoFar] = useState("0");
  const [curSpeed, setCurSpeed] = useState("0");
  const [endLat, setEndLat] = useState("13.090000");
  const [endLng, setEndLng] = useState("80.280000");
  const [totalDist, setTotalDist] = useState("10.5");
  const [duration, setDuration] = useState("25");

  const subTabs = ["tripStart", "tripCurrent", "tripEnd"];

  const handlePublish = () => {
    let payload = {
      messageId: state.config.messageId,
      tboxOperatingState: "normal",
      eTboxApplicationState: "customer",
      tboxEsimState: "normal_sim",
      version: "2.0.0",
      timeStamp: makeTimestamp(),
    };

    if (subTab === "tripStart") {
      payload.tripPayload = {
        tripstartpayload: {
          tripstartdata: [{
            tripId: parseInt(tripId),
            startTime: makeTimestamp(),
            startDate: parseInt(startDate.replace(/-/g, "")),
            gnssinfostart: {
              startlocationData: {
                gpsLat: parseFloat(lat),
                gpsLong: parseFloat(lng),
                gpsAlt: parseFloat(alt),
                gpsAccLat: 5.0, gpsAccLon: 5.0, gpsAccAlt: 10.0,
                gpsCourseAngle: parseFloat(course),
                gpsSignalQuality: parseFloat(sig),
              }
            },
            gpsFixedStatus: 1
          }]
        }
      };
    } else if (subTab === "tripCurrent") {
      payload.tripPayload = {
        tripinprogresspayload: {
          tripinprogressdata: [{
            tripId: parseInt(tripId),
            currenttime: makeTimestamp(),
            currentdate: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
            gnssinfocurrent: {
              currentlocationData: {
                gpsLat: parseFloat(state.telemetry.gpsLat),
                gpsLong: parseFloat(state.telemetry.gpsLong),
                gpsAlt: 21.5, gpsAccLat: 5.0, gpsAccLon: 5.0, gpsAccAlt: 10.0,
                gpsCourseAngle: 337.126, gpsSignalQuality: 0.9736
              }
            },
            tripDistance: parseFloat(distSoFar),
            tripTime: 5,
            tripType: parseFloat(curSpeed) > 5 ? "Active" : "Idle",
            hardBrakeCnt: 0, harshAccCnt: 0, highSpeedCnt: 0, harshTurnCnt: 0,
            avgSpeed: 45.0, topSpeed: 60.0
          }]
        }
      };
    } else {
      payload.tripPayload = {
        tripendedpayload: {
          tripendeddata: [{
            tripId: parseInt(tripId),
            currentTime: makeTimestamp(),
            currentDate: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ""), 10),
            gnssinfocurrent: {
              currentlocationData: {
                gpsLat: parseFloat(endLat), gpsLong: parseFloat(endLng),
                gpsAlt: 21.5, gpsAccLat: 5.0, gpsAccLon: 5.0, gpsAccAlt: 10.0,
                gpsCourseAngle: 337.126, gpsSignalQuality: 0.9736, gpsFixedStatus: 1
              }
            },
            tripDistance: parseFloat(totalDist),
            drivingScore: 85.0, tripTime: parseInt(duration),
            idleDuration: 5, idlingCnt: 1, hardBrakeCnt: 0, harshTurnCnt: 0,
            avgSpeed: 42.0, topSpeed: 55.0
          }]
        }
      };
    }

    onPublish({
      direction: "PUB",
      messageType: subTab,
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/${subTab}`,
      status: "SUCCESS",
      payloadBytes: JSON.stringify(payload).length,
      payloadJson: payload,
      hexPayload: mockHex(subTab, payload),
    });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {subTabs.map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            style={{
              flex: 1, padding: "6px 0",
              background: subTab === t ? `${T.accent}22` : "transparent",
              border: `1px solid ${subTab === t ? T.accent : T.border}`,
              color: subTab === t ? T.accent : T.textMut,
              borderRadius: 6, fontFamily: T.mono, fontSize: 11,
              cursor: "pointer", fontWeight: subTab === t ? 700 : 400,
            }}
          >
            {t === "tripStart" ? "Start" : t === "tripCurrent" ? "Current" : "End"}
          </button>
        ))}
      </div>

      {subTab === "tripStart" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Trip ID" value={tripId} onChange={() => { }} disabled />
            <Field label="Start Date" value={startDate} onChange={() => { }} disabled />
            <Field label="GPS Lat" value={lat} onChange={setLat} type="number" />
            <Field label="GPS Long" value={lng} onChange={setLng} type="number" />
            <Field label="Altitude" value={alt} onChange={setAlt} type="number" />
            <Field label="Course Angle" value={course} onChange={setCourse} type="number" />
            <Field label="Signal Quality" value={sig} onChange={setSig} type="number" />
          </div>
        </div>
      )}
      {subTab === "tripCurrent" && (
        <div>
          <Field label="Trip ID" value={tripId} onChange={() => { }} disabled />
          <Field label="Distance So Far (km)" value={distSoFar} onChange={setDistSoFar} type="number" />
          <Field label="Current Speed (km/h)" value={curSpeed} onChange={setCurSpeed} type="number" />
        </div>
      )}
      {subTab === "tripEnd" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Trip ID" value={tripId} onChange={() => { }} disabled />
            <Field label="End GPS Lat" value={endLat} onChange={setEndLat} type="number" />
            <Field label="End GPS Long" value={endLng} onChange={setEndLng} type="number" />
            <Field label="Total Distance (km)" value={totalDist} onChange={setTotalDist} type="number" />
            <Field label="Duration (min)" value={duration} onChange={setDuration} type="number" />
          </div>
        </div>
      )}

      <PressButton onClick={handlePublish} color={T.sub} style={{ width: "100%", marginTop: 8 }}>
        ↑ Publish {subTab === "tripStart" ? "Trip Start" : subTab === "tripCurrent" ? "Trip Current" : "Trip End"}
      </PressButton>
    </div>
  );
}

// Device Join Tab
function DeviceJoinTab({ state, dispatch, onPublish }) {
  const [nadSW, setNadSW] = useState("ND0.00.11");
  const [mcuSW, setMcuSW] = useState("MD0.00.03");
  const [opState, setOpState] = useState("NORMAL");
  const [appState, setAppState] = useState("PROVISIONED");
  const [esimState, setEsimState] = useState("NORMAL_SIM");

  const handleDeviceJoin = () => {
    const payload = {
      vehicleId: state.config.vin,
      tboxSerialNum: state.config.tboxSerial,
      imeiNo: state.config.imei,
      protocolVersion: state.config.protocolVersion,
      tboxOperatingState: opState,
      tboxApplicationState: appState,
      tboxeSimState: esimState,
      NAD_SW_Version: nadSW,
      MCU_SW_Version: mcuSW,
    };
    onPublish({
      direction: "PUB",
      messageType: "deviceJoined",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/deviceJoined`,
      status: "SUCCESS",
      payloadBytes: JSON.stringify(payload).length,
      payloadJson: payload,
      hexPayload: mockHex("deviceJoined", payload),
    });
    // Simulate subscription
    setTimeout(() => {
      dispatch({
        type: "ADD_LOG",
        entry: {
          id: uuidv4(), timestamp: new Date().toISOString(),
          direction: "SUB", messageType: "deviceJoinedRsp",
          topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/deviceJoinedRsp`,
          status: "SUCCESS", payloadBytes: 48,
          payloadJson: { status: "ok", vin: state.config.vin },
          hexPayload: "0a24" + "6f6b", expanded: false,
        },
      });
      dispatch({ type: "INCREMENT_RECEIVE" });
    }, 1200);
  };

  return (
    <div>
      <div style={{ marginBottom: 12, padding: 10, background: T.bgPrimary, borderRadius: 6, border: `1px solid ${T.border}` }}>
        <Label>Device Identity (Read-Only)</Label>
        {[
          ["VIN", state.config.vin],
          ["IMEI", state.config.imei],
          ["TBOX Serial", state.config.tboxSerial],
          ["Client ID", state.config.clientId],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{k}</span>
            <span style={{ fontSize: 11, color: T.textPri, fontFamily: T.mono }}>{v}</span>
          </div>
        ))}
      </div>
      <Field label="NAD SW Version" value={nadSW} onChange={setNadSW} />
      <Field label="MCU SW Version" value={mcuSW} onChange={setMcuSW} />
      <Field label="Operating State" value={opState} onChange={setOpState} isSelect options={["NORMAL", "SLEEP", "FULL_SLEEP", "BOOT"].map(v => ({ value: v, label: v }))} />
      <Field label="App State" value={appState} onChange={setAppState} isSelect options={["PROVISIONED", "CUSTOMER", "AUTHORIZED_CUSTOMER", "PROVISIONED_AUTHORIZED"].map(v => ({ value: v, label: v }))} />
      <Field label="eSIM State" value={esimState} onChange={setEsimState} isSelect options={["NORMAL_SIM", "NO_SIM", "ROAMING_SIM"].map(v => ({ value: v, label: v }))} />
      <PressButton onClick={handleDeviceJoin} color={T.accent} style={{ width: "100%" }}>
        ↑ Send Device Join + Subscribe
      </PressButton>
      <div style={{ marginTop: 8, fontSize: 10, color: T.textMut, fontFamily: T.mono }}>
        Subscribes: deviceJoinedRsp, command
      </div>
    </div>
  );
}

// FOTA Tab
function FotaTab({ state, dispatch, onPublish }) {
  const { fota, config } = state;
  const isProcessing = fota.isProcessing;

  const handleStop = () => {
    dispatch({ type: "UPDATE_FOTA", payload: { isProcessing: false, status: "IDLE", progress: 0 } });
  };

  return (
    <div>
      {isProcessing ? (
        <div style={{ padding: 12, borderRadius: 8, background: T.bgCard, border: `1px solid ${T.accent}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{fota.status.replace(/_/g, " ")}</span>
            <span style={{ fontSize: 12, fontFamily: T.mono }}>{Math.round(fota.progress)}%</span>
          </div>
          <div style={{ height: 6, background: T.bgPrimary, borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fota.progress}%` }}
              style={{ height: "100%", background: T.accent }}
            />
          </div>
          <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, marginBottom: 12 }}>
            JOB ID: {fota.correlationId}<br />
            STEP: {fota.currentStep}
          </div>
          <PressButton onClick={handleStop} color={T.error} style={{ width: "100%", fontSize: 11 }}>
            Abort Simulation
          </PressButton>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0", border: `2px dashed ${T.border}`, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: T.textMut, display: "block" }}>Waiting for FOTA Command...</span>
          <div style={{ marginTop: 8, fontSize: 10, color: T.textMut }}>
            Go to "Command Inbox" and simulate a FOTA Command to start.
          </div>
        </div>
      )}
    </div>
  );
}

// Diagnostics Tab
function DiagnosticsTab({ state, onPublish }) {
  const [logStatus, setLogStatus] = useState("succeeded");
  const handlePublish = () => {
    const payload = {
      messageId: state.config.messageId,
      correlationId: state.config.correlationId,
      version: "2.0.0",
      timeStamp: makeTimestamp(),
      deviceFetchLogsResponsePayload: {
        fetchLogsResponse: {
          returnCode: logStatus,
          logFileUrl: "http://fca-india-logs.s3.amazonaws.com/log_001.zip"
        }
      }
    };
    onPublish({
      direction: "PUB", messageType: "fetchDeviceLogResponse",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/fetchDeviceLogResponse`,
      status: "SUCCESS", payloadBytes: JSON.stringify(payload).length,
      payloadJson: payload, hexPayload: mockHex("diag", payload),
    });
  };
  return (
    <div>
      <Field label="Log Upload Status" value={logStatus} onChange={setLogStatus} isSelect options={["succeeded", "failed", "in_progress"].map(v => ({ value: v, label: v }))} />
      <PressButton onClick={handlePublish} color={T.accent} style={{ width: "100%", marginTop: 8 }}>↑ Publish Log Response</PressButton>
    </div>
  );
}

// Publish Panel — Tabbed
function PublishPanel({ state, dispatch, onPublish }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const tabs = [
    { key: "vehicleTelemetry", label: "Vehicle Tel" },
    { key: "locationTelemetry", label: "Location" },
    { key: "events", label: "Events" },
    { key: "alerts", label: "Alerts" },
    { key: "trips", label: "Trips" },
    { key: "deviceJoin", label: "Device Join" },
    { key: "fota", label: "FOTA Simulator" },
    { key: "diagnostics", label: "Diagnostics" },
  ];

  const active = state.activePublishTab;

  const innerContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1, marginRight: 16 }}>
          <SectionHeader style={{ marginBottom: 0 }}>↑ Publish MQTT Messages</SectionHeader>
        </div>
        <motion.span
          onClick={() => setIsFullScreen(prev => !prev)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ cursor: "pointer", color: T.accent, fontSize: 16, padding: "4px", marginTop: -6 }}
          title={isFullScreen ? "Collapse" : "Expand to Fullscreen"}
        >
          {isFullScreen ? "⤡" : "⤢"}
        </motion.span>
      </div>

      {/* Tab Bar — horizontally scrollable, no wrap */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 14,
          borderBottom: `1px solid ${T.border}`,
          paddingBottom: 10,
          paddingRight: 20, /* Space for the scroll end */
          overflowX: "auto",
          flexShrink: 0,
          scrollbarWidth: "thin",
          webkitOverflowScrolling: "touch",
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => dispatch({ type: "SET_ACTIVE_TAB", tab: tab.key })}
            style={{
              padding: "7px 14px",
              background: active === tab.key ? `${T.accent}22` : "transparent",
              border: `1px solid ${active === tab.key ? T.accent : T.border}`,
              color: active === tab.key ? T.accent : T.textMut,
              borderRadius: 6, fontFamily: T.mono, fontSize: 12,
              cursor: "pointer", fontWeight: active === tab.key ? 700 : 500,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRINGS.logEntry}
          >
            {active === "vehicleTelemetry" && <VehicleTelemetryTab state={state} dispatch={dispatch} onPublish={onPublish} />}
            {active === "locationTelemetry" && <LocationTelemetryTab state={state} dispatch={dispatch} onPublish={onPublish} />}
            {active === "events" && <EventsTab state={state} onPublish={onPublish} />}
            {active === "alerts" && <AlertsTab state={state} onPublish={onPublish} />}
            {active === "trips" && <TripsTab state={state} onPublish={onPublish} />}
            {active === "deviceJoin" && <DeviceJoinTab state={state} dispatch={dispatch} onPublish={onPublish} />}
            {active === "fota" && <FotaTab state={state} dispatch={dispatch} onPublish={onPublish} />}
            {active === "diagnostics" && <DiagnosticsTab state={state} dispatch={dispatch} onPublish={onPublish} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Placeholder to reserve space when in full-screen */}
      {isFullScreen && <div style={{ height: "100%", minHeight: 200 }} />}
      
      {/* Backdrop */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9998, backdropFilter: "blur(4px)" }} 
            onClick={() => setIsFullScreen(false)}
          />
        )}
      </AnimatePresence>

      {/* Actual Panel */}
      <div
        style={isFullScreen ? {
          position: "fixed",
          top: 40, left: 40, right: 40, bottom: 40,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column"
        } : {}}
      >
        <Card style={isFullScreen ? { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", margin: 0, boxShadow: "0 10px 40px rgba(0,0,0,0.4)" } : {}}>
          {innerContent}
        </Card>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// SECTION 4 — COMMAND INBOX
// ─────────────────────────────────────────────
function CommandInbox({ state, dispatch, onPublish }) {
  const commandTypes = [
    "Remote Door Lock",
    "Remote Door Unlock",
    "Remote Blinker ON",
    "Remote Blinker OFF",
    "Remote Honk",
    "FOTA Command",
    "OTA Command",
    "Fetch Device Log",
  ];

  const handleSimulate = (type) => {
    const fakeCorrelationId = uuidv4();
    const cmd = {
      id: uuidv4(),
      commandType: type,
      correlationId: fakeCorrelationId,
      receivedAt: new Date().toISOString(),
      responseStatus: null,
      hexPayload: `0a24${fakeCorrelationId.replace(/-/g, "")}1201011a04...`,
    };
    dispatch({ type: "ADD_COMMAND", cmd });
    dispatch({ type: "INCREMENT_RECEIVE" });
    dispatch({
      type: "ADD_LOG",
      entry: {
        id: uuidv4(), timestamp: cmd.receivedAt,
        direction: "SUB", messageType: "command",
        topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/command`,
        status: "SUCCESS", payloadBytes: 128,
        payloadJson: {
          commandType: type,
          correlationId: fakeCorrelationId,
          fotacommandPayload: type === "FOTA Command" ? {
            firmwareDownloadCommandPayload: {
              firmwareDownloadArtifacts: [
                { fileType: 1, releaseVersion: "MD0.02.00", downloadUrl: "https://fota.stla.com/MD0_02_00.zip", checksum: "sha256:abc..." }
              ]
            }
          } : undefined
        },
        hexPayload: cmd.hexPayload, expanded: false,
      },
    });

    if (type === "FOTA Command") {
      executeFotaCycle(fakeCorrelationId);
    }
  };

  const handleSendResponse = (cmd, responseStatus) => {
    const resp = {
      messageId: state.config.messageId,
      correlationId: cmd.correlationId,
      subtype: cmd.commandType.replace(/\s+/g, "") + "Response",
      tboxOperatingState: "normal",
      returnCode: responseStatus === "success" ? "succeeded" : "failed",
      commandStatus: responseStatus,
      version: state.config.protocolVersion,
      timeStamp: makeTimestamp(),
    };
    dispatch({ type: "UPDATE_COMMAND", id: cmd.id, payload: { responseStatus } });
    onPublish({
      direction: "PUB",
      messageType: "commandResponse",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/commandResponse`,
      status: responseStatus === "success" ? "SUCCESS" : "FAILED",
      payloadBytes: JSON.stringify(resp).length,
      payloadJson: resp,
      hexPayload: mockHex("commandResponse", resp),
    });
  };

  return (
    <Card>
      <SectionHeader>↓ Command Inbox</SectionHeader>
      {/* Simulate row */}
      <div style={{ marginBottom: 14 }}>
        <Label>Simulate Incoming Command</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {commandTypes.map(type => (
            <PressButton key={type} onClick={() => handleSimulate(type)} color={T.sub} style={{ fontSize: 10, padding: "5px 8px", textAlign: "left" }}>
              ↓ {type}
            </PressButton>
          ))}
        </div>
      </div>

      {/* Inbox entries */}
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        <AnimatePresence>
          {state.commandInbox.length === 0 && (
            <div style={{ color: T.textMut, fontSize: 11, fontFamily: T.mono, textAlign: "center", padding: 20 }}>
              No commands received yet
            </div>
          )}
          {state.commandInbox.map((cmd) => (
            <motion.div
              key={cmd.id}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              transition={SPRINGS.commandSlide}
              style={{
                background: T.bgPrimary,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <span style={{ color: T.sub, fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>
                    {cmd.commandType}
                  </span>
                  <div style={{ color: T.textMut, fontSize: 10, fontFamily: T.mono, marginTop: 3 }}>
                    correlationId: {cmd.correlationId.slice(0, 16)}…
                  </div>
                  <div style={{ color: T.textMut, fontSize: 10, fontFamily: T.mono }}>
                    {formatTimestamp(cmd.receivedAt)}
                  </div>
                </div>
                {cmd.responseStatus && (
                  <Badge
                    color={cmd.responseStatus === "success" ? T.pub : cmd.responseStatus === "failure" ? T.error : T.accent}
                  >
                    {cmd.responseStatus.toUpperCase()}
                  </Badge>
                )}
              </div>

              {!cmd.responseStatus && (
                <div>
                  <Label>Send Response</Label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <PressButton onClick={() => handleSendResponse(cmd, "success")} color={T.pub} style={{ flex: 1, fontSize: 11 }}>✓ success</PressButton>
                    <PressButton onClick={() => handleSendResponse(cmd, "failure")} color={T.error} style={{ flex: 1, fontSize: 11 }}>✗ failure</PressButton>
                    <PressButton onClick={() => handleSendResponse(cmd, "pending")} color={T.accent} style={{ flex: 1, fontSize: 11 }}>⏳ pending</PressButton>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// SECTION 6 — MESSAGE LOG
// ─────────────────────────────────────────────
function LogEntry({ entry, onToggle }) {
  const dirColor = entry.direction === "PUB" ? T.pub : T.sub;
  const stColor = entry.status === "SUCCESS" ? T.pub : entry.status === "FAILED" ? T.error : T.accent;

  return (
    <motion.div
      layout
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0, scale: 0.9 }}
      transition={SPRINGS.logEntry}
      onClick={onToggle}
      style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        padding: "8px 10px",
        marginBottom: 4,
        cursor: "pointer",
        borderLeft: `3px solid ${dirColor}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>
          {formatTimestamp(entry.timestamp)}
        </span>
        <Badge color={dirColor}>{entry.direction === "PUB" ? "↑ PUB" : "↓ SUB"}</Badge>
        <Badge color={T.accent}>{entry.messageType}</Badge>
        <Badge color={entry.protocol === "5.0" ? T.pub : T.accent} bg={`${entry.protocol === "5.0" ? T.pub : T.accent}11`}>
          {entry.protocol === "5.0" ? "PROTOBUF" : "JSON"}
        </Badge>
        <Badge color={stColor}>{entry.status}</Badge>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.topic}
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>
          {entry.binarySize ? `${entry.binarySize}B (BIN)` : `${entry.payloadBytes}B`}
        </span>
      </div>

      <AnimatePresence>
        {entry.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRINGS.panelCollapse}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: 8 }}>
              <Label>JSON Payload (Decoded Structure)</Label>
              <pre style={{
                background: T.bgPrimary, borderRadius: 4, padding: 8,
                fontSize: 10, fontFamily: T.mono, color: T.textPri,
                overflowX: "auto", maxHeight: 160, overflowY: "auto",
                border: `1px solid ${T.border}`,
              }}>
                {JSON.stringify(entry.payloadJson, null, 2)}
              </pre>

              {entry.payloadHex && (
                <>
                  <Label>BINARY HEX (Jeep Proto 5.0)</Label>
                  <div style={{
                    background: `${T.pub}08`, borderRadius: 4, padding: 10,
                    fontSize: 10, fontFamily: T.mono, color: T.pub,
                    wordBreak: "break-all", border: `1px solid ${T.pub}33`,
                    lineHeight: 1.4,
                  }}>
                    {entry.payloadHex.match(/.{1,2}/g).join(" ")}
                  </div>
                </>
              )}

              {!entry.payloadHex && entry.hexPayload && (
                <>
                  <Label>MOCK HEX (Legacy JSON String)</Label>
                  <div style={{
                    background: T.bgPrimary, borderRadius: 4, padding: 8,
                    fontSize: 10, fontFamily: T.mono, color: T.textMut,
                    wordBreak: "break-all", border: `1px solid ${T.border}`,
                  }}>
                    {entry.hexPayload}
                  </div>
                </>
              )}

              {entry.error && (
                <div style={{ color: T.error, fontSize: 10, fontFamily: T.mono, marginTop: 8, padding: 8, background: `${T.error}11`, borderRadius: 4, border: `1px solid ${T.error}33` }}>
                  ⚠ {entry.error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MessageLog({ state, dispatch }) {
  const [open, setOpen] = useState(true);
  const [filterDir, setFilterDir] = useState("ALL");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [clearing, setClearing] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.log.length, open]);

  const filtered = state.log.filter(e => {
    if (filterDir !== "ALL" && e.direction !== filterDir) return false;
    if (filterType && !e.messageType.toLowerCase().includes(filterType.toLowerCase())) return false;
    if (filterStatus !== "ALL" && e.status !== filterStatus) return false;
    return true;
  });

  const handleClear = () => {
    setClearing(true);
    setTimeout(() => { dispatch({ type: "CLEAR_LOG" }); setClearing(false); }, 400);
  };

  const handleExport = () => {
    const data = JSON.stringify(state.log, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mqtt_log.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id) => {
    const updated = state.log.map(e => e.id === id ? { ...e, expanded: !e.expanded } : e);
    dispatch({ type: "CLEAR_LOG" });
    updated.forEach(e => dispatch({ type: "ADD_LOG", entry: e }));
  };

  const uniqueTypes = [...new Set(state.log.map(e => e.messageType))];

  return (
    <Card style={{ flex: open ? 1 : 'none', minHeight: open ? 280 : 'auto', display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: open ? 12 : 0, flexWrap: "wrap", gap: 8 }}>
        <div 
          style={{ display: "flex", alignItems: "center", cursor: "pointer", flex: 1, marginRight: 16 }}
          onClick={() => setOpen(o => !o)}
        >
          <div style={{ flex: 1 }}>
            <SectionHeader>≡ Message Log ({filtered.length})</SectionHeader>
          </div>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={SPRINGS.panelCollapse}
            style={{ color: T.accent, fontSize: 16, marginTop: -6, marginRight: 8 }}
          >▼</motion.span>
        </div>
        
        {open && (
          <div style={{ display: "flex", gap: 6 }}>
            <PressButton onClick={handleClear} color={T.error} style={{ fontSize: 11, padding: "4px 10px" }}>Clear</PressButton>
            <PressButton onClick={handleExport} color={T.sub} style={{ fontSize: 11, padding: "4px 10px" }}>Export JSON</PressButton>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRINGS.panelCollapse}
            style={{ overflow: "hidden", display: "flex", flexDirection: "column", flex: 1 }}
          >
            {/* Filters */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {["ALL", "PUB", "SUB"].map(v => (
                <button key={v} onClick={() => setFilterDir(v)}
                  style={{
                    padding: "4px 10px", borderRadius: 4, fontFamily: T.mono, fontSize: 10, cursor: "pointer",
                    background: filterDir === v ? `${T.accent}22` : "transparent",
                    border: `1px solid ${filterDir === v ? T.accent : T.border}`,
                    color: filterDir === v ? T.accent : T.textMut,
                  }}>{v}</button>
              ))}
              <input
                placeholder="filter type..."
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{
                  background: T.bgPrimary, border: `1px solid ${T.border}`, color: T.textPri,
                  padding: "4px 8px", borderRadius: 4, fontFamily: T.mono, fontSize: 10, outline: "none",
                }}
              />
              {["ALL", "SUCCESS", "FAILED", "PENDING"].map(v => (
                <button key={v} onClick={() => setFilterStatus(v)}
                  style={{
                    padding: "4px 8px", borderRadius: 4, fontFamily: T.mono, fontSize: 10, cursor: "pointer",
                    background: filterStatus === v ? `${T.accent}22` : "transparent",
                    border: `1px solid ${filterStatus === v ? T.accent : T.border}`,
                    color: filterStatus === v ? T.accent : T.textMut,
                  }}>{v}</button>
              ))}
            </div>

            <div style={{ maxHeight: 380, overflowY: "auto", flex: 1 }}>
              <AnimatePresence>
                {filtered.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color: T.textMut, fontSize: 11, fontFamily: T.mono, textAlign: "center", padding: 30 }}
                  >
                    No log entries
                  </motion.div>
                )}
                {filtered.map((entry) => (
                  <LogEntry
                    key={entry.id}
                    entry={entry}
                    onToggle={() => {
                      dispatch({ type: "CLEAR_LOG" });
                      const updated = state.log.map(e => e.id === entry.id ? { ...e, expanded: !e.expanded } : e);
                      updated.forEach(e => dispatch({ type: "ADD_LOG", entry: e }));
                    }}
                  />
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─────────────────────────────────────────────
// BONUS — AUTO DRIVE
// ─────────────────────────────────────────────
function AutoDriveButton({ state, dispatch, onPublish }) {
  const autoDriveRef = useRef(null);

  const startAutoDrive = useCallback(() => {
    dispatch({ type: "SET_AUTO_DRIVE", value: true });
    let lat = 13.084534, lng = 80.270718, speed = 60, fuel = 80, odo = 45230, batt = 12.6;
    autoDriveRef.current = setInterval(() => {
      lat += (Math.random() - 0.5) * 0.001;
      lng += (Math.random() - 0.5) * 0.001;
      speed = Math.max(0, Math.min(140, speed + (Math.random() - 0.5) * 10));
      fuel = Math.max(0, fuel - 0.1);
      odo += (speed / 3600) * 3; // 3 seconds driving distance
      batt = 12.0 + Math.random() * 1.5;
      const rpm = speed * 50 + Math.random() * 100;
      const temp = 80 + Math.random() * 20;

      dispatch({ type: "SET_TELEMETRY", key: "gpsLat", value: lat });
      dispatch({ type: "SET_TELEMETRY", key: "gpsLong", value: lng });
      dispatch({ type: "SET_TELEMETRY", key: "speed", value: Math.round(speed) });
      dispatch({ type: "SET_TELEMETRY", key: "fuelLevel", value: parseFloat(fuel.toFixed(1)) });
      dispatch({ type: "SET_TELEMETRY", key: "engineSpeed", value: Math.round(rpm) });
      dispatch({ type: "SET_TELEMETRY", key: "engineWaterTemp", value: parseFloat(temp.toFixed(1)) });
      dispatch({ type: "SET_TELEMETRY", key: "batteryVoltage", value: parseFloat(batt.toFixed(1)) });
      dispatch({ type: "SET_TELEMETRY", key: "odometer", value: Math.round(odo) });

      // Publish Location
      onPublish({
        direction: "PUB",
        messageType: "locationTelemetry",
        topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/locationTelemetry`,
        status: "SUCCESS",
        payloadBytes: 128,
        payloadJson: { auto: true, gpsLat: lat, gpsLong: lng, speed },
        hexPayload: mockHex("auto", { lat, lng, speed, fuel }),
      });

      // Publish Vehicle Telemetry
      const ts = makeTimestamp();
      const makePacket = (id, val) => ({
        identifier: id,
        dlc: 8,
        cData: [{ pdu: "0x" + Math.round(val).toString(16).padStart(16, "0"), timestamp: ts }]
      });

      const mockPayload = {
        messageId: state.config.messageId || "auto-sim",
        eTboxApplicationState: "customer",
        tboxEsimState: "normal_sim",
        tboxOperatingState: "normal",
        version: state.config.protocolVersion,
        timeStamp: ts,
        canDataPayload: {
          canData: {
            canDataPacket: [
              makePacket(854, fuel),
              makePacket(998, rpm),
              makePacket(994, temp),
              makePacket(1132, batt),
              makePacket(1888, odo)
            ],
          },
        },
      };

      onPublish({
        direction: "PUB",
        messageType: "vehicleTelemetry",
        topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/vehicleTelemetry`,
        status: "SUCCESS",
        payloadBytes: JSON.stringify(mockPayload).length,
        payloadJson: mockPayload,
        hexPayload: mockHex("vehicleTelemetry", mockPayload),
      });

    }, 3000);
  }, [state.config.vin, state.config.messageId, state.config.protocolVersion, dispatch, onPublish]);

  const stopAutoDrive = useCallback(() => {
    clearInterval(autoDriveRef.current);
    dispatch({ type: "SET_AUTO_DRIVE", value: false });
  }, [dispatch]);

  return (
    <PressButton
      onClick={state.autoDriveActive ? stopAutoDrive : startAutoDrive}
      color={state.autoDriveActive ? T.error : "#a78bfa"}
      style={{ width: "100%", marginBottom: 6 }}
    >
      {state.autoDriveActive ? "⏹ Stop Auto Drive" : "⭐ Simulate Auto Drive"}
    </PressButton>
  );
}

// ─────────────────────────────────────────────
// TOP STATUS BAR
// ─────────────────────────────────────────────
function StatusBar({ state }) {
  const { config, connection, protoState } = state;
  const statusColor = {
    CONNECTED: T.pub, CONNECTING: T.accent, DISCONNECTED: T.textMut, ERROR: T.error,
  }[connection.status] || T.textMut;

  const protoStatusColor = {
    READY: T.pub, LOADING: T.accent, ERROR: T.error, IDLE: T.textMut
  }[protoState.status] || T.textMut;

  return (
    <div style={{
      height: 48,
      background: T.bgCard,
      borderBottom: `1px solid ${T.border}`,
      display: "flex",
      alignItems: "center",
      paddingLeft: 16,
      paddingRight: 16,
      gap: 16,
      flexShrink: 0,
      zIndex: 10,
    }}>
      <span style={{ color: T.accent, fontFamily: T.mono, fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
        ⚡ MQTT DEVICE
      </span>
      <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0 }} />
      <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}>
        <span style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, letterSpacing: "0.08em", flexShrink: 0 }}>VIN</span>
        <span style={{ fontSize: 12, color: T.textPri, fontFamily: T.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{config.vin}</span>
      </div>
      <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0 }} />
      <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}>
        <span style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, letterSpacing: "0.08em", flexShrink: 0 }}>IMEI</span>
        <span style={{ fontSize: 12, color: T.textPri, fontFamily: T.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{config.imei}</span>
      </div>
      <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0 }} />
      <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, letterSpacing: "0.08em", flexShrink: 0 }}>BROKER</span>
        <span style={{ fontSize: 12, color: T.sub, fontFamily: T.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {config.broker.replace("mqtts://", "")}
        </span>
      </div>

      {/* Proto Status */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, padding: "0 8px" }}>
        <Badge color={protoStatusColor} bg={`${protoStatusColor}11`}>
          ENGINE: {protoState.status}
        </Badge>
        <Badge color={config.selectedProtocol === "5.0" ? T.pub : T.accent} bg={`${config.selectedProtocol === "5.0" ? T.pub : T.accent}11`}>
          PROTO: v{config.protocolVersion}
        </Badge>
      </div>

      <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0 }} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        <ConnectionDot status={connection.status} />
        <span style={{ fontSize: 12, color: statusColor, fontFamily: T.mono, fontWeight: 800 }}>
          {connection.status}
        </span>
        {connection.status === "CONNECTED" && (
          <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, background: T.bgCard, padding: "2px 8px", borderRadius: 4, border: `1px solid ${T.border}` }}>
            {formatUptime(connection.uptimeSeconds)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
let globalDashboardState = initialState;


export default function MQTTVirtualDeviceDashboard() {
  const [state, dispatch] = useReducer(reducer, globalDashboardState);

  useEffect(() => {
    globalDashboardState = state;
  }, [state]);

  const protoRootRef = useRef(null);

  // Load Protobuf schemas
  useEffect(() => {
    async function loadProtos() {
      dispatch({ type: "SET_PROTO_STATE", payload: { status: "LOADING" } });
      try {
        const root = await protobuf.load([
          "/protos/jeep_common.proto",
          "/protos/timestamp.proto",
          "/protos/jeep_candata.proto",
          "/protos/jeep_candata_message.proto",
          "/protos/jeep_locationtelemetry.proto",
          "/protos/jeep_locationtelemetry_message.proto",
          "/protos/jeep_event.proto",
          "/protos/jeep_event_message.proto",
          "/protos/jeep_trip.proto",
          "/protos/jeep_trip_message.proto",
          "/protos/jeep_alert.proto",
          "/protos/jeep_alert_message.proto",
          "/protos/jeep_fota_command.proto",
          "/protos/jeep_fota_command_message.proto",
          "/protos/jeep_fota_commandresponse_message.proto",
          "/protos/jeep_command_message.proto",
          "/protos/jeep_commandresponse_message.proto"
        ]);
        protoRootRef.current = root;
        dispatch({ type: "SET_PROTO_STATE", payload: { status: "READY" } });
      } catch (err) {
        console.error("Proto Load Error:", err);
        dispatch({ type: "SET_PROTO_STATE", payload: { status: "ERROR", error: err.message } });
      }
    }
    loadProtos();
  }, []);

  const binaryEncode = useCallback((payload, typePath) => {
    if (!protoRootRef.current) return null;
    try {
      const MessageType = protoRootRef.current.lookupType(typePath);
      const errMsg = MessageType.verify(payload);
      if (errMsg) throw new Error(errMsg);
      const message = MessageType.create(payload);
      const buffer = MessageType.encode(message).finish();
      return {
        buffer,
        hex: Array.from(buffer).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase()
      };
    } catch (e) {
      console.error(`Encoding error [${typePath}]:`, e);
      return { error: e.message };
    }
  }, []);

  const getTopicProtoType = (topic) => {
    if (topic.includes("vehicleTelemetry")) return "stla.cvip.jeep.CANDataMessage";
    if (topic.includes("locationTelemetry")) return "stla.cvip.jeep.LocationTelemetryMessage";
    if (topic.includes("events")) return "stla.cvip.jeep.EventMessage";
    if (topic.includes("alerts")) return "stla.cvip.jeep.AlertMessage";
    if (topic.includes("trip")) return "stla.cvip.jeep.TripMessage";
    if (topic.includes("deviceJoined")) return "stla.cvip.jeep.DeviceJoinedMessage";
    if (topic.includes("fotaCommandResponse")) return "stla.cvip.jeep.fotaCommandResponseMessage";
    if (topic.includes("fetchDeviceLog")) return "stla.cvip.jeep.DeviceFetchLogsResponse";
    return null;
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (state.toasts.length > 0) {
      const id = state.toasts[state.toasts.length - 1].id;
      const t = setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), 3500);
      return () => clearTimeout(t);
    }
  }, [state.toasts]);

  const onPublish = useCallback((entry) => {
    if (state.connection.status !== "CONNECTED") return;

    let finalEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      expanded: false,
      ...entry,
      protocol: state.config.selectedProtocol
    };

    if (state.config.selectedProtocol === "5.0") {
      const typePath = getTopicProtoType(entry.topic);
      if (typePath) {
        // Map common camelCase fields to snake_case for Proto compatibility
        const protoPayload = {
          ...entry.payloadJson,
          message_id: entry.payloadJson.messageId || entry.payloadJson.message_id,
          version: state.config.protocolVersion,
          time_stamp: entry.payloadJson.timeStamp || entry.payloadJson.time_stamp,
          tbox_operating_state: entry.payloadJson.tboxOperatingState || entry.payloadJson.tbox_operating_state,
          e_tbox_application_state: entry.payloadJson.eTboxApplicationState || entry.payloadJson.e_tbox_application_state,
          tbox_esim_state: entry.payloadJson.tboxEsimState || entry.payloadJson.tbox_esim_state,
        };

        const encoded = binaryEncode(protoPayload, typePath);
        if (encoded && !encoded.error) {
          finalEntry.payloadHex = encoded.hex;
          finalEntry.binarySize = encoded.buffer.length;
        } else if (encoded?.error) {
          finalEntry.error = `Proto Error: ${encoded.error}`;
        }
      }
    }

    dispatch({
      type: "ADD_LOG",
      entry: finalEntry,
    });
    dispatch({ type: "INCREMENT_PUBLISH" });
  }, [state.connection.status, state.config.selectedProtocol, binaryEncode, state.config.vin, state.config.protocolVersion, dispatch]);

  const executeFotaCycle = useCallback(async (correlationId) => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const update = (p) => dispatch({ type: "UPDATE_FOTA", payload: p });

    update({ isProcessing: true, correlationId, status: "INITIALIZING", progress: 0, currentStep: "Preparing Environment..." });
    await sleep(1500);

    // Step 1: Download in Progress
    update({ status: "DOWNLOADING", progress: 10, currentStep: "Fetching Firmware Artifacts..." });
    onPublish({
      direction: "PUB", messageType: "fotaCommandResponse",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/fotaCommandResponse`,
      status: "SUCCESS", payloadJson: {
        messageId: state.config.messageId, correlationId, subtype: 2,
        return_code: 3, // UPDATE
        fotacommandResponsePayload: { firmwareDownloadCommandResponse: { downloadAndInstallFirmwareCommandState: "VMCU_Download_in_Progress" } }
      }
    });

    // Simulate progress
    for (let i = 20; i <= 90; i += 20) {
      await sleep(1000);
      update({ progress: i });
    }
    await sleep(1000);
    update({ progress: 100, currentStep: "Download Complete. Verifying Checksum..." });
    await sleep(1000);

    // Step 2: Download Successful
    onPublish({
      direction: "PUB", messageType: "fotaCommandResponse",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/fotaCommandResponse`,
      status: "SUCCESS", payloadJson: {
        messageId: state.config.messageId, correlationId, subtype: 2,
        return_code: 3,
        fotacommandResponsePayload: { firmwareDownloadCommandResponse: { downloadAndInstallFirmwareCommandState: "VMCU_Download_Success" } }
      }
    });
    await sleep(2000);

    // Step 3: Installation in Progress
    update({ status: "INSTALLING", progress: 0, currentStep: "Writing to Flash (VMCU)..." });
    onPublish({
      direction: "PUB", messageType: "fotaCommandResponse",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/fotaCommandResponse`,
      status: "SUCCESS", payloadJson: {
        messageId: state.config.messageId, correlationId, subtype: 2,
        return_code: 3,
        fotacommandResponsePayload: { firmwareDownloadCommandResponse: { downloadAndInstallFirmwareCommandState: "VMCU_Installation_in_Progress" } }
      }
    });

    for (let i = 25; i <= 100; i += 25) {
      await sleep(1500);
      update({ progress: i });
    }

    // Step 4: Final Success
    update({ status: "SUCCESS", currentStep: "Update Applied Successfully!" });
    onPublish({
      direction: "PUB", messageType: "fotaCommandResponse",
      topic: `/dongle/${state.config.vin}/MQTTPROTOBUF/fotaCommandResponse`,
      status: "SUCCESS", payloadJson: {
        messageId: state.config.messageId, correlationId, subtype: 2,
        return_code: 1, // SUCCEEDED
        fotacommandResponsePayload: { firmwareDownloadCommandResponse: { downloadAndInstallFirmwareCommandState: "Installation_successful_MCU" } }
      }
    });

    await sleep(3000);
    update({ isProcessing: false, status: "IDLE" });
    dispatch({ type: "ADD_TOAST", toast: { id: uuidv4(), type: "success", text: "FOTA Update Simulation Completed" } });

  }, [state.config.vin, state.config.messageId, onPublish]);


  return (
    <div style={{
      height: "100%",
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      background: T.bgPrimary,
      color: T.textPri,
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      overflow: "hidden",
    }}>
      {/* Status Bar */}
      <StatusBar state={state} />

      {/* Main Layout — 3 columns */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        overflow: "hidden",
      }}>
        {/* LEFT COLUMN — Device Identity + Connection */}
        <div style={{
          width: 300,
          flexShrink: 0,
          overflowY: "auto",
          padding: 10,
          borderRight: `1px solid ${T.border}`,
          scrollbarWidth: "thin",
          scrollbarColor: `${T.border} transparent`,
        }}>
          <DeviceIdentityPanel state={state} dispatch={dispatch} />
          <CertificatePanel state={state} dispatch={dispatch} />
          <ConnectionPanel state={state} dispatch={dispatch} />
          <Card>
            <SectionHeader>⭐ Automation</SectionHeader>
            <AutoDriveButton state={state} dispatch={dispatch} onPublish={onPublish} />
            <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, lineHeight: 1.5, marginTop: 6 }}>
              Auto-publishes GPS + telemetry every 3s with random drift. Connect first.
            </div>
          </Card>
        </div>

        {/* CENTER COLUMN — Publish + Commands */}
        <div style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          padding: 10,
          borderRight: `1px solid ${T.border}`,
          scrollbarWidth: "thin",
          scrollbarColor: `${T.border} transparent`,
        }}>
          <PublishPanel state={state} dispatch={dispatch} onPublish={onPublish} />
          <CommandInbox state={state} dispatch={dispatch} onPublish={onPublish} />
        </div>

        {/* RIGHT COLUMN — Telemetry + Log */}
        <div style={{
          width: 350,
          flexShrink: 0,
          overflowY: "auto",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          scrollbarWidth: "thin",
          scrollbarColor: `${T.border} transparent`,
        }}>
          <TelemetryCards state={state} />
          <MessageLog state={state} dispatch={dispatch} />
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={state.toasts} dispatch={dispatch} />
    </div>
  );
}
