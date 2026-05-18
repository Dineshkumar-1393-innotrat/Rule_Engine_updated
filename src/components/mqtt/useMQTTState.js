import { useReducer } from "react";

export const initialState = {
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

export function mqttReducer(state, action) {
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

export function useMQTTState() {
  const [state, dispatch] = useReducer(mqttReducer, initialState);
  return { state, dispatch };
}
