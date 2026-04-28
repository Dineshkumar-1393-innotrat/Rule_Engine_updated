// import React, { useState, useEffect, useRef } from 'react';
// import {
//     Modal,
//     ModalOverlay,
//     ModalContent,
//     ModalHeader,
//     ModalBody,
//     ModalCloseButton,
//     Box,
//     Grid,
//     Heading,
//     Text,
//     Button,
//     HStack,
//     VStack,
//     Input,
//     Checkbox,
//     Flex,
//     Spacer,
//     Spinner,
//     Badge,
//     IconButton,
//     Table,
//     Thead,
//     Tbody,
//     Tr,
//     Th,
//     Td,
//     TableContainer,
//     InputGroup,
//     InputLeftElement,
//     Wrap,
//     WrapItem,
//     Tooltip,
//     useToast
// } from '@chakra-ui/react';
// import Vehicle360Viewer from './Vehicle360Viewer';
// import { RotateCcw, LayoutDashboard, Wifi, WifiOff, ArrowLeft, Search, Monitor, Eye, Thermometer, Zap, Fuel, Activity, Car, Map, Calendar, Bell, AlertTriangle } from 'lucide-react';
// import { TraxoApi } from '../../utils/TraxoApi';
// import { motion, AnimatePresence } from 'framer-motion';

// // Visual Components for Dashboard
// const CircularGauge = ({ value, label, unit, color = "#00E5FF", size = 110, icon: Icon, isError = false }) => {
//     const strokeWidth = 6;
//     const radius = (size - strokeWidth) / 2;
//     const circumference = 2 * Math.PI * radius;
//     const progress = (parseFloat(value) || 0) / 100;

//     return (
//         <VStack spacing={3} align="center">
//             <Box position="relative" width={size} height={size}>
//                 {/* Outer decorative ring */}
//                 <Box
//                     position="absolute"
//                     top="-4px" left="-4px" right="-4px" bottom="-4px"
//                     border="1px solid"
//                     borderColor={isError ? "red.100" : "rgba(0, 0, 0, 0.05)"}
//                     borderRadius="full"
//                 />
//                 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
//                     <defs>
//                         <filter id={`glow-${label.replace(/\s+/g, '-')}`} x="-20%" y="-20%" width="140%" height="140%">
//                             <feGaussianBlur stdDeviation="3" result="coloredBlur" />
//                             <feMerge>
//                                 <feMergeNode in="coloredBlur" />
//                                 <feMergeNode in="SourceGraphic" />
//                             </feMerge>
//                         </filter>
//                     </defs>
//                     <circle
//                         cx={size / 2} cy={size / 2} r={radius}
//                         fill="transparent"
//                         stroke={isError ? "red.50" : "rgba(0, 0, 0, 0.03)"}
//                         strokeWidth={strokeWidth}
//                     />
//                     <motion.circle
//                         cx={size / 2} cy={size / 2} r={radius}
//                         fill="transparent"
//                         stroke={isError ? "#E53E3E" : color}
//                         strokeWidth={strokeWidth}
//                         strokeDasharray={circumference}
//                         initial={{ strokeDashoffset: circumference }}
//                         animate={{ strokeDashoffset: isError ? 0 : circumference - (progress * circumference) }}
//                         transition={{ duration: 1.5, ease: "easeOut" }}
//                         strokeLinecap="round"
//                         transform={`rotate(-90 ${size / 2} ${size / 2})`}
//                         filter={!isError ? `url(#glow-${label.replace(/\s+/g, '-')})` : "none"}
//                     />
//                 </svg>
//                 <VStack
//                     position="absolute"
//                     top="50%" left="50%"
//                     transform="translate(-50%, -50%)"
//                     spacing={0}
//                 >
//                     {isError ? (
//                         <VStack spacing={0}>
//                             <AlertTriangle size={24} color="#E53E3E" />
//                             <Text fontSize="10px" fontWeight="black" color="red.500">ERR</Text>
//                         </VStack>
//                     ) : (
//                         <>
//                             <Text fontSize="lg" fontWeight="900" color="gray.800" letterSpacing="-1px">
//                                 {value}{unit}
//                             </Text>
//                             {Icon && <Icon size={14} color={color} opacity={0.8} />}
//                         </>
//                     )}
//                 </VStack>
//             </Box>
//             <Text fontSize="10px" fontWeight="black" color={isError ? "red.400" : "gray.400"} letterSpacing="1px" textTransform="uppercase">
//                 {label}
//             </Text>
//         </VStack>
//     );
// };

// const SpeedometerGauge = ({ value, label, secondaryValue, highestSpeed, isError = false }) => {
//     const size = 260;
//     const strokeWidth = 12;
//     const radius = 90;
//     const center = size / 2;
//     const speed = parseFloat(value) || 0;
//     const odo = parseFloat(secondaryValue) || 0;
//     const maxSpeed = parseFloat(highestSpeed) || 0;
//     const maxVal = 240;
//     const progress = Math.min(speed / maxVal, 1);
//     const totalAngle = 270;
//     const startAngle = -135;
//     const currentAngle = startAngle + (isError ? 0 : progress * totalAngle);

//     const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
//         const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
//         return {
//             x: centerX + (radius * Math.cos(angleInRadians)),
//             y: centerY + (radius * Math.sin(angleInRadians))
//         };
//     };

//     const drawArc = (start, end) => {
//         const startPoint = polarToCartesian(center, center, radius, end);
//         const endPoint = polarToCartesian(center, center, radius, start);
//         const largeArcFlag = end - start <= 180 ? "0" : "1";
//         return [
//             "M", startPoint.x, startPoint.y,
//             "A", radius, radius, 0, largeArcFlag, 0, endPoint.x, endPoint.y
//         ].join(" ");
//     };

//     return (
//         <VStack spacing={0} position="relative" mt={-4}>
//             <Box position="relative" width={size} height={size}>
//                 <svg width={size} height={size} style={{ overflow: 'visible' }}>
//                     <defs>
//                         <filter id="speed-glow" x="-50%" y="-50%" width="200%" height="200%">
//                             <feGaussianBlur stdDeviation="4" result="blur" />
//                             <feMerge>
//                                 <feMergeNode in="blur" />
//                                 <feMergeNode in="SourceGraphic" />
//                             </feMerge>
//                         </filter>
//                         <linearGradient id="speed-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
//                             <stop offset="0%" stopColor={isError ? "#FEB2B2" : "#00B8D4"} />
//                             <stop offset="100%" stopColor={isError ? "#E53E3E" : "#00E5FF"} />
//                         </linearGradient>
//                     </defs>

//                     <path
//                         d={drawArc(startAngle, startAngle + totalAngle)}
//                         fill="none"
//                         stroke={isError ? "rgba(255, 0, 0, 0.05)" : "rgba(0, 0, 0, 0.03)"}
//                         strokeWidth={strokeWidth}
//                         strokeLinecap="round"
//                     />

//                     <motion.path
//                         d={drawArc(startAngle, currentAngle)}
//                         fill="none"
//                         stroke="url(#speed-gradient)"
//                         strokeWidth={strokeWidth}
//                         strokeLinecap="round"
//                         filter={!isError ? "url(#speed-glow)" : "none"}
//                         initial={{ pathLength: 0 }}
//                         animate={{ pathLength: 1 }}
//                         transition={{ duration: 1, ease: "easeOut" }}
//                     />

//                     {[...Array(9)].map((_, i) => {
//                         const angle = startAngle + (i * (totalAngle / 8));
//                         const p1 = polarToCartesian(center, center, radius + 8, angle);
//                         const p2 = polarToCartesian(center, center, radius + 18, angle);
//                         const tickVal = i * (maxVal / 8);
//                         const isActive = isError ? false : speed >= tickVal;
//                         return (
//                             <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isActive ? "#00B8D4" : isError ? "rgba(255,0,0,0.1)" : "rgba(0,0,0,0.1)"} strokeWidth="2" />
//                         );
//                     })}
//                 </svg>

//                 <VStack position="absolute" top="55%" left="50%" transform="translate(-50%, -50%)" spacing={-1}>
//                     {isError ? (
//                         <VStack spacing={1}>
//                             <AlertTriangle size={48} color="#E53E3E" />
//                             <Text fontSize="xs" fontWeight="black" color="red.500" letterSpacing="1px">SIG ERROR</Text>
//                         </VStack>
//                     ) : (
//                         <>
//                             <Flex align="center" direction="column" mb={1}>
//                                 <Badge variant="outline" colorScheme="orange" fontSize="8px" px={2} borderRadius="full" border="1px solid">
//                                     MAX {Math.floor(maxSpeed)} KM/H
//                                 </Badge>
//                             </Flex>
//                             <Text fontSize="6xl" fontWeight="900" color="gray.800" lineHeight="1">
//                                 {Math.floor(speed)}
//                             </Text>
//                             <Text fontSize="xs" fontWeight="black" color="blue.500" letterSpacing="2px">KM/H</Text>

//                             <Box mt={4} textAlign="center">
//                                 <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="1px">ODO</Text>
//                                 <Text fontSize="md" fontWeight="bold" color="gray.700">
//                                     {odo.toLocaleString()} <Text as="span" fontSize="10px" color="gray.500">KM</Text>
//                                 </Text>
//                             </Box>
//                         </>
//                     )}
//                 </VStack>
//             </Box>
//         </VStack>
//     );
// };

// const StatusToggle = ({ label, description, isOn, icon: Icon, isError = false }) => {
//     const color = isError ? "red" : (isOn ? "blue" : "gray");
//     return (
//         <Box
//             bg="white" p={5} borderRadius="2xl" border="1px solid"
//             borderColor={isError ? "red.200" : "gray.100"}
//             boxShadow="sm" _hover={{ border: '1px solid', borderColor: `${color}.200`, boxShadow: 'lg' }}
//             transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" position="relative" overflow="hidden"
//         >
//             {/* Subtle glow background */}
//             {isOn && !isError && <Box position="absolute" top="-20%" right="-10%" w="100px" h="100px" bg={`${color}.50`} filter="blur(40px)" opacity={0.6} zIndex={0} />}

//             <Flex align="center" justify="space-between" position="relative" zIndex={1}>
//                 <HStack spacing={4}>
//                     <Box p={3} borderRadius="xl" bg={isError ? "red.500" : (isOn ? "blue.500" : "gray.100")} transition="all 0.3s">
//                         <Icon size={22} color={(isOn && !isError) || isError ? "white" : "gray.500"} />
//                     </Box>
//                     <VStack align="flex-start" spacing={0}>
//                         <Text fontWeight="800" color="gray.800" fontSize="md" letterSpacing="-0.2px">{label}</Text>
//                         <Text fontSize="10px" color={isError ? "red.500" : "gray.500"} fontWeight="bold" textTransform="uppercase" letterSpacing="0.5px">
//                             {isError ? "STREAMS ERR" : description}
//                         </Text>
//                     </VStack>
//                 </HStack>

//                 <VStack align="flex-end" spacing={1}>
//                     <Box w="12px" h="12px" borderRadius="full" bg={isError ? "red.500" : (isOn ? "blue.500" : "gray.300")} boxShadow={isOn && !isError ? "0 0 10px rgba(49, 130, 206, 0.5)" : "none"} transition="all 0.3s" />
//                     <Text fontSize="9px" fontWeight="900" color={isError ? "red.600" : (isOn ? "blue.600" : "gray.400")} letterSpacing="1px">
//                         {isError ? "FAILURE" : (isOn ? "ENGAGED" : "OFF")}
//                     </Text>
//                 </VStack>
//             </Flex>
//         </Box>
//     );
// };



// const DeviceEventsList = ({ events }) => {
//     // Filter events to only show those from the last 15 seconds
//     const recentEvents = (events || []).filter(evt => {
//         if (!evt.sourcetimestamp) return false;
//         const evtTime = new Date(evt.sourcetimestamp).getTime();
//         const now = Date.now();
//         return (now - evtTime) < 15000; // 15 seconds window
//     }).slice(0, 3); // Then take top 3

//     if (recentEvents.length === 0) return null;

//     return (
//         <Box position="absolute" top={20} right={8} maxW="280px" zIndex={9} pointerEvents="none">
//             <VStack spacing={2} align="stretch">
//                 {recentEvents.map((evt, i) => {
//                     let details = {};
//                     try { details = JSON.parse(evt.eventdetails || '{}'); } catch (e) { }
//                     const type = evt.eventtype || 'Event';
//                     const time = evt.sourcetimestamp ? new Date(evt.sourcetimestamp).toLocaleTimeString() : '';

//                     return (
//                         <motion.div
//                             key={evt.eventid || i}
//                             initial={{ x: 50, opacity: 0 }}
//                             animate={{ x: 0, opacity: 1 }}
//                             transition={{ delay: i * 0.1 }}
//                         >
//                             <Box bg="whiteAlpha.900" backdropFilter="blur(8px)" p={3} borderRadius="lg" boxShadow="sm" borderLeft="3px solid" borderColor="purple.400" pointerEvents="auto">
//                                 <HStack justify="space-between" mb={1}>
//                                     <Text fontSize="10px" fontWeight="bold" color="purple.600" textTransform="uppercase">{type}</Text>
//                                     <Text fontSize="9px" color="gray.400">{time}</Text>
//                                 </HStack>
//                                 <Text fontSize="9px" color="gray.600" noOfLines={2} lineHeight="1.2">
//                                     {details.status || details.message || "Event Received"}
//                                 </Text>
//                             </Box>
//                         </motion.div>
//                     );
//                 })}
//             </VStack>
//         </Box>
//     );
// };

// const VisualDashboardView = ({ signals, deviceState, highestSpeed }) => {
//     // ... [Values logic kept same] ...
//     const getVal = (name, defaultValue = 0) => {
//         const signal = signals.find(s => s.name === name);
//         if (signal && signal.data && signal.data.length > 0) {
//             const latest = signal.data[0];
//             const result = latest.signalValue ?? latest.Event ?? latest.value ?? defaultValue;
//             if (name === "Battery Voltage Level") return parseFloat(result) || 0;
//             return result;
//         }
//         return defaultValue;
//     };

//     const cmdSignal = signals.find(s => s.name === "Remote Commands");
//     const lastCmds = cmdSignal?.data?.slice(0, 3) || [];

//     const getComplexVal = (name) => {
//         const signal = signals.find(s => s.name === name);
//         return (signal && signal.data && signal.data.length > 0) ? signal.data[0] : null;
//     };

//     const isSigError = (name) => {
//         const signal = signals.find(s => s.name === name);
//         return !!(signal && signal.error);
//     };

//     const vehicleSpeed = getVal("Vehicle Speed", 0);
//     const engineSpeed = getVal("Engine Speed", 0);
//     const fuel = getVal("Fuel Level", 0);
//     const batteryRaw = getVal("Battery Voltage Level", 0);
//     const batteryPercent = Math.min(Math.round((batteryRaw / 15) * 100), 100);
//     const engineTemp = getVal("Engine Water Temp", 0);
//     const extTemp = getVal("External Temperature (C)", 0);

//     // Prioritize Ignition Status from events if available, otherwise fallback to deviceState
//     const ignitionSignal = signals.find(s => s.name === "Ignition Status");
//     const hasIgnitionEvent = ignitionSignal && ignitionSignal.data && ignitionSignal.data.length > 0;
//     const ignition = hasIgnitionEvent ? getVal("Ignition Status") : (deviceState?.ignition ?? "OFF");

//     const odometer = getVal("Total Odometer", 0);

//     const locationData = getComplexVal("Location");
//     const alertsData = getComplexVal("Alerts");
//     const hasEmergency = Array.isArray(alertsData) ? alertsData.length > 0 : !!alertsData;

//     const eventsSignal = signals.find(s => s.name === "Device Events");
//     const deviceEvents = eventsSignal?.data || [];

//     const lat = locationData?.gpsLat || locationData?.latitude || locationData?.Latitude || locationData?.gps_lat;
//     const long = locationData?.gpsLong || locationData?.longitude || locationData?.Longitude || locationData?.gps_lng || locationData?.gpsLong;
//     const coords = (lat && long)
//         ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}`
//         : "12.9529, 80.2331";

//     const getMostRecentTimestamp = () => {
//         let mostRecent = null;
//         signals.forEach(signal => {
//             // Exclude Remote Commands as they use local system time for their 'time' field
//             if (signal.name === "Remote Commands") return;

//             if (signal.data && signal.data.length > 0) {
//                 // Check all items in the data array, not just the first one, to be safe (though usually 0 is latest)
//                 // But typically signal.data is sorted new -> old.
//                 const latest = signal.data[0];

//                 // User screenshot shows UPDATEDTIMESTAMP (all caps). Checking all variants.
//                 const timestamp = latest.updatedTimeStamp ||
//                     latest.UPDATEDTIMESTAMP ||
//                     latest.updatedtimestamp ||
//                     latest.sourcetimestamp ||
//                     latest.timestamp ||
//                     latest.time;

//                 if (timestamp) {
//                     const date = new Date(timestamp);
//                     if (!isNaN(date.getTime())) {
//                         if (!mostRecent || date > mostRecent) mostRecent = date;
//                     }
//                 }
//             }
//         });
//         return mostRecent;
//     };

//     const lastUpdate = getMostRecentTimestamp();
//     const formattedDate = lastUpdate
//         ? lastUpdate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
//         : '--';
//     const formattedTime = lastUpdate
//         ? lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
//         : '--:--';

//     const hasAnyError = signals.some(s => s.error);
//     const errorSignals = signals.filter(s => s.error).map(s => s.name);

//     return (
//         <Box w="full" bg="#f8faff" p={8} borderRadius="none" minH="100vh" position="relative" overflow="hidden">
//             {/* HUD Grid Background */}
//             <Box
//                 position="absolute" top={0} left={0} right={0} bottom={0}
//                 backgroundImage="radial-gradient(circle, #e2e8f0 1px, transparent 1px)"
//                 backgroundSize="32px 32px"
//                 pointerEvents="none"
//                 opacity={0.4}
//                 zIndex={0}
//             />

//             <DeviceEventsList events={deviceEvents} />

//             <Box position="relative" zIndex={1}>
//                 {hasAnyError && (
//                     <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
//                         <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} borderRadius="xl" mb={6} boxShadow="sm">
//                             <Flex align="center" gap={3}>
//                                 <AlertTriangle color="#E53E3E" size={18} />
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text color="red.700" fontWeight="bold" fontSize="xs">DATA SYNC ALERT</Text>
//                                     <Text color="red.600" fontSize="10px">
//                                         The following signals are currently reporting errors: {errorSignals.join(", ")}
//                                     </Text>
//                                 </VStack>
//                             </Flex>
//                         </Box>
//                     </motion.div>
//                 )}

//                 {/* Top Row: Status Toggles */}
//                 <Grid templateColumns="repeat(2, 1fr)" gap={6} mb={8}>
//                     <StatusToggle
//                         label="Ignition Status"
//                         description="Real-time engine status"
//                         isOn={String(ignition).toUpperCase() === 'ON' || String(ignition).toUpperCase() === 'TRUE' || String(ignition).toUpperCase() === 'CONNECTED' || ignition === 1}
//                         icon={Zap}
//                         isError={isSigError("Ignition Status")}
//                     />
//                     <StatusToggle
//                         label="Emergency Alert"
//                         description={hasEmergency ? "Critical Alerts Detected!" : "No active alerts"}
//                         isOn={hasEmergency}
//                         icon={Bell}
//                         isError={isSigError("Alerts")}
//                     />
//                 </Grid>

//                 {/* Middle Grid Layout */}
//                 <Grid templateColumns="1.2fr 0.8fr 1.5fr" gap={6} mb={8} h="380px">
//                     {/* Left: Map Card */}
//                     <Box bg="white" borderRadius="2xl" overflow="hidden" position="relative" border="1px solid" borderColor="rgba(0,0,0,0.06)" boxShadow="sm">
//                         {lat && long ? (
//                             <iframe
//                                 width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
//                                 src={`https://maps.google.com/maps?q=${lat},${long}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
//                             />
//                         ) : (
//                             <Flex bg="gray.50" h="full" align="center" justify="center" direction="column">
//                                 <Map size={40} color="#CBD5E0" />
//                                 <Text mt={3} color="gray.400" fontWeight="bold" fontSize="xs">AWAITING GPS SIGNAL...</Text>
//                             </Flex>
//                         )}
//                         {/* Map Overlay */}
//                         <Box position="absolute" top={4} left={4} bg="whiteAlpha.900" backdropFilter="blur(8px)" p={4} borderRadius="xl" boxShadow="lg" border="1px solid" borderColor="whiteAlpha.500">
//                             <Flex align="center" gap={3}>
//                                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
//                                     <Activity size={18} color="#3182CE" />
//                                 </motion.div>
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontSize="md" fontWeight="900" color="gray.800" letterSpacing="-1px">{coords}</Text>
//                                     <Text fontSize="9px" color="gray.500" fontWeight="black" letterSpacing="1px">LIVE COORDINATES</Text>
//                                 </VStack>
//                             </Flex>
//                         </Box>

//                         {/* Remote Command Status Overlay */}
//                         <AnimatePresence>
//                             {lastCmds.length > 0 && (
//                                 <Box position="absolute" bottom={4} right={4} maxW="200px" zIndex={5}>
//                                     <VStack spacing={2} align="stretch">
//                                         {lastCmds.map((cmd, i) => (
//                                             <motion.div
//                                                 key={i}
//                                                 initial={{ x: 50, opacity: 0 }}
//                                                 animate={{ x: 0, opacity: 1 }}
//                                                 exit={{ scale: 0.8, opacity: 0 }}
//                                             >
//                                                 <Box
//                                                     bg={cmd.status === 'SUCCESS' ? "green.500" : "red.500"}
//                                                     color="white" p={2} borderRadius="lg" boxShadow="md"
//                                                     border="1px solid" borderColor="whiteAlpha.400"
//                                                 >
//                                                     <HStack justify="space-between">
//                                                         <Text fontSize="9px" fontWeight="black">{(cmd.command || 'Unknown').toUpperCase()}</Text>
//                                                         <Activity size={10} color="white" />
//                                                     </HStack>
//                                                     <Text fontSize="8px" fontWeight="bold" opacity={0.9}>{cmd.time}</Text>
//                                                     {/* API Response Snippet */}
//                                                     {cmd.apiResponse && (
//                                                         <Box mt={1} pt={1} borderTop="1px solid" borderColor="whiteAlpha.300">
//                                                             <Text fontSize="7px" fontFamily="monospace" noOfLines={3}>
//                                                                 {JSON.stringify(cmd.apiResponse).substring(0, 100)}
//                                                             </Text>
//                                                         </Box>
//                                                     )}
//                                                 </Box>
//                                             </motion.div>
//                                         ))}
//                                     </VStack>
//                                 </Box>
//                             )}
//                         </AnimatePresence>
//                     </Box>

