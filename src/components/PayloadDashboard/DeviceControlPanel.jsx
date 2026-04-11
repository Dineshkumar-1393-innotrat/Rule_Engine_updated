import React from 'react';
import { Box, SimpleGrid, HStack, Heading, Badge, Text, Wrap, Button, Input, IconButton, Stack } from '@chakra-ui/react';
import { Info, Radio, Lock, Unlock, Zap, Volume2, Download, AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

export const DeviceDetails = ({ deviceState, vin }) => {
    if (!deviceState) return null;
    return (
        <Box mb={6}>
            <HStack spacing={2} mb={3}>
                <Info size={15} color="#3B6FE8" />
                <Heading size="xs" color="gray.700">Device Details</Heading>
                <Badge colorScheme={deviceState.deviceConnectedState === 'CONNECTED' ? 'green' : 'red'} variant="solid" fontSize="9px">{deviceState.deviceConnectedState || 'UNKNOWN'}</Badge>
            </HStack>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} gap={3}>
                {[
                    ['VIN', deviceState.vinNo || vin],
                    ['ICCID', deviceState.iccid],
                    ['IMEI', deviceState.imei],
                    ['Model', deviceState.car_model],
                    ['FW Version', deviceState.firmwareVersion || deviceState.fwVersion],
                    ['Last Seen', deviceState.lastActiveTime ? new Date(deviceState.lastActiveTime).toLocaleTimeString() : null]
                ].map(([label, value]) => value && (
                    <Box key={label} p={3} bg="gray.50" borderRadius="lg">
                        <Text fontSize="9px" color="gray.400" fontWeight="black" textTransform="uppercase" mb={0.5}>{label}</Text>
                        <Text fontWeight="700" fontSize="11px" color="gray.800" fontFamily="monospace" isTruncated>{value}</Text>
                    </Box>
                ))}
            </SimpleGrid>
        </Box>
    );
};

export const RemoteCommands = ({ commandLoading, handleCommand, speedAlert, setSpeedAlert, fotaVersion, setFotaVersion, isFotaUpdating, handleFotaUpdate, handleFotaReset, TraxoApi }) => {
    return (
        <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm">
            <HStack spacing={2} mb={4}><Radio size={15} color="#3B6FE8" /><Heading size="xs" color="gray.700">Remote Commands</Heading></HStack>
            <Wrap spacing={3} mb={4} justify={{ base: 'center', md: 'flex-start' }}>
                {[
                    { label: 'Lock Door', icon: Lock, fn: TraxoApi?.lockDoor, color: 'blue' },
                    { label: 'Unlock Door', icon: Unlock, fn: TraxoApi?.unlockDoor, color: 'blue' },
                    { label: 'Blinker ON', icon: Zap, fn: TraxoApi?.blinkerOn, color: 'orange' },
                    { label: 'Blinker OFF', icon: Zap, fn: TraxoApi?.blinkerOff, color: 'orange' },
                    { label: 'Honk', icon: Volume2, fn: TraxoApi?.honk, color: 'red' },
                    { label: 'Fetch Logs', icon: Download, fn: TraxoApi?.fetchDeviceLogs, color: 'green', isConcurrent: true },
                ].map(({ label, icon: Icon, fn, color, isConcurrent }) => (
                    <Button
                        key={label}
                        size={{ base: 'md', md: 'sm' }}
                        minH={{ base: '48px', md: 'auto' }}
                        colorScheme={color}
                        variant="outline"
                        isLoading={commandLoading === label}
                        leftIcon={<Icon size={13} />}
                        onClick={() => handleCommand(label, fn, [], isConcurrent)}
                        borderRadius="lg"
                        fontWeight="700"
                        fontSize="12px"
                        _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
                        transition="all 0.2s"
                        flex={{ base: '1 0 45%', md: 'none' }}
                    >
                        {label}
                    </Button>
                ))}
            </Wrap>

            <Box pt={3} borderTop="1px dashed" borderColor="gray.200" mb={3}>
                <Text fontSize="10px" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>Speed Alert</Text>
                <HStack spacing={2}>
                    <Input placeholder="Speed limit (km/h)" value={speedAlert} onChange={e => setSpeedAlert(e.target.value)} size="sm" w="160px" bg="gray.50" borderRadius="lg" color="black" border="none" />
                    <Button size="sm" colorScheme="red" variant="outline" borderRadius="lg" leftIcon={<AlertTriangle size={13} />} isLoading={commandLoading === 'Speed Alert'} isDisabled={!speedAlert} onClick={() => handleCommand('Speed Alert', TraxoApi?.setSpeedAlert, [speedAlert])}>Set Alert</Button>
                </HStack>
            </Box>

            <Box pt={3} borderTop="1px dashed" borderColor="gray.200">
                <Text fontSize="10px" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>Firmware Over-The-Air (FOTA)</Text>
                <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
                    <Input placeholder="Version (e.g. 2314.0)" value={fotaVersion} onChange={e => setFotaVersion(e.target.value)} size="sm" w={{ base: 'full', sm: '170px' }} bg="gray.50" borderRadius="lg" color="black" border="none" />
                    <Button size="sm" colorScheme="purple" isLoading={isFotaUpdating} loadingText="Updating..." onClick={handleFotaUpdate} leftIcon={<RotateCcw size={13} />} borderRadius="lg" w={{ base: 'full', sm: 'auto' }}>Trigger FOTA</Button>
                    <Button size="sm" variant="ghost" colorScheme="gray" onClick={handleFotaReset} leftIcon={<RefreshCw size={13} />} borderRadius="lg" w={{ base: 'full', sm: 'auto' }}>Reset State</Button>
                </Stack>
            </Box>
        </Box>
    );
};
