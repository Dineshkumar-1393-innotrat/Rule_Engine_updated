/**
 * MultiDomainRuleEngine.jsx
 * 
 * A self-contained multi-domain IoT Rule Engine UI.
 * Drop this into your existing project alongside DomainConfig.js.
 * 
 * Usage in RuleEngineDashboard.jsx:
 *   import MultiDomainRuleEngine from './MultiDomainRuleEngine';
 *   <MultiDomainRuleEngine />
 * 
 * Or use DomainConfig.js directly to feed facts/rules into your existing
 * RuleBuilder / RuleEngine components by domain.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, VStack, HStack, Grid, GridItem, Text, Badge, Button,
    Select, Input, IconButton, Tabs, TabList, Tab, TabPanels, TabPanel,
    Card, CardHeader, CardBody, Heading, Divider, Tooltip, Tag,
    useColorModeValue, useToast, Collapse, Flex, Spacer, Progress,
    Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
    useDisclosure, List, ListItem, ListIcon, Switch, FormControl, FormLabel,
    NumberInput, NumberInputField, Wrap, WrapItem, Icon, SimpleGrid,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Square, Plus, Trash2, Bell, ChevronDown, ChevronRight,
    RefreshCcw, CheckCircle2, AlertTriangle, XCircle, Info,
    Layers, Filter, Zap, Activity, Cpu, Radio, ShieldAlert,
    Gauge, Database, Code, Settings, Download, Search, LayoutDashboard
} from 'lucide-react';
import { DOMAINS, DOMAIN_LIST, getDomain, evaluateDomainRules, simulateDomain, OPERATORS } from '../../utils/DomainConfig';

// ─── Premium Light Theme Constants ──────────────────────────────────────────
const LIGHT_THEME = {
    bg: 'gray.50',
    card: 'white',
    border: 'gray.100',
    text: {
        primary: 'gray.800',
        secondary: 'gray.500',
        accent: 'blue.600'
    },
    glass: {
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
    }
};

// ─── Severity color helpers ───────────────────────────────────────────────────
const SEVERITY_COLOR = { critical: 'red.500', warning: 'orange.400', info: 'blue.400' };
const SEVERITY_ICON = { critical: XCircle, warning: AlertTriangle, info: Info };

// ─── Enhanced Arc Gauge ────────────────────────────────────────────────────────
const ArcGauge = ({ value, max, label, unit, color, warningAt, invertAlert }) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const angle = (pct / 100) * 180;
    const r = 40;
    const cx = 55, cy = 55;

    const toRad = (deg) => (deg - 180) * (Math.PI / 180);
    const x = cx + r * Math.cos(toRad(angle));
    const y = cy + r * Math.sin(toRad(angle));

    const isWarn = warningAt !== undefined
        ? (invertAlert ? value <= warningAt : value >= warningAt)
        : false;

    const gaugeColor = isWarn ? '#E53E3E' : (color || '#3182CE');
    const gradientId = `gauge-grad-${label.replace(/\s+/g, '-')}`;

    return (
        <VStack spacing={0} align="center">
            <Box position="relative" width="120px" height="75px" overflow="visible">
                <svg width="100%" height="100%" viewBox="0 0 110 65" style={{ overflow: 'visible' }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={gaugeColor} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={gaugeColor} />
                        </linearGradient>
                        <filter id="shadow">
                            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1" />
                        </filter>
                    </defs>
                    {/* Background Track */}
                    <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                        fill="none" stroke="#EDF2F7" strokeWidth="8" strokeLinecap="round" />

                    {/* Active Track */}
                    {pct > 0 && (
                        <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: pct / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                            fill="none" stroke={`url(#${gradientId})`} strokeWidth="8"
                            strokeLinecap="round" filter="url(#shadow)"
                        />
                    )}

                    {/* Needle/Indicator Point */}
                    <motion.circle
                        animate={{ cx: x, cy: y }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        r="4" fill="white" stroke={gaugeColor} strokeWidth="2"
                    />

                    <text x={cx} y={cy - 5} textAnchor="middle" fontSize="16" fontWeight="800" fill="gray.800">
                        {typeof value === 'number' ? value.toFixed(value > 10 ? 0 : 1) : '--'}
                    </text>
                    <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fill="gray.500" fontWeight="bold">
                        {unit?.toUpperCase()}
                    </text>
                </svg>
            </Box>
            <Text fontSize="10px" color="gray.500" fontWeight="bold" textTransform="uppercase" letterSpacing="0.5px" noOfLines={1} mt={1}>
                {label}
            </Text>
        </VStack>
    );
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#3B6FE8', width = 80, height = 24 }) => {
    if (!data || data.length < 2) return <Box w={`${width}px`} h={`${height}px`} bg="gray.100" borderRadius="sm" />;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={width} height={height}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

