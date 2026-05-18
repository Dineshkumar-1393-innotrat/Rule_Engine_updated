import React from "react";
import { Box, Flex, HStack, Text, Button, Icon, Badge } from "@chakra-ui/react";
import { Radio, Zap } from "lucide-react";
import { mqttTheme } from "./theme";

export const DeviceHeader = ({ state, handleConnect, handleDisconnect }) => {
  const isConnected = state.connection.status === "CONNECTED";
  const isConnecting = state.connection.status === "CONNECTING";
  
  return (
    <Box
      bg={mqttTheme.cardBg}
      borderBottom={`1px solid ${mqttTheme.border}`}
      p={4}
      position="sticky"
      top={0}
      zIndex={100}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center" maxW="1600px" mx="auto">
        <HStack spacing={6}>
          <HStack>
            <Icon as={Zap} color={mqttTheme.warning} />
            <Text fontWeight="bold" color={mqttTheme.text} fontSize="lg">
              Virtual Device
            </Text>
          </HStack>
          
          <HStack spacing={2} display={{ base: "none", md: "flex" }}>
            <Badge bg={mqttTheme.bg} color={mqttTheme.muted} border={`1px solid ${mqttTheme.border}`} px={2} py={1} borderRadius="md">
              VIN: <Text as="span" fontWeight="bold" color={mqttTheme.text}>{state.config.vin}</Text>
            </Badge>
            <Badge bg={mqttTheme.bg} color={mqttTheme.muted} border={`1px solid ${mqttTheme.border}`} px={2} py={1} borderRadius="md">
              Broker: <Text as="span" fontWeight="bold" color={mqttTheme.text}>{state.config.broker.split("://")[1]}</Text>
            </Badge>
          </HStack>
        </HStack>

        <HStack spacing={4}>
          <HStack>
            <Box
              w="10px"
              h="10px"
              borderRadius="full"
              bg={isConnected ? mqttTheme.success : (isConnecting ? mqttTheme.warning : mqttTheme.muted)}
              boxShadow={isConnected ? `0 0 8px ${mqttTheme.success}` : "none"}
            />
            <Text fontSize="sm" fontWeight="bold" color={mqttTheme.text}>
              {state.connection.status}
            </Text>
          </HStack>
          <Button
            size="sm"
            onClick={isConnected ? handleDisconnect : handleConnect}
            isLoading={isConnecting}
            bg={isConnected ? `${mqttTheme.danger}22` : mqttTheme.primary}
            color={isConnected ? mqttTheme.danger : "white"}
            _hover={{ bg: isConnected ? `${mqttTheme.danger}44` : `${mqttTheme.primary}ee` }}
            leftIcon={<Radio size={16} />}
          >
            {isConnected ? "DISCONNECT" : "CONNECT"}
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};