//                     {/* Center Column: Temp & Time */}
//                     <VStack spacing={6} h="full">
//                         <Box flex={1.2} w="full">
//                             <TempCard temp={engineTemp} label="Engine Temp" interiorTemp={extTemp} isError={isSigError("Engine Water Temp") || isSigError("External Temperature (C)")} />
//                         </Box>
//                         <Box flex={1} w="full" bg="white" p={5} borderRadius="2xl" border="1px solid" borderColor="rgba(0,0,0,0.06)" boxShadow="sm" display="flex" flexDirection="column" justifyContent="space-between">
//                             <Flex justify="space-between" align="center">
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontWeight="800" color="blue.500" fontSize="xs" letterSpacing="0.5px">SYSTEM TIME</Text>
//                                     <Text color="gray.400" fontSize="10px" fontWeight="bold">{formattedDate}</Text>
//                                 </VStack>
//                                 <LayoutDashboard size={18} color="#CBD5E0" />
//                             </Flex>
//                             <Box textAlign="center" py={2}>
//                                 <Text fontSize="4xl" fontWeight="900" color="gray.800" letterSpacing="-1px">{formattedTime}</Text>
//                             </Box>
//                             <Text fontSize="9px" color="gray.400" textAlign="center" fontWeight="black" letterSpacing="1px">LAST UPDATED</Text>
//                         </Box>
//                     </VStack>

//                     {/* Right: Car Visualization */}
//                     <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="rgba(0,0,0,0.06)" boxShadow="sm" overflow="hidden" position="relative">
//                         <Vehicle360Viewer
//                             baseUrl="https://imgd.aeplcdn.com/1280x720/cw/360/jeep/1048/5364/closed-door/c2c7cb/"
//                             imageCount={60}
//                         />
//                     </Box>
//                 </Grid>

//                 {/* Bottom Row: HUD Gauges */}
//                 <Flex
//                     align="center" justify="space-around" px={10} py={8}
//                     bg="white" borderRadius="3xl" boxShadow="lg"
//                     border="1px solid" borderColor="rgba(0,0,0,0.04)"
//                     position="relative" overflow="hidden"
//                 >
//                     <CircularGauge value={fuel} label="Fuel Level" unit="%" color="#00B8D4" icon={Fuel} isError={isSigError("Fuel Level")} />

//                     <CircularGauge
//                         value={Math.min(Math.round((engineSpeed / 8000) * 100), 100)}
//                         label={`RPM (${engineSpeed})`} unit="" color="#FF9100" icon={Activity}
//                         isError={isSigError("Engine Speed")}
//                     />

//                     <SpeedometerGauge
//                         value={vehicleSpeed}
//                         secondaryValue={odometer}
//                         highestSpeed={highestSpeed}
//                         isError={isSigError("Vehicle Speed") || isSigError("Total Odometer")}
//                     />

//                     <CircularGauge
//                         value={batteryPercent}
//                         label={`Battery (${batteryRaw}V)`} unit="%" color="#00C853" icon={Zap}
//                         isError={isSigError("Battery Voltage Level")}
//                     />
//                 </Flex>

//                 {/* Footer Icon Bar */}
//                 <HStack justify="center" spacing={6} mt={10}>
//                     {[
//                         { icon: Activity, label: 'Diagnostics', color: 'blue.500' },
//                         { icon: Wifi, label: 'Connectivity', color: 'green.500' },
//                         { icon: Zap, label: 'Performance', color: 'yellow.500' },
//                         { icon: Thermometer, label: 'Health Monitor', color: 'red.500' },
//                         { icon: Car, label: 'Vehicle Info', color: 'purple.500' }
//                     ].map(({ icon: Icon, color, label }, idx) => (
//                         <Tooltip key={idx} label={label} hasArrow>
//                             <motion.div whileHover={{ y: -3, scale: 1.1 }} whileTap={{ scale: 0.9 }}>
//                                 <Flex
//                                     w={12} h={12} align="center" justify="center" bg="white" borderRadius="xl" color={color} cursor="pointer"
//                                     boxShadow="md" border="1px solid" borderColor="gray.50"
//                                     _hover={{ bg: color, color: 'white' }} transition="all 0.2s"
//                                 >
//                                     <Icon size={20} />
//                                 </Flex>
//                             </motion.div>
//                         </Tooltip>
//                     ))}
//                 </HStack>
//             </Box>
//         </Box>
//     );
// };

// // Sub-components kept simple







// const TempCard = ({ temp, label, interiorTemp = "45", isError = false }) => (
//     <Box bg="white" p={5} borderRadius="2xl" border="1px solid" borderColor={isError ? "red.200" : "rgba(0,0,0,0.06)"} boxShadow="sm" height="full" position="relative" overflow="hidden">
//         <Flex justify="space-between" align="start" mb={4}>
//             <VStack align="flex-start" spacing={0}>
//                 <HStack spacing={2}>
//                     <Text fontWeight="800" color={isError ? "red.500" : "blue.500"} fontSize="xs" letterSpacing="0.5px" textTransform="uppercase">{label}</Text>
//                     <Thermometer size={14} color={isError ? "#E53E3E" : "#3182CE"} />
//                 </HStack>
//                 <Text color="gray.400" fontSize="10px" fontWeight="bold">Interior: {interiorTemp}°C</Text>
//             </VStack>
//             <Box w={2} h={2} borderRadius="full" bg={isError ? "red.500" : "blue.500"} />
//         </Flex>

//         <Flex align="center" justify="center" py={2} mb={4}>
//             {isError ? (
//                 <VStack spacing={1}>
//                     <AlertTriangle size={32} color="#E53E3E" />
//                     <Text fontSize="xs" fontWeight="black" color="red.500">DATA ERROR</Text>
//                 </VStack>
//             ) : (
//                 <Text fontSize="6xl" fontWeight="900" color="gray.800" lineHeight="1">{temp}°</Text>
//             )}
//         </Flex>

//         {!isError && (
//             <VStack width="full" align="flex-start" spacing={3}>
//                 <Flex justify="space-between" width="full">
//                     <Text fontSize="9px" fontWeight="black" color="blue.600" letterSpacing="0.5px">COOLING SYSTEM</Text>
//                     <Badge variant="subtle" colorScheme="blue" fontSize="8px" px={2} borderRadius="full">NORMAL</Badge>
//                 </Flex>
//                 <Box width="full" h="4px" bg="gray.50" borderRadius="full" position="relative" border="1px solid" borderColor="gray.100">
//                     <Box
//                         position="absolute" left={`${Math.min((temp / 100) * 100, 100)}%`} top="-5px"
//                         w="14px" h="14px" bg="white" border="3px solid" borderColor="blue.500"
//                         borderRadius="full" boxShadow="md" transform="translateX(-50%)"
//                     />
//                 </Box>
//             </VStack>
//         )}
//         {isError && (
//             <VStack width="full" align="flex-start" spacing={1}>
//                 <Text fontSize="9px" fontWeight="black" color="red.600" letterSpacing="0.5px">SYSTEM FAULT</Text>
//                 <Badge variant="solid" colorScheme="red" fontSize="8px" px={2} borderRadius="full">OFFLINE</Badge>
//             </VStack>
//         )}
//     </Box>
// );

// const PayloadDashboardModal = ({ isOpen, onClose, vinValue = "T434ZTZT155550104" }) => {
//     // ... [State init kept same] ...
//     const [vin, setVin] = useState(() => localStorage.getItem('last_vin') || vinValue);
//     const [signals, setSignals] = useState([
//         { name: "Fuel Level", apiName: "FuelLevel", id: "0x356", isChecked: true, data: [], loading: false, error: null },
//         { name: "Total Odometer", apiName: "TotalOdometer", id: "0x760", isChecked: true, data: [], loading: false, error: null },
//         { name: "Engine Water Temp", apiName: "EngineWaterTemp", id: "0x3E2", isChecked: true, data: [], loading: false, error: null },
//         { name: "Engine Speed", apiName: "EngineSpeed", id: "0x3E6", isChecked: true, data: [], loading: false, error: null },
//         { name: "Vehicle Speed", apiName: "VehicleSpeed", id: "0x3E8", isChecked: true, data: [], loading: false, error: null, hideInConsole: true },
//         { name: "Battery Voltage Level", apiName: "BatteryVoltageLevel", id: "0x46C", isChecked: true, data: [], loading: false, error: null },
//         { name: "IGNITION STATUS", apiName: "CmdIgnSts", id: "0x46C", isChecked: true, data: [], loading: false, error: null, fetchType: 'ignition' },
//         { name: "External Temperature (F)", apiName: "ExternalTemperatureF", id: "0x46C", isChecked: true, data: [], loading: false, error: null },
//         { name: "External Temperature (C)", apiName: "ExternalTemperatureC", id: "0x46C", isChecked: true, data: [], loading: false, error: null },
//         { name: "Location", apiName: "Location", id: "location", isChecked: true, data: [], loading: false, error: null, fetchType: 'location' },
//         { name: "Alerts", apiName: "Alerts", id: "alerts", isChecked: true, data: [], loading: false, error: null, fetchType: 'alerts' },
//         { name: "Device Events", apiName: "DeviceEvents", id: "events", isChecked: true, data: [], loading: false, error: null, fetchType: 'events' },
//         { name: "Remote Commands", apiName: "CommandLog", id: "action", isChecked: true, data: [], loading: false, error: null, fetchType: 'manual' },
//         { name: "Trip History", apiName: "TripSummary", id: "trips", isChecked: true, data: [], loading: false, error: null, fetchType: 'trips' },
//         { name: "Device Logs", apiName: "DeviceLogs", id: "logs", isChecked: true, data: [], loading: false, error: null, fetchType: 'logs' },
//         { name: "Jeep Vehicle Status", apiName: "VehicleStatus", id: "vehicleStatus", isChecked: true, data: [], loading: false, error: null, fetchType: 'vehicleStatus' },
//         { name: "Log Files List", apiName: "LogFiles", id: "log_files", isChecked: true, data: [], loading: false, error: null, fetchType: 'files' },
//         { name: "Alert Ingestion Audit", apiName: "AlertIngestion", id: "alert_audit", isChecked: true, data: [], loading: false, error: null, fetchType: 'alerts_audit' },
//         { name: "Signal List", apiName: "SignalList", id: "signals_list", isChecked: true, data: [], loading: false, error: null, fetchType: 'signals' },
//         { name: "Telemetry Message List", apiName: "TelemetryMessages", id: "msg_list", isChecked: false, data: [], loading: false, error: null, fetchType: 'messages' },
//         { name: "Trip Pagination", apiName: "TripDetailsPaginated", id: "trip_paginated", isChecked: false, data: [], loading: false, error: null, fetchType: 'trip_pagination' },
//         { name: "Trip ID Search", apiName: "TripDetailsById", id: "trip_by_id", isChecked: false, data: [], loading: false, error: null, fetchType: 'trip_details' },
//         { name: "Portal Search", apiName: "PortalSearch", id: "portal_lookup", isChecked: false, data: [], loading: false, error: null, fetchType: 'search' },
//     ]);
//     const [viewMode, setViewMode] = useState('visual');
//     const [isLive, setIsLive] = useState(true);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [highestSpeed, setHighestSpeed] = useState(0);

//     // Authentication state
//     const [accessToken, setAccessToken] = useState(null);
//     const [refreshToken, setRefreshToken] = useState(null);
//     const [tokenExpiry, setTokenExpiry] = useState(null);
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [isAuthenticating, setIsAuthenticating] = useState(false);

//     // ... [Traxo State & Effects kept same] ...
//     const [deviceState, setDeviceState] = useState(null);
//     const [ongoingTrip, setOngoingTrip] = useState(null);
//     const [tripSummary, setTripSummary] = useState(null);
//     const [commandLoading, setCommandLoading] = useState(null);
//     const [speedAlert, setSpeedAlert] = useState("");
//     const [fotaVersion, setFotaVersion] = useState("2314.0");
//     const [availableVersions, setAvailableVersions] = useState([]);
//     const [isFotaUpdating, setIsFotaUpdating] = useState(false);
//     const toast = useToast();
//     const pollingTimeout = useRef(null);

//     // Initial load and VIN change handler
//     useEffect(() => {
//         if (isOpen) {
//             // Save VIN to localStorage whenever it changes
//             localStorage.setItem('last_vin', vin);

//             // Reset signal data for new VIN to prevent data leakage
//             setSignals(prev => prev.map(s => ({ ...s, data: [], loading: false, error: null, hasFetched: false })));

//             setDeviceState(null);
//             setOngoingTrip(null);

//             // Fetch data for the new VIN
//             (async () => {
//                 await Promise.all([
//                     fetchCheckedSignals(),
//                     fetchOtherData()
//                 ]);
//                 if (isLive) startPolling();
//             })();
//         } else {
//             stopPolling();
//         }
//         return () => stopPolling();
//     }, [isOpen, vin]); // React to VIN changes

//     // Handle isLive toggling separately
//     useEffect(() => {
//         if (isLive && isOpen) {
//             startPolling();
//         } else {
//             stopPolling();
//         }
//     }, [isLive]);

//     const startPolling = () => {
//         // Clear any existing timeout to avoid duplicates
//         if (pollingTimeout.current) clearTimeout(pollingTimeout.current);

//         // Recursive polling function
//         const poll = async () => {
//             // If stopped or modal closed, don't schedule next
//             if (!isLive || !isOpen) return;

//             // If no VIN, stop polling (useEffect will restart when VIN changes)
//             if (!vin) return;

//             try {
//                 // Ensure we use the latest VIN from the parent scope's state
//                 // Note: fetch routines below already use the 'vin' state variable
//                 await Promise.all([
//                     fetchCheckedSignals(),
//                     fetchOtherData()
//                 ]);
//             } catch (err) {
//                 console.warn("Polling error", err);
//             }

//             // Schedule next poll ONLY after current one finishes
//             if (isLive && isOpen) {
//                 pollingTimeout.current = setTimeout(poll, 10000); // Changed from 5000 to 10000 (10 seconds)
//             }
//         };

//         // Start the cycle
//         pollingTimeout.current = setTimeout(poll, 10000); // Match the interval
//     };

//     const stopPolling = () => {
//         if (pollingTimeout.current) {
//             clearTimeout(pollingTimeout.current);
//             pollingTimeout.current = null;
//         }
//     };

//     // Authentication function
//     const loginToAPI = async () => {
//         setIsAuthenticating(true);
//         try {
//             const response = await fetch('/api/traxo/authentication/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     username: "admin",
//                     password: "VdP5REwF5VA",
//                     accountId: "factorytenant",
//                     clientId: "getAv29550cxRVHcHOEUGVEs",
//                     clientSecret: "0KiS1VyOuIc0B2qFcTqZTsRv1As"
//                 })
//             });

//             if (!response.ok) {
//                 throw new Error(`Authentication failed: ${response.status}`);
//             }

//             const data = await response.json();

//             setAccessToken(data.access_token);
//             setRefreshToken(data.refresh_token);

//             // Calculate token expiry time
//             const expiryTime = Date.now() + (data.expires_in * 1000);
//             setTokenExpiry(expiryTime);
//             setIsAuthenticated(true);

//             toast({
//                 title: 'Authentication Successful',
//                 description: 'Connected to API',
//                 status: 'success',
//                 duration: 3000,
//             });

//             return data.access_token;
//         } catch (error) {
//             console.error('Authentication error:', error);
//             toast({
//                 title: 'Authentication Failed',
//                 description: error.message,
//                 status: 'error',
//                 duration: 5000,
//             });
//             setIsAuthenticated(false);
//             return null;
//         } finally {
//             setIsAuthenticating(false);
//         }
//     };

//     // Check if token needs refresh
//     const ensureValidToken = async () => {
//         // If no token or token expired, login
//         if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry - 60000) {
//             return await loginToAPI();
//         }
//         return accessToken;
//     };

//     // Fetch location telemetry data with authentication
//     const fetchLocationTelemetry = async () => {
//         try {
//             const token = await ensureValidToken();
//             if (!token) {
//                 throw new Error('No valid authentication token');
//             }

//             const response = await fetch(
//                 `/api/traxo/devices/vin/${vin}/states?subcategory=Location:Telemetry`,
//                 {
//                     method: 'GET',
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json',
//                     }
//                 }
//             );

//             if (response.status === 401) {
//                 // Token expired, try to re-authenticate
//                 setIsAuthenticated(false);
//                 const newToken = await loginToAPI();
//                 if (newToken) {
//                     // Retry with new token
//                     return await fetchLocationTelemetry();
//                 }
//                 throw new Error('Authentication failed');
//             }

//             if (!response.ok) {
//                 throw new Error(`Location fetch failed: ${response.status}`);
//             }

//             const data = await response.json();
//             return data;
//         } catch (error) {
//             console.error('Location telemetry error:', error);
//             return null;
//         }
//     };


//     const fetchOtherData = async () => {
//         if (!vin) {
//             console.warn("Skipping fetchOtherData: No VIN available");
//             return;
//         }

//         try {
//             const stateData = await TraxoApi.getDeviceState(vin);
//             if (stateData) setDeviceState(stateData);

//             try {
//                 const tripData = await TraxoApi.getOngoingTrip(vin);
//                 if (tripData) {
//                     setOngoingTrip(tripData);
//                     // Extract peak speed directly from ongoing trip API
//                     const apiTopSpeed = parseFloat(tripData.topSpeed || tripData.maxSpeed || 0);
//                     if (!isNaN(apiTopSpeed) && apiTopSpeed > 0) {
//                         setHighestSpeed(prev => Math.max(prev, apiTopSpeed));
//                     }
//                 }
//             } catch (tripError) {
//                 console.warn("Failed to fetch ongoing trip", tripError);
//             }
//         } catch (error) {
//             console.error("Failed to fetch additional data:", error);
//         }
//     };

//     const pollCommandStatus = async (commandName, commandId, isFota = false) => {
//         const maxRetries = 20; // 20 * 3s = 60s max polling
//         let attempts = 0;

//         const interval = setInterval(async () => {
//             attempts++;
//             if (attempts > maxRetries) {
//                 clearInterval(interval);
//                 return;
//             }

//             try {
//                 let statusData;
//                 let status;

//                 if (isFota) {
//                     statusData = await TraxoApi.getFotaCommandStatus(commandId);
//                     // FOTA status logic based on API response structure
//                     status = statusData.commandstatus || statusData.status || "Unknown";
//                 } else {
//                     statusData = await TraxoApi.getCommandStatus(vin, commandId);
//                     status = statusData.commandStatus || "Unknown";
//                 }

//                 // Update specific command in log
//                 setSignals(prev => prev.map(s => {
//                     if (s.name === "Remote Commands") {
//                         const newData = s.data.map(cmd =>
//                             cmd.commandId === commandId ? { ...cmd, status: status, ...statusData } : cmd
//                         );
//                         return { ...s, data: newData };
//                     }
//                     return s;
//                 }));

//                 // Stop polling if terminal state
//                 const terminalStates = isFota
//                     ? ["Success", "Timed Out", "Failed", "Cancelled", "Completed", "Error"]
//                     : ["Success", "Timed Out", "Failed", "Cancelled"];

//                 if (terminalStates.includes(status)) {
//                     clearInterval(interval);
//                     if (status === "Success" || status === "Completed") {
//                         toast({ title: `${commandName} Success`, status: "success", duration: 3000 });
//                     } else if (status === "Timed Out") {
//                         toast({ title: `${commandName} Timed Out`, status: "warning", duration: 3000 });
//                     }
//                 }
//             } catch (error) {
//                 console.warn("Polling status failed", error);
//             }
//         }, 3000);
//     };

//     const handleCommand = async (commandName, apiCall, params = []) => {
//         setCommandLoading(commandName);
//         const timestamp = new Date().toLocaleTimeString();
//         try {
//             const result = await apiCall(vin, ...params);
//             const commandId = result.commandId || result.data?.commandId;

//             toast({ title: `${commandName} Sent`, description: "Waiting for device response...", status: "info", duration: 2000, isClosable: true });

//             // Update commands log
//             setSignals(prev => prev.map(s => {
//                 if (s.name === "Remote Commands") {
//                     const fullResponse = {
//                         command: commandName,
//                         status: 'PENDING',
//                         time: timestamp,
//                         commandId: commandId,
//                         apiResponse: result // Store full API response
//                     };
//                     return {
//                         ...s,
//                         data: [fullResponse, ...s.data].slice(0, 50)
//                     };
//                 }
//                 return s;
//             }));

//             if (commandId) {
//                 pollCommandStatus(commandName, commandId);
//             }
//         } catch (error) {
//             toast({ title: `Failed to send ${commandName}`, description: error.message, status: "error", duration: 3000, isClosable: true });

//             setSignals(prev => prev.map(s => {
//                 if (s.name === "Remote Commands") {
//                     return {
//                         ...s,
//                         data: [{
//                             command: commandName,
//                             status: 'FAILED',
//                             time: timestamp,
//                             error: error.message,
//                             apiResponse: error.response?.data || { message: error.message } // Store error response
//                         }, ...s.data].slice(0, 50)
//                     };
//                 }
//                 return s;
//             }));
//         } finally {
//             setCommandLoading(null);
//         }
//     };

//     //original code feb16
//     // const fetchCheckedSignals = async () => {
//     //     const today = new Date().toISOString().split('T')[0];

//     //     // Fetch all in parallel
//     //     const fetchPromises = signals.map(async (signal) => {
//     //         if (!signal.isChecked) return null;

//     //         try {
//     //             let newData;
//     //             if (signal.fetchType === 'events') {
//     //                 newData = await TraxoApi.getEvents(vin, 50, `${today} 00:00:00`, `${today} 23:59:59`);
//     //             } else if (signal.fetchType === 'ignition') {
//     //                 // Fetch last 7 days to ensure we get a status even if car hasn't moved recently
//     //                 const sevenDaysAgo = new Date();
//     //                 sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//     //                 const formattedStart = sevenDaysAgo.toISOString().split('T')[0] + ' 00:00:00';

//     //                 const events = await TraxoApi.getEvents(vin, 500, formattedStart);
//     //                 console.log("Raw Ignition Events Fetched:", events?.events?.length || 0, events);

//     //                 // Filter ignition events correctly
//     //                 newData = (events?.events || [])
//     //                     .filter(e => {
//     //                         // Check various possible event type formats
//     //                         const eventType = (e.eventtype || '').toUpperCase();
//     //                         return eventType === 'IGNITIONSTATUS' ||
//     //                             eventType === 'IGNITION_STATUS' ||
//     //                             eventType === 'IGNITION';
//     //                     })
//     //                     .map(e => {
//     //                         let status = 'OFF';
//     //                         let rawValue = '';

//     //                         try {
//     //                             // Parse event details
//     //                             const details = typeof e.eventdetails === 'string'
//     //                                 ? JSON.parse(e.eventdetails)
//     //                                 : e.eventdetails || {};

//     //                             // Get the event value from various possible fields
//     //                             rawValue = details.eventValue || details.value || details.status || '';

