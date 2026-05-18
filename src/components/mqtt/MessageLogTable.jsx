import React from "react";
import { Box, Table, Thead, Tbody, Tr, Th, Td, Text, Flex, Icon, Badge } from "@chakra-ui/react";
import { List, Download, Trash2 } from "lucide-react";
import { mqttTheme } from "./theme";

export const MessageLogTable = ({ state, dispatch }) => {
  const { log } = state;

  return (
    <Box w="100%" h="250px" bg={mqttTheme.cardBg} borderTop={`1px solid ${mqttTheme.border}`} display="flex" flexDirection="column">
      
      {/* Table Header Controls */}
      <Flex p={3} borderBottom={`1px solid ${mqttTheme.border}`} justify="space-between" align="center" bg={mqttTheme.bg}>
        <Flex align="center" gap={2}>
          <Icon as={List} size={16} color={mqttTheme.muted} />
          <Text fontSize="sm" fontWeight="bold" color={mqttTheme.text} textTransform="uppercase">
            Message Log ({log.length})
          </Text>
        </Flex>
        <Flex gap={2}>
          <Badge bg={`${mqttTheme.danger}22`} color={mqttTheme.danger} p={1} borderRadius="md" cursor="pointer" onClick={() => dispatch({ type: "CLEAR_LOG" })}>
            <Trash2 size={12} />
          </Badge>
          <Badge bg={`${mqttTheme.primary}22`} color={mqttTheme.primary} p={1} borderRadius="md" cursor="pointer">
            <Download size={12} />
          </Badge>
        </Flex>
      </Flex>

      {/* Table Body */}
      <Box flex={1} overflowY="auto" pb={4}>
        <Table variant="simple" size="sm">
          <Thead bg={mqttTheme.bg} position="sticky" top={0} zIndex={1}>
            <Tr>
              <Th color={mqttTheme.muted} fontSize="10px">TIME</Th>
              <Th color={mqttTheme.muted} fontSize="10px">TYPE</Th>
              <Th color={mqttTheme.muted} fontSize="10px">DIR</Th>
              <Th color={mqttTheme.muted} fontSize="10px">TOPIC</Th>
              <Th color={mqttTheme.muted} fontSize="10px">STATUS</Th>
            </Tr>
          </Thead>
          <Tbody>
            {log.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" color={mqttTheme.muted} py={6}>No log entries</Td>
              </Tr>
            ) : (
              log.map((entry, idx) => (
                <Tr key={entry.id || idx} _hover={{ bg: `${mqttTheme.primary}08` }}>
                  <Td fontSize="xs" fontFamily="monospace" color={mqttTheme.text}>{new Date(entry.timestamp).toLocaleTimeString()}</Td>
                  <Td fontSize="xs" fontWeight="bold" color={mqttTheme.text}>{entry.messageType}</Td>
                  <Td>
                    <Badge colorScheme={entry.direction === "PUB" ? "green" : "blue"} fontSize="9px">
                      {entry.direction}
                    </Badge>
                  </Td>
                  <Td fontSize="10px" fontFamily="monospace" color={mqttTheme.muted} maxW="200px" isTruncated>
                    {entry.topic}
                  </Td>
                  <Td>
                    <Badge colorScheme={entry.status === "SUCCESS" ? "green" : "red"} fontSize="9px">
                      {entry.status}
                    </Badge>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
