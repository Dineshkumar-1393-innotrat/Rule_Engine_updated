import React from 'react';
import { Box, VStack, HStack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

export const DeviceEventsList = ({ events }) => {
    // Filter events to only show those from the last 15 seconds
    const recentEvents = (events || []).filter(evt => {
        if (!evt.sourcetimestamp) return false;
        const evtTime = new Date(evt.sourcetimestamp).getTime();
        const now = Date.now();
        return (now - evtTime) < 15000; // 15 seconds window
    }).slice(0, 3); // Then take top 3

    if (recentEvents.length === 0) return null;

    return (
        <Box position="absolute" top={20} right={8} maxW="280px" zIndex={9} pointerEvents="none">
            <VStack spacing={2} align="stretch">
                {recentEvents.map((evt, i) => {
                    let details = {};
                    try { details = JSON.parse(evt.eventdetails || '{}'); } catch (e) { }
                    const type = evt.eventtype || 'Event';
                    const time = evt.sourcetimestamp ? new Date(evt.sourcetimestamp).toLocaleTimeString() : '';

                    return (
                        <motion.div
                            key={evt.eventid || i}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Box bg="whiteAlpha.900" backdropFilter="blur(8px)" p={3} borderRadius="lg" boxShadow="sm" borderLeft="3px solid" borderColor="purple.400" pointerEvents="auto">
                                <HStack justify="space-between" mb={1}>
                                    <Text fontSize="10px" fontWeight="bold" color="purple.600" textTransform="uppercase">{type}</Text>
                                    <Text fontSize="9px" color="gray.400">{time}</Text>
                                </HStack>
                                <Text fontSize="9px" color="gray.600" noOfLines={2} lineHeight="1.2">
                                    {details.status || details.message || "Event Received"}
                                </Text>
                            </Box>
                        </motion.div>
                    );
                })}
            </VStack>
        </Box>
    );
};
