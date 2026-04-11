import React from 'react';
import { Box, VStack, HStack, Text, Badge, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { AlertTriangle, Thermometer } from 'lucide-react';

export const CircularGauge = ({ value, label, unit, color = "#00E5FF", size = 110, icon: Icon, isError = false }) => {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (parseFloat(value) || 0) / 100;

    return (
        <VStack spacing={3} align="center">
            <Box position="relative" width={size} height={size}>
                {/* Outer decorative ring */}
                <Box
                    position="absolute"
                    top="-4px" left="-4px" right="-4px" bottom="-4px"
                    border="1px solid"
                    borderColor={isError ? "red.100" : "rgba(0, 0, 0, 0.05)"}
                    borderRadius="full"
                />
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <defs>
                        <filter id={`glow-${label.replace(/\s+/g, '-')}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="transparent"
                        stroke={isError ? "red.50" : "rgba(0, 0, 0, 0.03)"}
                        strokeWidth={strokeWidth}
                    />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="transparent"
                        stroke={isError ? "#E53E3E" : color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: isError ? 0 : circumference - (progress * circumference) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        filter={!isError ? `url(#glow-${label.replace(/\s+/g, '-')})` : "none"}
                    />
                </svg>
                <VStack
                    position="absolute"
                    top="50%" left="50%"
                    transform="translate(-50%, -50%)"
                    spacing={0}
                >
                    {isError ? (
                        <VStack spacing={0}>
                            <AlertTriangle size={24} color="#E53E3E" />
                            <Text fontSize="10px" fontWeight="black" color="red.500">ERR</Text>
                        </VStack>
                    ) : (
                        <>
                            <Text fontSize="lg" fontWeight="900" color="gray.800" letterSpacing="-1px">
                                {value}{unit}
                            </Text>
                            {Icon && <Icon size={14} color={color} opacity={0.8} />}
                        </>
                    )}
                </VStack>
            </Box>
            <Text fontSize="10px" fontWeight="black" color={isError ? "red.400" : "gray.400"} letterSpacing="1px" textTransform="uppercase">
                {label}
            </Text>
        </VStack>
    );
};

export const SpeedometerGauge = ({ value, label, secondaryValue, highestSpeed, isError = false }) => {
    const size = 260;
    const strokeWidth = 12;
    const radius = 90;
    const center = size / 2;
    const speed = parseFloat(value) || 0;
    const odo = parseFloat(secondaryValue) || 0;
    const maxSpeed = parseFloat(highestSpeed) || 0;
    const maxVal = 240;
    const progress = Math.min(speed / maxVal, 1);
    const totalAngle = 270;
    const startAngle = -135;
    const currentAngle = startAngle + (isError ? 0 : progress * totalAngle);

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const drawArc = (start, end) => {
        const startPoint = polarToCartesian(center, center, radius, end);
        const endPoint = polarToCartesian(center, center, radius, start);
        const largeArcFlag = end - start <= 180 ? "0" : "1";
        return [
            "M", startPoint.x, startPoint.y,
            "A", radius, radius, 0, largeArcFlag, 0, endPoint.x, endPoint.y
        ].join(" ");
    };

    return (
        <VStack spacing={0} position="relative" mt={-4}>
            <Box position="relative" width={size} height={size}>
                <svg width={size} height={size} style={{ overflow: 'visible' }}>
                    <defs>
                        <filter id="speed-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="speed-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={isError ? "#FEB2B2" : "#00B8D4"} />
                            <stop offset="100%" stopColor={isError ? "#E53E3E" : "#00E5FF"} />
                        </linearGradient>
                    </defs>

                    <path
                        d={drawArc(startAngle, startAngle + totalAngle)}
                        fill="none"
                        stroke={isError ? "rgba(255, 0, 0, 0.05)" : "rgba(0, 0, 0, 0.03)"}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    <motion.path
                        d={drawArc(startAngle, currentAngle)}
                        fill="none"
                        stroke="url(#speed-gradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        filter={!isError ? "url(#speed-glow)" : "none"}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />

                    {[...Array(9)].map((_, i) => {
                        const angle = startAngle + (i * (totalAngle / 8));
                        const p1 = polarToCartesian(center, center, radius + 8, angle);
                        const p2 = polarToCartesian(center, center, radius + 18, angle);
                        const tickVal = i * (maxVal / 8);
                        const isActive = isError ? false : speed >= tickVal;
                        return (
                            <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isActive ? "#00B8D4" : isError ? "rgba(255,0,0,0.1)" : "rgba(0,0,0,0.1)"} strokeWidth="2" />
                        );
                    })}
                </svg>

                <VStack position="absolute" top="55%" left="50%" transform="translate(-50%, -50%)" spacing={-1}>
                    {isError ? (
                        <VStack spacing={1}>
                            <AlertTriangle size={48} color="#E53E3E" />
                            <Text fontSize="xs" fontWeight="black" color="red.500" letterSpacing="1px">SIG ERROR</Text>
                        </VStack>
                    ) : (
                        <>
                            <Flex align="center" direction="column" mb={1}>
                                <Badge variant="outline" colorScheme="orange" fontSize="8px" px={2} borderRadius="full" border="1px solid">
                                    MAX {Math.floor(maxSpeed)} KM/H
                                </Badge>
                            </Flex>
                            <Text fontSize="6xl" fontWeight="900" color="gray.800" lineHeight="1">
                                {Math.floor(speed)}
                            </Text>
                            <Text fontSize="xs" fontWeight="black" color="blue.500" letterSpacing="2px">KM/H</Text>

                            <Box mt={4} textAlign="center">
                                <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="1px">ODO</Text>
                                <Text fontSize="md" fontWeight="bold" color="gray.700">
                                    {odo.toLocaleString()} <Text as="span" fontSize="10px" color="gray.500">KM</Text>
                                </Text>
                            </Box>
                        </>
                    )}
                </VStack>
            </Box>
        </VStack>
    );
};

export const TempCard = ({ temp, label, interiorTemp = "45", isError = false }) => (
    <Box bg="white" p={5} borderRadius="2xl" border="1px solid" borderColor={isError ? "red.200" : "rgba(0,0,0,0.06)"} boxShadow="sm" height="full" position="relative" overflow="hidden">
        <Flex justify="space-between" align="start" mb={4}>
            <VStack align="flex-start" spacing={0}>
                <HStack spacing={2}>
                    <Text fontWeight="800" color={isError ? "red.500" : "blue.500"} fontSize="xs" letterSpacing="0.5px" textTransform="uppercase">{label}</Text>
                    <Thermometer size={14} color={isError ? "#E53E3E" : "#3182CE"} />
                </HStack>
                <Text color="gray.400" fontSize="10px" fontWeight="bold">Interior: {interiorTemp}°C</Text>
            </VStack>
            <Box w={2} h={2} borderRadius="full" bg={isError ? "red.500" : "blue.500"} />
        </Flex>

        <Flex align="center" justify="center" py={2} mb={4}>
            {isError ? (
                <VStack spacing={1}>
                    <AlertTriangle size={32} color="#E53E3E" />
                    <Text fontSize="xs" fontWeight="black" color="red.500">DATA ERROR</Text>
                </VStack>
            ) : (
                <Text fontSize="6xl" fontWeight="900" color="gray.800" lineHeight="1">{temp}°</Text>
            )}
        </Flex>

        {!isError && (
            <VStack width="full" align="flex-start" spacing={3}>
                <Flex justify="space-between" width="full">
                    <Text fontSize="9px" fontWeight="black" color="blue.600" letterSpacing="0.5px">COOLING SYSTEM</Text>
                    <Badge variant="subtle" colorScheme="blue" fontSize="8px" px={2} borderRadius="full">NORMAL</Badge>
                </Flex>
                <Box width="full" h="4px" bg="gray.50" borderRadius="full" position="relative" border="1px solid" borderColor="gray.100">
                    <Box
                        position="absolute" left={`${Math.min((temp / 100) * 100, 100)}%`} top="-5px"
                        w="14px" h="14px" bg="white" border="3px solid" borderColor="blue.500"
                        borderRadius="full" boxShadow="md" transform="translateX(-50%)"
                    />
                </Box>
            </VStack>
        )}
        {isError && (
            <VStack width="full" align="flex-start" spacing={1}>
                <Text fontSize="9px" fontWeight="black" color="red.600" letterSpacing="0.5px">SYSTEM FAULT</Text>
                <Badge variant="solid" colorScheme="red" fontSize="8px" px={2} borderRadius="full">OFFLINE</Badge>
            </VStack>
        )}
    </Box>
);
