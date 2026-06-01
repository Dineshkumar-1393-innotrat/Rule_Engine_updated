import React from 'react';
import { Box, Flex, VStack, HStack, Text, Button, Icon, Divider, useColorModeValue } from '@chakra-ui/react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Smartphone, History, LogOut } from 'lucide-react';

const SidebarItem = ({ icon, label, to, isActive }) => {
    return (
        <Button
            as={Link}
            to={to}
            variant="ghost"
            justifyContent="flex-start"
            w="full"
            leftIcon={<Icon as={icon} />}
            colorScheme={isActive ? 'blue' : 'gray'}
            bg={isActive ? 'blue.50' : 'transparent'}
            _dark={{ bg: isActive ? 'blue.900' : 'transparent' }}
        >
            {label}
        </Button>
    );
};

const ManufacturingPortalLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        navigate('/manufacturing/login');
    };

    return (
        <Flex h="100vh" w="100vw" bg={useColorModeValue('gray.50', 'gray.900')} overflow="hidden">
            <Box w="250px" bg={useColorModeValue('white', 'gray.800')} borderRight="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
                <VStack align="stretch" p={4} spacing={2} h="full">
                    <Box mb={6} px={4}>
                        <Text fontSize="lg" fontWeight="bold" color="blue.600">Manufacturing</Text>
                        <Text fontSize="xs" color="gray.500">Device Management</Text>
                    </Box>

                    <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/manufacturing/dashboard" isActive={location.pathname === '/manufacturing/dashboard'} />
                    
                    <Divider my={2} />
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" px={4} textTransform="uppercase">Upload</Text>
                    <SidebarItem icon={UploadCloud} label="IMEI Upload" to="/manufacturing/upload/imei" isActive={location.pathname === '/manufacturing/upload/imei'} />
                    <SidebarItem icon={UploadCloud} label="Supplier Feed Upload" to="/manufacturing/upload/supplier-feed" isActive={location.pathname === '/manufacturing/upload/supplier-feed'} />
                    
                    <Divider my={2} />
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" px={4} textTransform="uppercase">Devices</Text>
                    <SidebarItem icon={Smartphone} label="Device List" to="/manufacturing/devices" isActive={location.pathname === '/manufacturing/devices' || (location.pathname.match(/^\/manufacturing\/devices\/[^/]+$/) && !location.pathname.includes('search'))} />
                    <SidebarItem icon={Smartphone} label="Device Search" to="/manufacturing/devices/search" isActive={location.pathname === '/manufacturing/devices/search'} />
                    
                    <Divider my={2} />
                    <SidebarItem icon={History} label="Upload History" to="/manufacturing/history" isActive={location.pathname === '/manufacturing/history'} />

                    <Box mt="auto">
                        <Button w="full" variant="outline" leftIcon={<Icon as={LogOut} />} onClick={handleLogout}>
                            Logout
                        </Button>
                    </Box>
                </VStack>
            </Box>

            <Flex direction="column" flex="1" overflow="hidden">
                <Box as="header" bg={useColorModeValue('white', 'gray.800')} borderBottom="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} p={4} display="flex" justifyContent="space-between" alignItems="center">
                    <Text fontSize="xl" fontWeight="bold">CVIP Device Management Portal</Text>
                    <HStack>
                        <Text fontSize="sm" color="gray.600">Manufacturing User</Text>
                    </HStack>
                </Box>
                <Box as="main" flex="1" overflowY="auto" p={6}>
                    <Outlet />
                </Box>
            </Flex>
        </Flex>
    );
};

export default ManufacturingPortalLayout;
