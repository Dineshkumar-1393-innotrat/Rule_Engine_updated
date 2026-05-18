import React from "react";
import { Box, VStack, Grid, Text, Flex, Input, Button, Select } from "@chakra-ui/react";
import { RefreshCw } from "lucide-react";
import { mqttTheme } from "./theme";

const EditCard = ({ label, value, onChange, disabled }) => (
  <Box bg={mqttTheme.cardBg} p={4} borderRadius="12px" border={`1px solid ${mqttTheme.border}`} boxShadow="sm">
    <Text fontSize="13px" fontWeight="bold" color={mqttTheme.muted} mb={2}>{label}</Text>
    <Input 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      disabled={disabled}
      size="sm"
      fontFamily="monospace"
      fontWeight="bold"
      color={mqttTheme.text}
      borderColor={mqttTheme.border}
      _hover={{ borderColor: mqttTheme.primary }}
      _focus={{ borderColor: mqttTheme.primary, boxShadow: `0 0 0 1px ${mqttTheme.primary}` }}
    />
  </Box>
);

export const DeviceIdentityView = ({ state, dispatch }) => {
  const handleChange = (field, value) => {
    dispatch({ type: "SET_CONFIG_FIELD", field, value });
  };



  const mockPresets = [
    { id: 1, label: "Mock Device 1", imei: "356741360383500", vin: "MOCKVIN124ABC0001", tboxSerial: "2g123abc", clientId: "MOCKVIN124ABC0001" },
    { id: 2, label: "Mock Device 2", imei: "356741360383501", vin: "MOCKVIN124ABC0002", tboxSerial: "2g124abc", clientId: "MOCKVIN124ABC0002" },
    { id: 3, label: "Mock Device 3", imei: "356741360383502", vin: "MOCKVIN124ABC0003", tboxSerial: "2g125abc", clientId: "MOCKVIN124ABC0003" },
    { id: 4, label: "Mock Device 4", imei: "356741360383503", vin: "MOCKVIN124ABC0004", tboxSerial: "2g126abc", clientId: "MOCKVIN124ABC0004" },
    { id: 5, label: "Mock Device 5", imei: "356741360383504", vin: "MOCKVIN124ABC0005", tboxSerial: "2g127abc", clientId: "MOCKVIN124ABC0005" },
  ];

  const handlePresetSelect = (e) => {
    const val = e.target.value;
    if (!val) return;
    const preset = mockPresets.find(p => p.id.toString() === val);
    if (preset) {
      dispatch({ type: "SET_CONFIG_FIELD", field: "vin", value: preset.vin });
      dispatch({ type: "SET_CONFIG_FIELD", field: "imei", value: preset.imei });
      dispatch({ type: "SET_CONFIG_FIELD", field: "tboxSerial", value: preset.tboxSerial });
      dispatch({ type: "SET_CONFIG_FIELD", field: "clientId", value: preset.clientId });
      dispatch({ type: "ADD_TOAST", toast: { id: Date.now().toString(), message: `Loaded ${preset.label}`, type: "success" } });
    }
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Flex justify="space-between" align="center">
        <Text fontSize="20px" fontWeight="bold" color={mqttTheme.text}>Device Identity</Text>
      </Flex>

      <Box bg={`${mqttTheme.primary}11`} p={4} borderRadius="12px" border={`1px solid ${mqttTheme.primary}33`}>
        <Text fontSize="12px" fontWeight="bold" color={mqttTheme.primary} mb={2} textTransform="uppercase">
          Load Mock Preset
        </Text>
        <Select 
          placeholder="-- Select a Mock Device --" 
          bg="white" 
          size="sm" 
          borderColor={`${mqttTheme.primary}44`}
          onChange={handlePresetSelect}
          fontWeight="bold"
          color={mqttTheme.text}
        >
          {mockPresets.map(p => (
            <option key={p.id} value={p.id}>{p.label} ({p.imei})</option>
          ))}
        </Select>
      </Box>
      
      <Box>
        <Text fontSize="16px" fontWeight="bold" color={mqttTheme.text} mb={4}>Vehicle Details</Text>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="12px">
          <EditCard 
            label="VIN (Vehicle Identification Number)" 
            value={state.config.vin} 
            onChange={(v) => handleChange("vin", v)}
          />
          <EditCard 
            label="Device Common Name" 
            value={`CVIP_DEV_${state.config.vin}`} 
            disabled 
            onChange={() => {}}
          />
        </Grid>
      </Box>

      <Box>
        <Text fontSize="16px" fontWeight="bold" color={mqttTheme.text} mb={4}>Hardware Information</Text>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="12px">
          <EditCard 
            label="IMEI Number" 
            value={state.config.imei} 
            onChange={(v) => handleChange("imei", v)}
          />
          <EditCard 
            label="TBOX Serial Number" 
            value={state.config.tboxSerial} 
            onChange={(v) => handleChange("tboxSerial", v)}
          />
          <EditCard 
            label="Client ID" 
            value={state.config.clientId} 
            onChange={(v) => handleChange("clientId", v)}
          />
        </Grid>
      </Box>
    </VStack>
  );
};
