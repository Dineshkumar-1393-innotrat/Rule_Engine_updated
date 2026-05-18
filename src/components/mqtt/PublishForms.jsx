import React, { useState } from "react";
import { Box, VStack, Grid, Text, Button, Select, Input, Flex, Checkbox, Switch } from "@chakra-ui/react";
import { ArrowUp, RefreshCw } from "lucide-react";
import { mqttTheme } from "./theme";

const CommandInbox = () => {
  const commands = [
    "Remote Door Lock", "Remote Door Unlock",
    "Remote Blinker ON", "Remote Blinker OFF",
    "Remote Honk", "FOTA Command",
    "OTA Command", "Fetch Device Log"
  ];
  return (
    <Box>
      <Text fontSize="14px" fontWeight="bold" color={mqttTheme.primary} textTransform="uppercase" mb={4}>
        ↓ Command Inbox
      </Text>
      <Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={2} textTransform="uppercase">
        Simulate Incoming Command
      </Text>
      <Grid templateColumns="1fr 1fr" gap={2}>
        {commands.map(cmd => (
          <Button key={cmd} size="sm" variant="outline" bg={`${mqttTheme.primary}11`} borderColor={`${mqttTheme.primary}44`} color={mqttTheme.primary} justifyContent="flex-start" fontSize="12px">
            ↓ {cmd}
          </Button>
        ))}
      </Grid>
    </Box>
  );
};

export const DiagnosticsForm = ({ onPublish }) => (
  <VStack align="stretch" spacing={6}>
    <Box>
      <Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={2} textTransform="uppercase">Log Upload Status</Text>
      <Select size="sm" borderRadius="md" bg="white">
        <option value="succeeded">succeeded</option>
        <option value="failed">failed</option>
      </Select>
    </Box>
    <Button size="sm" bg={`${mqttTheme.primary}11`} color={mqttTheme.primary} borderColor={`${mqttTheme.primary}44`} borderWidth="1px" onClick={() => onPublish("diagnostics")}>
      ↑ Publish Log Response
    </Button>
    <Box borderTop={`1px solid ${mqttTheme.border}`} pt={4}>
      <CommandInbox />
    </Box>
  </VStack>
);

export const FotaSimulatorForm = () => (
  <VStack align="stretch" spacing={6}>
    <Box p={6} border={`1px dashed ${mqttTheme.border}`} borderRadius="12px" textAlign="center">
      <Text fontSize="14px" color={mqttTheme.muted} mb={2}>Waiting for FOTA Command...</Text>
      <Text fontSize="12px" color={mqttTheme.muted}>Go to "Command Inbox" and simulate a FOTA Command to start.</Text>
    </Box>
    <Box borderTop={`1px solid ${mqttTheme.border}`} pt={4}>
      <CommandInbox />
    </Box>
  </VStack>
);

export const DeviceJoinForm = ({ state, onPublish }) => (
  <VStack align="stretch" spacing={4}>
    <Box bg={`${mqttTheme.bg}`} p={3} borderRadius="md" border={`1px solid ${mqttTheme.border}`}>
      <Flex justify="space-between" mb={1}><Text fontSize="12px" color={mqttTheme.muted}>TBOX Serial</Text><Text fontSize="12px" fontFamily="monospace">{state.config.tboxSerial}</Text></Flex>
      <Flex justify="space-between"><Text fontSize="12px" color={mqttTheme.muted}>Client ID</Text><Text fontSize="12px" fontFamily="monospace">{state.config.clientId}</Text></Flex>
    </Box>
    <Grid templateColumns="1fr" gap={4}>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">NAD SW Version</Text><Input size="sm" defaultValue="ND0.00.11" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">MCU SW Version</Text><Input size="sm" defaultValue="MD0.00.03" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Operating State</Text><Select size="sm"><option>NORMAL</option></Select></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">App State</Text><Select size="sm"><option>PROVISIONED</option></Select></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">eSIM State</Text><Select size="sm"><option>NORMAL_SIM</option></Select></Box>
    </Grid>
    <Button size="sm" bg={`${mqttTheme.primary}11`} color={mqttTheme.primary} borderColor={`${mqttTheme.primary}44`} borderWidth="1px" onClick={() => onPublish("deviceJoin")}>
      ↑ Send Device Join + Subscribe
    </Button>
  </VStack>
);

