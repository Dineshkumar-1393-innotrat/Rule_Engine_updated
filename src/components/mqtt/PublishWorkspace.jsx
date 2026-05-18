import React, { useState } from "react";
import { Box, Flex, Text, Button, VStack } from "@chakra-ui/react";
import { mqttTheme } from "./theme";
import { 
  DiagnosticsForm, 
  FotaSimulatorForm, 
  DeviceJoinForm, 
  TripsForm, 
  AlertsForm, 
  EventsForm, 
  LocationForm, 
  VehicleTelForm 
} from "./PublishForms";

export const PublishWorkspace = ({ state, dispatch, onPublish }) => {
  const [topic, setTopic] = useState("vehicleTelemetry");

  const handlePublish = (publishTopic) => {
    dispatch({ type: "INCREMENT_PUBLISH" });
    dispatch({ type: "ADD_TOAST", toast: { id: Date.now().toString(), message: `Published to ${publishTopic}`, type: "success" } });
    if (onPublish) onPublish(publishTopic, "MockData", 0);
  };

  const renderActiveForm = () => {
    switch (topic) {
      case "diagnostics": return <DiagnosticsForm onPublish={handlePublish} />;
      case "fotaSimulator": return <FotaSimulatorForm onPublish={handlePublish} />;
      case "deviceJoin": return <DeviceJoinForm state={state} onPublish={handlePublish} />;
      case "trips": return <TripsForm onPublish={handlePublish} />;
      case "alerts": return <AlertsForm onPublish={handlePublish} />;
      case "events": return <EventsForm onPublish={handlePublish} />;
      case "locationTelemetry": return <LocationForm onPublish={handlePublish} />;
      case "vehicleTelemetry": 
      default:
        return <VehicleTelForm onPublish={handlePublish} />;
    }
  };

  return (
    <Box w="100%" h="full" bg={mqttTheme.bg} p={6} overflowY="auto">
      
      {/* Workspace Content */}
      <Box bg={mqttTheme.cardBg} borderRadius="12px" border={`1px solid ${mqttTheme.border}`} p={6} boxShadow="sm" minH="400px">
        <VStack align="stretch" spacing={6}>
          <Text fontSize="md" fontWeight="bold" color={mqttTheme.primary} textTransform="uppercase">↑ Publish MQTT Messages</Text>
          
          {/* Topic Selector Nav */}
          <Box borderBottom={`1px solid ${mqttTheme.border}`} pb={4}>
            <Flex gap={2} wrap="wrap" justify="center">
              {[
                { value: "vehicleTelemetry", label: "Vehicle Tel" },
                { value: "locationTelemetry", label: "Location" },
                { value: "events", label: "Events" },
                { value: "alerts", label: "Alerts" },
                { value: "trips", label: "Trips" },
                { value: "deviceJoin", label: "Device Join" },
                { value: "fotaSimulator", label: "FOTA Simulator" },
                { value: "diagnostics", label: "Diagnostics" },
              ].map((t) => (
                <Button
                  key={t.value}
                  size="sm"
                  variant={topic === t.value ? "solid" : "outline"}
                  bg={topic === t.value ? `${mqttTheme.primary}1A` : "transparent"}
                  borderColor={topic === t.value ? mqttTheme.primary : mqttTheme.border}
                  color={topic === t.value ? mqttTheme.primary : mqttTheme.muted}
                  onClick={() => setTopic(t.value)}
                  fontWeight={topic === t.value ? "bold" : "medium"}
                >
                  {t.label}
                </Button>
              ))}
            </Flex>
          </Box>

          {/* Active Form */}
          <Box pt={2}>
            {renderActiveForm()}
          </Box>

        </VStack>
      </Box>
    </Box>
  );
};
