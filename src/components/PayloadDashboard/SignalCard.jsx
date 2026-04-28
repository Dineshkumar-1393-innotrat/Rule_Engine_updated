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

export const SignalCard = ({ signal, searchTerm, onRefresh, handlers, isFullScreen }) => {
    const [collapsed, setCollapsed] = useState(false);
    const latestVal = signal.data?.[0]?.signalValue ?? signal.data?.[0]?.value ?? signal.data?.[0]?.Event ?? signal.data?.[0]?.signalData ?? null;
    const unit = signal.data?.[0]?.signalUnit ?? '';

    return (
        <Box 
            bg="white" 
            borderRadius="xl" 
            border="1px solid" 
            borderColor={signal.error ? 'red.200' : 'gray.150'} 
            boxShadow={isFullScreen ? 'xl' : 'sm'} 
            overflow="hidden" 
            transition="all 0.3s ease" 
            _hover={{ boxShadow: 'md', borderColor: 'blue.200' }}
            w="full"
        >
            <Flex 
                align="center" 
                px={4} 
                py={isFullScreen ? 4 : 2.5} 
                borderBottom="1px solid" 
                borderColor={signal.error ? 'red.100' : 'gray.100'} 
                bg={signal.error ? 'red.50' : 'gray.50'} 
                cursor="pointer" 
                onClick={() => setCollapsed(c => !c)}
            >
                <VStack align="flex-start" spacing={0} flex={1}>
                    <HStack spacing={3}>
                        <Text fontWeight="800" fontSize={isFullScreen ? "16px" : "12px"} color="gray.700">{signal.name}</Text>
                        <Badge variant="outline" colorScheme="gray" fontSize="9px" fontFamily="monospace" borderRadius="sm" px={1.5}>{signal.id}</Badge>
                        {signal.error && <Badge colorScheme="red" fontSize="9px">ERROR</Badge>}
                        {signal.loading && <Spinner size="xs" color="blue.400" />}
                        {signal.data?.[0]?.isSimulated && <Badge colorScheme="purple" variant="solid" fontSize="9px">SIMULATED</Badge>}
                        {signal.lastUpdated && !signal.error && <Badge colorScheme="green" variant="subtle" fontSize="9px">{signal.lastUpdated}</Badge>}
                    </HStack>
                    {latestVal !== null && !signal.error && (
                        <HStack spacing={1} mt={1}>
                            <Text fontSize={isFullScreen ? "14px" : "10px"} fontWeight="800" color="blue.600">{String(latestVal)}</Text>
                            {unit && <Text fontSize={isFullScreen ? "12px" : "9px"} color="gray.400" fontWeight="bold">{unit}</Text>}
                        </HStack>
                    )}
                </VStack>
                <HStack spacing={3}>
                    {signal.data?.length > 1 && <Sparkline data={signal.data} color="#3B6FE8" width={isFullScreen ? 120 : 60} height={isFullScreen ? 40 : 22} />}
                    <IconButton icon={<RotateCcw size={14} />} size="sm" variant="ghost" aria-label="refresh" onClick={(e) => { e.stopPropagation(); onRefresh(); }} />
                    {collapsed ? <ChevronDown size={18} color="#A0AEC0" /> : <ChevronUp size={18} color="#A0AEC0" />}
                </HStack>
            </Flex>
            <AnimatePresence>
                {!collapsed && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        transition={{ duration: 0.3 }}
                    >
                        <Box height={isFullScreen ? "600px" : "260px"} overflow="auto" transition="height 0.3s ease">
                            {signal.error ? (
                                <Flex align="center" justify="center" h="full" p={6} direction="column" bg="red.50">
                                    <AlertTriangle size={isFullScreen ? 48 : 32} color="#EF4444" />
                                    <Text color="red.700" fontSize={isFullScreen ? "14px" : "12px"} fontWeight="900" fontFamily="monospace" mt={3} textAlign="center">SIGNAL ERROR</Text>
                                    <Text color="red.600" fontSize={isFullScreen ? "12px" : "10px"} fontWeight="bold" textAlign="center" maxW="80%" mt={1}>{signal.error}</Text>
                                    <IconButton size="xs" mt={3} colorScheme="red" variant="outline" icon={<RotateCcw size={10} />} onClick={onRefresh} aria-label="Retry" />
                                </Flex>
                            ) : signal.data?.length > 0 ? (
                                <DataTable data={signal.data} name={signal.name} searchTerm={searchTerm} handlers={handlers} />
                            ) : signal.loading ? (
                                <Flex align="center" justify="center" h="full">
                                    <VStack spacing={3}>
                                        <Spinner size={isFullScreen ? "xl" : "md"} color="blue.400" thickness="4px" />
                                        <Text color="gray.500" fontSize={isFullScreen ? "14px" : "12px"} fontWeight="bold" fontFamily="monospace">ESTABLISHING LINK...</Text>
                                    </VStack>
                                </Flex>
                            ) : (
                                <Flex align="center" justify="center" h="full" direction="column" bg="gray.50">
                                    <Activity size={isFullScreen ? 48 : 28} color="#CBD5E0" />
                                    <Text color="gray.400" fontSize={isFullScreen ? "14px" : "12px"} fontWeight="bold" fontFamily="monospace" mt={2}>NO DATA PACKETS</Text>
                                    <Text color="gray.400" fontSize={isFullScreen ? "10px" : "9px"} mt={0.5}>Waiting for telemetry...</Text>
                                </Flex>
                            )}
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};