export const TripsForm = ({ onPublish }) => (
  <VStack align="stretch" spacing={4}>
    <Flex border={`1px solid ${mqttTheme.border}`} borderRadius="md" overflow="hidden">
      <Button flex={1} size="sm" variant="ghost" bg={`${mqttTheme.primary}11`} color={mqttTheme.primary} borderRadius="0">Start</Button>
      <Button flex={1} size="sm" variant="ghost" borderLeft={`1px solid ${mqttTheme.border}`} borderRadius="0">Current</Button>
      <Button flex={1} size="sm" variant="ghost" borderLeft={`1px solid ${mqttTheme.border}`} borderRadius="0">End</Button>
    </Flex>
    <Grid templateColumns="1fr 1fr" gap={4}>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Trip ID</Text><Input size="sm" defaultValue="18052603" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Start Date</Text><Input size="sm" defaultValue="2026-05-18" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">GPS Lat</Text><Input size="sm" defaultValue="13.084534" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">GPS Long</Text><Input size="sm" defaultValue="80.270718" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Altitude</Text><Input size="sm" defaultValue="20.0" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Course Angle</Text><Input size="sm" defaultValue="180.0" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Signal Quality</Text><Input size="sm" defaultValue="0.97" /></Box>
    </Grid>
    <Button size="sm" bg={`${mqttTheme.primary}11`} color={mqttTheme.primary} borderColor={`${mqttTheme.primary}44`} borderWidth="1px" onClick={() => onPublish("trips")}>
      ↑ Publish Trip Start
    </Button>
  </VStack>
);

export const AlertsForm = ({ onPublish }) => (
  <VStack align="stretch" spacing={4}>
    <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Alert Type</Text><Select size="sm"><option>SpeedAlert</option></Select></Box>
    <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Alert State</Text><Select size="sm"><option>alsAlert</option></Select></Box>
    <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Alert ID</Text><Input size="sm" defaultValue="dd52bab1-c64a-431b-a945-1602f26e9f4e" /></Box>
    <Flex align="center" gap={2}><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} textTransform="uppercase">Is Live</Text><Checkbox defaultChecked /></Flex>
    <Grid templateColumns="1fr 1fr" gap={4}>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">GPS Latitude</Text><Input size="sm" defaultValue="12.971598" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">GPS Longitude</Text><Input size="sm" defaultValue="77.594566" /></Box>
    </Grid>
    <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Vehicle Speed (km/h)</Text><Input size="sm" defaultValue="120.5" /></Box>
    <Button size="sm" bg="#FEE2E2" color="#DC2626" borderColor="#FCA5A5" borderWidth="1px" _hover={{ bg: "#FECACA" }} onClick={() => onPublish("alerts")}>
      ↑ Publish Alert
    </Button>
  </VStack>
);

export const EventsForm = ({ onPublish }) => (
  <VStack align="stretch" spacing={4}>
    <Box>
      <Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Event Type</Text>
      <Select size="sm">
        <option>IgnitionStatus:START</option>
        <option>IgnitionStatus:STOP</option>
        <option>RemoteBlinkerOn</option>
        <option>RemoteBlinkerOff</option>
        <option>RemoteDoorLock</option>
        <option>RemoteDoorUnlock</option>
        <option>RemoteHonkStatus</option>
        <option>VehicleMobilizationStatus</option>
        <option>TBoxInFullSleep</option>
        <option>VehicleMobilization</option>
      </Select>
    </Box>
    <Button size="sm" bg={`${mqttTheme.success}11`} color={mqttTheme.success} borderColor={`${mqttTheme.success}44`} borderWidth="1px" onClick={() => onPublish("events")}>
      ↑ Publish Event
    </Button>
  </VStack>
);