//     //                             // Convert to ON/OFF based on common ignition values
//     //                             const upperValue = String(rawValue).toUpperCase();
//     //                             if (upperValue === 'RUN' ||
//     //                                 upperValue === 'START' ||
//     //                                 upperValue === 'ON' ||
//     //                                 upperValue === 'TRUE' ||
//     //                                 upperValue === '1' ||
//     //                                 upperValue.includes('RUN') ||
//     //                                 upperValue.includes('START')) {
//     //                                 status = 'ON';
//     //                             }
//     //                         } catch (err) {
//     //                             console.warn("Failed to parse ignition details", err, e.eventdetails);
//     //                         }

//     //                         return {
//     //                             ...e,
//     //                             value: status,
//     //                             signalValue: status,
//     //                             rawValue: rawValue,
//     //                             updatedTimeStamp: e.sourcetimestamp,
//     //                             timestamp: e.sourcetimestamp
//     //                         };
//     //                     });
//     //                 console.log("Filtered Ignition Events:", newData);
//     //             } else if (signal.fetchType === 'location') {
//     //                 // Use location telemetry array for console view
//     //                 newData = await TraxoApi.getLocationTelemetryArray(vin);
//     //                 console.log("Location Telemetry Data (raw):", newData);
//     //                 console.log("Location Telemetry Data type:", typeof newData, "isArray:", Array.isArray(newData));
//     //             } else if (signal.fetchType === 'alerts') {
//     //                 newData = await TraxoApi.getAlerts(vin);
//     //             } else {
//     //                 newData = await TraxoApi.getVehicleTelemetry(vin, signal.apiName);
//     //             }

//     //             const returnData = (newData && newData.events) ? newData.events : newData;
//     //             if (signal.fetchType === 'location') {
//     //                 console.log("Location return data:", returnData, "length:", returnData?.length);
//     //             }
//     //             return { name: signal.name, newData: returnData };
//     //         } catch (error) {
//     //             console.error(`Failed to fetch ${signal.name}`, error);
//     //             return { name: signal.name, error: error.message || "Fetch failed" };
//     //         }
//     //     });

//     //     const results = await Promise.all(fetchPromises);

//     //     setSignals(prevSignals => {
//     //         return prevSignals.map(signal => {
//     //             const result = results.find(r => r && r.name === signal.name);
//     //             if (!result) return signal;

//     //             const { newData, error } = result;
//     //             if (error) return { ...signal, error, loading: false, hasFetched: true };

//     //             if (newData !== null && newData !== undefined) {
//     //                 const existingData = signal.data || [];
//     //                 const isArray = Array.isArray(newData);
//     //                 const hasData = isArray ? newData.length > 0 : !!newData;

//     //                 let updatedData = existingData;
//     //                 if (hasData) {
//     //                     const lastEntry = existingData[0];
//     //                     const newEntryStr = JSON.stringify(isArray ? newData[0] : newData);
//     //                     const lastEntryStr = JSON.stringify(lastEntry);

//     //                     if (newEntryStr !== lastEntryStr) {
//     //                         if (isArray) {
//     //                             const newItems = newData.filter(newItem =>
//     //                                 !existingData.some(oldItem => JSON.stringify(oldItem) === JSON.stringify(newItem))
//     //                             );
//     //                             updatedData = [...newItems, ...existingData].slice(0, 100);
//     //                         } else {
//     //                             updatedData = [newData, ...existingData].slice(0, 100);
//     //                         }
//     //                     }
//     //                 }

//     //                 return {
//     //                     ...signal,
//     //                     data: updatedData,
//     //                     loading: false,
//     //                     lastUpdated: new Date().toLocaleTimeString(),
//     //                     hasFetched: true,
//     //                     error: null
//     //                 };
//     //             }
//     //             return { ...signal, loading: false };
//     //         });

//     //         // Log location signal data after update
//     //         const locationSignal = updatedSignals.find(s => s.name === 'Location');
//     //         if (locationSignal) {
//     //             console.log("Location signal after update:", {
//     //                 name: locationSignal.name,
//     //                 dataLength: locationSignal.data?.length,
//     //                 data: locationSignal.data
//     //             });
//     //         }
//     //         return updatedSignals;
//     //     });
//     // };


//     const fetchCheckedSignals = async () => {
//         if (!vin) {
//             console.warn("Skipping fetchCheckedSignals: No VIN available");
//             return;
//         }
//         const checkedSignals = signals.filter(s => s.isChecked);
//         console.log('🔍 fetchCheckedSignals called. Checked signals:', checkedSignals.map(s => s.name));

//         const today = new Date().toISOString().split('T')[0];
//         const sevenDaysAgo = new Date();
//         sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//         const formattedStart = sevenDaysAgo.toISOString().split('T')[0] + ' 00:00:00';
//         const formattedEnd = today + ' 23:59:59';

//         // Fetch all in parallel
//         const fetchPromises = signals.map(async (signal) => {
//             if (!signal.isChecked) return null;

//             // Log when Trip or Logs are about to be fetched
//             if (signal.fetchType === 'trips') {
//                 console.log('🎯 Trip History is CHECKED - Starting fetch...', signal.name);
//             }
//             if (signal.apiName === 'DeviceLogs') {
//                 console.log('🎯 Device Logs is CHECKED - Starting fetch...', signal.name);
//             }

//             try {
//                 let newData;
//                 if (signal.fetchType === 'events') {
//                     newData = await TraxoApi.getEvents(vin, 50, `${today} 00:00:00`, `${today} 23:59:59`);
//                 } else if (signal.fetchType === 'ignition') {
//                     // Use the new dedicated ignition events function
//                     newData = await TraxoApi.getIgnitionEvents(vin, formattedStart, formattedEnd);
//                     console.log("Formatted Ignition Events:", newData);
//                 } else if (signal.fetchType === 'location') {
//                     newData = await TraxoApi.getLocationTelemetryArray(vin);
//                 } else if (signal.fetchType === 'alerts') {
//                     newData = await TraxoApi.getAlerts(vin);
//                 } else if (signal.fetchType === 'trips') {
//                     // Fetch last 30 days of trip history
//                     console.log('⏳ About to call getTripSummary API...');
//                     const endDate = new Date();
//                     const startDate = new Date();
//                     startDate.setDate(startDate.getDate() - 30);
//                     const formatDateTime = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
//                     console.log('⏳ Date range:', formatDateTime(startDate), 'to', formatDateTime(endDate));
//                     newData = await TraxoApi.getTripSummary(vin, formatDateTime(startDate), formatDateTime(endDate));
//                     console.log('✅ getTripSummary returned:', newData);
//                 } else if (signal.fetchType === 'logs') {
//                     // Trigger device log fetch command
//                     console.log('📋 Fetching Device Logs...');
//                     newData = await TraxoApi.fetchDeviceLogs(vin);
//                 } else if (signal.fetchType === 'vehicleStatus') {
//                     console.log('🚗 Fetching Jeep Vehicle Status...');
//                     newData = await TraxoApi.getVehicleStatus(vin);
//                 } else if (signal.fetchType === 'files') {
//                     newData = await TraxoApi.listLogFiles(vin);
//                 } else if (signal.fetchType === 'alerts_audit') {
//                     newData = await TraxoApi.getAlertIngestion(vin);
//                 } else if (signal.fetchType === 'signals') {
//                     newData = await TraxoApi.getSignalList('356'); // Use Jeep device type ID
//                 } else if (signal.fetchType === 'messages') {
//                     newData = await TraxoApi.getVehicleTelemetryMessageList();
//                 } else if (signal.fetchType === 'trip_pagination') {
//                     newData = await TraxoApi.getTripDetailsWithPagination(vin, 0);
//                 } else if (signal.fetchType === 'trip_details') {
//                     const tripId = ongoingTrip?.tripId || (signals.find(s => s.name === "Trip History")?.data[0]?.tripId);
//                     if (tripId) {
//                         newData = await TraxoApi.getTripDetailsByTripId(vin, tripId);
//                     } else {
//                         throw new Error("No Trip ID available (requires ongoing trip or history)");
//                     }
//                 } else if (signal.fetchType === 'search') {
//                     newData = await TraxoApi.portalSearch(vin, "vin");
//                 } else {
//                     newData = await TraxoApi.getVehicleTelemetry(vin, signal.apiName);
//                 }

//                 const returnData = (() => {
//                     if (!newData) return null;

//                     // Standard normalization (flattening common wrappers)
//                     let items = newData;
//                     if (newData.events) items = newData.events;
//                     else if (newData.data && Array.isArray(newData.data)) items = newData.data;
//                     else if (newData.trips) items = newData.trips;
//                     else if (newData.tripSummary) items = newData.tripSummary;
//                     else if (newData.alerts) items = newData.alerts;
//                     else if (newData.signals) items = newData.signals;
//                     else if (newData.messages) items = newData.messages;
//                     else if (newData.files) items = newData.files;
//                     // Extra wrappers used by newer APIs
//                     else if (newData.signalList) items = newData.signalList;
//                     else if (newData.logFiles) items = newData.logFiles;
//                     else if (newData.auditLogs) items = newData.auditLogs;
//                     else if (newData.ingestionLog) items = newData.ingestionLog;
//                     else if (newData.result && Array.isArray(newData.result)) items = newData.result;
//                     else if (newData.content && Array.isArray(newData.content)) items = newData.content;

//                     // Special handling for vehicleStatus
//                     if (signal.fetchType === 'vehicleStatus') {
//                         if (typeof newData === 'object' && !Array.isArray(newData)) return [newData];
//                         return Array.isArray(newData) ? newData : null;
//                     }

//                     // For these fetch types, auto-wrap a single object response as an array for table display
//                     if (['files', 'alerts_audit', 'signals', 'messages'].includes(signal.fetchType)) {
//                         if (items && !Array.isArray(items) && typeof items === 'object') return [items];
//                     }

//                     return items;
//                 })();

//                 // Only treat null (not empty array) as a hard error for non-telemetry signals
//                 if (returnData === null && !['trips', 'ignition', 'events', 'location', 'files', 'alerts_audit', 'signals', 'messages'].includes(signal.fetchType)) {
//                     return { name: signal.name, error: "No data available or empty response from server. Check vehicle connectivity." };
//                 }

//                 return { name: signal.name, newData: returnData };
//             } catch (error) {
//                 // ... log ...
//                 console.error(`Failed to fetch ${signal.name}`, error);
//                 return { name: signal.name, error: error.message || "Network or API Error" };
//             }
//         });

//         const results = await Promise.all(fetchPromises);

//         setSignals(prevSignals => {
//             const updatedSignals = prevSignals.map(signal => {
//                 const result = results.find(r => r && r.name === signal.name);
//                 if (!result) return signal;

//                 const { newData, error } = result;
//                 if (error) return { ...signal, error, loading: false, hasFetched: true };

//                 if (newData !== null && newData !== undefined) {
//                     const existingData = signal.data || [];
//                     const isArray = Array.isArray(newData);
//                     const hasData = isArray ? newData.length > 0 : !!newData;

//                     let updatedData = existingData;
//                     if (hasData) {
//                         if (isArray) {
//                             // For trips and events, handle differently
//                             if (signal.fetchType === 'trips') {
//                                 // For trips, replace entirely on each fetch (don't merge)
//                                 updatedData = newData.slice(0, 100);
//                             } else {
//                                 // For ignition/events, merge and deduplicate
//                                 const existingStrings = new Set(existingData.map(d => JSON.stringify(d)));
//                                 const newUniqueItems = newData.filter(d => !existingStrings.has(JSON.stringify(d)));

//                                 if (newUniqueItems.length > 0) {
//                                     updatedData = [...newUniqueItems, ...existingData].slice(0, 500);
//                                 }
//                             }
//                         } else {
//                             if (JSON.stringify(newData) !== JSON.stringify(existingData[0])) {
//                                 updatedData = [newData, ...existingData].slice(0, 100);
//                             }
//                         }
//                     } else if (isArray && (signal.fetchType === 'ignition' || signal.fetchType === 'trips')) {
//                         // If ignition or trips got [] back, DO NOT CLEAR existing data.
//                         // Just keep what we have to prevent "coming and going" issue
//                     }

//                     return {
//                         ...signal,
//                         data: updatedData,
//                         loading: false,
//                         lastUpdated: new Date().toLocaleTimeString(),
//                         hasFetched: true,
//                         error: null
//                     };
//                 }
//                 return { ...signal, loading: false };
//             });

//             return updatedSignals;
//         });

//         // Update highest speed from telemetry and trips
//         results.forEach(result => {
//             if (!result || !result.newData) return;

//             // ONLY update highest speed from official trip history peak field
//             if (result.name === "Trip History") {
//                 const trips = result.newData;
//                 if (Array.isArray(trips)) {
//                     let maxTripSpeed = 0;
//                     trips.forEach(trip => {
//                         // Use official fields from API: topSpeed, maxSpeed, or MaximumSpeed
//                         const tripMax = parseFloat(trip.topSpeed ?? trip.maxSpeed ?? trip.MaximumSpeed ?? 0);
//                         if (!isNaN(tripMax) && tripMax > maxTripSpeed) maxTripSpeed = tripMax;
//                     });
//                     if (maxTripSpeed > 0) setHighestSpeed(prev => Math.max(prev, maxTripSpeed));
//                 }
//             }
//         });
//     };

//     // const fetchCheckedSignals = async () => {
//     //     const today = new Date().toISOString().split('T')[0];

//     //     // Fetch all in parallel
//     //     const fetchPromises = signals.map(async (signal) => {
//     //         if (!signal.isChecked) return null;

//     //         try {
//     //             let newData;
//     //             if (signal.fetchType === 'events') {
//     //                 newData = await TraxoApi.getEvents(vin, 50, `${today} 00:00:00`, `${today} 23:59:59`);
//     //             } else if (signal.fetchType === 'ignition') {
//     //                 // Fetch last 7 days to ensure we get a status even if car hasn't moved recently
//     //                 const sevenDaysAgo = new Date();
//     //                 sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//     //                 const formattedStart = sevenDaysAgo.toISOString().split('T')[0] + ' 00:00:00';

//     //                 const events = await TraxoApi.getEvents(vin, 500, formattedStart);

//     //                 // FIXED: Filter ignition events correctly
//     //                 newData = (events?.events || [])
//     //                     .filter(e => {
//     //                         // Check various possible event type formats
//     //                         const eventType = (e.eventtype || '').toUpperCase();
//     //                         return eventType === 'IGNITIONSTATUS' ||
//     //                             eventType === 'IGNITION_STATUS' ||
//     //                             eventType === 'IGNITION';
//     //                     })
//     //                     .map(e => {
//     //                         let status = 'OFF';
//     //                         let rawValue = '';

//     //                         try {
//     //                             // Parse event details
//     //                             const details = typeof e.eventdetails === 'string'
//     //                                 ? JSON.parse(e.eventdetails)
//     //                                 : e.eventdetails || {};

//     //                             // Get the event value from various possible fields
//     //                             rawValue = details.eventValue || details.value || details.status || '';

//     //                             // Convert to ON/OFF based on common ignition values
//     //                             const upperValue = String(rawValue).toUpperCase();
//     //                             if (upperValue === 'RUN' ||
//     //                                 upperValue === 'START' ||
//     //                                 upperValue === 'ON' ||
//     //                                 upperValue === 'TRUE' ||
//     //                                 upperValue === '1' ||
//     //                                 upperValue.includes('RUN') ||
//     //                                 upperValue.includes('START')) {
//     //                                 status = 'ON';
//     //                             }
//     //                         } catch (err) {
//     //                             console.warn("Failed to parse ignition details", err, e.eventdetails);
//     //                         }

//     //                         return {
//     //                             ...e,
//     //                             value: status,
//     //                             signalValue: status,
//     //                             rawValue: rawValue,
//     //                             updatedTimeStamp: e.sourcetimestamp,
//     //                             timestamp: e.sourcetimestamp
//     //                         };
//     //                     });

//     //                 console.log("Filtered Ignition Events:", newData);
//     //             } else if (signal.fetchType === 'location') {
//     //                 newData = await TraxoApi.getLocationTelemetryArray(vin);
//     //             } else if (signal.fetchType === 'alerts') {
//     //                 newData = await TraxoApi.getAlerts(vin);
//     //             } else {
//     //                 newData = await TraxoApi.getVehicleTelemetry(vin, signal.apiName);
//     //             }

//     //             const returnData = (newData && newData.events) ? newData.events : newData;
//     //             return { name: signal.name, newData: returnData };
//     //         } catch (error) {
//     //             console.error(`Failed to fetch ${signal.name}`, error);
//     //             return { name: signal.name, error: error.message || "Fetch failed" };
//     //         }
//     //     });

//     //     const results = await Promise.all(fetchPromises);

//     //     setSignals(prevSignals => {
//     //         const updatedSignals = prevSignals.map(signal => {
//     //             const result = results.find(r => r && r.name === signal.name);
//     //             if (!result) return signal;

//     //             const { newData, error } = result;
//     //             if (error) return { ...signal, error, loading: false, hasFetched: true };

//     //             if (newData !== null && newData !== undefined) {
//     //                 const existingData = signal.data || [];
//     //                 const isArray = Array.isArray(newData);
//     //                 const hasData = isArray ? newData.length > 0 : !!newData;

//     //                 let updatedData = existingData;
//     //                 if (hasData) {
//     //                     if (isArray) {
//     //                         // For ignition, we want to keep all events but ensure latest is first
//     //                         const allEvents = [...newData];
//     //                         updatedData = allEvents.slice(0, 50); // Keep last 50 events
//     //                     } else {
//     //                         updatedData = [newData, ...existingData].slice(0, 100);
//     //                     }
//     //                 }

//     //                 return {
//     //                     ...signal,
//     //                     data: updatedData,
//     //                     loading: false,
//     //                     lastUpdated: new Date().toLocaleTimeString(),
//     //                     hasFetched: true,
//     //                     error: null
//     //                 };
//     //             }
//     //             return { ...signal, loading: false };
//     //         });

//     //         return updatedSignals;
//     //     });
//     // };

//     const handleRefresh = async () => {
//         if (!vin) {
//             toast({
//                 title: "Cannot Refresh",
//                 description: "No Valid VIN selected",
//                 status: "warning",
//                 duration: 3000
//             });
//             return;
//         }

//         try {
//             await Promise.all([
//                 fetchCheckedSignals(),
//                 fetchOtherData()
//             ]);
//             toast({
//                 title: "Dashboard Refreshed",
//                 status: "info",
//                 duration: 2000,
//                 isClosable: true,
//             });
//         } catch (error) {
//             console.error("Refresh failed:", error);
//             toast({
//                 title: "Refresh Failed",
//                 description: "Could not update dashboard data.",
//                 status: "error",
//                 duration: 3000,
//                 isClosable: true,
//             });
//         }
//     };

//     // ... [Table and Filter Logic kept same] ...
//     const filteredSignals = signals.filter(signal => {

//         const term = searchTerm.toLowerCase();
//         return (
//             signal.name.toLowerCase().includes(term) ||
//             (signal.apiName && signal.apiName.toLowerCase().includes(term)) ||
//             (signal.id && signal.id.toLowerCase().includes(term))
//         );
//     });

//     // const renderDataAsTable = (data, name) => {
//     //     if (!data || data.length === 0) return null;
//     //     const term = searchTerm.toLowerCase();
//     //     console.log("term----", term);

//     //     const signalMatchesName = name.toLowerCase().includes(term);
//     //     let allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
//     //     const priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp', 'packetStatus', 'messageName'];
//     //     const keys = allKeys.sort((a, b) => {
//     //         const indexA = priorityKeys.indexOf(a);
//     //         const indexB = priorityKeys.indexOf(b);
//     //         if (indexA !== -1 && indexB !== -1) return indexA - indexB;
//     //         if (indexA !== -1) return -1;
//     //         if (indexB !== -1) return 1;
//     //         return 0;
//     //     }).slice(0, 5);
//     //     const filteredRows = signalMatchesName
//     //         ? data.slice(0, 20)
//     //         : data.filter(item => keys.some(key => String(item[key] ?? '').toLowerCase().includes(term))).slice(0, 20);

//     //     if (filteredRows.length === 0) return <Text fontSize="xs" color="gray.500" p={4} textAlign="center">No matching records.</Text>;

//     //     return (
//     //         <TableContainer overflowY="auto" maxH="100%">
//     //             <Table size="sm" variant="simple">
//     //                 <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
//     //                     <Tr>{keys.map(key => (
//     //                         <Th key={key} fontSize="8px" color="gray.600" textTransform="uppercase" px={2} py={2} borderBottom="1px solid" borderColor="gray.100" letterSpacing="0.5px">{key}</Th>
//     //                     ))}</Tr>
//     //                 </Thead>
//     //                 <Tbody>
//     //                     {filteredRows.map((item, idx) => (
//     //                         <Tr key={idx} _hover={{ bg: "gray.50" }}>
//     //                             {keys.map(key => (
//     //                                 <Td key={key} fontSize="9px" py={1.5} px={2} borderBottom="1px solid" borderColor="gray.100" color="gray.800" fontFamily="monospace" fontWeight="bold">
//     //                                     {typeof item[key] === 'object' ? JSON.stringify(item[key]) : String(item[key] ?? '')}
//     //                                 </Td>
//     //                             ))}
//     //                         </Tr>
//     //                     ))}
//     //                 </Tbody>
//     //             </Table>
//     //         </TableContainer>
//     //     );
//     // };

//     // const renderDataAsTable = (data, name, isOdometer = false) => {
//     //     if (!data || data.length === 0) return null;
//     //     const term = searchTerm.toLowerCase();
//     //     const signalMatchesName = name.toLowerCase().includes(term);

//     //     let allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));

//     //     // Priority keys based on signal type
//     //     let priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp', 'packetStatus', 'messageName'];

//     //     // Special handling for Ignition Status
//     //     if (name === "Ignition Status") {
//     //         priorityKeys = ['signalValue', 'sourcetimestamp', 'eventtype', 'eventValue', 'details'];
//     //     }
//     //     // For Odometer, show only essential columns
//     //     else if (isOdometer) {
//     //         priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp'];
//     //     }

//     //     const keys = allKeys.sort((a, b) => {
//     //         const indexA = priorityKeys.indexOf(a);
//     //         const indexB = priorityKeys.indexOf(b);
//     //         if (indexA !== -1 && indexB !== -1) return indexA - indexB;
//     //         if (indexA !== -1) return -1;
//     //         if (indexB !== -1) return 1;
//     //         return 0;
//     //     }).slice(0, name === "Ignition Status" ? 5 : (isOdometer ? 4 : 6));

//     //     const filteredRows = signalMatchesName
//     //         ? data.slice(0, 25)
//     //         : data.filter(item => keys.some(key => String(item[key] ?? '').toLowerCase().includes(term))).slice(0, 25);

