import React from 'react';
import { Box, Flex, HStack, Text, Button, Input, InputGroup, InputLeftElement, Select, IconButton, Spacer, Stack, Badge } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Monitor, Search, RotateCcw, Download } from 'lucide-react';
import { isValidVin, formatVin } from '../../utils/validation';

export const DashboardHeader = ({
    viewMode, setViewMode, searchTerm, setSearchTerm, vin, setVin,
    pollingInterval, setPollingInterval, isLive, setIsLive, handleRefresh, handleExport,
    isSimulated = false
}) => {
    return (
        <Box mb={6} position="relative" zIndex={2}>
            <Stack
                direction={{ base: 'column', lg: 'row' }}
                align={{ base: 'stretch', lg: 'center' }}
                justify="space-between"
                bg="white"
                p={4}
                borderRadius="2xl"
                border="1px solid"
                borderColor="gray.100"
                boxShadow="sm"
                spacing={4}
            >
                <HStack spacing={4} justify={{ base: 'center', lg: 'flex-start' }}>
                    <HStack spacing={1} bg="gray.100" p={1} borderRadius="xl">
                        <Button size="xs" variant={viewMode === 'visual' ? 'solid' : 'ghost'} colorScheme={viewMode === 'visual' ? 'blue' : 'gray'} borderRadius="lg" onClick={() => setViewMode('visual')}>Visual</Button>
                        <Button size="xs" variant={viewMode === 'console' ? 'solid' : 'ghost'} colorScheme={viewMode === 'console' ? 'blue' : 'gray'} borderRadius="lg" onClick={() => setViewMode('console')} leftIcon={<Monitor size={11} />}>Console</Button>
                    </HStack>
                </HStack>

                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    gap={4}
                    align={{ base: 'stretch', md: 'center' }}
                    justify={{ base: 'center', lg: 'flex-end' }}
                    flex={1}
                >
                    <InputGroup size="sm" maxW={{ base: 'full', md: '220px' }}>
                        <InputLeftElement pointerEvents="none"><Search size={13} color="#A0AEC0" /></InputLeftElement>
                        <Input 
                            placeholder="Search signals..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            borderRadius="lg" 
                            bg="gray.50" 
                            border="none" 
                            color="black" 
                            fontSize="12px" 
                            _focus={{ bg: 'white', boxShadow: 'outline' }} 
                        />
                    </InputGroup>

                    <Flex 
                        direction={{ base: 'column', xs: 'row', md: 'row' }} 
                        gap={3} 
                        wrap="wrap" 
                        justify={{ base: 'center', md: 'flex-end' }}
                        align="center"
                    >
                        <HStack spacing={3} wrap="wrap" justify="center">
                            <HStack spacing={1} align="center">
                                <Text fontSize="9px" fontWeight="black" color="gray.400" letterSpacing="0.5px">VIN</Text>
                                    <Input 
                                        value={vin} 
                                        onChange={e => setVin(formatVin(e.target.value))} 
                                        size="sm" 
                                        w={{ base: "full", xs: "140px", md: "155px" }} 
                                        borderRadius="lg" 
                                        color={vin.length > 0 && !isValidVin(vin) ? "red.600" : "black"} 
                                        fontWeight="bold" 
                                        fontSize="11px" 
                                        bg={vin.length > 0 && !isValidVin(vin) ? "red.50" : "gray.50"} 
                                        border={vin.length > 0 && !isValidVin(vin) ? "1px solid" : "none"}
                                        borderColor={vin.length > 0 && !isValidVin(vin) ? "red.200" : "transparent"}
                                    />
                                    {isSimulated && <Badge colorScheme="purple" variant="solid" fontSize="8px">VIRTUAL</Badge>}
                                </HStack>

                            <HStack spacing={1}>
                                <Text fontSize="9px" color="gray.400" fontWeight="bold">Poll</Text>
                                <Select 
                                    size="xs" 
                                    value={pollingInterval} 
                                    onChange={e => setPollingInterval(Number(e.target.value))} 
                                    w="70px" 
                                    borderRadius="md" 
                                    bg="gray.50" 
                                    border="none" 
                                    color="black" 
                                    fontSize="11px"
                                >
                                    <option value={5}>5s</option><option value={10}>10s</option><option value={30}>30s</option><option value={60}>60s</option>
                                </Select>
                            </HStack>
                        </HStack>

                        <HStack spacing={3}>
                            <HStack spacing={2} bg={isLive ? 'green.50' : 'gray.100'} px={3} py={1.5} borderRadius="full" border="1px solid" borderColor={isLive ? 'green.100' : 'gray.200'} cursor="pointer" onClick={() => setIsLive(!isLive)}>
                                {isLive && <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><Box w={2} h={2} borderRadius="full" bg="green.500" /></motion.div>}
                                <Text fontSize="9px" fontWeight="900" color={isLive ? 'green.600' : 'gray.600'} letterSpacing="1px">{isLive ? 'LIVE' : 'PAUSED'}</Text>
                            </HStack>

                            <HStack spacing={1}>
                                <IconButton 
                                    icon={<RotateCcw size={14} />} 
                                    aria-label="Refresh" 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={handleRefresh} 
                                    borderRadius="full" 
                                    isDisabled={!isValidVin(vin)}
                                />
                                <IconButton icon={<Download size={14} />} aria-label="Export JSON" size="sm" variant="ghost" onClick={handleExport} borderRadius="full" title="Export data as JSON" />
                            </HStack>
                        </HStack>
                    </Flex>
                </Flex>
            </Stack>
        </Box>
    );
};
