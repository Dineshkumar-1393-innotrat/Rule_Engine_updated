import React from 'react';
import { Box, Flex, HStack, VStack, Text } from '@chakra-ui/react';

export const StatusToggle = ({ label, description, isOn, icon: Icon, videoIcon, videoSize = "14px", iconPadding = 2, isError = false, color: customColor, statusText, isSimulated = false }) => {
    const defaultColor = isError ? "red" : (isOn ? "blue" : "gray");
    const activeColor = customColor || defaultColor;

    const getShadowColor = (c, opacity) => {
        const map = { green: '72, 187, 120', blue: '49, 130, 206', red: '229, 62, 62', orange: '237, 137, 54', purple: '128, 90, 213', teal: '49, 151, 149' };
        return `rgba(${map[c] || '160, 174, 192'}, ${opacity})`;
    };

    return (
        <Box
            bg="white" p={{ base: 3, md: 5 }} borderRadius="2xl" border="1px solid"
            borderColor={isError ? "red.200" : "gray.100"}
            boxShadow="sm" _hover={{ bg: `${activeColor}.50`, border: '1px solid', borderColor: `${activeColor}.200`, boxShadow: 'lg' }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" position="relative" overflow="hidden"
        >
            {isSimulated && (
                <Box position="absolute" top={0} right={0} bg="purple.500" color="white" px={2} py={0.5} borderBottomLeftRadius="md" fontSize="7px" fontWeight="black" zIndex={2}>
                    SIMULATED
                </Box>
            )}
            {/* Subtle glow background */}
            {isOn && !isError && <Box position="absolute" top="-20%" right="-10%" w="100px" h="100px" bg={`${activeColor}.50`} filter="blur(40px)" opacity={0.6} zIndex={0} />}

            <Flex align="center" justify="space-between" h="full" position="relative" zIndex={1}>
                <HStack spacing={3}>
                    <Box 
                        p={iconPadding} 
                        borderRadius="lg" 
                        bg={isError ? "red.50" : (isOn ? `${activeColor}.100` : `${activeColor}.50`)} 
                        transition="all 0.3s"
                        boxShadow={isOn && !isError ? `0 2px 8px ${getShadowColor(activeColor, 0.2)}` : "none"}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        {videoIcon ? (
                            <Box as="video" src={videoIcon} autoPlay loop muted playsInline w={videoSize} h={videoSize} objectFit="contain" />
                        ) : (
                            <Icon size={14} color={isError ? "red.500" : (isOn ? `${activeColor}.600` : "gray.500")} />
                        )}
                    </Box>
                    <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="800" color="gray.800" fontSize="xs" letterSpacing="-0.2px">{label}</Text>
                        <Text fontSize="8px" color={isError ? "red.500" : "gray.400"} fontWeight="black" textTransform="uppercase" letterSpacing="0.5px">
                            {isError ? "STREAMS ERR" : description}
                        </Text>
                    </VStack>
                </HStack>

                <VStack align="flex-end" spacing={0.5}>
                    <Box 
                        w="6px" 
                        h="6px" 
                        borderRadius="full" 
                        bg={isError ? "red.500" : (isOn ? `${activeColor}.500` : "gray.300")} 
                        boxShadow={isOn && !isError ? `0 0 8px ${getShadowColor(activeColor, 0.6)}` : "none"} 
                        transition="all 0.3s" 
                    />
                    <Text fontSize="8px" fontWeight="black" color={isError ? "red.600" : (isOn ? `${activeColor}.600` : "gray.400")} letterSpacing="0.5px" textAlign="right">
                        {statusText ? statusText : (isError ? "FAILURE" : (isOn ? "CONNECTED" : "OFFLINE"))}
                    </Text>
                </VStack>
            </Flex>
        </Box>
    );
};