//     //     if (filteredRows.length === 0) {
//     //         return (
//     //             <Flex align="center" justify="center" h="100%" p={4}>
//     //                 <Text fontSize="14px" color="gray.500" textAlign="center">No matching records.</Text>
//     //             </Flex>
//     //         );
//     //     }

//     //     // Format the cell value based on the key
//     //     const formatCellValue = (item, key) => {
//     //         const value = item[key];

//     //         // Handle undefined/null
//     //         if (value === undefined || value === null) return '';

//     //         // Handle objects (like details)
//     //         if (typeof value === 'object') {
//     //             // For details object, show a summary
//     //             if (key === 'details') {
//     //                 const details = value;
//     //                 return `${details.eventValue || ''} ${details.message || ''}`.trim() || JSON.stringify(value).substring(0, 30);
//     //             }
//     //             return JSON.stringify(value).substring(0, 30);
//     //         }

//     //         // Handle timestamps - format nicely
//     //         if (key === 'sourcetimestamp' || key === 'updatedTimeStamp' || key === 'timestamp') {
//     //             try {
//     //                 const date = new Date(value);
//     //                 if (!isNaN(date.getTime())) {
//     //                     return date.toLocaleString('en-US', {
//     //                         month: '2-digit',
//     //                         day: '2-digit',
//     //                         hour: '2-digit',
//     //                         minute: '2-digit',
//     //                         second: '2-digit'
//     //                     });
//     //                 }
//     //             } catch (e) {
//     //                 return String(value);
//     //             }
//     //         }

//     //         return String(value);
//     //     };

//     //     return (
//     //         <Box width="100%" overflowX="auto">
//     //             <Table size="sm" variant="simple" width="100%">
//     //                 <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
//     //                     <Tr>
//     //                         {keys.map(key => (
//     //                             <Th
//     //                                 key={key}
//     //                                 fontSize="14px"
//     //                                 color="gray.700"
//     //                                 textTransform="uppercase"
//     //                                 px={4}
//     //                                 py={3}
//     //                                 borderBottom="2px solid"
//     //                                 borderColor="gray.300"
//     //                                 letterSpacing="0.5px"
//     //                                 whiteSpace="nowrap"
//     //                                 fontWeight="800"
//     //                             >
//     //                                 {key}
//     //                             </Th>
//     //                         ))}
//     //                     </Tr>
//     //                 </Thead>
//     //                 <Tbody>
//     //                     {filteredRows.map((item, idx) => (
//     //                         <Tr key={idx} _hover={{ bg: "gray.50" }}>
//     //                             {keys.map(key => {
//     //                                 // Add color coding for signalValue in Ignition Status
//     //                                 const isIgnitionStatus = name === "Ignition Status" && key === "signalValue";
//     //                                 const value = formatCellValue(item, key);

//     //                                 return (
//     //                                     <Td
//     //                                         key={key}
//     //                                         fontSize="12px"
//     //                                         py={3}
//     //                                         px={4}
//     //                                         borderBottom="1px solid"
//     //                                         borderColor="gray.100"
//     //                                         color={isIgnitionStatus && value === 'ON' ? 'green.600' :
//     //                                             isIgnitionStatus && value === 'OFF' ? 'gray.600' : 'gray.800'}
//     //                                         fontFamily="monospace"
//     //                                         fontWeight={isIgnitionStatus ? "700" : "500"}
//     //                                         whiteSpace="nowrap"
//     //                                         bg={isIgnitionStatus && value === 'ON' ? 'green.50' :
//     //                                             isIgnitionStatus && value === 'OFF' ? 'gray.50' : 'transparent'}
//     //                                     >
//     //                                         {value}
//     //                                     </Td>
//     //                                 );
//     //                             })}
//     //                         </Tr>
//     //                     ))}
//     //                 </Tbody>
//     //             </Table>
//     //         </Box>
//     //     );
//     // };



//     const handleFotaUpdate = async () => {
//         if (!fotaVersion) {
//             toast({ title: "Error", description: "Please enter a firmware version", status: "error" });
//             return;
//         }

//         setIsFotaUpdating(true);
//         try {
//             toast({
//                 title: "Initiating FOTA Update",
//                 description: `Version: ${fotaVersion}`,
//                 status: "info",
//                 duration: 3000,
//                 isClosable: true,
//             });

//             // Optimistic UI update
//             const signalIndex = signals.findIndex(s => s.name === "Remote Commands");
//             if (signalIndex !== -1) {
//                 const newCommand = {
//                     command: "FOTA Update",
//                     status: "PENDING",
//                     time: new Date().toLocaleTimeString(),
//                     apiResponse: { actionType: "FOTA_DOWNLOAD", version: fotaVersion, status: "PENDING" }
//                 };

//                 setSignals(prev => {
//                     const newSignals = [...prev];
//                     const currentData = newSignals[signalIndex].data || [];
//                     newSignals[signalIndex].data = [newCommand, ...currentData];
//                     return newSignals;
//                 });
//             }

//             const response = await TraxoApi.triggerFotaUpdate(vin, fotaVersion);
//             console.log("FOTA Response:", response);

//             const commandId = response.commandId || response.fotaId || (response.data && (response.data.commandId || response.data.fotaId));

//             // Update with success/pending and start polling
//             setSignals(prev => {
//                 const newSignals = [...prev];
//                 const signalIdx = newSignals.findIndex(s => s.name === "Remote Commands");
//                 if (signalIdx !== -1) {
//                     const currentData = [...newSignals[signalIdx].data];
//                     if (currentData.length > 0) {
//                         currentData[0] = {
//                             ...currentData[0],
//                             status: commandId ? "PENDING" : "SUCCESS",
//                             commandId: commandId,
//                             apiResponse: response,
//                             time: new Date().toLocaleTimeString()
//                         };
//                         newSignals[signalIdx].data = currentData;
//                     }
//                 }
//                 return newSignals;
//             });

//             if (commandId) {
//                 pollCommandStatus("FOTA Update", commandId, true);
//             }

//             toast({ title: commandId ? "FOTA Update Initiated" : "FOTA Update Triggered", status: "success", duration: 3000 });

//         } catch (error) {
//             console.error("FOTA Failed:", error);
//             setSignals(prev => {
//                 const newSignals = [...prev];
//                 const signalIdx = newSignals.findIndex(s => s.name === "Remote Commands");
//                 if (signalIdx !== -1) {
//                     const currentData = [...newSignals[signalIdx].data];
//                     if (currentData.length > 0) {
//                         currentData[0] = {
//                             ...currentData[0],
//                             status: "FAILED",
//                             apiResponse: { error: error.message || "Request failed" }
//                         };
//                         newSignals[signalIdx].data = currentData;
//                     }
//                 }
//                 return newSignals;
//             });
//             toast({ title: "FOTA Update Failed", description: error.message, status: "error", duration: 5000 });
//         } finally {
//             setIsFotaUpdating(false);
//         }
//     };

//     const handleFotaReset = async () => {
//         if (!confirm("Are you sure you want to reset the FOTA state for this vehicle? This is usually done to fix 'Request is invalid' errors.")) return;

//         try {
//             toast({ title: "Resetting FOTA State...", status: "info", duration: 2000 });
//             const response = await TraxoApi.resetFotaState(vin);
//             console.log("FOTA Reset Response:", response);
//             toast({ title: "FOTA State Reset Successful", status: "success", duration: 3000 });

//             // Log in table
//             const signalIndex = signals.findIndex(s => s.name === "Remote Commands");
//             if (signalIndex !== -1) {
//                 const newCommand = {
//                     command: "FOTA Reset",
//                     status: "SUCCESS",
//                     time: new Date().toLocaleTimeString(),
//                     apiResponse: response
//                 };
//                 setSignals(prev => {
//                     const newSignals = [...prev];
//                     const currentData = newSignals[signalIndex].data || [];
//                     newSignals[signalIndex].data = [newCommand, ...currentData];
//                     return newSignals;
//                 });
//             }

//         } catch (error) {
//             console.error("FOTA Reset Failed:", error);
//             toast({ title: "FOTA Reset Failed", description: error.message, status: "error", duration: 5000 });
//         }
//     };

//     const renderDataAsTable = (data, name, isOdometer = false) => {
//         // Validation check for data structure
//         if (!data) return (
//             <Flex align="center" justify="center" h="100%" p={4}>
//                 <Text fontSize="12px" color="orange.500" fontWeight="bold">NO DATA RECEIVED</Text>
//             </Flex>
//         );

//         const dataArray = Array.isArray(data) ? data : [data];

//         if (dataArray.length === 0) return (
//             <Flex align="center" justify="center" h="100%" p={4}>
//                 <Text fontSize="12px" color="gray.500">NO RECORDS FOUND</Text>
//             </Flex>
//         );

//         const term = searchTerm.toLowerCase();
//         const signalMatchesName = name.toLowerCase().includes(term);

//         // Special handling for Remote Commands
//         if (name === "Remote Commands") {
//             const headerKeys = ['Command ID', 'Version', 'Action', 'Status', 'Time', 'Comments'];

//             return (
//                 <Box width="100%" overflowX="auto">
//                     <Table size="sm" variant="simple" width="100%">
//                         <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
//                             <Tr>
//                                 {headerKeys.map(key => (
//                                     <Th
//                                         key={key}
//                                         fontSize="14px"
//                                         color="gray.700"
//                                         textTransform="uppercase"
//                                         px={4}
//                                         py={3}
//                                         borderBottom="2px solid"
//                                         borderColor="gray.300"
//                                         letterSpacing="0.5px"
//                                         whiteSpace="nowrap"
//                                         fontWeight="800"
//                                     >
//                                         {key}
//                                     </Th>
//                                 ))}
//                             </Tr>
//                         </Thead>
//                         <Tbody>
//                             {dataArray.map((cmd, idx) => {
//                                 const response = cmd.apiResponse || {};
//                                 const commandId = response.commandId || cmd.commandId || '-';
//                                 const actionType = response.actionType || cmd.command || '-';
//                                 const status = response.commandStatus || cmd.status || '-';
//                                 const createdTime = response.createdTime
//                                     ? new Date(response.createdTime * 1000).toLocaleString()
//                                     : (cmd.time || '-');
//                                 const comments = response.comments || '-';
//                                 const version = response.version || '1.0';

//                                 return (
//                                     <Tr key={idx} _hover={{ bg: "gray.50" }}>
//                                         <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" color="gray.800" fontFamily="monospace" fontWeight="bold">{commandId}</Td>
//                                         <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" color="gray.800" fontFamily="monospace" fontWeight="500">{version}</Td>
//                                         <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" color="gray.800" fontFamily="monospace" fontWeight="bold">{actionType}</Td>
//                                         <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" fontFamily="monospace" fontWeight="700">
//                                             <Badge colorScheme={status === 'success' || status === 'accepted' ? 'green' : status === 'pending' || status === 'in progress' ? 'yellow' : 'red'}>
//                                                 {status.toUpperCase()}
//                                             </Badge>
//                                         </Td>
//                                         <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" color="gray.600" fontFamily="monospace">{createdTime}</Td>
//                                         <Td fontSize="12px" py={3} px={4} borderBottom="1px solid" borderColor="gray.100" color="gray.600" maxW="300px" isTruncated title={comments}>
//                                             {comments}
//                                         </Td>
//                                     </Tr>
//                                 );
//                             })}
//                         </Tbody>
//                     </Table>
//                 </Box>
//             );
//         }

//         if (name === "Ignition Status") {
//             const ignitionEvents = dataArray || [];

//             console.log("🔥 Ignition Events to display:", ignitionEvents);

//             if (ignitionEvents.length === 0) {
//                 return (
//                     <Flex align="center" justify="center" h="100%" p={4}>
//                         <Text fontSize="14px" color="gray.500" textAlign="center">No ignition events found</Text>
//                     </Flex>
//                 );
//             }

//             // Get all unique keys from all ignition events
//             const allKeys = Array.from(new Set(
//                 ignitionEvents.flatMap(item => {
//                     // Parse eventdetails to get nested keys
//                     let details = {};
//                     try {
//                         details = typeof item.eventdetails === 'string'
//                             ? JSON.parse(item.eventdetails)
//                             : item.eventdetails || {};
//                     } catch (e) { }

//                     // Combine top-level keys with details keys (prefixed with 'details.')
//                     const topLevelKeys = Object.keys(item).filter(k => k !== 'eventdetails');
//                     const detailsKeys = Object.keys(details).map(k => `details.${k}`);

//                     return [...topLevelKeys, ...detailsKeys];
//                 })
//             ));

//             // Priority keys to show first
//             const priorityKeys = [
//                 'eventtype',
//                 'sourcetimestamp',
//                 'details.eventValue',
//                 'details.ecuCommunicationEventValue',
//                 'details.eventName',
//                 'details.timestamp',
//                 'sourceid',
//                 'eventid',
//                 'eventsubcategory',
//                 'accountId'
//             ];

//             // Sort keys with priority keys first
//             const keys = allKeys.sort((a, b) => {
//                 const indexA = priorityKeys.indexOf(a);
//                 const indexB = priorityKeys.indexOf(b);
//                 if (indexA !== -1 && indexB !== -1) return indexA - indexB;
//                 if (indexA !== -1) return -1;
//                 if (indexB !== -1) return 1;
//                 return a.localeCompare(b);
//             }).slice(0, 10); // Show top 10 columns to avoid overcrowding

//             return (
//                 <Box width="100%" overflowX="auto">
//                     <Table size="sm" variant="simple" width="100%">
//                         <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
//                             <Tr>
//                                 {keys.map(key => (
//                                     <Th
//                                         key={key}
//                                         fontSize="14px"
//                                         color="gray.700"
//                                         textTransform="uppercase"
//                                         px={3}
//                                         py={3}
//                                         borderBottom="2px solid"
//                                         borderColor="gray.300"
//                                         letterSpacing="0.5px"
//                                         whiteSpace="nowrap"
//                                         fontWeight="800"
//                                     >
//                                         {key.replace('details.', '')}
//                                     </Th>
//                                 ))}
//                             </Tr>
//                         </Thead>
//                         <Tbody>
//                             {ignitionEvents.slice(0, 20).map((item, idx) => {
//                                 // Parse eventdetails
//                                 let details = {};
//                                 try {
//                                     details = typeof item.eventdetails === 'string'
//                                         ? JSON.parse(item.eventdetails)
//                                         : item.eventdetails || {};
//                                 } catch (e) {
//                                     details = {};
//                                 }

//                                 return (
//                                     <Tr key={item.eventid || idx} _hover={{ bg: "gray.50" }}>
//                                         {keys.map(key => {
//                                             // Get value based on key path
//                                             let value;
//                                             if (key.startsWith('details.')) {
//                                                 const detailKey = key.replace('details.', '');
//                                                 value = details[detailKey];
//                                             } else {
//                                                 value = item[key];
//                                             }

//                                             // Format the value for display
//                                             let displayValue = value;

//                                             // Handle objects
//                                             if (typeof displayValue === 'object' && displayValue !== null) {
//                                                 displayValue = JSON.stringify(displayValue);
//                                             }

//                                             // Handle timestamps
//                                             if (key.includes('timestamp') || key.includes('TimeStamp')) {
//                                                 try {
//                                                     const date = new Date(displayValue);
//                                                     if (!isNaN(date.getTime())) {
//                                                         displayValue = date.toLocaleString('en-US', {
//                                                             month: '2-digit',
//                                                             day: '2-digit',
//                                                             year: 'numeric',
//                                                             hour: '2-digit',
//                                                             minute: '2-digit',
//                                                             second: '2-digit'
//                                                         });
//                                                     }
//                                                 } catch (e) { }
//                                             }

//                                             // Handle eventValue with color coding
//                                             const isEventValue = key === 'details.eventValue' || key === 'eventValue';
//                                             const isOn = displayValue === 'RUN' || displayValue === 'START';
//                                             const isAcc = displayValue === 'ACC';

//                                             return (
//                                                 <Td
//                                                     key={key}
//                                                     fontSize="12px"
//                                                     py={2.5}
//                                                     px={3}
//                                                     borderBottom="1px solid"
//                                                     borderColor="gray.100"
//                                                     color={isEventValue && isOn ? 'green.600' :
//                                                         isEventValue && isAcc ? 'orange.600' : 'gray.800'}
//                                                     fontFamily="monospace"
//                                                     fontWeight={isEventValue ? "700" : "500"}
//                                                     bg={isEventValue && isOn ? 'green.50' :
//                                                         isEventValue && isAcc ? 'orange.50' : 'transparent'}
//                                                     whiteSpace="nowrap"
//                                                 >
//                                                     {displayValue !== null && displayValue !== undefined
//                                                         ? String(displayValue)
//                                                         : '-'}
//                                                 </Td>
//                                             );
//                                         })}
//                                     </Tr>
//                                 );
//                             })}
//                         </Tbody>
//                     </Table>
//                 </Box>
//             );
//         }

//         // For other signals, show all data
//         // Get all unique keys from all items
//         const allKeys = Array.from(new Set(dataArray.flatMap(item => typeof item === 'object' && item !== null ? Object.keys(item) : [])));

//         if (allKeys.length === 0 && dataArray.length > 0) {
//             return (
//                 <Flex align="center" justify="center" h="100%" p={4} direction="column">
//                     <AlertTriangle size={24} color="#DD6B20" />
//                     <Text fontSize="12px" color="orange.600" fontWeight="bold" mt={2}>IMPROPER DATA FORMAT</Text>
//                     <Text fontSize="10px" color="gray.500" textAlign="center">Raw: {JSON.stringify(dataArray[0]).substring(0, 50)}...</Text>
//                 </Flex>
//             )
//         }

//         // Priority keys based on signal type
//         let priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp', 'packetStatus', 'messageName'];

//         if (name === "Log Files List") {
//             priorityKeys = ['fileName', 'fileSize', 'createdTime', 'status'];
//         } else if (name === "Signal List") {
//             priorityKeys = ['signalName', 'signalId', 'canId', 'byteOrder', 'unit'];
//         } else if (name === "Telemetry Message List") {
//             priorityKeys = ['messageName', 'canId', 'dlc', 'signals'];
//         } else if (name === "Portal Search") {
//             priorityKeys = ['vinNo', 'imei', 'iccid', 'deviceConnectedState', 'car_model'];
//         } else if (name.includes("Trip")) {
//             priorityKeys = ['tripId', 'startTime', 'endTime', 'distance', 'duration', 'topSpeed'];
//         } else if (name === "Alert Ingestion Audit") {
//             priorityKeys = ['vin', 'alertName', 'alertTime', 'status', 'errorCode'];
//         }

//         if (isOdometer) {
//             priorityKeys = ['signalValue', 'signalUnit', 'updatedTimeStamp'];
//         }

//         const keys = allKeys.sort((a, b) => {
//             const indexA = priorityKeys.indexOf(a);
//             const indexB = priorityKeys.indexOf(b);
//             if (indexA !== -1 && indexB !== -1) return indexA - indexB;
//             if (indexA !== -1) return -1;
//             if (indexB !== -1) return 1;
//             return a.localeCompare(b);
//         }).slice(0, 8); // Show up to 8 columns

//         const filteredRows = signalMatchesName
//             ? dataArray.slice(0, 25)
//             : dataArray.filter(item => keys.some(key => String(item[key] ?? '').toLowerCase().includes(term))).slice(0, 25);

//         if (filteredRows.length === 0) {
//             return (
//                 <Flex align="center" justify="center" h="100%" p={4}>
//                     <Text fontSize="14px" color="gray.500" textAlign="center">No matching records.</Text>
//                 </Flex>
//             );
//         }

//         return (
//             <Box width="100%" overflowX="auto">
//                 <Table size="sm" variant="simple" width="100%">
//                     <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
//                         <Tr>
//                             {keys.map(key => (
//                                 <Th
//                                     key={key}
//                                     fontSize="14px"
//                                     color="gray.700"
//                                     textTransform="uppercase"
//                                     px={4}
//                                     py={3}
//                                     borderBottom="2px solid"
//                                     borderColor="gray.300"
//                                     letterSpacing="0.5px"
//                                     whiteSpace="nowrap"
//                                     fontWeight="800"
//                                 >
//                                     {key}
//                                 </Th>
//                             ))}
//                         </Tr>
//                     </Thead>
//                     <Tbody>
//                         {filteredRows.map((item, idx) => (
//                             <Tr key={idx} _hover={{ bg: "gray.50" }}>
//                                 {keys.map(key => {
//                                     let value = item[key];

//                                     // Format objects
//                                     if (typeof value === 'object' && value !== null) {
//                                         value = JSON.stringify(value);
//                                     }

//                                     // Format timestamps
//                                     if (key.includes('timestamp') || key.includes('TimeStamp')) {
//                                         try {
//                                             const date = new Date(value);
//                                             if (!isNaN(date.getTime())) {
//                                                 value = date.toLocaleString('en-US', {
//                                                     month: '2-digit',
//                                                     day: '2-digit',
//                                                     hour: '2-digit',
//                                                     minute: '2-digit',
//                                                     second: '2-digit'
//                                                 });
//                                             }
//                                         } catch (e) { }
//                                     }

//                                     return (
//                                         <Td
//                                             key={key}
//                                             fontSize="12px"
//                                             py={3}
//                                             px={4}
//                                             borderBottom="1px solid"
//                                             borderColor="gray.100"
//                                             color="gray.800"
//                                             fontFamily="monospace"
//                                             fontWeight="500"
//                                             whiteSpace="nowrap"
//                                         >
//                                             {value !== null && value !== undefined ? String(value) : '-'}
//                                         </Td>
//                                     );
//                                 })}
//                             </Tr>
//                         ))}
//                     </Tbody>
//                 </Table>
//             </Box>
//         );
//     };


//     return (
//         <Modal isOpen={isOpen} onClose={onClose} size="full" scrollBehavior="inside">
//             <ModalOverlay />
//             <ModalContent bg="#f8faff" borderRadius="none">
//                 <ModalCloseButton zIndex={10} />
//                 <ModalBody
//                     p={0}
//                     bg="gray.50"
//                     overflowX="hidden"
//                     overflowY="auto"
//                 > {/* Removed padding here, handled in inner Box */}

//                     {/* Header Strip */}
//                     <Box bg="white" borderBottom="1px solid" borderColor="gray.100" px={8} py={3} position="sticky" top={0} zIndex={20} boxShadow="sm">
//                         <Flex justify="space-between" align="center">
//                             <HStack spacing={6}>
//                                 <HStack spacing={3}>
//                                     <IconButton
//                                         icon={<ArrowLeft size={18} />}
//                                         aria-label="Back"
//                                         variant="ghost"
//                                         onClick={onClose}
//                                         size="sm"
//                                     />
//                                     <Heading size="md" color="gray.800" fontWeight="900" letterSpacing="-0.5px">Payload Dashboard</Heading>
//                                 </HStack>
//                                 <HStack spacing={1} bg="gray.100" p={1} borderRadius="xl">
//                                     <Button size="xs" variant={viewMode === 'visual' ? "solid" : "ghost"} colorScheme={viewMode === 'visual' ? "blue" : "gray"} borderRadius="lg" onClick={() => setViewMode('visual')}>Visual</Button>
//                                     <Button size="xs" variant={viewMode === 'table' ? "solid" : "ghost"} colorScheme={viewMode === 'table' ? "blue" : "gray"} borderRadius="lg" onClick={() => setViewMode('table')}>Console</Button>
//                                 </HStack>
//                             </HStack>

