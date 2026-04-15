import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Flex,
    IconButton,
    Text,
    Spacer,
    useToast,
    SimpleGrid,
    Heading,
    HStack
} from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { TraxoApi } from '../../utils/TraxoApi';
import { formatFullDate } from './dataUtils';

// Extracted Components
import { DashboardHeader } from './DashboardHeader';
import { VisualView } from './VisualView';
import { SignalCard } from './SignalCard';
import { DeviceEventsList } from './DeviceEventsList';
import { DeviceDetails, RemoteCommands } from './DeviceControlPanel';
import { BulkProvisionSection } from './BulkProvisionSection';

const THEME = { bg: 'gray.50' };

const PayloadDashboardPage = () => {
    const { vin: urlVin } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [vin, setVin] = useState(urlVin || localStorage.getItem('last_vin') || 'MCANJREB1MFA65412');
    const [signals, setSignals] = useState([
        { name: 'Fuel Level', apiName: 'fuelPercentage', id: '0x356', isChecked: true, data: [], loading: false, error: null, useVehicleStatus: true },
        { name: 'Total Odometer', apiName: 'odometer', id: '0x760', isChecked: true, data: [], loading: false, error: null, useVehicleStatus: true },
        { name: 'Engine Water Temp', apiName: 'coolant', id: '0x3E2', isChecked: true, data: [], loading: false, error: null, useVehicleStatus: true },
        { name: 'Engine Speed', apiName: 'engineRpm', id: '0x3E6', isChecked: true, data: [], loading: false, error: null, useVehicleStatus: true },
        { name: 'Vehicle Speed', apiName: 'speed', id: '0x3E8', isChecked: true, data: [], loading: false, error: null, hideInConsole: true, useVehicleStatus: true },
        { name: 'Battery Voltage Level', apiName: 'battery', id: '0x46C', isChecked: true, data: [], loading: false, error: null, useVehicleStatus: true },
        { name: 'Ignition Status', apiName: 'CmdIgnSts', id: '0x46C', isChecked: true, data: [], loading: false, error: null, fetchType: 'ignition' },
        { name: 'External Temperature (F)', apiName: 'ExternalTemperatureF', id: '0x46C', isChecked: true, data: [], loading: false, error: null, useVehicleStatus: true },
        { name: 'External Temperature (C)', apiName: 'ExternalTemperatureC', id: '0x46C', isChecked: true, data: [], loading: false, error: null, useVehicleStatus: true },
        { name: 'Location', apiName: 'Location', id: 'location', isChecked: true, data: [], loading: false, error: null, fetchType: 'location' },
        { name: 'Alerts', apiName: 'Alerts', id: 'alerts', isChecked: true, data: [], loading: false, error: null, fetchType: 'alerts' },
        { name: 'Device Events', apiName: 'DeviceEvents', id: 'events', isChecked: true, data: [], loading: false, error: null, fetchType: 'events' },
        { name: 'Remote Commands', apiName: 'CommandLog', id: 'action', isChecked: true, data: [], loading: false, error: null, fetchType: 'manual' },
        { name: 'Trip History', apiName: 'TripSummary', id: 'trips', isChecked: true, data: [], loading: false, error: null, fetchType: 'trips' },
        { name: 'Device Logs', apiName: 'DeviceLogs', id: 'logs', isChecked: true, data: [], loading: false, error: null, fetchType: 'logs' },
        { name: 'Jeep Vehicle Status', apiName: 'VehicleStatus', id: 'vehicleStatus', isChecked: true, data: [], loading: false, error: null, fetchType: 'vehicleStatus' },
        { name: 'Log Files List', apiName: 'LogFiles', id: 'log_files', isChecked: true, data: [], loading: false, error: null, fetchType: 'files' },
        { name: 'Alert Ingestion Audit', apiName: 'AlertIngestion', id: 'alert_audit', isChecked: true, data: [], loading: false, error: null, fetchType: 'alerts_audit' },
        { name: 'Signal List', apiName: 'SignalList', id: 'signals_list', isChecked: true, data: [], loading: false, error: null, fetchType: 'signals' },
        { name: 'Telemetry Message List', apiName: 'TelemetryMessages', id: 'msg_list', isChecked: false, data: [], loading: false, error: null, fetchType: 'messages' },
        { name: 'Trip Pagination', apiName: 'TripDetailsPaginated', id: 'trip_paginated', isChecked: false, data: [], loading: false, error: null, fetchType: 'trip_pagination' },
        { name: 'Trip ID Search', apiName: 'TripDetailsById', id: 'trip_by_id', isChecked: false, data: [], loading: false, error: null, fetchType: 'trip_details' },
        { name: 'Portal Search', apiName: 'PortalSearch', id: 'portal_lookup', isChecked: false, data: [], loading: false, error: null, fetchType: 'search' },
        { name: 'Device Join Status', apiName: 'DeviceJoinStatus', id: 'notification_api', isChecked: true, data: [], loading: false, error: null, fetchType: 'notification' },
        { name: 'Command History Audit', apiName: 'CommandAudit', id: 'cmd_audit', isChecked: true, data: [], loading: false, error: null, fetchType: 'command_audit' },
    ]);

    const [viewMode, setViewMode] = useState('visual');
    const [isLive, setIsLive] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [highestSpeed, setHighestSpeed] = useState(0);
    const [deviceState, setDeviceState] = useState(null);
    const [ongoingTrip, setOngoingTrip] = useState(null);
    const [commandLoading, setCommandLoading] = useState(null);
    const [fotaVersion, setFotaVersion] = useState('2314.0');
    const [isFotaUpdating, setIsFotaUpdating] = useState(false);
    const [speedAlert, setSpeedAlert] = useState('');
    const [lastRefreshTime, setLastRefreshTime] = useState(null);
    const [pollingInterval, setPollingInterval] = useState(10);

    const pollingTimeout = useRef(null);

    useEffect(() => {
        if (vin) {
            localStorage.setItem('last_vin', vin);
            // navigate(`/payload-dashboard/${vin}`, { replace: true });
            setSignals(prev => prev.map(s => ({ ...s, data: [], loading: false, error: null, hasFetched: false })));
            setDeviceState(null);
            setOngoingTrip(null);
            (async () => {
                await Promise.all([fetchCheckedSignals(), fetchOtherData()]);
                if (isLive) startPolling();
            })();
        }
        return () => stopPolling();
    }, [vin]);

    useEffect(() => {
        if (urlVin && urlVin !== vin) {
            setVin(urlVin);
        }
    }, [urlVin]);

    useEffect(() => {
        if (isLive) startPolling();
        else stopPolling();
    }, [isLive]);

    const startPolling = () => {
        if (pollingTimeout.current) clearTimeout(pollingTimeout.current);
        const poll = async () => {
            if (!isLive || !vin) return;
            try { await Promise.all([fetchCheckedSignals(), fetchOtherData()]); } catch (e) { console.warn('Poll error', e); }
            if (isLive) pollingTimeout.current = setTimeout(poll, pollingInterval * 1000);
        };
        pollingTimeout.current = setTimeout(poll, pollingInterval * 1000);
    };

    const stopPolling = () => {
        if (pollingTimeout.current) {
            clearTimeout(pollingTimeout.current);
            pollingTimeout.current = null;
        }
    };

    // Helper logic from modal extracted here
    const mapVSToSignal = (vsData, signal) => {
        if (!vsData) return null;
        let d = vsData;
        if (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) d = d.data;
        else if (d.result && typeof d.result === 'object' && !Array.isArray(d.result)) d = d.result;
        else if (d.vehicleStatus && typeof d.vehicleStatus === 'object') d = d.vehicleStatus;
        if (Array.isArray(d)) d = d[0];
        if (!d) return null;

        let val = d[signal.apiName] ?? d[signal.name.toLowerCase()] ?? null;
        let unit = '';
        let msg = 'STATUS_VEHICLE_STATUS';

        if (signal.name === 'Fuel Level') { unit = '%'; msg = 'STATUS_BH_BCM1'; }
        else if (signal.name === 'Total Odometer') { unit = 'km'; msg = 'TRIP_A_B'; }
        else if (signal.name === 'Engine Water Temp') { unit = '°C'; msg = 'STATUS_CCAN3'; }
        else if (signal.name === 'Engine Speed') { unit = '1/min'; msg = 'STATUS_CCAN5'; }
        else if (signal.name === 'Vehicle Speed') { unit = 'km/h'; msg = 'VEHICLE_SPEED'; }
        else if (signal.name === 'Battery Voltage Level') { unit = 'V'; msg = 'BATTERY_STATUS'; }
        else if (signal.name === 'External Temperature (C)') { unit = '°C'; msg = 'STATUS_AMBIENT'; val = d.ambientTemp ?? d.externalTemp ?? d.outsideTemp; }
        else if (signal.name === 'External Temperature (F)') { unit = '°F'; msg = 'STATUS_AMBIENT'; let v = d.ambientTemp ?? d.externalTemp ?? d.outsideTemp; val = v !== null ? (v * 1.8 + 32).toFixed(1) : null; }

        if (val === null || val === undefined) return null;

        return [{
            signalValue: val,
            signalUnit: unit,
            updatedTimeStamp: d.lastUpdateTime || d.updatedtimestamp || new Date().toISOString(),
            packetStatus: '0',
            messageName: msg,
            canType: 'VehicleTelemetry',
            createdTimeStamp: new Date().toISOString()
        }];
    };

    const fetchOtherData = async () => {
        if (!vin) return;
        try {
            const s = await TraxoApi.getDeviceState(vin);
            if (s) setDeviceState(s);
            try {
                const t = await TraxoApi.getOngoingTrip(vin);
                if (t) {
                    setOngoingTrip(t);
                    const ts = parseFloat(t.topSpeed || t.maxSpeed || 0);
                    if (!isNaN(ts) && ts > 0) setHighestSpeed(prev => Math.max(prev, ts));
                }
            } catch (e) { console.warn('Trip fetch failed', e); }
        } catch (e) { console.error('fetchOtherData', e); }
    };

    const fetchCheckedSignals = async () => {
        if (!vin) return;
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fmtStart = sevenDaysAgo.toISOString().split('T')[0] + ' 00:00:00';
        const fmtEnd = today + ' 23:59:59';

        const needsVS = signals.some(s => s.isChecked && s.useVehicleStatus);
        let vsData = null;
        if (needsVS) {
            try { vsData = await TraxoApi.getVehicleStatus(vin); }
            catch (e) { console.warn('VehicleStatus fetch error', e); }
        }

        const promises = signals.map(async (signal) => {
            if (!signal.isChecked) return null;
            try {
                let newData;
                if (signal.useVehicleStatus && vsData) {
                    newData = mapVSToSignal(vsData, signal);
                    return { name: signal.name, newData };
                }

                if (signal.fetchType === 'events') newData = await TraxoApi.getEvents(vin, 50, `${today} 00:00:00`, `${today} 23:59:59`);
                else if (signal.fetchType === 'ignition') newData = await TraxoApi.getIgnitionEvents(vin, fmtStart, fmtEnd);
                else if (signal.fetchType === 'location') newData = await TraxoApi.getLocationTelemetryArray(vin);
                else if (signal.fetchType === 'alerts') newData = await TraxoApi.getAlerts(vin);
                else if (signal.fetchType === 'trips') {
                    const format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
                    const now = new Date();
                    const past = new Date(); past.setDate(past.getDate() - 30);
                    newData = await TraxoApi.getTripSummary(vin, format(past), format(now));
                }
                else if (signal.fetchType === 'logs') newData = await TraxoApi.listLogFiles(vin);
                else if (signal.fetchType === 'vehicleStatus') newData = await TraxoApi.getVehicleStatus(vin);
                else if (signal.fetchType === 'files') newData = await TraxoApi.listLogFiles(vin);
                else if (signal.fetchType === 'alerts_audit') newData = await TraxoApi.getAlertIngestion(vin);
                else if (signal.fetchType === 'signals') newData = await TraxoApi.getSignalList('356');
                else if (signal.fetchType === 'messages') newData = await TraxoApi.getVehicleTelemetryMessageList();
                else if (signal.fetchType === 'trip_pagination') newData = await TraxoApi.getTripDetailsWithPagination(vin, 0);
                else if (signal.fetchType === 'trip_details') {
                    const tid = ongoingTrip?.tripId || signals.find(s => s.name === 'Trip History')?.data[0]?.tripId;
                    if (tid) newData = await TraxoApi.getTripDetailsByTripId(vin, tid);
                    else return null;
                }
                else if (signal.fetchType === 'search') newData = await TraxoApi.portalSearch(vin, 'vin');
                else if (signal.fetchType === 'notification') newData = await TraxoApi.getDeviceJoinStatus(vin);
                else if (signal.fetchType === 'command_audit') newData = await TraxoApi.getCommandAudit(vin);
                else if (signal.fetchType !== 'manual') newData = await TraxoApi.getVehicleTelemetry(vin, signal.apiName);
                else return null;

                // Simple normalization logic (already moved to separate file in the modal, keeping it clean here)
                return { name: signal.name, newData };
            } catch (error) {
                return { name: signal.name, error: error.message || 'Fetch failed' };
            }
        });

        const results = await Promise.all(promises);
        setSignals(prevSignals => prevSignals.map(signal => {
            const result = results.find(r => r?.name === signal.name);
            if (!result) return signal;
            const { newData, error } = result;
            if (error) return { ...signal, error, loading: false };
            if (newData !== null && newData !== undefined) {
                // Simplified update logic for the page
                return { ...signal, data: Array.isArray(newData) ? newData : [newData], loading: false, lastUpdated: formatFullDate(new Date()), error: null };
            }
            return signal;
        }));
    };

    const handleRefresh = async () => {
        if (!vin) return;
        try {
            await Promise.all([fetchCheckedSignals(), fetchOtherData()]);
            toast({ title: 'Dashboard Refreshed', status: 'info', duration: 1500 });
        } catch (e) {
            toast({ title: 'Refresh Failed', status: 'error', duration: 3000 });
        }
    };

    const handleExport = () => {
        const exportData = { vin, exportTime: new Date().toISOString(), signals: signals.filter(s => s.data?.length > 0) };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `payload_${vin}.json`; a.click();
        URL.revokeObjectURL(url);
    };

    const pollCommandStatus = async (commandName, commandId, isFota = false, isConcurrent = false) => {
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            if (attempts > 20) { clearInterval(interval); return; }
            try {
                let status;
                if (isFota) { const d = await TraxoApi.getFotaCommandStatus(commandId); status = d.commandstatus || d.status || 'Unknown'; }
                else if (isConcurrent) { const d = await TraxoApi.getConcurrentCommandStatus(vin, commandId); status = d.commandStatus || d.status || 'Unknown'; }
                else { const d = await TraxoApi.getCommandStatus(vin, commandId); status = d.commandStatus || 'Unknown'; }

                setSignals(prev => prev.map(s => s.name === 'Remote Commands' ? { ...s, data: s.data.map(cmd => cmd.commandId === commandId ? { ...cmd, status } : cmd) } : s));

                const terminals = isFota ? ['Success', 'Timed Out', 'Failed', 'Cancelled', 'Completed', 'Error'] : ['Success', 'Timed Out', 'Failed', 'Cancelled'];
                if (terminals.includes(status)) {
                    clearInterval(interval);
                    if (['Success', 'Completed'].includes(status)) toast({ title: `${commandName} Success`, status: 'success', duration: 3000 });
                    else if (status === 'Timed Out') toast({ title: `${commandName} Timed Out`, status: 'warning', duration: 3000 });
                }
            } catch (e) { console.warn('Status poll failed', e); }
        }, 3000);
    };

    const handleCommand = async (commandName, apiCall, params = [], isConcurrent = false) => {
        if (!apiCall) return;
        setCommandLoading(commandName);
        const timestamp = new Date().toLocaleTimeString();
        try {
            const result = await apiCall(vin, ...params);
            const commandId = result.commandId || result.data?.commandId;
            toast({ title: `${commandName} Sent`, description: 'Waiting for device...', status: 'info', duration: 2000 });

            setSignals(prev => prev.map(s => s.name === 'Remote Commands' ? {
                ...s,
                data: [{ command: commandName, status: 'PENDING', time: timestamp, commandId, apiResponse: result }, ...s.data].slice(0, 50)
            } : s));

            if (commandId) pollCommandStatus(commandName, commandId, false, isConcurrent);
        } catch (error) {
            toast({ title: `${commandName} Failed`, description: error.message, status: 'error', duration: 3000 });
            setSignals(prev => prev.map(s => s.name === 'Remote Commands' ? {
                ...s,
                data: [{ command: commandName, status: 'FAILED', time: timestamp, error: error.message, apiResponse: { message: error.message } }, ...s.data].slice(0, 50)
            } : s));
        } finally {
            setCommandLoading(null);
        }
    };

    const handleNotificationAction = async (action, id) => {
        try {
            if (action === 'Mark Read') await TraxoApi.updateNotificationStatus(id);
            else if (action === 'Delete') await TraxoApi.deleteNotification(id);
            toast({ title: `Notification ${action} Success`, status: 'success' });
            handleRefresh();
        } catch (error) {
            toast({ title: 'Action Failed', description: error.message, status: 'error' });
        }
    };

    const handleDownloadLog = async (filename) => {
        try {
            const blob = await TraxoApi.downloadLogFile(vin, filename);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            toast({ title: 'Download Failed', status: 'error' });
        }
    };

    const handleDeleteLog = async (filename) => {
        if (!confirm(`Delete log file ${filename}?`)) return;
        try {
            await TraxoApi.deleteLogFile(vin, filename);
            toast({ title: 'Log File Deleted', status: 'success' });
            handleRefresh();
        } catch (error) {
            toast({ title: 'Delete Failed', status: 'error' });
        }
    };

    const handleFotaUpdate = async () => {
        if (!fotaVersion) { toast({ title: 'Enter firmware version', status: 'error' }); return; }
        setIsFotaUpdating(true);
        try {
            const newCmd = { command: 'FOTA Update', status: 'PENDING', time: new Date().toLocaleTimeString(), apiResponse: { actionType: 'FOTA_DOWNLOAD', version: fotaVersion, status: 'PENDING' } };
            setSignals(prev => prev.map(s => s.name === 'Remote Commands' ? { ...s, data: [newCmd, ...s.data] } : s));
            const response = await TraxoApi.triggerFotaUpdate(vin, fotaVersion);
            const commandId = response.commandId || response.fotaId || response.data?.commandId;
            setSignals(prev => prev.map(s => s.name === 'Remote Commands' && s.data.length ? { ...s, data: [{ ...s.data[0], status: commandId ? 'PENDING' : 'SUCCESS', commandId, apiResponse: response }, ...s.data.slice(1)] } : s));
            if (commandId) pollCommandStatus('FOTA Update', commandId, true);
            toast({ title: 'FOTA Update Initiated', status: 'success', duration: 3000 });
        } catch (error) {
            setSignals(prev => prev.map(s => s.name === 'Remote Commands' && s.data.length ? { ...s, data: [{ ...s.data[0], status: 'FAILED', apiResponse: { error: error.message } }, ...s.data.slice(1)] } : s));
            toast({ title: 'FOTA Failed', description: error.message, status: 'error', duration: 5000 });
        } finally { setIsFotaUpdating(false); }
    };

    const handleFotaReset = async () => {
        if (!confirm('Reset FOTA state for this vehicle?')) return;
        try { await TraxoApi.resetFotaState(vin); toast({ title: 'FOTA State Reset', status: 'success', duration: 3000 }); }
        catch (error) { toast({ title: 'FOTA Reset Failed', description: error.message, status: 'error', duration: 5000 }); }
    };

    const activeSignals = signals.filter(s => s.data?.length > 0).length;
    const errorSignals = signals.filter(s => s.error).length;
    const totalSignals = signals.length;
    const filteredSignals = signals.filter(s => s.isChecked && !s.hideInConsole && (!searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())));
    const filteredSignalsCount = filteredSignals.length;

    return (
        <Box minH="100vh" bg={THEME.bg}>
            {/* Header */}
            <DeviceEventsList events={signals.find(s => s.name === 'Device Events')?.data || []} />

            <DashboardHeader
                viewMode={viewMode} setViewMode={setViewMode}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                vin={vin} setVin={setVin}
                pollingInterval={pollingInterval} setPollingInterval={setPollingInterval}
                isLive={isLive} setIsLive={setIsLive}
                handleRefresh={handleRefresh}
                handleExport={handleExport}
            />

            {viewMode === 'visual' ? (
                <VisualView signals={signals} deviceState={deviceState} highestSpeed={highestSpeed} />
            ) : (
                <Box position="relative">
                    <Box position="absolute" top={0} left={0} right={0} bottom={0} backgroundImage="radial-gradient(circle, #dde4f0 1.5px, transparent 1.5px)" backgroundSize="32px 32px" pointerEvents="none" opacity={0.4} zIndex={0} />
                    <Box position="relative" zIndex={1}>
                        <Flex align="center" justify="space-between" mb={4} p={3} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm">
                            <HStack spacing={4}>
                                <HStack spacing={1}><Box w={2} h={2} bg="green.400" borderRadius="full" /><Text fontSize="11px" fontWeight="bold" color="gray.600">{activeSignals} with data</Text></HStack>
                                <HStack spacing={1}><Box w={2} h={2} bg="red.400" borderRadius="full" /><Text fontSize="11px" fontWeight="bold" color="gray.600">{errorSignals} errors</Text></HStack>
                                <HStack spacing={1}><Box w={2} h={2} bg="gray.300" borderRadius="full" /><Text fontSize="11px" fontWeight="bold" color="gray.600">{totalSignals - activeSignals - errorSignals} pending</Text></HStack>
                            </HStack>
                            <Text fontSize="10px" color="gray.400" fontWeight="bold" textTransform="uppercase" letterSpacing="0.5px">{filteredSignalsCount} signals shown</Text>
                        </Flex>
                        <SimpleGrid columns={{ base: 1, md: 2, xl: 3, "2xl": 4 }} spacing={6}>
                            {filteredSignals.map((signal, index) => (
                                <SignalCard
                                    key={signal.id + index}
                                    signal={signal}
                                    searchTerm={searchTerm}
                                    onRefresh={handleRefresh}
                                    handlers={{ handleDownloadLog, handleDeleteLog, handleNotificationAction }}
                                />
                            ))}
                        </SimpleGrid>
                    </Box>
                </Box>
            )}

            <Box mt={2}>
                <DeviceDetails deviceState={deviceState} vin={vin} />
                <BulkProvisionSection />
                <RemoteCommands
                    commandLoading={commandLoading} handleCommand={handleCommand}
                    speedAlert={speedAlert} setSpeedAlert={setSpeedAlert}
                    fotaVersion={fotaVersion} setFotaVersion={setFotaVersion}
                    isFotaUpdating={isFotaUpdating} handleFotaUpdate={handleFotaUpdate}
                    handleFotaReset={handleFotaReset} TraxoApi={TraxoApi}
                />
            </Box>
        </Box>
    );
};

export default PayloadDashboardPage;