// ─── Technical Alert Item ───────────────────────────────────────────────────
const AlertItem = ({ alert, onDismiss }) => {
    const alertColor = alert.severity === 'critical' ? 'red.500' : alert.severity === 'warning' ? 'orange.500' : 'blue.500';
    const IconComponent = SEVERITY_ICON[alert.severity];

    return (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <HStack
                p={3} mb={1} borderRadius="lg" align="center"
                bg="white" border="1px solid" borderColor="gray.100"
                _hover={{ bg: "gray.50", boxShadow: "sm" }} transition="all 0.2s"
            >
                <Box p={2} bg={`${alertColor.split('.')[0]}.50`} borderRadius="md" mr={2}>
                    <Icon as={IconComponent} boxSize={3.5} color={alertColor} />
                </Box>
                <VStack align="start" spacing={0} flex={1}>
                    <HStack w="full" justify="space-between">
                        <Text fontSize="11px" fontWeight="800" color="gray.800" letterSpacing="0.2px">
                            {alert.ruleName.toUpperCase()}
                        </Text>
                        <Tag size="sm" variant="subtle" colorScheme={alertColor.split('.')[0]} fontSize="9px" fontWeight="bold">
                            {alert.severity.toUpperCase()}
                        </Tag>
                    </HStack>
                    <Text fontSize="11px" color="gray.600" noOfLines={1} mt={0.5}>
                        {alert.message}
                    </Text>
                    <Text fontSize="9px" color="gray.400" mt={1} fontWeight="bold">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                    </Text>
                </VStack>
                <IconButton
                    size="xs" variant="ghost" color="gray.300" _hover={{ color: "red.500", bg: "red.50" }}
                    icon={<Trash2 size={12} />}
                    onClick={() => onDismiss(alert.ruleId + alert.timestamp)}
                    aria-label="Dismiss Incident"
                />
            </HStack>
        </motion.div>
    );
};

// ─── Technical Signal Card ────────────────────────────────────────────────────
const SignalCard = ({ fact, value, history, isAlert, domain }) => {
    const [open, setOpen] = useState(false);
    const domainColor = domain?.color?.hex || '#3182CE';
    const accentColor = isAlert ? '#E53E3E' : domainColor;

    return (
        <Box
            bg="white" borderRadius="xl" border="1px solid"
            borderColor={isAlert ? "red.200" : "gray.100"}
            boxShadow="sm" overflow="hidden" transition="all 0.2s"
            _hover={{ borderColor: accentColor, boxShadow: "md" }}
        >
            <Box p={3} cursor="pointer" onClick={() => setOpen(!open)}>
                <HStack justify="space-between">
                    <HStack spacing={3}>
                        <Icon as={open ? ChevronDown : ChevronRight} boxSize={3.5} color="gray.400" />
                        <VStack align="start" spacing={0}>
                            <Text fontSize="xs" fontWeight="800" color="gray.700" letterSpacing="0.2px">{fact.label.toUpperCase()}</Text>
                            <Text fontSize="9px" color="gray.400" fontWeight="bold">{fact.category.toUpperCase()}</Text>
                        </VStack>
                        {isAlert && <Badge colorScheme="red" variant="solid" fontSize="8px" borderRadius="full" px={2}>CRITICAL</Badge>}
                    </HStack>
                    <HStack spacing={4}>
                        <Sparkline data={history} color={accentColor} width={60} height={20} />
                        <VStack align="end" spacing={0}>
                            <Text fontSize="sm" fontWeight="800" color={accentColor}>
                                {CSS.escape(typeof value === 'boolean' ? (value ? 'ACTIVE' : 'INACTIVE') : typeof value === 'number' ? value.toFixed(1) : value)}
                                <Text as="span" fontSize="10px" color="gray.400" ml="1" fontWeight="bold">{fact.unit}</Text>
                            </Text>
                        </VStack>
                    </HStack>
                </HStack>
            </Box>
            <Collapse in={open}>
                <Box px={4} pb={4} pt={2} borderTop="1px solid" borderColor="gray.50">
                    <SimpleGrid columns={2} spacing={6} align="center">
                        <ArcGauge
                            value={value} max={fact.max || 100} label={fact.label}
                            unit={fact.unit} color={domainColor}
                            warningAt={fact.warningAt} invertAlert={fact.invertAlert}
                        />
                        <VStack align="start" justify="center" spacing={3}>
                            <Box w="full">
                                <Text fontSize="9px" color="gray.400" fontWeight="800" mb={1}>OPERATIONAL RANGE</Text>
                                <HStack justify="space-between" bg="gray.50" p={2} borderRadius="lg" w="full">
                                    <Text fontSize="10px" fontWeight="bold" color="gray.600">{fact.min} {fact.unit}</Text>
                                    <Box flex={1} h="2px" bg="gray.200" mx={2} borderRadius="full" />
                                    <Text fontSize="10px" fontWeight="bold" color="gray.600">{fact.max} {fact.unit}</Text>
                                </HStack>
                            </Box>
                            <Box w="full">
                                <Text fontSize="9px" color="gray.400" fontWeight="800" mb={1}>ANALYTICS (LAST 20)</Text>
                                <Box bg="gray.50" p={2} borderRadius="lg" w="full">
                                    <Sparkline data={history} color={accentColor} width={100} height={30} />
                                </Box>
                            </Box>
                        </VStack>
                    </SimpleGrid>
                </Box>
            </Collapse>
        </Box>
    );
};