//                             <HStack spacing={4}>
//                                 <InputGroup size="sm" w="240px">
//                                     <InputLeftElement pointerEvents="none"><Search size={14} color="#A0AEC0" /></InputLeftElement>
//                                     <Input placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} borderRadius="lg" color="black" bg="gray.50" border="none" _focus={{ bg: 'white', boxShadow: 'outline' }} />
//                                 </InputGroup>
//                                 <HStack spacing={2} align="center">
//                                     <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="0.5px">VIN:</Text>
//                                     <Input value={vin} onChange={(e) => setVin(e.target.value)} size="sm" w="160px" borderRadius="lg" color="black" fontWeight="bold" fontSize="xs" bg="gray.50" border="none" />
//                                 </HStack>
//                                 <HStack spacing={3} bg={isLive ? "green.50" : "gray.100"} px={4} py={1.5} borderRadius="full" border="1px solid" borderColor={isLive ? "green.100" : "gray.200"} cursor="pointer" onClick={() => setIsLive(!isLive)} transition="all 0.2s">
//                                     {isLive && (
//                                         <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
//                                             <Box w={2} h={2} borderRadius="full" bg="green.500" />
//                                         </motion.div>
//                                     )}
//                                     <Text fontSize="9px" fontWeight="900" color={isLive ? "green.600" : "gray.600"} letterSpacing="1px">
//                                         {isLive ? "LIVE SYNC" : "PAUSED"}
//                                     </Text>
//                                 </HStack>
//                                 <IconButton icon={<RotateCcw size={16} />} aria-label="Refresh" size="sm" variant="ghost" onClick={handleRefresh} borderRadius="full" />
//                             </HStack>
//                         </Flex>
//                     </Box>

//                     {/* Main Content Area */}



//                     {/* duplicate version  */}
//                     {viewMode === 'visual' ? (
//                         <VisualDashboardView
//                             signals={signals}
//                             deviceState={deviceState}
//                             highestSpeed={highestSpeed}
//                         />
//                     ) : (
//                         <Box p={8} bg="#f8faff" position="relative" width="100%">
//                             <Box position="absolute" top={0} left={0} right={0} bottom={0}
//                                 backgroundImage="linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)"
//                                 backgroundSize="40px 40px"
//                                 pointerEvents="none" />

//                             <Grid
//                                 templateColumns={{
//                                     base: "1fr",
//                                     md: "repeat(2, 1fr)",
//                                     xl: "repeat(2, 1fr)"
//                                 }}
//                                 gap={6}
//                                 width="100%"
//                                 position="relative"
//                                 zIndex={1}
//                             >
//                                 {(() => {
//                                     const consoleSignals = filteredSignals.filter(s => s.isChecked && !s.hideInConsole);
//                                     return consoleSignals.map((signal, index) => {
//                                         const isOdometer = signal.name === "Total Odometer";

//                                         return (
//                                             <VStack
//                                                 key={index}
//                                                 align="stretch"
//                                                 spacing={2}
//                                                 w="full"
//                                                 maxW={isOdometer ? "450px" : "600px"} // Increased by 50% (300px -> 450px, 400px -> 600px)
//                                                 justifySelf="center"
//                                             >
//                                                 <HStack justify="space-between" h="35px" px={2}>
//                                                     <HStack spacing={3}>
//                                                         <Text fontWeight="800" fontSize="14px" color="gray.700" letterSpacing="0.5px">
//                                                             {signal.name}
//                                                         </Text>
//                                                         <Badge variant="outline" colorScheme="gray" fontSize="10px" fontFamily="monospace" borderRadius="sm" px={2} py={0.5}>
//                                                             {signal.id}
//                                                         </Badge>
//                                                     </HStack>
//                                                     {signal.loading && <Spinner size="sm" color="blue.500" />}
//                                                 </HStack>

//                                                 <Box
//                                                     bg="white"
//                                                     borderRadius="xl"
//                                                     height="350px" // Increased height proportionally
//                                                     width="100%"
//                                                     position="relative"
//                                                     overflow="hidden"
//                                                     border="1px solid"
//                                                     borderColor={signal.error ? "red.200" : "gray.200"}
//                                                     boxShadow="sm"
//                                                 >
//                                                     <Box p={0} height="100%" overflow="auto" width="100%">
//                                                         {signal.error ? (
//                                                             <Flex align="center" justify="center" h="100%" p={8} width="100%" direction="column" bg="red.50">
//                                                                 <AlertTriangle size={40} color="#E53E3E" />
//                                                                 <VStack spacing={2} mt={4}>
//                                                                     <Text color="red.700" fontSize="14px" fontWeight="900" fontFamily="monospace" textAlign="center">
//                                                                         {`> SIGNAL ERROR DETECTED`}
//                                                                     </Text>
//                                                                     <Text color="red.600" fontSize="11px" fontWeight="bold" fontFamily="monospace" textAlign="center" maxW="80%">
//                                                                         {signal.error}
//                                                                     </Text>
//                                                                     <Button
//                                                                         size="xs"
//                                                                         mt={2}
//                                                                         colorScheme="red"
//                                                                         variant="outline"
//                                                                         leftIcon={<RotateCcw size={12} />}
//                                                                         onClick={handleRefresh}
//                                                                     >
//                                                                         RETRY SYNC
//                                                                     </Button>
//                                                                 </VStack>
//                                                             </Flex>
//                                                         ) : signal.data && signal.data.length > 0 ? (
//                                                             <Box width="100%" overflow="auto">
//                                                                 {renderDataAsTable(signal.data, signal.name, isOdometer)}
//                                                             </Box>
//                                                         ) : signal.loading ? (
//                                                             <Flex align="center" justify="center" h="100%" width="100%">
//                                                                 <VStack spacing={2}>
//                                                                     <Spinner size="md" color="blue.400" thickness="3px" />
//                                                                     <Text color="gray.500" fontSize="14px" fontWeight="bold" fontFamily="monospace">
//                                                                         {`> ESTABLISHING LINK...`}
//                                                                     </Text>
//                                                                 </VStack>
//                                                             </Flex>
//                                                         ) : (
//                                                             <Flex align="center" justify="center" h="100%" width="100%" direction="column" bg="gray.50">
//                                                                 <Box opacity={0.3} mb={3}>
//                                                                     <Activity size={32} />
//                                                                 </Box>
//                                                                 <Text color="gray.400" fontSize="14px" fontWeight="bold" fontFamily="monospace">
//                                                                     {`> NO DATA PACKETS`}
//                                                                 </Text>
//                                                                 <Text color="gray.400" fontSize="10px" mt={1}>Waiting for next telemetry update...</Text>
//                                                             </Flex>
//                                                         )}
//                                                     </Box>
//                                                     <Box position="absolute" top={0} left={0} right={0} bottom={0}
//                                                         backgroundImage="linear-gradient(rgba(0,0,0,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.01) 1px, transparent 1px)"
//                                                         backgroundSize="20px 20px"
//                                                         pointerEvents="none" />
//                                                 </Box>
//                                             </VStack>
//                                         );
//                                     })
//                                 })()}
//                             </Grid>
//                         </Box>
//                     )}

//                     {/* Device Events Section (Commented out) */}
//                     {/* Device Details Card */}
//                     {deviceState && (
//                         <Box bg="white" p={4} borderRadius="xl" mt={6} border="1px solid" borderColor="gray.100" boxShadow="sm">
//                             <Heading size="sm" mb={3} color="gray.700">Device Details</Heading>
//                             <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontSize="xs" color="gray.500">VIN</Text>
//                                     <Text fontWeight="bold">{deviceState.vinNo || vin}</Text>
//                                 </VStack>
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontSize="xs" color="gray.500">ICCID</Text>
//                                     <Text fontWeight="bold">{deviceState.iccid || "N/A"}</Text>
//                                 </VStack>
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontSize="xs" color="gray.500">Model</Text>
//                                     <Text fontWeight="bold">{deviceState.car_model || "N/A"}</Text>
//                                 </VStack>
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontSize="xs" color="gray.500">Status</Text>
//                                     <Badge colorScheme={deviceState.deviceConnectedState === 'CONNECTED' ? 'green' : 'red'}>
//                                         {deviceState.deviceConnectedState || "UNKNOWN"}
//                                     </Badge>
//                                 </VStack>
//                             </Grid>
//                         </Box>
//                     )}

//                     {/* Remote Commands & Controls */}
//                     <Box mt={6}>
//                         {/* Remote Commands */}
//                         <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm">
//                             <Heading size="sm" mb={4} color="gray.700">Remote Commands</Heading>
//                             <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={3}>
//                                 <Button
//                                     size="sm" colorScheme="blue" variant="outline"
//                                     isLoading={commandLoading === "Lock Door"}
//                                     onClick={() => handleCommand("Lock Door", TraxoApi.lockDoor)}
//                                 >
//                                     Lock Door
//                                 </Button>
//                                 <Button
//                                     size="sm" colorScheme="blue" variant="outline"
//                                     isLoading={commandLoading === "Unlock Door"}
//                                     onClick={() => handleCommand("Unlock Door", TraxoApi.unlockDoor)}
//                                 >
//                                     Unlock Door
//                                 </Button>
//                                 <Button
//                                     size="sm" colorScheme="orange" variant="outline"
//                                     isLoading={commandLoading === "Blinker ON"}
//                                     onClick={() => handleCommand("Blinker ON", TraxoApi.blinkerOn)}
//                                 >
//                                     Blinker ON
//                                 </Button>
//                                 <Button
//                                     size="sm" colorScheme="orange" variant="outline"
//                                     isLoading={commandLoading === "Blinker OFF"}
//                                     onClick={() => handleCommand("Blinker OFF", TraxoApi.blinkerOff)}
//                                 >
//                                     Blinker OFF
//                                 </Button>
//                                 <Button
//                                     size="sm" colorScheme="red" variant="outline"
//                                     isLoading={commandLoading === "Honk"}
//                                     onClick={() => handleCommand("Honk", TraxoApi.honk)}
//                                 >
//                                     Honk
//                                 </Button>
//                             </Grid>

//                             {/* FOTA Section */}
//                             <Box mt={4} pt={4} borderTop="1px dashed" borderColor="gray.200">
//                                 <Heading size="xs" mb={3} color="gray.600" textTransform="uppercase" letterSpacing="0.5px">Firmware Over-The-Air (FOTA)</Heading>
//                                 <HStack spacing={3}>
//                                     <Input
//                                         placeholder="Version (e.g. 2314.0)"
//                                         value={fotaVersion}
//                                         onChange={(e) => setFotaVersion(e.target.value)}
//                                         size="sm"
//                                         width="180px"
//                                         bg="gray.50"
//                                         borderRadius="md"
//                                         color="black"
//                                     />
//                                     <Button
//                                         size="sm" colorScheme="purple"
//                                         isLoading={isFotaUpdating}
//                                         loadingText="Updating..."
//                                         onClick={handleFotaUpdate}
//                                         leftIcon={<RotateCcw size={14} />}
//                                     >
//                                         Trigger FOTA Update
//                                     </Button>
//                                 </HStack>
//                             </Box>
//                         </Box>
//                     </Box>

//                     {/* Trip Information */}
//                     {ongoingTrip && (
//                         <Box bg="blue.50" p={5} borderRadius="xl" mt={6} border="1px dashed" borderColor="blue.200">
//                             <Flex justify="space-between" align="center" mb={3}>
//                                 <Heading size="sm" color="blue.700">Ongoing Trip</Heading>
//                                 <Badge colorScheme="blue" variant="solid">LIVE</Badge>
//                             </Flex>
//                             <Grid templateColumns={{ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontSize="xs" color="blue.500">Trip ID</Text>
//                                     <Text fontWeight="bold" fontSize="sm">{ongoingTrip.tripId || "N/A"}</Text>
//                                 </VStack>
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontSize="xs" color="blue.500">Start Time</Text>
//                                     <Text fontWeight="bold" fontSize="sm">{ongoingTrip.startTime || "N/A"}</Text>
//                                 </VStack>
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontSize="xs" color="blue.500">Distance</Text>
//                                     <Text fontWeight="bold" fontSize="sm">{ongoingTrip.distance ? `${ongoingTrip.distance} km` : "0 km"}</Text>
//                                 </VStack>
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontSize="xs" color="blue.500">Duration</Text>
//                                     <Text fontWeight="bold" fontSize="sm">{ongoingTrip.duration || "0 min"}</Text>
//                                 </VStack>
//                                 <VStack align="flex-start" spacing={0}>
//                                     <Text fontSize="xs" color="blue.500">Peak Speed</Text>
//                                     <Text fontWeight="bold" fontSize="sm">{ongoingTrip.topSpeed || ongoingTrip.maxSpeed || 0} km/h</Text>
//                                 </VStack>
//                             </Grid>
//                         </Box>
//                     )}
//                 </ModalBody>
//             </ModalContent>
//         </Modal >
//     );
// };

// export default PayloadDashboardModal;



import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalBody,
    Box, Grid, Heading, Text, Button, HStack, VStack, Input,
    Flex, Spacer, Spinner, Badge, IconButton, Table, Thead, Tbody, Tr, Th, Td,
    InputGroup, InputLeftElement, Tooltip, useToast,
    SimpleGrid, Select, Wrap,
} from '@chakra-ui/react';
import Vehicle360Viewer from './Vehicle360Viewer';
import {
    RotateCcw, LayoutDashboard, Wifi, ArrowLeft, Search, Monitor,
    Thermometer, Zap, Fuel, Activity, Car, Map, Bell,
    AlertTriangle, Download, ChevronDown, ChevronUp, Lock, Unlock,
    Volume2, Battery, Navigation, Wind, Settings, RefreshCw,
    BarChart2, Info, Shield, Gauge, Radio
} from 'lucide-react';
import { TraxoApi } from '../../utils/TraxoApi';
import { motion, AnimatePresence } from 'framer-motion';

// ─── THEME ────────────────────────────────────────────────────────────────────
const THEME = {
    bg: '#f0f4ff',
    surface: '#ffffff',
    border: 'rgba(0,0,0,0.06)',
    primary: '#3B6FE8',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#6366F1',
};

// ─── MINI SPARKLINE ───────────────────────────────────────────────────────────
const Sparkline = ({ data = [], color = '#3B6FE8', height = 32, width = 80 }) => {
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

// ─── CIRCULAR GAUGE ──────────────────────────────────────────────────────────
// displayValue = text shown in center (optional, defaults to value+unit)
// fillPct = arc fill percentage 0-100 (optional, defaults to value/100)
const CircularGauge = ({ value, label, unit, color = '#3B6FE8', size = 110, icon: Icon, isError = false, displayValue, fillPct }) => {
    const sw = 7, r = (size - sw) / 2, circ = 2 * Math.PI * r;
    // Use fillPct prop if given, else derive from value/100
    const pct = Math.min(Math.max((fillPct !== undefined ? fillPct : (parseFloat(value) || 0)) / 100, 0), 1);
    const id = (label || '').replace(/\s+/g, '-');
    // What to show in the center text
    const centerText = displayValue !== undefined ? displayValue : `${value}${unit}`;
    return (
        <VStack spacing={2} align="center">
            <Box position="relative" width={size} height={size}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <defs>
                        <filter id={`glow-${id}`}><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.8" /><stop offset="100%" stopColor={color} />
                        </linearGradient>
                    </defs>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="rgba(0,0,0,0.05)" strokeWidth={sw} />
                    <motion.circle cx={size / 2} cy={size / 2} r={r} fill="transparent"
                        stroke={isError ? '#EF4444' : `url(#grad-${id})`} strokeWidth={sw}
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: isError ? 0 : circ - pct * circ }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        filter={!isError ? `url(#glow-${id})` : 'none'} />
                </svg>
                <VStack position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" spacing={0}>
                    {isError ? <AlertTriangle size={22} color="#EF4444" /> : (
                        <>{Icon && <Icon size={13} color={color} opacity={0.8} />}
                            <Text fontSize="md" fontWeight="900" color="gray.800" letterSpacing="-1px">{centerText}</Text></>
                    )}
                </VStack>
            </Box>
            <Text fontSize="9px" fontWeight="800" color={isError ? 'red.400' : 'gray.400'} letterSpacing="1px" textTransform="uppercase">{label}</Text>
        </VStack>
    );
};

// ─── SPEEDOMETER ─────────────────────────────────────────────────────────────
const SpeedometerGauge = ({ value, secondaryValue, highestSpeed, isSpeedError = false, isOdoError = false, isError = false }) => {
    const size = 260, radius = 90, center = size / 2;
    const speed = parseFloat(value) || 0;

    // Odometer Outlier Filter: Ignore values > 300,000 if usual is much lower
    let odo = parseFloat(secondaryValue) || 0;
    if (odo > 300000) odo = 0; // Spike protection

    const maxVal = 240, totalAngle = 270, startAngle = -135;
    const progress = Math.min(speed / maxVal, 1);
    const currentAngle = startAngle + (isSpeedError ? 0 : progress * totalAngle);
    const speedColor = speed > 160 ? '#EF4444' : speed > 100 ? '#F59E0B' : '#3B6FE8';

    const polar = (cx, cy, r, deg) => {
        const rad = (deg - 90) * Math.PI / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };
    const arc = (s, e) => {
        const sp = polar(center, center, radius, e), ep = polar(center, center, radius, s);
        return `M ${sp.x} ${sp.y} A ${radius} ${radius} 0 ${e - s <= 180 ? '0' : '1'} 0 ${ep.x} ${ep.y}`;
    };

    return (
        <VStack spacing={0} position="relative" mt={-4}>
            <Box position="relative" width={size} height={size}>
                <svg width={size} height={size} style={{ overflow: 'visible' }}>
                    <defs>
                        <filter id="sp-glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        <linearGradient id="sp-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={isSpeedError ? '#FEB2B2' : '#60A5FA'} /><stop offset="100%" stopColor={isSpeedError ? '#EF4444' : speedColor} />
                        </linearGradient>
                    </defs>
                    <path d={arc(startAngle, startAngle + totalAngle)} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={12} strokeLinecap="round" />
                    <motion.path d={arc(startAngle, currentAngle)} fill="none" stroke="url(#sp-grad)" strokeWidth={12} strokeLinecap="round" filter="url(#sp-glow)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                    {[...Array(9)].map((_, i) => {
                        const angle = startAngle + (i * totalAngle / 8);
                        const p1 = polar(center, center, radius + 8, angle), p2 = polar(center, center, radius + 18, angle);
                        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={!isSpeedError && speed >= i * (maxVal / 8) ? speedColor : 'rgba(0,0,0,0.1)'} strokeWidth="2" />;
                    })}
                </svg>
                <VStack position="absolute" top="52%" left="50%" transform="translate(-50%, -50%)" spacing={-1}>
                    <Text fontSize="6xl" fontWeight="900" color={speedColor} lineHeight="1" style={{ transition: 'color 0.3s' }}>{Math.floor(speed)}</Text>
                    <Text fontSize="xs" fontWeight="black" color="blue.500" letterSpacing="2px">KM/H</Text>
                    <Box mt={3} textAlign="center">
                        <Text fontSize="9px" fontWeight="black" color="gray.400" letterSpacing="1px">ODOMETER</Text>
                        <Text fontSize="sm" fontWeight="bold" color="gray.700">{odo.toLocaleString()} <Text as="span" fontSize="9px" color="gray.400">KM</Text></Text>
                    </Box>
                </VStack>
            </Box>
        </VStack>
    );
};

// ─── STATUS TOGGLE ────────────────────────────────────────────────────────────
const StatusToggle = ({ label, description, isOn, icon: Icon, isError = false, color = 'blue', statusText }) => (
    <Box bg="white" p={4} borderRadius="2xl" border="1px solid" borderColor={isError ? 'red.200' : 'gray.100'} boxShadow="sm" position="relative" overflow="hidden" transition="all 0.3s">
        {isOn && !isError && <Box position="absolute" top="-20%" right="-10%" w="80px" h="80px" bg={`${color}.50`} filter="blur(30px)" opacity={0.9} zIndex={0} />}
        <Flex align="center" justify="space-between" position="relative" zIndex={1}>
            <HStack spacing={3}>
                <Box p={2.5} borderRadius="xl" bg={isError ? 'red.500' : isOn ? `${color}.500` : 'gray.100'}>
                    <Icon size={18} color={isOn || isError ? 'white' : '#718096'} />
                </Box>
                <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="800" color="gray.800" fontSize="sm">{label}</Text>
                    <Text fontSize="9px" color={isError ? 'red.500' : 'gray.400'} fontWeight="bold" textTransform="uppercase" letterSpacing="0.5px">
                        {isError ? 'STREAM ERROR' : description}
                    </Text>
                </VStack>
            </HStack>
            <VStack align="flex-end" spacing={1}>
                <Box w="10px" h="10px" borderRadius="full" bg={isError ? 'red.500' : isOn ? `${color}.500` : 'gray.300'} transition="all 0.3s" />
                <Text fontSize="8px" fontWeight="900" color={isError ? 'red.600' : isOn ? `${color}.600` : 'gray.400'} letterSpacing="1px">
                    {statusText || (isError ? 'FAILURE' : isOn ? 'ACTIVE' : 'OFF')}
                </Text>
            </VStack>
        </Flex>
    </Box>
);

// ─── VEHICLE STATUS PANEL ─────────────────────────────────────────────────────