export const LocationForm = ({ onPublish }) => (
  <VStack align="stretch" spacing={4}>
    <Grid templateColumns="1fr 1fr" gap={4}>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">GPS Latitude</Text><Input size="sm" defaultValue="13.084534" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">GPS Longitude</Text><Input size="sm" defaultValue="80.270718" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Altitude (m)</Text><Input size="sm" defaultValue="20.0" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Course Angle (°)</Text><Input size="sm" defaultValue="180.0" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Signal Quality</Text><Input size="sm" defaultValue="97.0" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">GPS Fixed</Text><Select size="sm"><option>Fixed (1)</option></Select></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Speed (km/h)</Text><Input size="sm" defaultValue="25" /></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Signal Strength</Text><Input size="sm" defaultValue="30" /></Box>
    </Grid>
    <Box h="100px" bg="#0F172A" borderRadius="md" p={2} position="relative" overflow="hidden" backgroundImage="linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)" backgroundSize="20px 20px">
      <Text fontSize="10px" color="#94A3B8" position="absolute" top={2} left={2}>GPS MAP PREVIEW</Text>
      <Text fontSize="10px" color={mqttTheme.primary} position="absolute" bottom={2} left={2}>13.0845°, 80.2707°</Text>
      <Box position="absolute" bottom="20px" left="20px" w="6px" h="6px" bg={mqttTheme.primary} borderRadius="full" boxShadow={`0 0 10px ${mqttTheme.primary}`} />
    </Box>
    <Button size="sm" bg={`${mqttTheme.success}11`} color={mqttTheme.success} borderColor={`${mqttTheme.success}44`} borderWidth="1px" onClick={() => onPublish("locationTelemetry")}>
      ↑ Publish Location Telemetry
    </Button>
  </VStack>
);

export const VehicleTelForm = ({ onPublish }) => {
  const [telemetryType, setTelemetryType] = useState("fuelLevel");
  
  const types = [
    { key: "fuelLevel", label: "Fuel Level (identifier:854)", valLabel: "Value (%)", defaultVal: "64" },
    { key: "engineSpeed", label: "Engine Speed", valLabel: "Value (RPM)", defaultVal: "2500" },
    { key: "engineWaterTemp", label: "Engine Water Temp", valLabel: "Value (°C)", defaultVal: "90" },
    { key: "batteryVoltage", label: "Battery Voltage", valLabel: "Value (V)", defaultVal: "13.8" },
    { key: "odometer", label: "Odometer", valLabel: "Value (KM)", defaultVal: "12450" }
  ];

  const currentType = types.find(t => t.key === telemetryType) || types[0];
  const [val, setVal] = useState(currentType.defaultVal);

  const handleTypeChange = (key) => {
    setTelemetryType(key);
    const target = types.find(t => t.key === key);
    if (target) {
      setVal(target.defaultVal);
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Telemetry Type</Text>
        <Flex gap={2} wrap="wrap">
          {types.map((t) => {
            const isActive = telemetryType === t.key;
            return (
              <Button
                key={t.key}
                size="sm"
                variant="outline"
                bg={isActive ? `${mqttTheme.primary}11` : "transparent"}
                color={isActive ? mqttTheme.primary : mqttTheme.muted}
                borderColor={isActive ? mqttTheme.primary : mqttTheme.border}
                borderRadius="full"
                onClick={() => handleTypeChange(t.key)}
              >
                {t.label}
              </Button>
            );
          })}
        </Flex>
      </Box>
      <Box>
        <Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">
          {currentType.valLabel}
        </Text>
        <Input size="sm" value={val} onChange={(e) => setVal(e.target.value)} />
      </Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">App State</Text><Select size="sm"><option>customer</option></Select></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">eSIM State</Text><Select size="sm"><option>normal_sim</option></Select></Box>
      <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Operating State</Text><Select size="sm"><option>normal</option></Select></Box>
      <Grid templateColumns="1fr 1fr" gap={4}>
        <Box><Text fontSize="12px" fontWeight="bold" color={mqttTheme.muted} mb={1} textTransform="uppercase">Interval (Sec)</Text><Input size="sm" defaultValue="60" /></Box>
        <Flex align="flex-end"><Button size="sm" w="full" bg={`${mqttTheme.primary}11`} color={mqttTheme.primary} borderColor={`${mqttTheme.primary}44`} borderWidth="1px" leftIcon={<RefreshCw size={14} />}>Auto</Button></Flex>
      </Grid>
      <Button size="sm" bg={`${mqttTheme.success}11`} color={mqttTheme.success} borderColor={`${mqttTheme.success}44`} borderWidth="1px" onClick={() => onPublish("vehicleTelemetry")}>
        ↑ Publish Vehicle Telemetry
      </Button>
    </VStack>
  );
};
