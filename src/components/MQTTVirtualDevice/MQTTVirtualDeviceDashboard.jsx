import React, { useState, useEffect } from "react";
import { Box } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

import { useMQTTState } from "../mqtt/useMQTTState";
import { mqttTheme } from "../mqtt/theme";
import { DeviceHeader } from "../mqtt/DeviceHeader";
import { TopConfigTabs } from "../mqtt/TopConfigTabs";
import { DynamicWorkspace } from "../mqtt/DynamicWorkspace";

// Module Views
import { DeviceIdentityView } from "../mqtt/DeviceIdentityView";
import { ConnectionProfileView } from "../mqtt/ConnectionProfileView";
import { CertificatesView } from "../mqtt/CertificatesView";
import { PlatformStateView } from "../mqtt/PlatformStateView";
import { MQTTConnectionView } from "../mqtt/MQTTConnectionView";

const ToastContainer = ({ toasts, dispatch }) => (
  <Box position="fixed" bottom="20px" right="20px" zIndex={10000} display="flex" flexDirection="column-reverse" gap={2}>
    <AnimatePresence>
      {toasts.map(toast => (
        <motion.div
          key={toast.id}
          initial={{ x: 120, opacity: 0, scale: 0.85 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 120, opacity: 0, scale: 0.85 }}
          style={{
            background: toast.type === "error" ? `${mqttTheme.danger}22` : `${mqttTheme.success}22`,
            border: `1px solid ${toast.type === "error" ? mqttTheme.danger : mqttTheme.success}`,
            color: toast.type === "error" ? mqttTheme.danger : mqttTheme.success,
            padding: "10px 18px",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: "12px",
            minWidth: "220px",
            cursor: "pointer",
            backdropFilter: "blur(4px)"
          }}
          onClick={() => dispatch({ type: "REMOVE_TOAST", id: toast.id })}
        >
          {toast.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </Box>
);

export default function MQTTVirtualDeviceDashboard() {
  const { state, dispatch } = useMQTTState();
  const [activeTab, setActiveTab] = useState("mqtt");

  const handleConnect = () => {
    dispatch({ type: "SET_CONNECTION", payload: { status: "CONNECTING" } });
    setTimeout(() => {
      dispatch({ type: "SET_CONNECTION", payload: { status: "CONNECTED", connectedAt: new Date().toISOString() } });
      dispatch({ type: "ADD_TOAST", toast: { id: uuidv4(), message: "✓ MQTT Connected", type: "success" } });
    }, 800);
  };

  const handleDisconnect = () => {
    dispatch({ type: "SET_CONNECTION", payload: { status: "DISCONNECTED", connectedAt: null, uptimeSeconds: 0 } });
    dispatch({ type: "ADD_TOAST", toast: { id: uuidv4(), message: "MQTT Disconnected", type: "error" } });
  };

  const handlePublish = (topic, type, value) => {
    dispatch({
      type: "ADD_LOG",
      entry: {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        direction: "PUB",
        messageType: type,
        topic: topic,
        status: "SUCCESS",
      }
    });
  };

  useEffect(() => {
    let timer;
    if (state.connection.status === "CONNECTED") {
      timer = setInterval(() => {
        dispatch({ type: "SET_CONNECTION", payload: { uptimeSeconds: state.connection.uptimeSeconds + 1 } });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.connection.status, state.connection.uptimeSeconds, dispatch]);

  const renderActiveView = () => {
    switch (activeTab) {
      case "identity":
        return <DeviceIdentityView state={state} dispatch={dispatch} />;
      case "connection":
        return <ConnectionProfileView state={state} />;
      case "certificates":
        return <CertificatesView state={state} dispatch={dispatch} />;
      case "platform":
        return <PlatformStateView state={state} dispatch={dispatch} />;
      case "mqtt":
      default:
        return <MQTTConnectionView state={state} dispatch={dispatch} handlePublish={handlePublish} />;
    }
  };

  return (
    <Box minH="calc(100vh - 80px)" bg={mqttTheme.bg} overflow="hidden" display="flex" flexDirection="column">
      <ToastContainer toasts={state.toasts} dispatch={dispatch} />
      
      {/* Header Row */}
      <DeviceHeader 
        state={state} 
        handleConnect={handleConnect} 
        handleDisconnect={handleDisconnect} 
      />

      {/* Configuration Navigation Row */}
      <TopConfigTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Single Main Workspace Content Area */}
      <DynamicWorkspace activeTab={activeTab}>
        {renderActiveView()}
      </DynamicWorkspace>
    </Box>
  );
}
