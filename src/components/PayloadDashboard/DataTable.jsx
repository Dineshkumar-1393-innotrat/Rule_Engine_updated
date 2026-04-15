import React from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Text, Flex, Badge, HStack, Button, IconButton } from '@chakra-ui/react';
import { Download, AlertTriangle } from 'lucide-react';
import { formatFullDate, deepFormatDates } from './dataUtils';

export const DataTable = ({ data, name, searchTerm = '', handlers = {} }) => {
    const { handleDownloadLog, handleDeleteLog, handleNotificationAction } = handlers;
    
    if (!data) return <Flex align="center" justify="center" h="full" p={4}><Text fontSize="12px" color="orange.500" fontWeight="bold">NO DATA</Text></Flex>;
    const arr = Array.isArray(data) ? data : [data];
    if (!arr.length) return <Flex align="center" justify="center" h="full" p={4}><Text fontSize="12px" color="gray.500">NO RECORDS</Text></Flex>;
    const term = searchTerm.toLowerCase();
    const nameMatch = name.toLowerCase().includes(term);
    const allKeys = Array.from(new Set(arr.flatMap(item => typeof item === 'object' && item ? Object.keys(item) : [])));

    if (name === 'Remote Commands') {
        return (
            <Box w="100%" overflowX="auto">
                <Table size="sm" variant="simple">
                    <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                        <Tr>{['Command ID', 'Action', 'Status', 'Time', 'Details'].map(k => <Th key={k} fontSize="10px" color="gray.600" textTransform="uppercase" px={3} py={2} borderBottom="2px solid" borderColor="gray.200" fontWeight="800">{k}</Th>)}</Tr>
                    </Thead>
                    <Tbody>
                        {arr.map((cmd, idx) => {
                            const r = cmd.apiResponse || {};
                            const sc = (cmd.status || '').toLowerCase();
                            const col = sc.includes('success') ? 'green' : sc.includes('pending') ? 'yellow' : 'red';
                            return (
                                <Tr key={idx} _hover={{ bg: 'gray.50' }}>
                                    <Td fontSize="11px" py={2} px={3} fontFamily="monospace" fontWeight="bold" color="gray.700">{r.commandId || cmd.commandId || '-'}</Td>
                                    <Td fontSize="11px" py={2} px={3} fontFamily="monospace" color="gray.800">{r.actionType || cmd.command || '-'}</Td>
                                    <Td fontSize="11px" py={2} px={3}><Badge colorScheme={col} fontSize="9px">{(cmd.status || '-').toUpperCase()}</Badge></Td>
                                    <Td fontSize="11px" py={2} px={3} color="gray.500">{cmd.time || '-'}</Td>
                                    <Td fontSize="11px" py={2} px={3} color="gray.500" maxW="200px" isTruncated>{r.comments || cmd.error || '-'}</Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>
            </Box>
        );
    }

    if (name === 'Ignition Status' || name === 'Device Events') {
        const priority = ['eventtype', 'sourcetimestamp', 'eventValue', 'signalValue', 'sourceid', 'message', 'details', 'updatedTimeStamp'];
        const allK = Array.from(new Set(arr.flatMap(item => {
            let d = {}; try { d = typeof item.eventdetails === 'string' ? JSON.parse(item.eventdetails) : item.eventdetails || {}; } catch (e) { }
            return [...Object.keys(item).filter(k => k !== 'eventdetails'), ...Object.keys(d).map(k => `details.${k}`)];
        })));
        const keys = allK.sort((a, b) => { const ia = priority.indexOf(a), ib = priority.indexOf(b); if (ia !== -1 && ib !== -1) return ia - ib; if (ia !== -1) return -1; if (ib !== -1) return 1; return 0; }).slice(0, 10);
        return (
            <Box w="100%" overflowX="auto">
                <Table size="sm" variant="simple">
                    <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                        <Tr>{keys.map(k => <Th key={k} fontSize="10px" color="gray.600" textTransform="uppercase" px={3} py={2} fontWeight="800" whiteSpace="nowrap">{k.replace('details.', '')}</Th>)}</Tr>
                    </Thead>
                    <Tbody>
                        {arr.slice(0, 20).map((item, idx) => {
                            let d = {}; try { d = typeof item.eventdetails === 'string' ? JSON.parse(item.eventdetails) : item.eventdetails || {}; } catch (e) { }
                            return (
                                <Tr key={idx} _hover={{ bg: 'gray.50' }}>
                                    {keys.map(key => {
                                        let val = key.startsWith('details.') ? d[key.replace('details.', '')] : item[key];
                                        if (key.includes('timestamp')) { try { const dt = new Date(val); if (!isNaN(dt)) val = dt.toLocaleString(); } catch (e) { } }
                                        const isEV = ['details.eventValue', 'eventValue', 'signalValue'].includes(key);
                                        const isOn = ['RUN', 'START', 'ON'].includes(String(val || '').toUpperCase());
                                        
                                        if (typeof val === 'object' && val !== null) {
                                            return (
                                                <Td key={key} fontSize="10px" py={2} px={3}>
                                                    <Box maxH="120px" maxW="300px" overflow="auto" bg="gray.100" p={1.5} borderRadius="md" border="1px solid" borderColor="gray.200">
                                                        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '10px' }}>{JSON.stringify(val, null, 2)}</pre>
                                                    </Box>
                                                </Td>
                                            );
                                        }

                                        return <Td key={key} fontSize="11px" py={2} px={3} fontFamily="monospace" fontWeight={isEV ? '700' : '500'} color={isEV && isOn ? 'green.600' : 'gray.800'} bg={isEV && isOn ? 'green.50' : 'transparent'} whiteSpace="nowrap">{val !== null && val !== undefined ? String(val) : '-'}</Td>;
                                    })}
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>
            </Box>
        );
    }

    if (name === 'Log Files List') {
        const priority = ['fileName', 'fileSize', 'createdTime', 'status'];
        const keys = allKeys.sort((a, b) => { const ia = priority.indexOf(a), ib = priority.indexOf(b); if (ia !== -1 && ib !== -1) return ia - ib; if (ia !== -1) return -1; if (ib !== -1) return 1; return a.localeCompare(b); }).slice(0, 6);
        return (
            <Box w="100%" overflowX="auto">
                <Table size="sm" variant="simple">
                    <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                        <Tr>
                            {keys.map(k => <Th key={k} fontSize="10px" color="gray.600" textTransform="uppercase" px={3} py={2} fontWeight="800">{k}</Th>)}
                            <Th fontSize="10px" color="gray.600" textTransform="uppercase" px={3} py={2} fontWeight="800">Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {arr.map((file, idx) => (
                            <Tr key={idx} _hover={{ bg: 'gray.50' }}>
                                {keys.map(k => {
                                    let v = file[k];
                                    if (k === 'fileSize' && v) v = (v / 1024).toFixed(1) + ' KB';
                                    if (k === 'createdTime' && v) v = formatFullDate(v);
                                    return <Td key={k} fontSize="11px" py={2} px={3} fontFamily="monospace" color="gray.800">{v !== null && v !== undefined ? String(v) : '-'}</Td>;
                                })}
                                <Td px={3} py={1}>
                                    <HStack spacing={1}>
                                        <IconButton icon={<Download size={12} />} size="xs" colorScheme="blue" variant="ghost" onClick={() => handleDownloadLog && handleDownloadLog(file.fileName)} aria-label="Download" />
                                        <IconButton icon={<AlertTriangle size={12} />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDeleteLog && handleDeleteLog(file.fileName)} aria-label="Delete" />
                                    </HStack>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        );
    }

    // Generic
    if (!allKeys.length) return <Flex align="center" justify="center" h="full" p={4} direction="column"><AlertTriangle size={20} color="#DD6B20" /><Text fontSize="11px" color="orange.500" mt={2}>IMPROPER FORMAT</Text></Flex>;
    let priority = ['signalValue', 'signalUnit', 'updatedTimeStamp', 'packetStatus', 'messageName'];
    if (name.includes('Trip')) priority = ['tripId', 'startTime', 'endTime', 'distance', 'duration', 'topSpeed'];
    else if (name === 'Alerts') priority = ['alertType', 'timeStamp', 'vehicleSpeed', 'alertId', 'sourceid', 'version'];
    else if (name === 'Jeep Vehicle Status') priority = ['vinNo', 'status', 'ignitionStatus', 'fuelLevel', 'batteryVoltage'];
    else if (name === 'Device Join Status') priority = ['alertName', 'body', 'signalTimeStamp', 'createdTimeStamp', 'updatedTimeStamp', 'gpsLat', 'gpsLong', 'read'];

    const friendlyHeaders = {
        alertName: 'Alert',
        body: 'Description',
        signalTimeStamp: 'Signal Time',
        createdTimeStamp: 'Created At',
        updatedTimeStamp: 'Updated At',
        gpsLat: 'Latitude',
        gpsLong: 'Longitude',
        read: 'Status'
    };

    let sortedKeys = allKeys.sort((a, b) => { const ia = priority.indexOf(a), ib = priority.indexOf(b); if (ia !== -1 && ib !== -1) return ia - ib; if (ia !== -1) return -1; if (ib !== -1) return 1; return a.localeCompare(b); });
    const keys = (name === 'Jeep Vehicle Status' || name === 'Alerts' || name === 'Device Join Status') ? sortedKeys : sortedKeys.slice(0, 8);
    const rows = nameMatch ? arr.slice(0, 25) : arr.filter(item => keys.some(k => String(item[k] ?? '').toLowerCase().includes(term))).slice(0, 25);
    if (!rows.length) return <Flex align="center" justify="center" h="full" p={4}><Text fontSize="12px" color="gray.500">No matching records.</Text></Flex>;
    return (
        <Box w="100%" overflowX="auto">
            <Table size="sm" variant="simple">
                <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                    <Tr>
                        {keys.map(k => <Th key={k} fontSize="10px" color="gray.600" textTransform="uppercase" px={3} py={2} borderBottom="2px solid" borderColor="gray.200" fontWeight="800" whiteSpace="nowrap">{friendlyHeaders[k] || k}</Th>)}
                        {name === 'Device Join Status' && <Th fontSize="10px" color="gray.600" textTransform="uppercase" px={3} py={2} borderBottom="2px solid" borderColor="gray.200" fontWeight="800">Actions</Th>}
                    </Tr>
                </Thead>
                <Tbody>
                    {rows.map((item, idx) => (
                        <Tr key={idx} _hover={{ bg: 'blue.50' }}>
                            {keys.map(k => {
                                let v = item[k];
                                if (typeof v === 'object' && v !== null) {
                                    const formattedObj = deepFormatDates(v);
                                    return (
                                        <Td key={k} fontSize="10px" py={2} px={3}>
                                            <Box maxH="120px" maxW="300px" overflow="auto" bg="gray.100" p={1.5} borderRadius="md">
                                                <pre style={{ margin: 0, fontFamily: 'monospace' }}>{JSON.stringify(formattedObj, null, 2)}</pre>
                                            </Box>
                                        </Td>
                                    );
                                }
                                if (k && (k.toLowerCase().includes('time') || k.toLowerCase().includes('stamp') || k.toLowerCase().includes('date')) && v && (typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))))) {
                                    v = formatFullDate(v);
                                }
                                if (k === 'read' && name === 'Device Join Status') {
                                    return <Td key={k} fontSize="11px" py={2} px={3}><Badge colorScheme={v ? 'green' : 'red'} fontSize="9px">{v ? 'READ' : 'UNREAD'}</Badge></Td>;
                                }
                                if ((k === 'gpsLat' || k === 'gpsLong') && !isNaN(parseFloat(v))) {
                                    v = parseFloat(v).toFixed(6);
                                }
                                return <Td key={k} fontSize="11px" py={2} px={3} fontFamily="monospace" fontWeight="500" color="gray.800" whiteSpace={k === 'body' ? 'normal' : 'nowrap'}>{v !== null && v !== undefined ? String(v) : '-'}</Td>;
                            })}
                            {name === 'Device Join Status' && (
                                <Td px={3} py={1}>
                                    <HStack spacing={1}>
                                        <Button size="xxs" fontSize="8px" colorScheme="blue" variant="ghost" height="20px" px={1} onClick={() => handleNotificationAction && handleNotificationAction('Mark Read', item.notificationId || item.id)}>READ</Button>
                                        <Button size="xxs" fontSize="8px" colorScheme="red" variant="ghost" height="20px" px={1} onClick={() => handleNotificationAction && handleNotificationAction('Delete', item.notificationId || item.id)}>DEL</Button>
                                    </HStack>
                                </Td>
                            )}
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};