// ─── TEMP CARD ────────────────────────────────────────────────────────────────
const TempCard = ({ temp, label, interiorTemp = '--', isError = false }) => (
    <Box bg="white" p={4} borderRadius="2xl" border="1px solid" borderColor={isError ? 'red.200' : 'gray.100'} boxShadow="sm" height="full" overflow="hidden">
        <Flex justify="space-between" align="start" mb={3}>
            <VStack align="flex-start" spacing={0}>
                <HStack spacing={2}>
                    <Text fontWeight="800" color={isError ? 'red.500' : 'blue.500'} fontSize="xs" textTransform="uppercase">{label}</Text>
                    <Thermometer size={13} color={isError ? '#EF4444' : '#3B6FE8'} />
                </HStack>
                <Text color="gray.400" fontSize="9px" fontWeight="bold">Ext: {interiorTemp}°C</Text>
            </VStack>
            <Box w={2} h={2} borderRadius="full" bg={isError ? 'red.500' : parseFloat(temp) > 100 ? 'orange.500' : 'blue.500'} />
        </Flex>
        <Flex align="center" justify="center" py={1} mb={3}>
            {isError ? <VStack spacing={1}><AlertTriangle size={28} color="#EF4444" /><Text fontSize="xs" fontWeight="black" color="red.500">DATA ERROR</Text></VStack>
                : <Text fontSize="5xl" fontWeight="900" color={parseFloat(temp) > 100 ? 'orange.500' : 'gray.800'} lineHeight="1">{temp}°</Text>}
        </Flex>
        {!isError && (
            <VStack width="full" align="flex-start" spacing={2}>
                <Flex justify="space-between" width="full">
                    <Text fontSize="9px" fontWeight="black" color="blue.600">COOLING</Text>
                    <Badge variant="subtle" colorScheme={parseFloat(temp) > 100 ? 'orange' : 'blue'} fontSize="7px" px={2} borderRadius="full">{parseFloat(temp) > 100 ? 'WARNING' : 'NORMAL'}</Badge>
                </Flex>
                <Box width="full" h="3px" bg="gray.100" borderRadius="full">
                    <Box width={`${Math.min((parseFloat(temp) / 110) * 100, 100)}%`} h="full" bg={parseFloat(temp) > 100 ? 'orange.400' : 'blue.400'} borderRadius="full" transition="width 0.5s ease" />
                </Box>
            </VStack>
        )}
    </Box>
);

// ─── DEVICE EVENTS ────────────────────────────────────────────────────────────
const DeviceEventsList = ({ events }) => {
    const recent = (events || []).filter(e => e.sourcetimestamp && (Date.now() - new Date(e.sourcetimestamp).getTime()) < 15000).slice(0, 3);
    if (!recent.length) return null;
    return (
        <Box position="absolute" top={20} right={8} maxW="280px" zIndex={9} pointerEvents="none">
            <VStack spacing={2} align="stretch">
                {recent.map((evt, i) => {
                    let details = {}; try { details = JSON.parse(evt.eventdetails || '{}'); } catch (e) { }
                    return (
                        <motion.div key={evt.eventid || i} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
                            <Box bg="whiteAlpha.900" backdropFilter="blur(8px)" p={3} borderRadius="lg" boxShadow="sm" borderLeft="3px solid" borderColor="purple.400" pointerEvents="auto">
                                <HStack justify="space-between" mb={1}>
                                    <Text fontSize="10px" fontWeight="bold" color="purple.600" textTransform="uppercase">{evt.eventtype || 'Event'}</Text>
                                    <Text fontSize="9px" color="gray.400">{evt.sourcetimestamp ? new Date(evt.sourcetimestamp).toLocaleTimeString() : ''}</Text>
                                </HStack>
                                <Text fontSize="9px" color="gray.600" noOfLines={2}>{details.status || details.message || 'Event Received'}</Text>
                            </Box>
                        </motion.div>
                    );
                })}
            </VStack>
        </Box>
    );
};

