import React, { useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  VStack,
  Icon,
  Spacer,
  Tooltip,
} from '@chakra-ui/react';
import { Menu, LayoutDashboard, Zap, Settings, Activity, ChevronRight, ChevronLeft, Car, History, UploadCloud, Terminal, Radio } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Engine Overview', icon: LayoutDashboard, path: '/payload-dashboard' },
  { label: 'Bulk Provisioning', icon: UploadCloud, path: '/bulk-provision' },
  { label: ' VIN Details', icon: Terminal, path: '/system-console' },
  { label: 'MQTT Physical Device', icon: Radio, path: '/mqtt-virtual-device' },
];

const SidebarContent = ({ onClose, currentPath, isCollapsed, onToggle, ...rest }) => {
  const navigate = useNavigate();

  return (
    <Box
      transition="0.3s ease"
      bg="white"
      borderRight="1px"
      borderRightColor="gray.200"
      w={{ base: 'full', md: isCollapsed ? 20 : 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx={isCollapsed ? 0 : 8} justifyContent={isCollapsed ? "center" : "space-between"}>
        <HStack spacing={3} cursor="pointer" onClick={() => navigate('/')}>
          <Box p={2} bg="blue.500" borderRadius="lg" color="white">
            <Zap size={20} />
          </Box>
          {!isCollapsed && (
            <Text fontSize="md" fontWeight="800" letterSpacing="-1px">
              Rule-Engine
            </Text>
          )}
        </HStack>
        {onClose && (
          <Box display={{ base: 'flex', md: 'none' }}>
            <IconButton
              variant="ghost"
              icon={<Icon as={Menu} size={20} />}
              onClick={onClose}
              aria-label="Close menu"
            />
          </Box>
        )}
      </Flex>
      <VStack spacing={1} px={isCollapsed ? 2 : 4} align="stretch">
        {!isCollapsed && (
          <Text fontSize="10px" fontWeight="800" color="gray.400" px={4} mb={2} textTransform="uppercase" letterSpacing="1px">
            Management
          </Text>
        )}
        {navItems.map((link) => {
          const isActive = currentPath === link.path;
          return (
            <Tooltip key={link.label} label={isCollapsed ? link.label : ""} placement="right">
              <Flex
                align="center"
                p="4"
                mx="2"
                borderRadius="xl"
                role="group"
                cursor="pointer"
                bg={isActive ? 'blue.50' : 'transparent'}
                color={isActive ? 'blue.600' : 'gray.500'}
                justifyContent={isCollapsed ? "center" : "flex-start"}
                _hover={{
                  bg: 'blue.50',
                  color: 'blue.600',
                }}
                onClick={() => {
                  navigate(link.path);
                  if (onClose) onClose();
                }}
                transition="all 0.2s"
              >
                {link.icon && (
                  <Icon
                    mr={isCollapsed ? 0 : 4}
                    fontSize="18"
                    as={link.icon}
                  />
                )}
                {!isCollapsed && (
                  <Text fontSize="sm" fontWeight={isActive ? '800' : '600'}>{link.label}</Text>
                )}
                <Spacer />
                {!isCollapsed && isActive && <ChevronRight size={14} />}
              </Flex>
            </Tooltip>
          );
        })}
      </VStack>

      {/* Logout Button */}
      <Box position="absolute" bottom={20} w="full" px={4}>
        <Flex
          align="center"
          p="4"
          borderRadius="xl"
          cursor="pointer"
          color="red.500"
          _hover={{ bg: 'red.50' }}
          onClick={() => {
            // Mock logout for now since we are using custom pages
            navigate('/login');
          }}
          justifyContent={isCollapsed ? "center" : "flex-start"}
        >
          <Icon as={Radio} transform="rotate(180deg)" mr={isCollapsed ? 0 : 4} />
          {!isCollapsed && <Text fontSize="sm" fontWeight="600">Logout</Text>}
        </Flex>
      </Box>

      {/* Collapse Toggle Button - Always at the bottom for Desktop */}
      <Box position="absolute" bottom={8} w="full" px={4} display={{ base: 'none', md: 'block' }}>
        <Flex justify={isCollapsed ? "center" : "flex-end"}>
          <IconButton
            size="sm"
            variant="ghost"
            icon={isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            onClick={onToggle}
            aria-label="Toggle Sidebar"
            borderRadius="full"
            bg="gray.50"
            _hover={{ bg: 'blue.50', color: 'blue.600' }}
          />
        </Flex>
      </Box>
    </Box>
  );
};

const Navbar = ({ onOpen, isCollapsed }) => {
  return (
    <Flex
      ml={{ base: 0, md: isCollapsed ? 20 : 60 }}
      px={{ base: 4, md: 8 }}
      height="20"
      alignItems="center"
      bg="white"
      borderBottomWidth="1px"
      borderBottomColor="gray.200"
      justifyContent="space-between"
      position="sticky"
      top={0}
      zIndex={1000}
      transition="0.3s ease"
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="ghost"
        aria-label="open menu"
        icon={<Menu size={20} />}
      />

      <HStack spacing={{ base: '0', md: '6' }}>
        <Box display={{ base: 'none', md: 'block' }}>
          <Text fontSize="xs" fontWeight="800" color="gray.400">RULE ENGINE V2.0</Text>
        </Box>
      </HStack>

    </Flex>
  );
};

const MainLayout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <Box minH="100vh" bg="gray.50">
      <SidebarContent
        onClose={() => onClose}
        currentPath={location.pathname}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent>
          <SidebarContent 
            onClose={onClose} 
            currentPath={location.pathname} 
            isCollapsed={false} // Always expanded in drawer
          />
        </DrawerContent>
      </Drawer>
      {/* Navbar */}
      <Navbar onOpen={onOpen} isCollapsed={isCollapsed} />
      <Box 
        ml={{ base: 0, md: isCollapsed ? 20 : 60 }} 
        p={location.pathname === '/mqtt-virtual-device' ? 0 : { base: 4, md: 8 }}
        transition="0.3s ease"
        height={location.pathname === '/mqtt-virtual-device' ? 'calc(100vh - 80px)' : 'auto'}
        overflow={location.pathname === '/mqtt-virtual-device' ? 'hidden' : 'visible'}
        display={location.pathname === '/mqtt-virtual-device' ? 'flex' : 'block'}
        flexDirection="column"
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
