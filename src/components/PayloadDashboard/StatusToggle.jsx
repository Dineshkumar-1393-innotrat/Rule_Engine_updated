import React from 'react';
import { Box, Flex, HStack, VStack, Text } from '@chakra-ui/react';

export const StatusToggle = ({ label, description, isOn, icon: Icon, isError = false, color: customColor, statusText, isSimulated = false }) => {
    const defaultColor = isError ? "red" : (isOn ? "blue" : "gray");
    const activeColor = customColor || defaultColor;

    return (
        <Box
            bg="white" p={{ base: 3, md: 5 }} borderRadius="2xl" border="1px solid"
            borderColor={isError ? "red.200" : "gray.100"}
            boxShadow="sm" _hover={{ border: '1px solid', borderColor: `${activeColor}.200`, boxShadow: 'lg' }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" position="relative" overflow="hidden"
        >
            {isSimulated && (
                <Box position="absolute" top={0} right={0} bg="purple.500" color="white" px={2} py={0.5} borderBottomLeftRadius="md" fontSize="7px" fontWeight="black" zIndex={2}>
                    SIMULATED
                </Box>
            )}
            {/* Subtle glow background */}
            {isOn && !isError && <Box position="absolute" top="-20%" right="-10%" w="100px" h="100px" bg={`${activeColor}.50`} filter="blur(40px)" opacity={0.6} zIndex={0} />}

            <Flex align="center" justify="space-between" position="relative" zIndex={1}>
                <HStack spacing={{ base: 2, md: 4 }}>
                    <Box p={{ base: 2, md: 3 }} borderRadius="xl" bg={isError ? "red.500" : (isOn ? `${activeColor}.500` : `${activeColor}.50`)} transition="all 0.3s">
                        <Icon size={18} color={isError || (isOn && !isError) ? "white" : `${activeColor}.500`} />
                    </Box>
                    <VStack align="flex-start" spacing={0} overflow="visible">
                        <Text fontWeight="800" color="gray.800" fontSize={{ base: "xs", md: "md" }} letterSpacing="-0.2px">{label}</Text>
                        <Text fontSize={{ base: "8px", md: "10px" }} color={isError ? "red.500" : "gray.500"} fontWeight="bold" textTransform="uppercase" letterSpacing="0.5px">
                            {isError ? "STREAMS ERR" : description}
                        </Text>
                    </VStack>
                </HStack>

                <VStack align="flex-end" spacing={1} ml={2}>
                    <Box w={{ base: "8px", md: "12px" }} h={{ base: "8px", md: "12px" }} borderRadius="full" bg={isError ? "red.500" : (isOn ? `${activeColor}.500` : "gray.300")} boxShadow={isOn && !isError ? `0 0 10px rgba(49, 130, 206, 0.5)` : "none"} transition="all 0.3s" />
                    <Text fontSize="8px" fontWeight="900" color={isError ? "red.600" : (isOn ? `${activeColor}.600` : "gray.400")} letterSpacing="1px">
                        {statusText ? statusText : (isError ? "FAILURE" : (isOn ? "ENGAGED" : "OFF"))}
                    </Text>
                </VStack>
            </Flex>
        </Box>
    );
};
