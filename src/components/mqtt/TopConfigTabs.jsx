import React from "react";
import { Flex, Box, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { mqttTheme } from "./theme";

export const TopConfigTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "identity", label: "Device Identity" },
    { id: "connection", label: "Connection Profile" },
    { id: "certificates", label: "Certificates" },
    { id: "platform", label: "Platform State" },
    { id: "mqtt", label: "MQTT Connection" },
  ];

  return (
    <Flex 
      w="full" 
      bg={mqttTheme.cardBg} 
      borderBottom={`1px solid ${mqttTheme.border}`} 
      px={6} 
      py={3}
      gap={4}
      overflowX="auto"
      css={{
        "&::-webkit-scrollbar": { display: "none" },
        msOverflowStyle: "none",
        scrollbarWidth: "none"
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Box
            key={tab.id}
            as={motion.div}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            px={4}
            py={2}
            borderRadius="md"
            cursor="pointer"
            bg={isActive ? `${mqttTheme.primary}1A` : "transparent"}
            color={isActive ? mqttTheme.primary : mqttTheme.muted}
            position="relative"
            transition="all 0.2s"
          >
            <Text fontSize="sm" fontWeight={isActive ? "bold" : "medium"} whiteSpace="nowrap">
              {tab.label}
            </Text>
            {isActive && (
              <Box
                as={motion.div}
                layoutId="activeTabIndicator"
                position="absolute"
                bottom="-12px"
                left="0"
                right="0"
                height="3px"
                bg={mqttTheme.primary}
                borderTopRadius="md"
              />
            )}
          </Box>
        );
      })}
    </Flex>
  );
};
