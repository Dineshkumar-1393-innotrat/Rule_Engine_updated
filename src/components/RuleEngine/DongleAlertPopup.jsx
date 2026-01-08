import React from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
    VStack,
    HStack,
    Badge,
    Icon,
    Box,
    Divider
} from '@chakra-ui/react';
import {
    WarningIcon,
    InfoIcon,
    CheckCircleIcon,
    WarningTwoIcon
} from '@chakra-ui/icons';

const DongleAlertPopup = ({ isOpen, onClose, alert }) => {
    if (!alert) return null;

    const getSeverityDetails = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return {
                    color: 'red.500',
                    icon: WarningTwoIcon,
                    badge: 'red',
                    title: 'CRITICAL ALERT'
                };
            case 'warning':
                return {
                    color: 'orange.500',
                    icon: WarningIcon,
                    badge: 'orange',
                    title: 'WARNING ALERT'
                };
            case 'info':
                return {
                    color: 'blue.500',
                    icon: InfoIcon,
                    badge: 'blue',
                    title: 'INFORMATION'
                };
            default:
                return {
                    color: 'green.500',
                    icon: CheckCircleIcon,
                    badge: 'green',
                    title: 'NOTIFICATION'
                };
        }
    };

    const details = getSeverityDetails(alert.severity);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            isCentered
            motionPreset="slideInBottom"
        >
            <ModalOverlay
                bg='blackAlpha.300'
                backdropFilter='blur(10px) hue-rotate(90deg)'
            />
            <ModalContent
                borderTop="4px solid"
                borderColor={details.color}
                borderRadius="xl"
                boxShadow="2xl"
            >
                <ModalHeader>
                    <HStack spacing={3}>
                        <Icon as={details.icon} color={details.color} boxSize={6} />
                        <VStack align="start" spacing={0}>
                            <Text fontSize="md" fontWeight="bold">{details.title}</Text>
                            <Text fontSize="xs" fontWeight="normal" color="gray.500">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                            </Text>
                        </VStack>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack align="stretch" spacing={4}>
                        <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={2}>
                                {alert.ruleName || alert.message}
                            </Text>
                            <Text color="gray.600">
                                {alert.message}
                            </Text>
                        </Box>

                        <Divider />

                        <VStack align="stretch" spacing={2}>
                            <HStack justify="space-between">
                                <Text fontSize="xs" fontWeight="bold" color="gray.500">CATEGORY</Text>
                                <Badge colorScheme={details.badge}>{alert.alertDetails?.category || alert.type || 'N/A'}</Badge>
                            </HStack>
                            <HStack justify="space-between">
                                <Text fontSize="xs" fontWeight="bold" color="gray.500">ALERT CODE</Text>
                                <Text fontSize="xs" fontWeight="mono">{alert.alertDetails?.code || 'N/A'}</Text>
                            </HStack>
                            <HStack justify="space-between">
                                <Text fontSize="xs" fontWeight="bold" color="gray.500">ID</Text>
                                <Text fontSize="xs" fontWeight="mono" color="gray.400">{alert.ruleId}</Text>
                            </HStack>
                        </VStack>
                    </VStack>
                </ModalBody>

                <ModalFooter bg="gray.50" borderBottomRadius="xl">
                    <Button colorScheme={details.badge} mr={3} onClick={onClose} size="sm">
                        Acknowledge
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DongleAlertPopup;
