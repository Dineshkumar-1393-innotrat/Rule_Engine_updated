import React from "react";
import { Box, VStack, Grid, Text, Flex } from "@chakra-ui/react";
import { mqttTheme } from "./theme";

const InfoCard = ({ label, value }) => (
  <Box bg={mqttTheme.cardBg} p={4} borderRadius="12px" border={`1px solid ${mqttTheme.border}`} boxShadow="sm">
    <Text fontSize="13px" fontWeight="bold" color={mqttTheme.muted} mb={1}>{label}</Text>
    <Text fontSize="15px" fontFamily="monospace" color={mqttTheme.text} fontWeight="600" wordBreak="break-all">{value}</Text>
  </Box>
);

export const ConnectionProfileView = ({ state }) => {
  return (
    <VStack align="stretch" spacing={6}>
      <Text fontSize="20px" fontWeight="bold" color={mqttTheme.text}>Connection Profile</Text>
      
      <Box>
        <Text fontSize="16px" fontWeight="bold" color={mqttTheme.text} mb={4}>MQTT Broker Details</Text>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="12px">
          <InfoCard label="Broker URL" value={state.config.broker} />
          <InfoCard label="Protocol Version" value={state.config.selectedProtocol === "5.0" ? "MQTT v5.0 (Binary Payload)" : "MQTT v3.1.1/v2.0.0 (JSON Payload)"} />
        </Grid>
      </Box>

      <Box>
        <Text fontSize="16px" fontWeight="bold" color={mqttTheme.text} mb={4}>Message Identifiers</Text>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="12px">
          <InfoCard label="Message ID (UUID)" value={state.config.messageId} />
          <InfoCard label="Correlation ID (UUID)" value={state.config.correlationId} />
        </Grid>
      </Box>
    </VStack>
  );
};
