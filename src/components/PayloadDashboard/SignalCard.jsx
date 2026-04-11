import React, { useState } from 'react';
import { Box, Flex, VStack, HStack, Text, Badge, Spinner, IconButton } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronDown, ChevronUp, AlertTriangle, Activity } from 'lucide-react';
import { DataTable } from './DataTable';

export const Sparkline = ({ data = [], color = '#3B6FE8', height = 32, width = 80 }) => {
    if (!data || data.length < 2) return null;
    const vals = data.map(d => parseFloat(d.signalValue ?? d.value ?? 0)).filter(v => !isNaN(v));
    if (vals.length < 2) return null;
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const arr = vals.slice(-12);
    const pts = arr.map((v, i) => `${(i / (arr.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
    const last = pts.split(' ').pop().split(',');
    return (
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
            <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
        </svg>
    );
};

export const SignalCard = ({ signal, searchTerm, onRefresh, handlers }) => {
    const [collapsed, setCollapsed] = useState(false);
    const latestVal = signal.data?.[0]?.signalValue ?? signal.data?.[0]?.value ?? signal.data?.[0]?.Event ?? signal.data?.[0]?.signalData ?? null;
    const unit = signal.data?.[0]?.signalUnit ?? '';

    return (
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor={signal.error ? 'red.200' : 'gray.150'} boxShadow="sm" overflow="hidden" transition="all 0.2s" _hover={{ boxShadow: 'md', borderColor: 'blue.200' }}>
            <Flex align="center" px={3} py={2.5} borderBottom="1px solid" borderColor={signal.error ? 'red.100' : 'gray.100'} bg={signal.error ? 'red.50' : 'gray.50'} cursor="pointer" onClick={() => setCollapsed(c => !c)}>
                <VStack align="flex-start" spacing={0} flex={1}>
                    <HStack spacing={2}>
                        <Text fontWeight="800" fontSize="12px" color="gray.700">{signal.name}</Text>
                        <Badge variant="outline" colorScheme="gray" fontSize="8px" fontFamily="monospace" borderRadius="sm" px={1.5}>{signal.id}</Badge>
                        {signal.error && <Badge colorScheme="red" fontSize="8px">ERROR</Badge>}
                        {signal.loading && <Spinner size="xs" color="blue.400" />}
                        {signal.lastUpdated && !signal.error && <Badge colorScheme="green" variant="subtle" fontSize="8px">{signal.lastUpdated}</Badge>}
                    </HStack>
                    {latestVal !== null && !signal.error && (
                        <HStack spacing={1} mt={0.5}>
                            <Text fontSize="10px" fontWeight="700" color="blue.600">{String(latestVal)}</Text>
                            {unit && <Text fontSize="9px" color="gray.400">{unit}</Text>}
                        </HStack>
                    )}
                </VStack>
                <HStack spacing={2}>
                    {signal.data?.length > 1 && <Sparkline data={signal.data} color="#3B6FE8" width={60} height={22} />}
                    <IconButton icon={<RotateCcw size={12} />} size="xs" variant="ghost" aria-label="refresh" onClick={(e) => { e.stopPropagation(); onRefresh(); }} />
                    {collapsed ? <ChevronDown size={14} color="#A0AEC0" /> : <ChevronUp size={14} color="#A0AEC0" />}
                </HStack>
            </Flex>
            <AnimatePresence>
                {!collapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <Box height="260px" overflow="auto">
                            {signal.error ? (
                                <Flex align="center" justify="center" h="full" p={6} direction="column" bg="red.50">
                                    <AlertTriangle size={32} color="#EF4444" />
                                    <Text color="red.700" fontSize="12px" fontWeight="900" fontFamily="monospace" mt={3} textAlign="center">SIGNAL ERROR</Text>
                                    <Text color="red.600" fontSize="10px" fontWeight="bold" textAlign="center" maxW="80%" mt={1}>{signal.error}</Text>
                                    <IconButton size="xs" mt={3} colorScheme="red" variant="outline" icon={<RotateCcw size={10} />} onClick={onRefresh} aria-label="Retry" />
                                </Flex>
                            ) : signal.data?.length > 0 ? (
                                <DataTable data={signal.data} name={signal.name} searchTerm={searchTerm} handlers={handlers} />
                            ) : signal.loading ? (
                                <Flex align="center" justify="center" h="full">
                                    <VStack spacing={2}>
                                        <Spinner size="md" color="blue.400" thickness="3px" />
                                        <Text color="gray.500" fontSize="12px" fontWeight="bold" fontFamily="monospace">ESTABLISHING LINK...</Text>
                                    </VStack>
                                </Flex>
                            ) : (
                                <Flex align="center" justify="center" h="full" direction="column" bg="gray.50">
                                    <Activity size={28} color="#CBD5E0" />
                                    <Text color="gray.400" fontSize="12px" fontWeight="bold" fontFamily="monospace" mt={2}>NO DATA PACKETS</Text>
                                    <Text color="gray.400" fontSize="9px" mt={0.5}>Waiting for telemetry...</Text>
                                </Flex>
                            )}
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};