// ─── Cyber Rule Builder ───────────────────────────────────────────────────────
const DomainRuleBuilder = ({ domain, onAdd }) => {
    const [name, setName] = useState('');
    const [fact, setFact] = useState(domain.facts[0]?.name || '');
    const [op, setOp] = useState('>');
    const [val, setVal] = useState('');
    const [severity, setSeverity] = useState('warning');
    const [message, setMessage] = useState('');
    const toast = useToast();

    const handleAdd = () => {
        if (!name || !message || !val) {
            toast({ title: 'DATA INCOMPLETE', status: 'error', duration: 2000 });
            return;
        }
        onAdd({
            id: `custom-${Date.now()}`,
            name,
            conditions: { all: [{ fact, operator: op, value: isNaN(val) ? val : Number(val) }] },
            event: { type: 'custom', message, severity }
        });
        setName(''); setMessage(''); setVal('');
        toast({ title: 'POLICY FORGED', status: 'success', duration: 1500 });
    };

    const inputStyle = {
        bg: "gray.50",
        borderColor: "gray.200",
        color: "gray.700",
        fontSize: "xs",
        _focus: { borderColor: domain.color.hex, boxShadow: `0 0 0 1px ${domain.color.hex}` },
        _hover: { borderColor: "gray.300" }
    };

    return (
        <VStack spacing={4} align="stretch">
            <HStack>
                <Icon as={Code} color={domain.color.hex} size={14} />
                <Text fontSize="10px" fontWeight="800" color="gray.500" letterSpacing="1px">RULE SPECIFICATION</Text>
            </HStack>
            <Input {...inputStyle} placeholder="RULE IDENTITY (E.G. OVERHEAT_THRESHOLD)" value={name} onChange={e => setName(e.target.value)} />

            <HStack>
                <Select {...inputStyle} value={fact} onChange={e => setFact(e.target.value)} flex={2}>
                    {domain.facts.map(f => <option key={f.name} value={f.name} style={{ background: 'white' }}>{f.label.toUpperCase()}</option>)}
                </Select>
                <Select {...inputStyle} value={op} onChange={e => setOp(e.target.value)} flex={1}>
                    {OPERATORS.map(o => <option key={o.value} value={o.value} style={{ background: 'white' }}>{o.label}</option>)}
                </Select>
                <Input {...inputStyle} placeholder="VALUE" value={val} onChange={e => setVal(e.target.value)} flex={1} />
            </HStack>

            <HStack>
                <Select {...inputStyle} value={severity} onChange={e => setSeverity(e.target.value)} flex={1}>
                    <option value="info" style={{ background: 'white' }}>INFO</option>
                    <option value="warning" style={{ background: 'white' }}>WARNING</option>
                    <option value="critical" style={{ background: 'white' }}>CRITICAL</option>
                </Select>
                <Input {...inputStyle} placeholder="ALERT MESSAGE DISPATCH" value={message} onChange={e => setMessage(e.target.value)} flex={3} />
            </HStack>

            <Button
                size="md" bg={domain.color.hex} color="white" _hover={{ filter: "brightness(1.1)" }}
                leftIcon={<Plus size={16} />} onClick={handleAdd}
                fontWeight="800" fontSize="11px" letterSpacing="1px" boxShadow="sm"
            >
                FORGE POLICY
            </Button>
        </VStack>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const MultiDomainRuleEngine = () => {
    const { domainId } = useParams();
    const navigate = useNavigate();

    const [selectedDomainId, setSelectedDomainId] = useState('jeep_proto_5');
    const [isRunning, setIsRunning] = useState(false);
    const [liveData, setLiveData] = useState({});
    const [dataHistory, setDataHistory] = useState({});  // fact -> [last 20 values]
    const [alerts, setAlerts] = useState([]);
    const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
    const [customRules, setCustomRules] = useState([]);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [totalAlertCount, setTotalAlertCount] = useState(0);
    const [tickCount, setTickCount] = useState(0);
    const intervalRef = useRef(null);
    const toast = useToast();
    const bgCard = useColorModeValue('white', 'gray.800');

    // Determine target domain based on route parameter
    const targetDomainId = domainId && DOMAINS[domainId] ? domainId : 'jeep_proto_5';

    const domain = getDomain(selectedDomainId);
    const allRules = [...domain.defaultRules, ...customRules.filter(r => r._domainId === selectedDomainId)];

    // Switch domain via URL navigation
    const handleDomainChange = useCallback((newId) => {
        navigate(`/iot-rule-engine/${newId}`);
    }, [navigate]);

    // Synchronize selectedDomainId state with route parameter changes
    useEffect(() => {
        setSelectedDomainId(targetDomainId);
        setLiveData({});
        setDataHistory({});
        setAlerts([]);
        setTickCount(0);
        const initialData = simulateDomain(targetDomainId);
        setLiveData(initialData);
    }, [targetDomainId]);

    // Simulation tick
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                const newData = simulateDomain(selectedDomainId);
                setLiveData(newData);
                setDataHistory(prev => {
                    const next = { ...prev };
                    Object.keys(newData).forEach(k => {
                        if (typeof newData[k] === 'number') {
                            next[k] = [...(prev[k] || []), newData[k]].slice(-20);
                        }
                    });
                    return next;
                });
                // Evaluate rules
                const triggered = evaluateDomainRules(selectedDomainId, newData, allRules);
                if (triggered.length > 0) {
                    setAlerts(prev => [...triggered.map(t => ({ ...t, domainId: selectedDomainId })), ...prev].slice(0, 50));
                    setTotalAlertCount(c => c + triggered.length);
                }
                setTickCount(c => c + 1);
            }, 3000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning, selectedDomainId, allRules]);

    const dismissAlert = (key) => {
        setDismissedAlerts(prev => new Set([...prev, key]));
        setAlerts(prev => prev.filter(a => (a.ruleId + a.timestamp) !== key));
    };

    const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.ruleId + a.timestamp));
    const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
    const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length;

    const domainRulesForBuilder = customRules.filter(r => r._domainId === selectedDomainId);

    const addCustomRule = (rule) => {
        setCustomRules(prev => [...prev, { ...rule, _domainId: selectedDomainId }]);
    };
    const deleteRule = (ruleId) => {
        setCustomRules(prev => prev.filter(r => r.id !== ruleId));
    };

    const handleRefresh = () => {
        setAlerts([]);
        setTickCount(0);
        setDataHistory({});
        const initialData = simulateDomain(selectedDomainId);
        setLiveData(initialData);
        toast({ title: 'Session Reset', status: 'info', duration: 1500 });
    };

    const handleDownload = () => {
        const exportData = {
            domain: selectedDomainId,
            timestamp: new Date().toISOString(),
            telemetry: liveData,
            history: dataHistory,
            rules: allRules.length,
            tick: tickCount
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iot_session_${selectedDomainId}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Data Exported', status: 'success', duration: 1500 });
    };

    return (
        <Box minH="100vh" bg={LIGHT_THEME.bg} p={{ base: 0, md: 5 }}>
            <VStack spacing={6} align="stretch" w="full">
            {/* ── Premium Header ── */}
            <Box
                bg="white" mb={6} borderRadius="xl" px={6} py={4}
                border="1px solid" borderColor="gray.100" boxShadow="sm"
            >
                <Flex align="center">
                    <HStack spacing={4}>
                        <Box p={2.5} bg="blue.500" borderRadius="xl" boxShadow="0 4px 12px rgba(49, 130, 206, 0.3)">
                            <Zap color="white" size={24} />
                        </Box>
                        <VStack align="start" spacing={0}>
                            <HStack>
                                <Heading size="md" color="gray.800" letterSpacing="-0.5px">IOT RULE ENGINE</Heading>
                                <Badge colorScheme="blue" variant="subtle" fontSize="11px" px={2} borderRadius="full">PRO V2.1</Badge>
                            </HStack>
                            <HStack spacing={4} mt={1}>
                                <HStack spacing={1.5}>
                                    <Box w={2} h={2} borderRadius="full" bg={isRunning ? "green.400" : "gray.300"} />
                                    <Text fontSize="xs" fontWeight="bold" color="gray.500">{isRunning ? 'ACTIVE SESSION' : 'SYSTEM PAUSED'}</Text>
                                </HStack>
                                <HStack spacing={1.5}>
                                    <Bell size={12} color="gray.400" />
                                    <Text fontSize="xs" fontWeight="bold" color="gray.500">{totalAlertCount} INCIDENTS</Text>
                                </HStack>
                            </HStack>
                        </VStack>
                    </HStack>

                    <Spacer />

                    <HStack spacing={4}>
                        <Button
                            leftIcon={isRunning ? <Square size={16} fill="white" /> : <Play size={16} fill="white" />}
                            colorScheme={isRunning ? "red" : "blue"}
                            onClick={() => setIsRunning(!isRunning)}
                            px={8} height="12" borderRadius="xl"
                            fontWeight="800" fontSize="sm"
                            boxShadow="lg"
                        >
                            {isRunning ? "STOP MONITORING" : "START MONITORING"}
                        </Button>
                    </HStack>
                </Flex>
            </Box>

            <Box px={{ base: 3, md: 5 }}>
                <VStack align="stretch" spacing={6}>
                    {/* Domain Title Bar */}
                    <HStack spacing={4}>
                        <Box
                            flex={1} bg="white" p={5} borderRadius="xl" border="1px solid"
                            borderColor="gray.100" boxShadow="sm" borderLeft="4px solid" borderLeftColor={domain.color.hex}
                        >
                            <HStack spacing={5} wrap="wrap" justify="space-between">
                                <HStack spacing={4}>
                                    <Box p={2.5} bg={`${domain.color.hex}10`} borderRadius="xl">
                                        {typeof domain.icon === 'string' ? (
                                            <Text fontSize="2xl">{domain.icon}</Text>
                                        ) : (
                                            <Icon as={domain.icon || Radio} color={domain.color.hex} boxSize={6} />
                                        )}
                                    </Box>
                                    <VStack align="start" spacing={0}>
                                        <Heading size="sm" color="gray.800">{domain.label.toUpperCase()}</Heading>
                                        <Text fontSize="10px" color="gray.500" fontWeight="800" letterSpacing="1px">REAL-TIME TELEMETRY STREAM</Text>
                                    </VStack>
                                </HStack>
                                <HStack spacing={3}>
                                    <Badge colorScheme="purple" variant="subtle" borderRadius="lg" px={3} py={1} fontSize="11px" fontWeight="800">
                                        FACTORS: {domain.facts.length}
                                    </Badge>
                                    <Badge colorScheme="orange" variant="subtle" borderRadius="lg" px={3} py={1} fontSize="11px" fontWeight="800">
                                        POLICIES: {allRules.length}
                                    </Badge>
                                    <Badge colorScheme="blue" variant="subtle" borderRadius="lg" px={3} py={1} fontSize="11px" fontWeight="800">
                                        TICK: {tickCount}
                                    </Badge>
                                </HStack>
                            </HStack>
                        </Box>

                        <HStack bg="white" p={2} borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" spacing={2}>
                            <IconButton size="md" variant="ghost" icon={<RefreshCcw size={18} />} aria-label="Reset" onClick={handleRefresh} borderRadius="lg" _hover={{ bg: "gray.50", color: "blue.500" }} />
                            <IconButton size="md" variant="ghost" icon={<Download size={18} />} aria-label="Export" onClick={handleDownload} borderRadius="lg" _hover={{ bg: "gray.50", color: "blue.500" }} />
                        </HStack>
                    </HStack>

                        <Tabs variant="unstyled" index={activeTabIndex} onChange={setActiveTabIndex} isLazy>
                            <TabList
                                bg="white"
                                p={1.5}
                                borderRadius="2xl"
                                border="1px solid"
                                borderColor="gray.100"
                                boxShadow="sm"
                                overflowX={{ base: "auto", md: "visible" }}
                                whiteSpace="nowrap"
                                display="flex"
                                w="full"
                                gap={2}
                            >
                                <Tab _selected={{ bg: 'blue.500', color: 'white', boxShadow: 'lg' }} flex={1} borderRadius="lg" py={3} color="gray.500">
                                    <HStack spacing={2} justify="center">
                                        <Activity size={18} />
                                        <Text fontSize="xs" fontWeight="800" letterSpacing="0.5px">TELEMETRY</Text>
                                    </HStack>
                                </Tab>
                                <Tab _selected={{ bg: 'blue.500', color: 'white', boxShadow: 'lg' }} flex={1} borderRadius="lg" py={3} color="gray.500">
                                    <HStack spacing={2} justify="center">
                                        <ShieldAlert size={18} />
                                        <Text fontSize="xs" fontWeight="800" letterSpacing="0.5px">INCIDENTS</Text>
                                        {visibleAlerts.length > 0 && <Badge bg="white" color="blue.600" borderRadius="full" px={2}>{visibleAlerts.length}</Badge>}
                                    </HStack>
                                </Tab>
                                <Tab _selected={{ bg: 'blue.500', color: 'white', boxShadow: 'lg' }} flex={1} borderRadius="lg" py={3} color="gray.500">
                                    <HStack spacing={2} justify="center">
                                        <Settings size={18} />
                                        <Text fontSize="xs" fontWeight="800" letterSpacing="0.5px">POLICIES</Text>
                                    </HStack>
                                </Tab>
                                <Tab _selected={{ bg: 'blue.500', color: 'white', boxShadow: 'lg' }} flex={1} borderRadius="lg" py={3} color="gray.500">
                                    <HStack spacing={2} justify="center">
                                        <Code size={18} />
                                        <Text fontSize="xs" fontWeight="800" letterSpacing="0.5px">FORGE</Text>
                                    </HStack>
                                </Tab>
                            </TabList>

                            <TabPanels mt={6}>
                                {/* Telemetry Panel */}
                                <TabPanel p={0}>
                                    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6} mb={8}>
                                        {domain.gauges.map(g => (
                                            <Box
                                                key={g.fact} textAlign="center" p={6} bg="white"
                                                borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm"
                                                _hover={{ borderColor: g.color, boxShadow: "md" }} transition="all 0.3s"
                                            >
                                                <ArcGauge
                                                    value={liveData[g.fact] || 0} max={g.max} label={g.label}
                                                    unit={g.unit} color={g.color} warningAt={g.warningAt} invertAlert={g.invertAlert}
                                                />
                                            </Box>
                                        ))}
                                    </SimpleGrid>

                                    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
                                        {domain.facts.map(f => (
                                            <SignalCard
                                                key={f.name} fact={f} value={liveData[f.name]}
                                                history={dataHistory[f.name] || []} domain={domain}
                                                isAlert={visibleAlerts.some(a => a.ruleId.includes(f.name))}
                                            />
                                        ))}
                                    </SimpleGrid>
                                </TabPanel>

                                {/* Incidents Panel */}
                                <TabPanel p={0}>
                                    <Grid templateColumns={{ base: "1fr", xl: "1fr 360px" }} gap={6}>
                                        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" overflow="hidden">
                                            <Box p={4} borderBottom="1px solid" borderColor="gray.50" bg="gray.50">
                                                <HStack>
                                                    <Text fontWeight="800" fontSize="xs" color="gray.600" letterSpacing="0.5px">INCIDENT DISPATCH LOG</Text>
                                                    <Spacer />
                                                    <HStack spacing={2}>
                                                        <Badge colorScheme="red" variant="solid" borderRadius="full" px={2}>{criticalCount}</Badge>
                                                        <Badge colorScheme="orange" variant="solid" borderRadius="full" px={2}>{warningCount}</Badge>
                                                    </HStack>
                                                </HStack>
                                            </Box>
                                            <VStack align="stretch" spacing={0} maxH="650px" overflowY="auto" p={2}>
                                                <AnimatePresence initial={false}>
                                                    {visibleAlerts.length > 0 ? (
                                                        visibleAlerts.map((alert) => (
                                                            <AlertItem key={alert.ruleId + alert.timestamp} alert={alert} onDismiss={dismissAlert} />
                                                        ))
                                                    ) : (
                                                        <VStack py={24} opacity={0.6}>
                                                            <Box p={6} bg="green.50" borderRadius="full" mb={4}>
                                                                <CheckCircle2 size={48} color="green.500" />
                                                            </Box>
                                                            <Text fontWeight="800" fontSize="md" color="gray.700">NO ACTIVE INCIDENTS</Text>
                                                            <Text fontSize="xs" color="gray.500" fontWeight="bold">System operating within normal parameters</Text>
                                                        </VStack>
                                                    )}
                                                </AnimatePresence>
                                            </VStack>
                                        </Box>

                                        <VStack align="stretch" spacing={6}>
                                            <Box
                                                bg="blue.600" p={6} borderRadius="xl" color="white" boxShadow="xl"
                                                backgroundImage="linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%)"
                                            >
                                                <HStack mb={4}>
                                                    <Activity size={20} />
                                                    <Heading size="sm">INCIDENT REPORT</Heading>
                                                </HStack>
                                                <Text fontSize="xs" opacity={0.9} mb={6} fontWeight="500">Real-time heuristics and anomaly detection metrics for the current session.</Text>
                                                <VStack align="stretch" spacing={4}>
                                                    <HStack justify="space-between" borderBottom="1px solid" borderColor="whiteAlpha.200" pb={3}>
                                                        <Text fontSize="xs" fontWeight="800" opacity={0.8}>POLLED METRICS</Text>
                                                        <Text fontSize="sm" fontWeight="800">{tickCount * domain.facts.length}</Text>
                                                    </HStack>
                                                    <HStack justify="space-between" borderBottom="1px solid" borderColor="whiteAlpha.200" pb={3}>
                                                        <Text fontSize="xs" fontWeight="800" opacity={0.8}>CRITICAL ALERTS</Text>
                                                        <Text fontSize="sm" fontWeight="800">{criticalCount}</Text>
                                                    </HStack>
                                                    <Box pt={2}>
                                                        <Text fontSize="10px" fontWeight="800" mb={2} opacity={0.8}>SYSTEM STABILITY</Text>
                                                        <Progress value={99.4} size="sm" colorScheme="green" borderRadius="full" bg="whiteAlpha.200" />
                                                        <Text fontSize="10px" mt={2} textAlign="right" fontWeight="800">99.4%</Text>
                                                    </Box>
                                                </VStack>
                                            </Box>
                                        </VStack>
                                    </Grid>
                                </TabPanel>

                                {/* Policy Panel */}
                                <TabPanel p={0}>
                                    <Grid templateColumns={{ base: "1fr", xl: "1fr 340px" }} gap={6}>
                                        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" overflow="hidden">
                                            <Box p={4} borderBottom="1px solid" borderColor="gray.50" bg="gray.50">
                                                <HStack>
                                                    <Layers size={16} color="gray.500" />
                                                    <Text fontWeight="800" fontSize="xs" color="gray.600" letterSpacing="0.5px">DOMINANT POLICIES</Text>
                                                </HStack>
                                            </Box>
                                            <VStack align="stretch" spacing={0} maxH="600px" overflowY="auto">
                                                {allRules.map((rule) => {
                                                    const isCustom = rule.id.startsWith('custom-');
                                                    return (
                                                        <Box
                                                            key={rule.id} p={5} borderBottom="1px solid" borderColor="gray.50"
                                                            _hover={{ bg: 'gray.50' }} transition="all 0.2s"
                                                        >
                                                            <HStack spacing={4}>
                                                                <Box p={2} bg="gray.50" borderRadius="lg">
                                                                    <Icon as={Cpu} color="blue.500" size={18} />
                                                                </Box>
                                                                <VStack align="start" spacing={0} flex={1}>
                                                                    <HStack spacing={3}>
                                                                        <Text fontWeight="800" fontSize="sm" color="gray.800">{rule.name.toUpperCase()}</Text>
                                                                        {isCustom && <Badge colorScheme="purple" variant="subtle" fontSize="9px" px={2} borderRadius="full">CUSTOM</Badge>}
                                                                    </HStack>
                                                                    <HStack spacing={2} mt={1}>
                                                                        <Badge variant="outline" colorScheme="gray" fontSize="9px" px={1.5}>IF</Badge>
                                                                        <Text fontSize="11px" color="blue.600" fontWeight="800">
                                                                            {rule.conditions?.all?.[0]?.fact?.toUpperCase()}
                                                                        </Text>
                                                                        <Text fontSize="11px" color="gray.400" fontWeight="bold">
                                                                            {rule.conditions?.all?.[0]?.operator}
                                                                        </Text>
                                                                        <Text fontSize="11px" color="blue.600" fontWeight="800">
                                                                            {rule.conditions?.all?.[0]?.value}
                                                                        </Text>
                                                                    </HStack>
                                                                </VStack>
                                                                <Spacer />
                                                                <Badge colorScheme={rule.event.severity === 'critical' ? 'red' : rule.event.severity === 'warning' ? 'orange' : 'blue'} variant="solid" borderRadius="full" px={3} fontSize="10px" fontWeight="800">
                                                                    {rule.event.severity.toUpperCase()}
                                                                </Badge>
                                                                {isCustom && (
                                                                    <IconButton
                                                                        size="sm" icon={<Trash2 size={14} />} variant="ghost"
                                                                        onClick={() => deleteRule(rule.id)} aria-label="Delete"
                                                                        color="gray.400" _hover={{ color: "red.500", bg: "red.50" }} borderRadius="lg"
                                                                    />
                                                                )}
                                                            </HStack>
                                                        </Box>
                                                    );
                                                })}
                                            </VStack>
                                        </Box>

                                        <Box bg="white" p={6} borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="lg" alignSelf="start">
                                            <DomainRuleBuilder domain={domain} onAdd={addCustomRule} />
                                        </Box>
                                    </Grid>
                                </TabPanel>

                                {/* Forge/RAW Panel */}
                                <TabPanel p={0}>
                                    <Box
                                        bg="gray.900" borderRadius="xl" p={6} border="1px solid" borderColor="gray.800"
                                        boxShadow="2xl"
                                    >
                                        <HStack justify="space-between" mb={6}>
                                            <HStack>
                                                <Box w={2} h={2} borderRadius="full" bg="green.400" />
                                                <Text fontSize="xs" fontWeight="bold" color="green.400" fontFamily="monospace">LIVE_STREAM_BUFFER</Text>
                                            </HStack>
                                            <Button size="xs" colorScheme="green" variant="outline" onClick={() => {
                                                const blob = new Blob([JSON.stringify({ domain: selectedDomainId, data: liveData }, null, 2)], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a'); a.href = url;
                                                a.download = `iot_payload_${selectedDomainId}.json`; a.click();
                                            }}>EXPORT JSON</Button>
                                        </HStack>
                                        <Box
                                            position="relative" maxH="400px" overflowY="auto"
                                            p={4} bg="blackAlpha.500" borderRadius="lg"
                                        // sx={{
                                        //     '&::-webkit-scrollbar': { width: '4px' },
                                        //     '&::-webkit-scrollbar-thumb': { background: 'whiteAlpha.200', borderRadius: '10px' },
                                        // }}
                                        >
                                            <Text color="green.300" fontFamily="monospace" fontSize="12px" whiteSpace="pre-wrap">
                                                {JSON.stringify({
                                                    domain: selectedDomainId,
                                                    timestamp: new Date().toISOString(),
                                                    telemetry: liveData,
                                                    active_rules: allRules.length,
                                                    tick: tickCount
                                                }, null, 2)}
                                            </Text>
                                        </Box>
                                    </Box>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </VStack>
            </Box>
            </VStack>
        </Box>
    );
};

export default MultiDomainRuleEngine;
