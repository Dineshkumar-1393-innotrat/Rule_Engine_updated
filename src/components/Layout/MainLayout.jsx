import React, { useState, useEffect } from 'react';
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
  Collapse,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
} from '@chakra-ui/react';
import { Menu, LayoutDashboard, Zap, Settings, Activity, ChevronRight, ChevronLeft, Car, History, UploadCloud, Terminal, Radio, Factory, Layers, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DOMAIN_LIST } from '../../utils/DomainConfig';

const navItems = [
  { label: 'Engine Overview', icon: LayoutDashboard, path: '/payload-dashboard' },
  { label: 'Bulk Provisioning', icon: UploadCloud, path: '/bulk-provision' },
  { label: ' VIN Details', icon: Terminal, path: '/system-console' },
  { label: 'MQTT Physical Device', icon: Radio, path: '/mqtt-virtual-device' },
  { label: 'Manufacturing Portal', icon: Factory, path: '/manufacturing/login' },
];

const SidebarContent = ({ onClose, currentPath, isCollapsed, onToggle, ...rest }) => {
  const navigate = useNavigate();
  const [isIndustriesOpen, setIsIndustriesOpen] = useState(() => currentPath.startsWith('/iot-rule-engine'));

  useEffect(() => {
    if (currentPath.startsWith('/iot-rule-engine')) {
      setIsIndustriesOpen(true);
    }
  }, [currentPath]);

  const isGroupActive = currentPath.startsWith('/iot-rule-engine');
  const isIndustryActive = (id) => {
    if (currentPath === '/iot-rule-engine' && id === 'jeep_proto_5') return true;
    return currentPath === `/iot-rule-engine/${id}`;
  };

  const renderNavItem = (link) => {
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
  };

  const renderIoTIndustries = () => {
    if (isCollapsed) {
      return (
        <Popover trigger="hover" placement="right-start" openDelay={100} closeDelay={200}>
          <PopoverTrigger>
            <Flex
              align="center"
              p="4"
              mx="2"
              borderRadius="xl"
              role="group"
              cursor="pointer"
              bg={isGroupActive ? 'blue.50' : 'transparent'}
              color={isGroupActive ? 'blue.600' : 'gray.500'}
              justifyContent="center"
              _hover={{
                bg: 'blue.50',
                color: 'blue.600',
              }}
              transition="all 0.2s"
            >
              <Icon fontSize="18" as={Layers} />
            </Flex>
          </PopoverTrigger>
          <Portal>
            <PopoverContent bg="white" borderColor="gray.100" boxShadow="xl" borderRadius="xl" w="240px">
              <PopoverBody p={2}>
                <Text fontSize="10px" fontWeight="800" color="gray.400" px={3} py={1.5} mb={1} textTransform="uppercase" letterSpacing="1px">
                  IoT Industries
                </Text>
                <VStack spacing={0.5} align="stretch" maxH="350px" overflowY="auto">
                  {DOMAIN_LIST.map((domain) => {
                    const isActive = isIndustryActive(domain.id);
                    return (
                      <Flex
                        key={domain.id}
                        align="center"
                        p="3"
                        borderRadius="lg"
                        cursor="pointer"
                        bg={isActive ? 'blue.50' : 'transparent'}
                        color={isActive ? 'blue.600' : 'gray.700'}
                        _hover={{ bg: 'blue.50', color: 'blue.600' }}
                        onClick={() => {
                          navigate(`/iot-rule-engine/${domain.id}`);
                          if (onClose) onClose();
                        }}
                      >
                        {typeof domain.icon === 'string' ? (
                          <Text fontSize="sm" w="18px" mr={3} textAlign="center">{domain.icon}</Text>
                        ) : (
                          <Icon as={domain.icon || Radio} mr={3} fontSize="14" />
                        )}
                        <Text fontSize="xs" fontWeight={isActive ? '800' : '600'}>
                          {domain.label}
                        </Text>
                      </Flex>
                    );
                  })}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Portal>
        </Popover>
      );
    }

    return (
      <VStack align="stretch" spacing={0}>
        <Flex
          align="center"
          p="4"
          mx="2"
          borderRadius="xl"
          role="group"
          cursor="pointer"
          bg={isGroupActive && !isIndustriesOpen ? 'blue.50' : 'transparent'}
          color={isGroupActive ? 'blue.600' : 'gray.500'}
          _hover={{
            bg: 'blue.50',
            color: 'blue.600',
          }}
          onClick={() => setIsIndustriesOpen(!isIndustriesOpen)}
          transition="all 0.2s"
        >
          <Icon mr={4} fontSize="18" as={Layers} />
          <Text fontSize="sm" fontWeight={isGroupActive ? '800' : '600'}>IoT Industries</Text>
          <Spacer />
          <Icon
            as={ChevronDown}
            transition="transform 0.2s"
            transform={isIndustriesOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
            fontSize="14"
          />
        </Flex>

        <Collapse in={isIndustriesOpen} animateOpacity>
          <VStack
            align="stretch"
            spacing={0.5}
            pl={6}
            pr={2}
            mt={1}
            mb={2}
            maxH="280px"
            overflowY="auto"
            sx={{
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: 'gray.200', borderRadius: '10px' },
            }}
          >
            {DOMAIN_LIST.map((domain) => {
              const isActive = isIndustryActive(domain.id);
              return (
                <Flex
                  key={domain.id}
                  align="center"
                  py="2"
                  px="4"
                  borderRadius="lg"
                  cursor="pointer"
                  bg={isActive ? 'blue.50' : 'transparent'}
                  color={isActive ? 'blue.600' : 'gray.600'}
                  _hover={{ bg: 'blue.50', color: 'blue.600' }}
                  onClick={() => {
                    navigate(`/iot-rule-engine/${domain.id}`);
                    if (onClose) onClose();
                  }}
                  transition="all 0.15s"
                >
                  {typeof domain.icon === 'string' ? (
                    <Text fontSize="sm" w="16px" mr={3} textAlign="center">{domain.icon}</Text>
                  ) : (
                    <Icon as={domain.icon || Radio} mr={3} fontSize="13" />
                  )}
                  <Text fontSize="xs" fontWeight={isActive ? '800' : '600'} noOfLines={1}>
                    {domain.label}
                  </Text>
                  <Spacer />
                  {isActive && <ChevronRight size={12} />}
                </Flex>
              );
            })}
          </VStack>
        </Collapse>
      </VStack>
    );
  };

  return (
    <Box
      transition="0.3s ease"
      bg="white"
      borderRight="1px"
      borderRightColor="gray.200"
      w={{ base: 'full', md: isCollapsed ? 20 : 60 }}
      pos="fixed"
      h="full"
      display="flex"
      flexDirection="column"
      {...rest}
    >
      {/* Header / Logo */}
      <Flex h="20" alignItems="center" mx={isCollapsed ? 0 : 8} justifyContent={isCollapsed ? "center" : "space-between"} flexShrink={0}>
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

      {/* Navigation Links Scroll Area */}
      <Box
        flex="1"
        overflowY="auto"
        px={isCollapsed ? 2 : 4}
        pb={4}
        sx={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'gray.200', borderRadius: '10px' },
        }}
      >
        <VStack spacing={1} align="stretch">
          {!isCollapsed && (
            <Text fontSize="10px" fontWeight="800" color="gray.400" px={4} mb={2} textTransform="uppercase" letterSpacing="1px">
              Management
            </Text>
          )}
          {renderNavItem(navItems[0])}
          {/* {renderIoTIndustries()} */}
          {navItems.slice(1).map(renderNavItem)}
        </VStack>
      </Box>

      {/* Footer Actions (Logout & Toggle) */}
      <Box flexShrink={0} px={isCollapsed ? 2 : 4} pb={4} pt={2} borderTop="1px solid" borderColor="gray.100" bg="white">
        {/* Logout Button */}
        <Flex
          align="center"
          p="4"
          borderRadius="xl"
          cursor="pointer"
          color="red.500"
          _hover={{ bg: 'red.50' }}
          onClick={() => {
            navigate('/login');
          }}
          justifyContent={isCollapsed ? "center" : "flex-start"}
        >
          <Icon as={Radio} transform="rotate(180deg)" mr={isCollapsed ? 0 : 4} />
          {!isCollapsed && <Text fontSize="sm" fontWeight="600">Logout</Text>}
        </Flex>

        {/* Collapse Toggle Button */}
        <Box display={{ base: 'none', md: 'block' }} mt={2}>
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
