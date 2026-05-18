import React from "react";
import { Box, SimpleGrid, Text, Flex, Icon } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { mqttTheme } from "./theme";

const getTrendArrow = (hist) => {
  if (!hist || hist.length < 2) return "→";
  const last = hist[hist.length - 1];
  const prev = hist[hist.length - 2];
  if (last > prev) return "↑";
  if (last < prev) return "↓";
  return "→";
};

export const TelemetryPanel = ({ state }) => {
  const { telemetry: tel, telemetryHistory: hist } = state;

  const cards = [
    { key: "fuelLevel",       label: "Fuel Level",    value: tel.fuelLevel,       suffix: "%",   color: mqttTheme.warning },
    { key: "engineSpeed",     label: "Engine Speed",  value: tel.engineSpeed,     suffix: "RPM", color: mqttTheme.success },
    { key: "engineWaterTemp", label: "Water Temp",    value: tel.engineWaterTemp, suffix: "°C",  color: mqttTheme.danger },
    { key: "batteryVoltage",  label: "Battery",       value: tel.batteryVoltage,  suffix: "V",   color: mqttTheme.primary },
    { key: "odometer",        label: "Odometer",      value: tel.odometer,        suffix: "km",  color: "#8B5CF6" },
    { key: "speed",           label: "Speed",         value: tel.speed,           suffix: "km/h",color: "#10B981" },
  ];

  return (
    <Box w="100%" h="full" bg={mqttTheme.cardBg} borderLeft={`1px solid ${mqttTheme.border}`} p={4} overflowY="auto">
      <Flex align="center" gap={2} mb={4}>
        <Icon as={Activity} size={16} color={mqttTheme.primary} />
        <Text fontSize="sm" fontWeight="bold" color={mqttTheme.muted} textTransform="uppercase">
          Live Diagnostics
        </Text>
      </Flex>
      
      <SimpleGrid columns={2} spacing={3} mb={6}>
        {cards.map((card) => {
          const history = hist[card.key] || [];
          const trend = getTrendArrow(history);
          const trendColor = trend === "↑" ? mqttTheme.success : trend === "↓" ? mqttTheme.danger : mqttTheme.muted;
          
          return (
            <motion.div
              key={card.key}
              layout
              style={{
                background: mqttTheme.bg,
                border: `1px solid ${mqttTheme.border}`,
                borderRadius: "12px",
                padding: "12px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <Text fontSize="xs" fontWeight="bold" color={mqttTheme.muted} mb={1}>
                {card.label}
              </Text>
              <Flex align="baseline" gap={2}>
                <Text fontSize="lg" fontWeight="900" color={card.color} fontFamily="monospace">
                  {card.value}
                </Text>
                <Text fontSize="10px" color={mqttTheme.muted} fontWeight="bold">
                  {card.suffix}
                </Text>
                <Text ml="auto" fontSize="sm" color={trendColor} fontWeight="bold">
                  {trend}
                </Text>
              </Flex>
            </motion.div>
          );
        })}
      </SimpleGrid>
      
      {/* Mini connection status timeline / message counts */}
      <Box p={3} bg={mqttTheme.bg} borderRadius="12px" border={`1px solid ${mqttTheme.border}`}>
        <Text fontSize="xs" fontWeight="bold" color={mqttTheme.muted} mb={2} textTransform="uppercase">
          Session Stats
        </Text>
        <Flex justify="space-between" mb={1}>
          <Text fontSize="xs" color={mqttTheme.text}>Published</Text>
          <Text fontSize="xs" fontWeight="bold" color={mqttTheme.success}>{state.connection.publishCount}</Text>
        </Flex>
        <Flex justify="space-between" mb={1}>
          <Text fontSize="xs" color={mqttTheme.text}>Received</Text>
          <Text fontSize="xs" fontWeight="bold" color={mqttTheme.primary}>{state.connection.receiveCount}</Text>
        </Flex>
        <Flex justify="space-between">
          <Text fontSize="xs" color={mqttTheme.text}>Uptime</Text>
          <Text fontSize="xs" fontWeight="bold" color={mqttTheme.muted}>{state.connection.uptimeSeconds}s</Text>
        </Flex>
      </Box>
    </Box>
  );
};