// ─── VISUAL DASHBOARD ─────────────────────────────────────────────────────────
const VisualDashboardView = ({ signals, deviceState, highestSpeed }) => {
    // ─── Jeep Vehicle Status data (exact field names from API response) ───────
    const vsData = signals.find(s => s.name === 'Jeep Vehicle Status')?.data?.[0];

    // getVal: reads the latest data point from a signal, using the EXACT same field
    // priority as SignalCard does (signalValue → value → Event → signalUnit fallbacks).
    // This guarantees the Visual gauge always shows the same number as the Console table.
    const getVal = (name, def = 0) => {
        // 1️⃣ PRIMARY: individual CAN telemetry signal (same source as Console table)
        const s = signals.find(sig => sig.name === name);
        if (s?.data?.length > 0) {
            const l = s.data[0];
            // Use the same field order as SignalCard's latestVal computation
            const r = l.signalValue ?? l.value ?? l.Event ?? l.signalData ?? l.data;
            if (r !== undefined && r !== null && r !== '') {
                if (name === 'Battery Voltage Level') return parseFloat(r) || 0;
                return r;
            }
        }
        // 2️⃣ FALLBACK: Jeep Vehicle Status API (only when telemetry has no data at all)
        if (vsData) {
            if (name === 'Fuel Level') {
                const v = parseFloat(vsData.fuelPercentage ?? vsData.fuelLevelPct ?? vsData.fuelLevel);
                if (!isNaN(v) && v > 0) return v;
            }
            if (name === 'Vehicle Speed') {
                const v = parseFloat(vsData.speed ?? vsData.vehicleSpeed);
                if (!isNaN(v)) return v;
            }
            if (name === 'Engine Water Temp') {
                const v = parseFloat(vsData.coolant ?? vsData.engineWaterTemp ?? vsData.engineCoolantTemp);
                if (!isNaN(v) && v > 0) return v;
            }
            if (name === 'Battery Voltage Level') {
                const v = parseFloat(vsData.battery ?? vsData.batteryVoltage);
                if (!isNaN(v) && v > 0) return v;
            }
            if (name === 'Total Odometer') {
                const v = parseFloat(vsData.odometer ?? vsData.totalOdometer);
                if (!isNaN(v) && v > 0) return v;
            }
            if (name === 'Engine Speed') {
                const v = parseFloat(vsData.engineRpm ?? vsData.engineSpeed);
                if (!isNaN(v) && v >= 0) return v;
            }
            if (name === 'External Temperature (C)') {
                const v = parseFloat(vsData.ambientTemp ?? vsData.externalTemp ?? vsData.outsideTemp);
                if (!isNaN(v)) return v;
            }
            if (name === 'External Temperature (F)') {
                const v = parseFloat(vsData.ambientTemp ?? vsData.externalTemp ?? vsData.outsideTemp);
                if (!isNaN(v)) return (v * 1.8 + 32).toFixed(1);
            }
        }
        return def;
    };


    const isSigError = (name) => !!(signals.find(s => s.name === name)?.error);
    const getComplex = (name) => { const s = signals.find(s => s.name === name); return s?.data?.length > 0 ? s.data[0] : null; };

    const vehicleSpeed = getVal('Vehicle Speed', 0);
    const engineSpeed = getVal('Engine Speed', 0);
    const fuel = getVal('Fuel Level', 0);
    const batteryRaw = getVal('Battery Voltage Level', 0);
    const batteryPct = Math.min(Math.round((batteryRaw / 15) * 100), 100);
    const engineTemp = getVal('Engine Water Temp', 0);
    const extTemp = getVal('External Temperature (C)', 0);
    const odometer = getVal('Total Odometer', 0);

    const ignSig = signals.find(s => s.name === 'Ignition Status');
    // Use ignitionStatus from vehicleStatus API (confirmed field name)
    const ignition = ignSig?.data?.length > 0 ? getVal('Ignition Status') : (vsData?.ignitionStatus ?? deviceState?.ignition ?? 'OFF');
    const locationData = getComplex('Location');
    const alertsData = getComplex('Alerts');
    const hasEmergency = Array.isArray(alertsData) ? alertsData.length > 0 : !!alertsData;
    const deviceEvents = signals.find(s => s.name === 'Device Events')?.data || [];
    const lastCmds = signals.find(s => s.name === 'Remote Commands')?.data?.slice(0, 3) || [];
    const speedHistory = signals.find(s => s.name === 'Vehicle Speed')?.data || [];

    // Location: prefer live telemetry, fallback to vehicleStatus API (gpsLat/gpsLong confirmed)
    const lat = locationData?.gpsLat || locationData?.latitude || locationData?.Latitude || vsData?.gpsLat;
    const long = locationData?.gpsLong || locationData?.longitude || locationData?.Longitude || vsData?.gpsLong;
    const coords = (lat && long) ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}` : '12.9529, 80.2331';

    const getMostRecentTs = () => {
        let best = null;
        signals.forEach(s => {
            if (s.name === 'Remote Commands' || !s.data?.length) return;
            const l = s.data[0];
            const ts = l.updatedTimeStamp || l.UPDATEDTIMESTAMP || l.sourcetimestamp || l.timestamp;
            if (ts) { const d = new Date(ts); if (!isNaN(d) && (!best || d > best)) best = d; }
        });
        return best;
    };
    const lastUpdate = getMostRecentTs();
    const hasAnyError = signals.some(s => s.error);
    const errorNames = signals.filter(s => s.error).map(s => s.name);
    const isUsingVirtual = signals.some(s => s.data?.[0]?.isVirtual);
    const ignOn = ['ON', 'TRUE', 'CONNECTED', '1', 'RUN', 'START'].includes(String(ignition).toUpperCase());

    const ignitionDisplay = (() => {
        const val = String(ignition || '').toUpperCase();
        if (val === 'IGN_LK') return 'PARKED';
        if (val === 'RUN') return 'DRIVING';
        if (val === 'START') return 'START';
        return val || 'OFF';
    })();

    return (


        // <Box w="full" bg={THEME.bg} pt={8} px={8} pb={2} borderRadius="none" position="relative" overflow="hidden">
        //     <Box position="absolute" top={0} left={0} right={0} bottom={0} backgroundImage="radial-gradient(circle, #dde4f0 1px, transparent 1px)" backgroundSize="32px 32px" pointerEvents="none" opacity={0.5} zIndex={0} />
        //     <DeviceEventsList events={deviceEvents} />
        //     <Box position="relative" zIndex={1}>
        //         {hasAnyError && (
        //             <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        //                 <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} borderRadius="xl" mb={5} boxShadow="sm">
        //                     <Flex align="center" gap={3}>
        //                         <AlertTriangle color="#EF4444" size={16} />
        //                         <VStack align="flex-start" spacing={0}>
        //                             <Text color="red.700" fontWeight="bold" fontSize="xs">DATA SYNC ALERT</Text>
        //                             <Text color="red.600" fontSize="10px">Signals with errors: {errorNames.join(', ')}</Text>
        //                         </VStack>
        //                     </Flex>
        //                 </Box>
        //             </motion.div>
        //         )}

        //         {/* Status Row */}
        //         <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={6}>
        //             <StatusToggle label="Ignition Status" description="Engine status" isOn={ignOn} icon={Zap} isError={isSigError('Ignition Status')} color="blue" statusText={String(ignition || 'OFF').toUpperCase()} />
        //             <StatusToggle label="Device Connected" description={deviceState?.deviceConnectedState || 'Unknown'} isOn={deviceState?.deviceConnectedState === 'CONNECTED'} icon={Wifi} color="green" />
        //             <StatusToggle label="Trip Active" description="Ongoing trip status" isOn={ignOn} icon={Navigation} color="purple" statusText={ignitionDisplay} />
        //         </Grid>

        //         {/* Main Grid */}
        //         <Grid templateColumns="1.3fr 0.8fr 1.6fr" gap={5} mb={6} h="380px">
        //             {/* Map */}
        //             <Box bg="white" borderRadius="2xl" overflow="hidden" position="relative" border="1px solid" borderColor="gray.100" boxShadow="sm">
        //                 {lat && long ? (
        //                     <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${lat},${long}&t=&z=15&ie=UTF8&iwloc=&output=embed`} />
        //                 ) : (
        //                     <Flex bg="gray.50" h="full" align="center" justify="center" direction="column">
        //                         <Map size={36} color="#CBD5E0" /><Text mt={2} color="gray.400" fontWeight="bold" fontSize="xs">AWAITING GPS</Text>
        //                     </Flex>
        //                 )}
        //                 <Box position="absolute" top={3} left={3} bg="whiteAlpha.950" backdropFilter="blur(8px)" p={3} borderRadius="xl" boxShadow="lg">
        //                     <Flex align="center" gap={2}>
        //                         <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}><Activity size={14} color="#3B6FE8" /></motion.div>
        //                         <VStack align="flex-start" spacing={0}>
        //                             <Text fontSize="sm" fontWeight="900" color="gray.800" letterSpacing="-0.5px">{coords}</Text>
        //                             <Text fontSize="8px" color="gray.500" fontWeight="black" letterSpacing="1px">LIVE COORDINATES</Text>
        //                         </VStack>
        //                     </Flex>
        //                 </Box>
        //                 <AnimatePresence>
        //                     {lastCmds.length > 0 && (
        //                         <Box position="absolute" bottom={3} right={3} maxW="180px" zIndex={5}>
        //                             <VStack spacing={1.5} align="stretch">
        //                                 {lastCmds.map((cmd, i) => (
        //                                     <motion.div key={i} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
        //                                         <Box bg={cmd.status === 'SUCCESS' ? 'green.500' : cmd.status === 'PENDING' ? 'orange.400' : 'red.500'} color="white" p={2} borderRadius="lg" boxShadow="md">
        //                                             <HStack justify="space-between"><Text fontSize="9px" fontWeight="black">{(cmd.command || 'CMD').toUpperCase()}</Text><Text fontSize="8px" opacity={0.8}>{cmd.status}</Text></HStack>
        //                                             <Text fontSize="8px" opacity={0.7}>{cmd.time}</Text>
        //                                         </Box>
        //                                     </motion.div>
        //                                 ))}
        //                             </VStack>
        //                         </Box>
        //                     )}
        //                 </AnimatePresence>
        //             </Box>

        //             {/* Center */}
        //             <VStack spacing={4} h="full">
        //                 {/* Vehicle Status Info Card - uses confirmed API field names */}
        //                 {vsData && (
        //                     <Box w="full" bg="white" p={4} borderRadius="2xl" border="1px solid" borderColor="blue.100" boxShadow="sm">
        //                         <HStack spacing={2} mb={3}>
        //                             <Car size={14} color="#3B6FE8" />
        //                             <Text fontWeight="800" color="gray.700" fontSize="xs">JEEP STATUS</Text>
        //                             <Spacer />
        //                             <Badge colorScheme={['RUN', 'ON', 'START'].includes(String(vsData.ignitionStatus || '').toUpperCase()) ? 'green' : 'orange'} variant="solid" fontSize="8px">
        //                                 {vsData.ignitionStatus || 'OFF'}
        //                             </Badge>
        //                         </HStack>
        //                         <SimpleGrid columns={2} spacing={2}>
        //                             <Box p={2} bg="blue.50" borderRadius="lg">
        //                                 <Text fontSize="8px" color="gray.400" fontWeight="black">FUEL</Text>
        //                                 <Text fontSize="14px" fontWeight="900" color="blue.700">{vsData.fuelPercentage ?? '--'}%</Text>
        //                             </Box>
        //                             <Box p={2} bg="green.50" borderRadius="lg">
        //                                 <Text fontSize="8px" color="gray.400" fontWeight="black">BATTERY</Text>
        //                                 <Text fontSize="14px" fontWeight="900" color="green.700">{vsData.battery ?? '--'}V</Text>
        //                             </Box>
        //                             <Box p={2} bg="orange.50" borderRadius="lg">
        //                                 <Text fontSize="8px" color="gray.400" fontWeight="black">COOLANT</Text>
        //                                 <Text fontSize="14px" fontWeight="900" color="orange.700">{vsData.coolant ?? '--'}°C</Text>
        //                             </Box>
        //                             <Box p={2} bg="purple.50" borderRadius="lg">
        //                                 <Text fontSize="8px" color="gray.400" fontWeight="black">ODOMETER</Text>
        //                                 <Text fontSize="12px" fontWeight="900" color="purple.700">{vsData.odometer ? Number(vsData.odometer).toLocaleString() : '--'} km</Text>
        //                             </Box>
        //                             <Box p={2} bg="pink.50" borderRadius="lg">
        //                                 <Text fontSize="8px" color="gray.400" fontWeight="black">EXTERNAL</Text>
        //                                 <Text fontSize="14px" fontWeight="900" color="pink.700">{vsData.ambientTemp ?? vsData.externalTemp ?? '--'}°C</Text>
        //                             </Box>
        //                         </SimpleGrid>
        //                     </Box>
        //                 )}

        //                 <Box flex={1} w="full" bg="white" p={4} borderRadius="2xl" border="1px solid" borderColor="gray.100" boxShadow="sm">
        //                     <Flex justify="space-between" align="center" mb={1}>
        //                         <Text fontWeight="800" color="blue.500" fontSize="xs">LAST UPDATED</Text>
        //                     </Flex>
        //                     <Text color="gray.400" fontSize="9px" fontWeight="bold" mb={1}>{lastUpdate ? lastUpdate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}</Text>
        //                     <Text fontSize="2xl" fontWeight="900" color="gray.800" letterSpacing="-1px">{lastUpdate ? lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</Text>
        //                     {speedHistory.length > 1 && (
        //                         <Box mt={2}>
        //                             <Text fontSize="8px" color="gray.400" fontWeight="black" letterSpacing="1px" mb={1}>SPEED TREND</Text>
        //                             <Sparkline data={speedHistory} color="#3B6FE8" width={100} height={28} />
        //                         </Box>
        //                     )}
        //                 </Box>
        //             </VStack>

        //             {/* Vehicle Viewer */}
        //             <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" boxShadow="sm" overflow="hidden">
        //                 <Vehicle360Viewer baseUrl="https://imgd.aeplcdn.com/1280x720/cw/360/jeep/1048/5364/closed-door/c2c7cb/" imageCount={60} />
        //             </Box>
        //         </Grid>


        //     </Box>
        // </Box>
        <>

            {/* demo1 */}
            <Box
                w="full"
                bg={THEME.bg}
                pt={8}
                px={8}
                pb={2}
                position="relative"
                overflow="visible" // Change from 'hidden' to 'visible'
            // minH="100%" // Ensure minimum height
            >
                <Box position="absolute" top={0} left={0} right={0} bottom={0} backgroundImage="radial-gradient(circle, #dde4f0 1px, transparent 1px)" backgroundSize="32px 32px" pointerEvents="none" opacity={0.5} zIndex={0} />
                <DeviceEventsList events={deviceEvents} />
                <Box position="relative" zIndex={1}>
                    {hasAnyError && (
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                            <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} borderRadius="xl" mb={5} boxShadow="sm">
                                <Flex align="center" gap={3}>
                                    <AlertTriangle color="#EF4444" size={16} />
                                    <VStack align="flex-start" spacing={0}>
                                        <Text color="red.700" fontWeight="bold" fontSize="xs">DATA SYNC ALERT</Text>
                                        <Text color="red.600" fontSize="10px">Signals with errors: {errorNames.join(', ')}</Text>
                                    </VStack>
                                </Flex>
                            </Box>
                        </motion.div>
                    )}

                    {isUsingVirtual && (
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                            <Box bg="purple.50" border="1px solid" borderColor="purple.200" p={3} borderRadius="xl" mb={5} boxShadow="sm">
                                <Flex align="center" gap={3}>
                                    <Radio color="#805AD5" size={16} />
                                    <VStack align="flex-start" spacing={0}>
                                        <Text color="purple.700" fontWeight="bold" fontSize="xs">SIMULATED DATA ACTIVE</Text>
                                        <Text color="purple.600" fontSize="10px">Rendering telemetry from MQTT Virtual Device for VIN: {vin}</Text>
                                    </VStack>
                                </Flex>
                            </Box>
                        </motion.div>
                    )}

                    {/* Status Row */}
                    <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={6}>
                        <StatusToggle label="Ignition Status" description="Engine status" isOn={ignOn} icon={Zap} isError={isSigError('Ignition Status')} color="blue" statusText={String(ignition || 'OFF').toUpperCase()} />
                        <StatusToggle label="Device Connected" description={deviceState?.deviceConnectedState || 'Unknown'} isOn={deviceState?.deviceConnectedState === 'CONNECTED'} icon={Wifi} color="green" />
                        <StatusToggle label="Trip Active" description="Ongoing trip status" isOn={ignOn} icon={Navigation} color="purple" statusText={ignitionDisplay} />
                    </Grid>

                    {/* Main Grid */}
                    <Grid templateColumns="1.3fr 0.8fr 1.6fr" gap={5} mb={6} h="380px">
                        {/* Map */}
                        <Box bg="white" borderRadius="2xl" overflow="hidden" position="relative" border="1px solid" borderColor="gray.100" boxShadow="sm">
                            {lat && long ? (
                                <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${lat},${long}&t=&z=15&ie=UTF8&iwloc=&output=embed`} />
                            ) : (
                                <Flex bg="gray.50" h="full" align="center" justify="center" direction="column">
                                    <Map size={36} color="#CBD5E0" /><Text mt={2} color="gray.400" fontWeight="bold" fontSize="xs">AWAITING GPS</Text>
                                </Flex>
                            )}
                            <Box position="absolute" top={3} left={3} bg="whiteAlpha.950" backdropFilter="blur(8px)" p={3} borderRadius="xl" boxShadow="lg">
                                <Flex align="center" gap={2}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}><Activity size={14} color="#3B6FE8" /></motion.div>
                                    <VStack align="flex-start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="900" color="gray.800" letterSpacing="-0.5px">{coords}</Text>
                                        <Text fontSize="8px" color="gray.500" fontWeight="black" letterSpacing="1px">LIVE COORDINATES</Text>
                                    </VStack>
                                </Flex>
                            </Box>
                            <AnimatePresence>
                                {lastCmds.length > 0 && (
                                    <Box position="absolute" bottom={3} right={3} maxW="180px" zIndex={5}>
                                        <VStack spacing={1.5} align="stretch">
                                            {lastCmds.map((cmd, i) => (
                                                <motion.div key={i} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                                                    <Box bg={cmd.status === 'SUCCESS' ? 'green.500' : cmd.status === 'PENDING' ? 'orange.400' : 'red.500'} color="white" p={2} borderRadius="lg" boxShadow="md">
                                                        <HStack justify="space-between"><Text fontSize="9px" fontWeight="black">{(cmd.command || 'CMD').toUpperCase()}</Text><Text fontSize="8px" opacity={0.8}>{cmd.status}</Text></HStack>
                                                        <Text fontSize="8px" opacity={0.7}>{cmd.time}</Text>
                                                    </Box>
                                                </motion.div>
                                            ))}
                                        </VStack>
                                    </Box>
                                )}
                            </AnimatePresence>
                        </Box>

                        {/* Center */}
                        <VStack spacing={4} h="full">
                            {/* Vehicle Status Info Card - uses confirmed API field names */}
                            {vsData && (
                                <Box w="full" bg="white" p={4} borderRadius="2xl" border="1px solid" borderColor="blue.100" boxShadow="sm">
                                    <HStack spacing={2} mb={3}>
                                        <Car size={14} color="#3B6FE8" />
                                        <Text fontWeight="800" color="gray.700" fontSize="xs">JEEP STATUS</Text>
                                        <Spacer />
                                        <Badge colorScheme={['RUN', 'ON', 'START'].includes(String(vsData.ignitionStatus || '').toUpperCase()) ? 'green' : 'orange'} variant="solid" fontSize="8px">
                                            {vsData.ignitionStatus || 'OFF'}
                                        </Badge>
                                    </HStack>
                                    <SimpleGrid columns={2} spacing={2}>
                                        <Box p={2} bg="blue.50" borderRadius="lg">
                                            <Text fontSize="8px" color="gray.400" fontWeight="black">FUEL</Text>
                                            <Text fontSize="14px" fontWeight="900" color="blue.700">{vsData.fuelPercentage ?? '--'}%</Text>
                                        </Box>
                                        <Box p={2} bg="green.50" borderRadius="lg">
                                            <Text fontSize="8px" color="gray.400" fontWeight="black">BATTERY</Text>
                                            <Text fontSize="14px" fontWeight="900" color="green.700">{vsData.battery ?? '--'}V</Text>
                                        </Box>
                                        <Box p={2} bg="orange.50" borderRadius="lg">
                                            <Text fontSize="8px" color="gray.400" fontWeight="black">COOLANT</Text>
                                            <Text fontSize="14px" fontWeight="900" color="orange.700">{vsData.coolant ?? '--'}°C</Text>
                                        </Box>
                                        <Box p={2} bg="purple.50" borderRadius="lg">
                                            <Text fontSize="8px" color="gray.400" fontWeight="black">ODOMETER</Text>
                                            <Text fontSize="12px" fontWeight="900" color="purple.700">{vsData.odometer ? Number(vsData.odometer).toLocaleString() : '--'} km</Text>
                                        </Box>
                                        <Box p={2} bg="pink.50" borderRadius="lg">
                                            <Text fontSize="8px" color="gray.400" fontWeight="black">EXTERNAL</Text>
                                            <Text fontSize="14px" fontWeight="900" color="pink.700">{vsData.ambientTemp ?? vsData.externalTemp ?? '--'}°C</Text>
                                        </Box>
                                    </SimpleGrid>
                                </Box>
                            )}

                            <Box flex={1} w="full" bg="white" p={4} borderRadius="2xl" border="1px solid" borderColor="gray.100" boxShadow="sm">
                                <Flex justify="space-between" align="center" mb={1}>
                                    <Text fontWeight="800" color="blue.500" fontSize="xs">LAST UPDATED</Text>
                                </Flex>
                                <Text color="gray.400" fontSize="9px" fontWeight="bold" mb={1}>{lastUpdate ? lastUpdate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}</Text>
                                <Text fontSize="2xl" fontWeight="900" color="gray.800" letterSpacing="-1px">{lastUpdate ? lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</Text>
                                {speedHistory.length > 1 && (
                                    <Box mt={2}>
                                        <Text fontSize="8px" color="gray.400" fontWeight="black" letterSpacing="1px" mb={1}>SPEED TREND</Text>
                                        <Sparkline data={speedHistory} color="#3B6FE8" width={100} height={28} />
                                    </Box>
                                )}
                            </Box>
                        </VStack>

                        {/* Vehicle Viewer */}
                        <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" boxShadow="sm" overflow="hidden">
                            <Vehicle360Viewer baseUrl="https://imgd.aeplcdn.com/1280x720/cw/360/jeep/1048/5364/closed-door/c2c7cb/" imageCount={60} />
                        </Box>
                    </Grid>


                </Box>
            </Box>
        </>


    );
};

// Helper to format timestamps as DDMMYYYY HHMMSS
const formatFullDate = (ts) => {
    if (!ts) return '-';
    try {
        let date = new Date(ts);
        // Handle numeric strings (Unix timestamps like 1775055158075)
        if (isNaN(date.getTime()) && !isNaN(Number(ts))) {
            date = new Date(Number(ts));
        }
        if (isNaN(date.getTime())) return String(ts);
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        const h = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        return `${d}/${m}/${y} ${h}:${min}:${s}`;
    } catch (e) {
        return String(ts);
    }
};

/**
 * Deeply traverses an object or array and formats any 13-digit numbers
 * into a human-readable DD/MM/YYYY HH:MM:SS string.
 * This ensures that even if API data is nested, timestamps are readable.
 */
const deepFormatDates = (obj) => {
    if (!obj || typeof obj !== 'object') {
        // If it's a 13-digit number (timestamp), format it
        if ((typeof obj === 'number' || (typeof obj === 'string' && !isNaN(Number(obj)))) && String(obj).length === 13) {
            return formatFullDate(obj);
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepFormatDates(item));
    }

    const formatted = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            // Format if it's a timestamp key or a 13-digit value
            if ((key.toLowerCase().includes('time') || key.toLowerCase().includes('stamp') || key.toLowerCase().includes('date')) &&
                (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)))) && String(val).length === 13) {
                formatted[key] = formatFullDate(val);
            } else {
                formatted[key] = deepFormatDates(val);
            }
        }
    }
    return formatted;
};

// ─── DATA TABLE RENDERER ──────────────────────────────────────────────────────
const renderDataAsTable = (data, name, searchTerm = '') => {
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

    if (name === 'Ignition Status') {
        const priority = ['eventtype', 'sourcetimestamp', 'eventValue', 'signalValue', 'details.eventValue', 'sourceid'];
        const allK = Array.from(new Set(arr.flatMap(item => {
            let d = {}; try { d = typeof item.eventdetails === 'string' ? JSON.parse(item.eventdetails) : item.eventdetails || {}; } catch (e) { }
            return [...Object.keys(item).filter(k => k !== 'eventdetails'), ...Object.keys(d).map(k => `details.${k}`)];
        })));
        const keys = allK.sort((a, b) => { const ia = priority.indexOf(a), ib = priority.indexOf(b); if (ia !== -1 && ib !== -1) return ia - ib; if (ia !== -1) return -1; if (ib !== -1) return 1; return 0; }).slice(0, 8);
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
                                        <IconButton icon={<Download size={12} />} size="xs" colorScheme="blue" variant="ghost" onClick={() => handleDownloadLog(file.fileName)} aria-label="Download" />
                                        <IconButton icon={<AlertTriangle size={12} />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDeleteLog(file.fileName)} aria-label="Delete" />
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
                                        <Button size="xxs" fontSize="8px" colorScheme="blue" variant="ghost" height="20px" px={1} onClick={() => handleNotificationAction('Mark Read', item.notificationId || item.id)}>READ</Button>
                                        <Button size="xxs" fontSize="8px" colorScheme="red" variant="ghost" height="20px" px={1} onClick={() => handleNotificationAction('Delete', item.notificationId || item.id)}>DEL</Button>
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

// ─── SIGNAL CARD ──────────────────────────────────────────────────────────────
const SignalCard = ({ signal, searchTerm, onRefresh }) => {
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
                                    <Button size="xs" mt={3} colorScheme="red" variant="outline" leftIcon={<RotateCcw size={10} />} onClick={onRefresh}>RETRY</Button>
                                </Flex>
                            ) : signal.data?.length > 0 ? renderDataAsTable(signal.data, signal.name, searchTerm)
                                : signal.loading ? (
                                    <Flex align="center" justify="center" h="full"><VStack spacing={2}><Spinner size="md" color="blue.400" thickness="3px" /><Text color="gray.500" fontSize="12px" fontWeight="bold" fontFamily="monospace">ESTABLISHING LINK...</Text></VStack></Flex>
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const PayloadDashboardModal = ({ isOpen, onClose, vinValue = '' }) => {
    const [vin, setVin] = useState(() => localStorage.getItem('last_vin') || vinValue);
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

    const toast = useToast();
    const pollingTimeout = useRef(null);

    useEffect(() => {
        if (isOpen) {
            localStorage.setItem('last_vin', vin);
            setSignals(prev => prev.map(s => ({ ...s, data: [], loading: false, error: null, hasFetched: false })));
            setDeviceState(null); setOngoingTrip(null);
            (async () => { await Promise.all([fetchCheckedSignals(), fetchOtherData()]); if (isLive) startPolling(); })();
        } else { stopPolling(); }
        return () => stopPolling();
    }, [isOpen, vin]);

    useEffect(() => { if (isLive && isOpen) startPolling(); else stopPolling(); }, [isLive]);

    const startPolling = () => {
        if (pollingTimeout.current) clearTimeout(pollingTimeout.current);
        const poll = async () => {
            if (!isLive || !isOpen || !vin) return;
            try { await Promise.all([fetchCheckedSignals(), fetchOtherData()]); } catch (e) { console.warn('Poll error', e); }
            if (isLive && isOpen) pollingTimeout.current = setTimeout(poll, pollingInterval * 1000);
        };
        pollingTimeout.current = setTimeout(poll, pollingInterval * 1000);
    };
    const stopPolling = () => { if (pollingTimeout.current) { clearTimeout(pollingTimeout.current); pollingTimeout.current = null; } };

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

    const mapVirtualToSignal = (virtualData, signal) => {
        if (!virtualData || !virtualData.telemetry) return null;
        const t = virtualData.telemetry;
        let val = null;
        let unit = '';
        let msg = 'STATUS_VIRTUAL_DEVICE';

        if (signal.name === 'Fuel Level') { val = t.fuelLevel; unit = '%'; msg = 'VIRTUAL_BH_BCM1'; }
        else if (signal.name === 'Total Odometer') { val = t.odometer; unit = 'km'; msg = 'VIRTUAL_TRIP'; }
        else if (signal.name === 'Engine Water Temp') { val = t.engineWaterTemp; unit = '°C'; msg = 'VIRTUAL_CCAN3'; }
        else if (signal.name === 'Engine Speed') { val = t.engineSpeed; unit = '1/min'; msg = 'VIRTUAL_CCAN5'; }
        else if (signal.name === 'Vehicle Speed') { val = t.speed; unit = 'km/h'; msg = 'VIRTUAL_SPEED'; }
        else if (signal.name === 'Battery Voltage Level') { val = t.batteryVoltage; unit = 'V'; msg = 'VIRTUAL_BATTERY'; }
        else if (signal.name === 'External Temperature (C)') { val = t.externalTemp ?? t.ambientTemp; unit = '°C'; msg = 'VIRTUAL_AMBIENT'; }
        else if (signal.name === 'External Temperature (F)') { let v = t.externalTemp ?? t.ambientTemp; val = v !== null ? (v * 1.8 + 32).toFixed(1) : null; unit = '°F'; msg = 'VIRTUAL_AMBIENT'; }
        else if (signal.name === 'Location') {
            return [{
                gpsLat: t.gpsLat,
                gpsLong: t.gpsLong,
                gpsAlt: t.gpsAlt,
                updatedTimeStamp: virtualData.lastUpdate,
                messageName: 'VIRTUAL_LOCATION'
            }];
        }
        else if (signal.name === 'Ignition Status') {
            val = (t.speed > 0 || (t.engineSpeed && t.engineSpeed > 0)) ? 'RUN' : 'OFF';
            return [{
                signalValue: val,
                eventtype: 'VIRTUAL_IGNITION',
                sourcetimestamp: virtualData.lastUpdate,
                updatedTimeStamp: virtualData.lastUpdate
            }];
        }

        if (val === null || val === undefined) return null;

        return [{
            signalValue: val,
            signalUnit: unit,
            updatedTimeStamp: virtualData.lastUpdate,
            packetStatus: 'V',
            messageName: msg,
            canType: 'VirtualTelemetry',
            createdTimeStamp: virtualData.lastUpdate,
            isVirtual: true
        }];
    };

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

        const virtualDataStr = localStorage.getItem(`mqtt_virtual_device_data_${vin}`);
        const virtualData = virtualDataStr ? JSON.parse(virtualDataStr) : null;

        const promises = signals.map(async (signal) => {
            if (!signal.isChecked) return null;
            try {
                let newData = null;
                let fetchError = null;

                // 1. Try Primary API Fetch
                try {
                    if (signal.useVehicleStatus && vsData) {
                        newData = mapVSToSignal(vsData, signal);
                    } else {
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
                        else if (signal.fetchType === 'vehicleStatus') newData = await TraxoApi.getVehicleStatus(vin);
                        else if (signal.fetchType === 'files') newData = await TraxoApi.listLogFiles(vin);
                        else if (signal.fetchType === 'alerts_audit') newData = await TraxoApi.getAlertIngestion(vin);
                        else if (signal.fetchType === 'signals') newData = await TraxoApi.getSignalList('356');
                        else if (signal.fetchType === 'messages') newData = await TraxoApi.getVehicleTelemetryMessageList();
                        else if (signal.fetchType === 'trip_pagination') newData = await TraxoApi.getTripDetailsWithPagination(vin, 0);
                        else if (signal.fetchType === 'trip_details') {
                            const tid = ongoingTrip?.tripId || signals.find(s => s.name === 'Trip History')?.data[0]?.tripId;
                            if (tid) newData = await TraxoApi.getTripDetailsByTripId(vin, tid);
                            else throw new Error('No Trip ID available');
                        }
                        else if (signal.fetchType === 'search') newData = await TraxoApi.portalSearch(vin, 'vin');
                        else if (signal.fetchType === 'notification') newData = await TraxoApi.getDeviceJoinStatus(vin);
                        else if (signal.fetchType === 'command_audit') newData = await TraxoApi.getCommandAudit(vin);
                        else if (signal.fetchType !== 'manual') newData = await TraxoApi.getVehicleTelemetry(vin, signal.apiName);
                    }
                } catch (e) {
                    console.warn(`API Fetch Failed for ${signal.name}, checking virtual fallback`, e.message);
                    fetchError = e.message;
                }

                // 2. Fallback to Virtual Device Data if API failed or returned empty
                const hasApiData = Array.isArray(newData) ? newData.length > 0 : !!newData;
                if (!hasApiData && virtualData) {
                    const vData = mapVirtualToSignal(virtualData, signal);
                    if (vData) {
                        console.log(`[Fallback] Using Virtual Device data for ${signal.name}`);
                        newData = vData;
                        fetchError = null; // Clear error if we have fallback data
                    }
                }

                if (!newData && fetchError) throw new Error(fetchError);
                if (!newData) return { name: signal.name, newData: null };

                const normalized = (() => {
                    if (!newData) return null;
                    if (signal.fetchType === 'vehicleStatus') {
                        // Unwrap common API wrapper patterns so both Console & Visual see the same flat object
                        let vsObj = newData;
                        if (!Array.isArray(newData)) {
                            // Unwrap { data: {...} }, { result: {...} }, { vehicleStatus: {...} }
                            if (newData.data && typeof newData.data === 'object' && !Array.isArray(newData.data)) vsObj = newData.data;
                            else if (newData.result && typeof newData.result === 'object' && !Array.isArray(newData.result)) vsObj = newData.result;
                            else if (newData.vehicleStatus && typeof newData.vehicleStatus === 'object') vsObj = newData.vehicleStatus;
                        }
                        return Array.isArray(vsObj) ? vsObj : [vsObj];
                    }
                    let items = newData;
                    if (newData.events) items = newData.events;
                    else if (newData.data && Array.isArray(newData.data)) items = newData.data;
                    else if (newData.trips) items = newData.trips;
                    else if (newData.tripSummary) items = newData.tripSummary;
                    else if (newData.alerts) items = newData.alerts;
                    else if (newData.notifications) items = newData.notifications;
                    else if (newData.signals) items = newData.signals;
                    else if (newData.signalList) items = newData.signalList;
                    else if (newData.commandAudit) items = newData.commandAudit;
                    else if (newData.audit) items = newData.audit;

                    if (signal.fetchType === 'notification') {
                        // Handle notification raw data vs nested notifications array
                        let raw = newData.raw || (newData.notifications ? newData : null) || newData;

                        // Support for object-based arrays { "0": {...}, "1": {...} } or objects containing notifications
                        // Be aggressive: if it's an object but not a real array, try to find an array inside or convert it.
                        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                            if (raw.notifications && Array.isArray(raw.notifications)) raw = raw.notifications;
                            else if (raw.notifications && typeof raw.notifications === 'object') raw = raw.notifications;

                            // If it's STILL an indexed object { "0": ... }, convert to values
                            if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                                const keys = Object.keys(raw).filter(k => !isNaN(k));
                                if (keys.length > 0) {
                                    raw = keys.sort((a, b) => Number(a) - Number(b)).map(k => raw[k]);
                                }
                            }
                        }

                        let list = Array.isArray(raw) ? raw : [raw];
                        // Support for nested 'NOTIFICATION' or 'notification' keys to flatten the data for the table
                        const normalizedData = list.filter(Boolean).map(item => {
                            const n = item?.NOTIFICATION || item?.notification || item;
                            // If n is an object, merge it with the item's metadata (id, etc)
                            let flat = item;
                            if (typeof n === 'object' && n !== null) {
                                flat = { ...(typeof item === 'object' ? item : {}), ...n };
                            }
                            // Important: ensure we deep-format timestamps even at the normalization stage
                            return deepFormatDates(flat);
                        });
                        return Array.isArray(normalizedData) ? normalizedData : [normalizedData];
                    }

                    // Special Parsing for Alerts with stringified details
                    if (signal.fetchType === 'alerts' && Array.isArray(items)) {
                        return items.map(item => {
                            if (typeof item.alertDetails === 'string') {
                                try {
                                    const parsed = JSON.parse(item.alertDetails);
                                    return { ...item, ...parsed, alertDetailsRaw: item.alertDetails };
                                } catch (e) { console.warn('Failed to parse alertDetails', e); }
                            }
                            return item;
                        });
                    }
                    return items;
                })();
                return { name: signal.name, newData: normalized };
            } catch (error) {
                return { name: signal.name, error: error.message || 'Fetch failed' };
            }
        });

        const results = await Promise.all(promises);
        setLastRefreshTime(formatFullDate(new Date()));

        setSignals(prevSignals => prevSignals.map(signal => {
            const result = results.find(r => r?.name === signal.name);
            if (!result) return signal;
            const { newData, error } = result;
            if (error) return { ...signal, error, loading: false, hasFetched: true };
            if (newData !== null && newData !== undefined) {
                const existing = signal.data || [];
                const isArr = Array.isArray(newData);
                const hasData = isArr ? newData.length > 0 : !!newData;
                let updated = existing;
                if (hasData) {
                    if (isArr) {
                        if (signal.fetchType === 'trips') { updated = newData.slice(0, 100); }
                        else { const ex = new Set(existing.map(d => JSON.stringify(d))); const nu = newData.filter(d => !ex.has(JSON.stringify(d))); if (nu.length > 0) updated = [...nu, ...existing].slice(0, 500); }
                    } else { if (JSON.stringify(newData) !== JSON.stringify(existing[0])) updated = [newData, ...existing].slice(0, 100); }
                }
                return { ...signal, data: updated, loading: false, lastUpdated: formatFullDate(new Date()), hasFetched: true, error: null };
            }
            return { ...signal, loading: false };
        }));

        results.forEach(r => {
            if (r?.name === 'Trip History' && Array.isArray(r.newData)) {
                const max = Math.max(0, ...r.newData.map(t => parseFloat(t.topSpeed ?? t.maxSpeed ?? 0)).filter(v => !isNaN(v)));
                if (max > 0) setHighestSpeed(prev => Math.max(prev, max));
            }
        });
    };

    const handleRefresh = async () => {
        if (!vin) { toast({ title: 'No VIN selected', status: 'warning', duration: 2000 }); return; }
        try { await Promise.all([fetchCheckedSignals(), fetchOtherData()]); toast({ title: 'Dashboard Refreshed', status: 'info', duration: 1500 }); }
        catch (e) { toast({ title: 'Refresh Failed', status: 'error', duration: 3000 }); }
    };

    const handleExport = () => {
        const exportData = { vin, exportTime: new Date().toISOString(), deviceState, signals: signals.filter(s => s.data?.length > 0).map(s => ({ name: s.name, id: s.id, data: s.data.slice(0, 50) })) };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `payload_${vin}_${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Data Exported', status: 'success', duration: 2000 });
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
        setCommandLoading(commandName);
        const timestamp = new Date().toLocaleTimeString();
        try {
            const result = await apiCall(vin, ...params);
            const commandId = result.commandId || result.data?.commandId;
            toast({ title: `${commandName} Sent`, description: 'Waiting for device...', status: 'info', duration: 2000 });
            setSignals(prev => prev.map(s => s.name === 'Remote Commands' ? { ...s, data: [{ command: commandName, status: 'PENDING', time: timestamp, commandId, apiResponse: result }, ...s.data].slice(0, 50) } : s));
            if (commandId) pollCommandStatus(commandName, commandId, false, isConcurrent);
        } catch (error) {
            toast({ title: `${commandName} Failed`, description: error.message, status: 'error', duration: 3000 });
            setSignals(prev => prev.map(s => s.name === 'Remote Commands' ? { ...s, data: [{ command: commandName, status: 'FAILED', time: timestamp, error: error.message, apiResponse: { message: error.message } }, ...s.data].slice(0, 50) } : s));
        } finally { setCommandLoading(null); }
    };

    const handleNotificationAction = async (action, id) => {
        if (!id) { toast({ title: 'Invalid Notification ID', status: 'error' }); return; }
        try {
            if (action === 'Mark Read') await TraxoApi.updateNotificationStatus(id);
            else if (action === 'Delete') await TraxoApi.deleteNotification(id);
            toast({ title: `Notification ${action} Success`, status: 'success', duration: 2000 });
            handleRefresh();
        } catch (error) {
            toast({ title: 'Action Failed', description: error.message, status: 'error' });
        }
    };

    const handleDownloadLog = async (filename) => {
        toast({ title: 'Preparing Download', description: filename, status: 'info', duration: 2000 });
        try {
            const blob = await TraxoApi.downloadLogFile(vin, filename);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast({ title: 'Download Started', status: 'success' });
        } catch (error) {
            toast({ title: 'Download Failed', description: error.message, status: 'error' });
        }
    };

    const handleDeleteLog = async (filename) => {
        if (!confirm(`Delete log file ${filename}?`)) return;
        try {
            await TraxoApi.deleteLogFile(vin, filename);
            toast({ title: 'Log File Deleted', status: 'success' });
            // Refresh log files list signal
            setSignals(prev => prev.map(s => s.name === 'Log Files List' ? { ...s, loading: true } : s));
            const newData = await TraxoApi.listLogFiles(vin);
            setSignals(prev => prev.map(s => s.name === 'Log Files List' ? { ...s, data: newData, loading: false, lastUpdated: formatFullDate(new Date()) } : s));
        } catch (error) {
            toast({ title: 'Delete Failed', description: error.message, status: 'error' });
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

    const filteredSignals = signals.filter(s => {
        const t = searchTerm.toLowerCase();
        return s.name.toLowerCase().includes(t) || (s.apiName || '').toLowerCase().includes(t) || (s.id || '').toLowerCase().includes(t);
    });

    const vehicleStatusSignal = signals.find(s => s.name === 'Jeep Vehicle Status');
    const tripSignal = signals.find(s => s.name === 'Trip History');
    const totalSignals = signals.filter(s => s.isChecked).length;
    const activeSignals = signals.filter(s => s.data?.length > 0).length;
    const errorSignals = signals.filter(s => s.error).length;

    return (


        // <Modal isOpen={isOpen} onClose={onClose} size="full" scrollBehavior="inside">
        //     <ModalOverlay />
        //     <ModalContent bg={THEME.bg} borderRadius="none">
        //         <ModalBody p={0} overflowX="hidden" overflowY="auto">

        //             {/* HEADER */}
        //             <Box bg="white" borderBottom="1px solid" borderColor="gray.100" px={6} py={3} position="sticky" top={0} zIndex={20} boxShadow="sm">
        //                 <Flex justify="space-between" align="center">
        //                     <HStack spacing={4}>
        //                         <IconButton icon={<ArrowLeft size={16} />} aria-label="Back" variant="ghost" onClick={onClose} size="sm" />
        //                         <VStack align="flex-start" spacing={0}>
        //                             <HStack spacing={2}>
        //                                 <Heading size="sm" color="gray.800" fontWeight="900" letterSpacing="-0.5px">Payload Dashboard</Heading>
        //                                 <Badge colorScheme="blue" variant="subtle" fontSize="9px">V0.4</Badge>
        //                             </HStack>
        //                             <HStack spacing={3}>
        //                                 <Text fontSize="9px" color="gray.400" fontWeight="bold">{activeSignals}/{totalSignals} signals active</Text>
        //                                 {errorSignals > 0 && <Text fontSize="9px" color="red.500" fontWeight="bold">{errorSignals} errors</Text>}
        //                                 {lastRefreshTime && <Text fontSize="9px" color="gray.400">Updated: {lastRefreshTime}</Text>}
        //                             </HStack>
        //                         </VStack>
        //                         <HStack spacing={1} bg="gray.100" p={1} borderRadius="xl">
        //                             <Button size="xs" variant={viewMode === 'visual' ? 'solid' : 'ghost'} colorScheme={viewMode === 'visual' ? 'blue' : 'gray'} borderRadius="lg" onClick={() => setViewMode('visual')} leftIcon={<LayoutDashboard size={11} />}>Visual</Button>
        //                             <Button size="xs" variant={viewMode === 'console' ? 'solid' : 'ghost'} colorScheme={viewMode === 'console' ? 'blue' : 'gray'} borderRadius="lg" onClick={() => setViewMode('console')} leftIcon={<Monitor size={11} />}>Console</Button>
        //                         </HStack>
        //                     </HStack>

        //                     <HStack spacing={3}>
        //                         <InputGroup size="sm" w="200px">
        //                             <InputLeftElement pointerEvents="none"><Search size={13} color="#A0AEC0" /></InputLeftElement>
        //                             <Input placeholder="Search signals..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} borderRadius="lg" bg="gray.50" border="none" color="black" fontSize="12px" _focus={{ bg: 'white', boxShadow: 'outline' }} />
        //                         </InputGroup>
        //                         <HStack spacing={1} align="center">
        //                             <Text fontSize="9px" fontWeight="black" color="gray.400" letterSpacing="0.5px">VIN</Text>
        //                             <Input value={vin} onChange={e => setVin(e.target.value)} size="sm" w="155px" borderRadius="lg" color="black" fontWeight="bold" fontSize="11px" bg="gray.50" border="none" />
        //                         </HStack>
        //                         <HStack spacing={1}>
        //                             <Text fontSize="9px" color="gray.400" fontWeight="bold">Poll</Text>
        //                             <Select size="xs" value={pollingInterval} onChange={e => setPollingInterval(Number(e.target.value))} w="60px" borderRadius="md" bg="gray.50" border="none" color="black" fontSize="11px">
        //                                 <option value={5}>5s</option><option value={10}>10s</option><option value={30}>30s</option><option value={60}>60s</option>
        //                             </Select>
        //                         </HStack>
        //                         <HStack spacing={2} bg={isLive ? 'green.50' : 'gray.100'} px={3} py={1.5} borderRadius="full" border="1px solid" borderColor={isLive ? 'green.100' : 'gray.200'} cursor="pointer" onClick={() => setIsLive(!isLive)}>
        //                             {isLive && <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><Box w={2} h={2} borderRadius="full" bg="green.500" /></motion.div>}
        //                             <Text fontSize="9px" fontWeight="900" color={isLive ? 'green.600' : 'gray.600'} letterSpacing="1px">{isLive ? 'LIVE' : 'PAUSED'}</Text>
        //                         </HStack>
        //                         <IconButton icon={<RotateCcw size={14} />} aria-label="Refresh" size="sm" variant="ghost" onClick={handleRefresh} borderRadius="full" />
        //                         <IconButton icon={<Download size={14} />} aria-label="Export JSON" size="sm" variant="ghost" onClick={handleExport} borderRadius="full" title="Export data as JSON" />
        //                     </HStack>
        //                 </Flex>
        //             </Box>

        //             {/* VISUAL VIEW */}
        //             {viewMode === 'visual' && <VisualDashboardView signals={signals} deviceState={deviceState} highestSpeed={highestSpeed} />}



        //             {/* CONSOLE VIEW */}
        //             {viewMode === 'console' && (
        //                 <Box p={6} bg={THEME.bg} position="relative">
        //                     <Box position="absolute" top={0} left={0} right={0} bottom={0} backgroundImage="linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)" backgroundSize="40px 40px" pointerEvents="none" />
        //                     <Flex align="center" gap={3} mb={4} p={3} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" position="relative" zIndex={1}>
        //                         <HStack spacing={4}>
        //                             <HStack spacing={1}><Box w={2} h={2} bg="green.400" borderRadius="full" /><Text fontSize="11px" fontWeight="bold" color="gray.600">{activeSignals} with data</Text></HStack>
        //                             <HStack spacing={1}><Box w={2} h={2} bg="red.400" borderRadius="full" /><Text fontSize="11px" fontWeight="bold" color="gray.600">{errorSignals} errors</Text></HStack>
        //                             <HStack spacing={1}><Box w={2} h={2} bg="gray.300" borderRadius="full" /><Text fontSize="11px" fontWeight="bold" color="gray.600">{totalSignals - activeSignals - errorSignals} pending</Text></HStack>
        //                         </HStack>
        //                         <Spacer />
        //                         <Text fontSize="10px" color="gray.400">{filteredSignals.filter(s => s.isChecked && !s.hideInConsole).length} signals shown</Text>
        //                     </Flex>
        //                     <SimpleGrid columns={2} gap={4} position="relative" zIndex={1}>
        //                         {filteredSignals.filter(s => s.isChecked && !s.hideInConsole).map((signal, index) => (
        //                             <SignalCard key={signal.id + index} signal={signal} searchTerm={searchTerm} onRefresh={handleRefresh} />
        //                         ))}
        //                     </SimpleGrid>
        //                 </Box>
        //             )}

        //             {/* BOTTOM PANELS */}
        //             <Box>
        //                 {deviceState && (
        //                     <Box>
        //                         <HStack spacing={2} mb={3}>
        //                             <Info size={15} color="#3B6FE8" />
        //                             <Heading size="xs" color="gray.700">Device Details</Heading>
        //                             <Badge colorScheme={deviceState.deviceConnectedState === 'CONNECTED' ? 'green' : 'red'} variant="solid" fontSize="9px">{deviceState.deviceConnectedState || 'UNKNOWN'}</Badge>
        //                         </HStack>
        //                         <SimpleGrid columns={{ base: 2, md: 6 }} gap={3}>
        //                             {[['VIN', deviceState.vinNo || vin], ['ICCID', deviceState.iccid], ['IMEI', deviceState.imei], ['Model', deviceState.car_model], ['FW Version', deviceState.firmwareVersion || deviceState.fwVersion], ['Last Seen', deviceState.lastActiveTime ? new Date(deviceState.lastActiveTime).toLocaleTimeString() : null]].map(([label, value]) => value && (
        //                                 <Box key={label} p={3} bg="gray.50" borderRadius="lg">
        //                                     <Text fontSize="9px" color="gray.400" fontWeight="black" textTransform="uppercase" mb={0.5}>{label}</Text>
        //                                     <Text fontWeight="700" fontSize="11px" color="gray.800" fontFamily="monospace" isTruncated>{value}</Text>
        //                                 </Box>
        //                             ))}
        //                         </SimpleGrid>
        //                     </Box>
        //                 )}

        //                 <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm">
        //                     <HStack spacing={2} mb={4}><Radio size={15} color="#3B6FE8" /><Heading size="xs" color="gray.700">Remote Commands</Heading></HStack>
        //                     <Wrap spacing={3} mb={4}>
        //                         {[
        //                             { label: 'Lock Door', icon: Lock, fn: TraxoApi.lockDoor, color: 'blue' },
        //                             { label: 'Unlock Door', icon: Unlock, fn: TraxoApi.unlockDoor, color: 'blue' },
        //                             { label: 'Blinker ON', icon: Zap, fn: TraxoApi.blinkerOn, color: 'orange' },
        //                             { label: 'Blinker OFF', icon: Zap, fn: TraxoApi.blinkerOff, color: 'orange' },
        //                             { label: 'Honk', icon: Volume2, fn: TraxoApi.honk, color: 'red' },
        //                             { label: 'Fetch Logs', icon: Download, fn: TraxoApi.fetchDeviceLogs, color: 'green', isConcurrent: true },
        //                         ].map(({ label, icon: Icon, fn, color, isConcurrent }) => (
        //                             <Button key={label} size="sm" colorScheme={color} variant="outline" isLoading={commandLoading === label} leftIcon={<Icon size={13} />} onClick={() => handleCommand(label, fn, [], isConcurrent)} borderRadius="lg" fontWeight="700" fontSize="12px" _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }} transition="all 0.2s">{label}</Button>
        //                         ))}
        //                     </Wrap>

        //                     <Box pt={3} borderTop="1px dashed" borderColor="gray.200" mb={3}>
        //                         <Text fontSize="10px" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>Speed Alert</Text>
        //                         <HStack spacing={2}>
        //                             <Input placeholder="Speed limit (km/h)" value={speedAlert} onChange={e => setSpeedAlert(e.target.value)} size="sm" w="160px" bg="gray.50" borderRadius="lg" color="black" border="none" />
        //                             <Button size="sm" colorScheme="red" variant="outline" borderRadius="lg" leftIcon={<AlertTriangle size={13} />} isLoading={commandLoading === 'Speed Alert'} isDisabled={!speedAlert} onClick={() => handleCommand('Speed Alert', TraxoApi.setSpeedAlert, [speedAlert])}>Set Alert</Button>
        //                         </HStack>
        //                     </Box>

        //                     <Box pt={3} borderTop="1px dashed" borderColor="gray.200">
        //                         <Text fontSize="10px" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>Firmware Over-The-Air (FOTA)</Text>
        //                         <HStack spacing={3}>
        //                             <Input placeholder="Version (e.g. 2314.0)" value={fotaVersion} onChange={e => setFotaVersion(e.target.value)} size="sm" w="170px" bg="gray.50" borderRadius="lg" color="black" border="none" />
        //                             <Button size="sm" colorScheme="purple" isLoading={isFotaUpdating} loadingText="Updating..." onClick={handleFotaUpdate} leftIcon={<RotateCcw size={13} />} borderRadius="lg">Trigger FOTA</Button>
        //                             <Button size="sm" variant="ghost" colorScheme="gray" onClick={handleFotaReset} leftIcon={<RefreshCw size={13} />} borderRadius="lg">Reset State</Button>
        //                         </HStack>
        //                     </Box>
        //                 </Box>
        //             </Box>

        //         </ModalBody>
        //     </ModalContent>
        // </Modal>


        // In PayloadDashboardModal component, update the Modal props demo 1

        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="full"
            scrollBehavior="inside"  // Keep this
            motionPreset="slideInBottom" // Add smooth animation
        >
            <ModalOverlay />
            <ModalContent
                bg={THEME.bg}
                borderRadius="none"
                maxH="100vh"  // Ensure modal doesn't exceed viewport
                h="100vh"     // Fixed height
                display="flex"
                flexDirection="column"
            >
                <ModalBody
                    p={0}
                    overflowY="auto"  // Ensure vertical scrolling
                    overflowX="hidden" // Prevent horizontal scroll
                    flex="1"
                // sx={{
                //     '&::-webkit-scrollbar': {
                //         width: '8px',
                //         height: '8px',
                //     },
                //     '&::-webkit-scrollbar-track': {
                //         background: '#f1f1f1',
                //         borderRadius: '4px',
                //     },
                //     '&::-webkit-scrollbar-thumb': {
                //         background: '#888',
                //         borderRadius: '4px',
                //     },
                //     '&::-webkit-scrollbar-thumb:hover': {
                //         background: '#555',
                //     },
                // }}
                >
                    {/* Your existing content */}
                    {/* HEADER */}
                    <Box bg="white" borderBottom="1px solid" borderColor="gray.100" px={6} py={3} position="sticky" top={0} zIndex={20} boxShadow="sm">
                        <Flex justify="space-between" align="center">
                            <HStack spacing={4}>
                                <IconButton icon={<ArrowLeft size={16} />} aria-label="Back" variant="ghost" onClick={onClose} size="sm" />
                                <VStack align="flex-start" spacing={0}>
                                    <HStack spacing={2}>
                                        <Heading size="sm" color="gray.800" fontWeight="900" letterSpacing="-0.5px">Payload Dashboard</Heading>
                                        <Badge colorScheme="blue" variant="subtle" fontSize="9px">V0.4</Badge>
                                    </HStack>
                                    <HStack spacing={3}>
                                        <Text fontSize="9px" color="gray.400" fontWeight="bold">{activeSignals}/{totalSignals} signals active</Text>
                                        {errorSignals > 0 && <Text fontSize="9px" color="red.500" fontWeight="bold">{errorSignals} errors</Text>}
                                        {lastRefreshTime && <Text fontSize="9px" color="gray.400">Updated: {lastRefreshTime}</Text>}
                                    </HStack>
                                </VStack>
                                <HStack spacing={1} bg="gray.100" p={1} borderRadius="xl">
                                    <Button size="xs" variant={viewMode === 'visual' ? 'solid' : 'ghost'} colorScheme={viewMode === 'visual' ? 'blue' : 'gray'} borderRadius="lg" onClick={() => setViewMode('visual')} leftIcon={<LayoutDashboard size={11} />}>Visual</Button>
                                    <Button size="xs" variant={viewMode === 'console' ? 'solid' : 'ghost'} colorScheme={viewMode === 'console' ? 'blue' : 'gray'} borderRadius="lg" onClick={() => setViewMode('console')} leftIcon={<Monitor size={11} />}>Console</Button>
                                </HStack>
                            </HStack>

                            <HStack spacing={3}>
                                <InputGroup size="sm" w="200px">
                                    <InputLeftElement pointerEvents="none"><Search size={13} color="#A0AEC0" /></InputLeftElement>
                                    <Input placeholder="Search signals..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} borderRadius="lg" bg="gray.50" border="none" color="black" fontSize="12px" _focus={{ bg: 'white', boxShadow: 'outline' }} />
                                </InputGroup>
                                <HStack spacing={1} align="center">
                                    <Text fontSize="9px" fontWeight="black" color="gray.400" letterSpacing="0.5px">VIN</Text>
                                    <Input value={vin} onChange={e => setVin(e.target.value)} size="sm" w="155px" borderRadius="lg" color="black" fontWeight="bold" fontSize="11px" bg="gray.50" border="none" />
                                </HStack>
                                <HStack spacing={1}>
                                    <Text fontSize="9px" color="gray.400" fontWeight="bold">Poll</Text>
                                    <Select size="xs" value={pollingInterval} onChange={e => setPollingInterval(Number(e.target.value))} w="60px" borderRadius="md" bg="gray.50" border="none" color="black" fontSize="11px">
                                        <option value={5}>5s</option><option value={10}>10s</option><option value={30}>30s</option><option value={60}>60s</option>
                                    </Select>
                                </HStack>
                                <HStack spacing={2} bg={isLive ? 'green.50' : 'gray.100'} px={3} py={1.5} borderRadius="full" border="1px solid" borderColor={isLive ? 'green.100' : 'gray.200'} cursor="pointer" onClick={() => setIsLive(!isLive)}>
                                    {isLive && <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><Box w={2} h={2} borderRadius="full" bg="green.500" /></motion.div>}
                                    <Text fontSize="9px" fontWeight="900" color={isLive ? 'green.600' : 'gray.600'} letterSpacing="1px">{isLive ? 'LIVE' : 'PAUSED'}</Text>
                                </HStack>
                                <IconButton icon={<RotateCcw size={14} />} aria-label="Refresh" size="sm" variant="ghost" onClick={handleRefresh} borderRadius="full" />
                                <IconButton icon={<Download size={14} />} aria-label="Export JSON" size="sm" variant="ghost" onClick={handleExport} borderRadius="full" title="Export data as JSON" />
                            </HStack>
                        </Flex>
                    </Box>

                    {/* VISUAL VIEW */}
                    {viewMode === 'visual' && <VisualDashboardView signals={signals} deviceState={deviceState} highestSpeed={highestSpeed} />}



                    {/* CONSOLE VIEW */}
                    {viewMode === 'console' && (
                        <Box p={6} bg={THEME.bg} position="relative">
                            <Box position="absolute" top={0} left={0} right={0} bottom={0} backgroundImage="linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)" backgroundSize="40px 40px" pointerEvents="none" />
                            <Flex align="center" gap={3} mb={4} p={3} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm" position="relative" zIndex={1}>
                                <HStack spacing={4}>
                                    <HStack spacing={1}><Box w={2} h={2} bg="green.400" borderRadius="full" /><Text fontSize="11px" fontWeight="bold" color="gray.600">{activeSignals} with data</Text></HStack>
                                    <HStack spacing={1}><Box w={2} h={2} bg="red.400" borderRadius="full" /><Text fontSize="11px" fontWeight="bold" color="gray.600">{errorSignals} errors</Text></HStack>
                                    <HStack spacing={1}><Box w={2} h={2} bg="gray.300" borderRadius="full" /><Text fontSize="11px" fontWeight="bold" color="gray.600">{totalSignals - activeSignals - errorSignals} pending</Text></HStack>
                                </HStack>
                                <Spacer />
                                <Text fontSize="10px" color="gray.400">{filteredSignals.filter(s => s.isChecked && !s.hideInConsole).length} signals shown</Text>
                            </Flex>
                            <SimpleGrid columns={2} gap={4} position="relative" zIndex={1}>
                                {filteredSignals.filter(s => s.isChecked && !s.hideInConsole).map((signal, index) => (
                                    <SignalCard key={signal.id + index} signal={signal} searchTerm={searchTerm} onRefresh={handleRefresh} />
                                ))}
                            </SimpleGrid>
                        </Box>
                    )}

                    {/* BOTTOM PANELS */}
                    <Box>
                        {deviceState && (
                            <Box>
                                <HStack spacing={2} mb={3}>
                                    <Info size={15} color="#3B6FE8" />
                                    <Heading size="xs" color="gray.700">Device Details</Heading>
                                    <Badge colorScheme={deviceState.deviceConnectedState === 'CONNECTED' ? 'green' : 'red'} variant="solid" fontSize="9px">{deviceState.deviceConnectedState || 'UNKNOWN'}</Badge>
                                </HStack>
                                <SimpleGrid columns={{ base: 2, md: 6 }} gap={3}>
                                    {[['VIN', deviceState.vinNo || vin], ['ICCID', deviceState.iccid], ['IMEI', deviceState.imei], ['Model', deviceState.car_model], ['FW Version', deviceState.firmwareVersion || deviceState.fwVersion], ['Last Seen', deviceState.lastActiveTime ? new Date(deviceState.lastActiveTime).toLocaleTimeString() : null]].map(([label, value]) => value && (
                                        <Box key={label} p={3} bg="gray.50" borderRadius="lg">
                                            <Text fontSize="9px" color="gray.400" fontWeight="black" textTransform="uppercase" mb={0.5}>{label}</Text>
                                            <Text fontWeight="700" fontSize="11px" color="gray.800" fontFamily="monospace" isTruncated>{value}</Text>
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            </Box>
                        )}

                        <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="gray.100" boxShadow="sm">
                            <HStack spacing={2} mb={4}><Radio size={15} color="#3B6FE8" /><Heading size="xs" color="gray.700">Remote Commands</Heading></HStack>
                            <Wrap spacing={3} mb={4}>
                                {[
                                    { label: 'Lock Door', icon: Lock, fn: TraxoApi.lockDoor, color: 'blue' },
                                    { label: 'Unlock Door', icon: Unlock, fn: TraxoApi.unlockDoor, color: 'blue' },
                                    { label: 'Blinker ON', icon: Zap, fn: TraxoApi.blinkerOn, color: 'orange' },
                                    { label: 'Blinker OFF', icon: Zap, fn: TraxoApi.blinkerOff, color: 'orange' },
                                    { label: 'Honk', icon: Volume2, fn: TraxoApi.honk, color: 'red' },
                                    { label: 'Fetch Logs', icon: Download, fn: TraxoApi.fetchDeviceLogs, color: 'green', isConcurrent: true },
                                ].map(({ label, icon: Icon, fn, color, isConcurrent }) => (
                                    <Button key={label} size="sm" colorScheme={color} variant="outline" isLoading={commandLoading === label} leftIcon={<Icon size={13} />} onClick={() => handleCommand(label, fn, [], isConcurrent)} borderRadius="lg" fontWeight="700" fontSize="12px" _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }} transition="all 0.2s">{label}</Button>
                                ))}
                            </Wrap>

                            <Box pt={3} borderTop="1px dashed" borderColor="gray.200" mb={3}>
                                <Text fontSize="10px" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>Speed Alert</Text>
                                <HStack spacing={2}>
                                    <Input placeholder="Speed limit (km/h)" value={speedAlert} onChange={e => setSpeedAlert(e.target.value)} size="sm" w="160px" bg="gray.50" borderRadius="lg" color="black" border="none" />
                                    <Button size="sm" colorScheme="red" variant="outline" borderRadius="lg" leftIcon={<AlertTriangle size={13} />} isLoading={commandLoading === 'Speed Alert'} isDisabled={!speedAlert} onClick={() => handleCommand('Speed Alert', TraxoApi.setSpeedAlert, [speedAlert])}>Set Alert</Button>
                                </HStack>
                            </Box>

                            <Box pt={3} borderTop="1px dashed" borderColor="gray.200">
                                <Text fontSize="10px" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>Firmware Over-The-Air (FOTA)</Text>
                                <HStack spacing={3}>
                                    <Input placeholder="Version (e.g. 2314.0)" value={fotaVersion} onChange={e => setFotaVersion(e.target.value)} size="sm" w="170px" bg="gray.50" borderRadius="lg" color="black" border="none" />
                                    <Button size="sm" colorScheme="purple" isLoading={isFotaUpdating} loadingText="Updating..." onClick={handleFotaUpdate} leftIcon={<RotateCcw size={13} />} borderRadius="lg">Trigger FOTA</Button>
                                    <Button size="sm" variant="ghost" colorScheme="gray" onClick={handleFotaReset} leftIcon={<RefreshCw size={13} />} borderRadius="lg">Reset State</Button>
                                </HStack>
                            </Box>
                        </Box>
                    </Box>

                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default PayloadDashboardModal;