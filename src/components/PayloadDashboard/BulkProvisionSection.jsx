import React, { useState, useRef } from 'react';
import {
    Box,
    Card,
    CardBody,
    SimpleGrid,
    VStack,
    HStack,
    Icon,
    Text,
    Heading,
    Button,
    useToast,
    IconButton,
    Progress,
    Badge,
    Flex
} from '@chakra-ui/react';
import { UploadCloud, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import { TraxoApi } from '../../utils/TraxoApi';

export const BulkProvisionSection = () => {
    const toast = useToast();
    const [imeiFile, setImeiFile] = useState(null);
    const [supplierFile, setSupplierFile] = useState(null);
    const [isImeiUploading, setIsImeiUploading] = useState(false);
    const [isSupplierUploading, setIsSupplierUploading] = useState(false);

    const imeiInputRef = useRef();
    const supplierInputRef = useRef();

    const handleFileChange = (event, setFile) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.name.endsWith('.csv')) {
                toast({
                    title: 'Invalid File',
                    description: 'Please upload a CSV file.',
                    status: 'error',
                    duration: 2000,
                });
                return;
            }
            setFile(file);
        }
    };

    const uploadImei = async () => {
        if (!imeiFile) return;
        setIsImeiUploading(true);
        try {
            await TraxoApi.bulkImeiUpload(imeiFile);
            toast({ title: 'IMEI Uploaded', status: 'success' });
            setImeiFile(null);
        } catch (error) {
            toast({ title: 'Upload Failed', description: error.message, status: 'error' });
        } finally {
            setIsImeiUploading(false);
        }
    };

    const uploadSupplier = async () => {
        if (!supplierFile) return;
        setIsSupplierUploading(true);
        try {
            await TraxoApi.bulkSupplierFeed(supplierFile);
            toast({ title: 'Feed Uploaded', status: 'success' });
            setSupplierFile(null);
        } catch (error) {
            toast({ title: 'Upload Failed', description: error.message, status: 'error' });
        } finally {
            setIsSupplierUploading(false);
        }
    };

    return (
        <Card variant="outline" bg="white" shadow="sm" borderRadius="xl" mb={6}>
            <CardBody p={5}>
                <HStack spacing={2} mb={4}>
                    <Icon as={UploadCloud} color="blue.500" />
                    <Heading size="xs" color="gray.700">Bulk Provisioning</Heading>
                    <Badge colorScheme="blue" variant="subtle" fontSize="9px">CSV BATCH</Badge>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {/* IMEI Upload */}
                    <VStack align="stretch" spacing={2}>
                        <Text fontSize="10px" fontWeight="bold" color="gray.500" textTransform="uppercase">IMEI Batch Provisioning</Text>
                        {!imeiFile ? (
                            <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<UploadCloud size={14} />}
                                onClick={() => imeiInputRef.current.click()}
                                borderStyle="dashed"
                            >
                                Select IMEI CSV
                            </Button>
                        ) : (
                            <HStack bg="blue.50" p={2} borderRadius="md" border="1px solid" borderColor="blue.100">
                                <Icon as={FileText} size={14} color="blue.500" />
                                <Text fontSize="xs" isTruncated flex={1}>{imeiFile.name}</Text>
                                <IconButton
                                    size="xs"
                                    icon={<Trash2 size={12} />}
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => setImeiFile(null)}
                                />
                                <Button size="xs" colorScheme="blue" isLoading={isImeiUploading} onClick={uploadImei}>Upload</Button>
                            </HStack>
                        )}
                        <input
                            type="file"
                            ref={imeiInputRef}
                            style={{ display: 'none' }}
                            accept=".csv"
                            onChange={(e) => handleFileChange(e, setImeiFile)}
                        />
                    </VStack>

                    {/* Supplier Upload */}
                    <VStack align="stretch" spacing={2}>
                        <Text fontSize="10px" fontWeight="bold" color="gray.500" textTransform="uppercase">Supplier/Dongle Feed</Text>
                        {!supplierFile ? (
                            <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<UploadCloud size={14} />}
                                onClick={() => supplierInputRef.current.click()}
                                borderStyle="dashed"
                            >
                                Select Supplier CSV
                            </Button>
                        ) : (
                            <HStack bg="purple.50" p={2} borderRadius="md" border="1px solid" borderColor="purple.100">
                                <Icon as={FileText} size={14} color="purple.500" />
                                <Text fontSize="xs" isTruncated flex={1}>{supplierFile.name}</Text>
                                <IconButton
                                    size="xs"
                                    icon={<Trash2 size={12} />}
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => setSupplierFile(null)}
                                />
                                <Button size="xs" colorScheme="purple" isLoading={isSupplierUploading} onClick={uploadSupplier}>Upload</Button>
                            </HStack>
                        )}
                        <input
                            type="file"
                            ref={supplierInputRef}
                            style={{ display: 'none' }}
                            accept=".csv"
                            onChange={(e) => handleFileChange(e, setSupplierFile)}
                        />
                    </VStack>
                </SimpleGrid>
            </CardBody>
        </Card>
    );
};
