import React, { useState, useRef } from 'react';
import { Box, Heading, Text, VStack, Button, Input, Progress, useToast, Alert, AlertIcon, Table, Thead, Tbody, Tr, Th, Td, Flex } from '@chakra-ui/react';
import Papa from 'papaparse';
import axios from 'axios';

const REQUIRED_COLUMNS = [
    'Dongle_SN', 'IMEI', 'MSISDN', 'ICCID', 'eUICCID', 
    'HW_part_number', 'NAD_SW_version', 'MCU_SW_version', 
    'encryptionKeyVersion', 'signingKeyVersion', 
    'plantManufacturingCountryCode', 'Plant_Manufactured_Date', 
    'countrycode', 'regioncode'
];

const UploadSupplierFeedPage = () => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [validationError, setValidationError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState(null);
    const fileInputRef = useRef();
    const toast = useToast();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        if (!selectedFile.name.endsWith('.csv')) {
            setValidationError('Accepted: .csv only');
            setFile(null);
            return;
        }
        if (selectedFile.size > 25 * 1024 * 1024) {
            setValidationError('Max size: 25 MB');
            setFile(null);
            return;
        }

        setFile(selectedFile);
        setValidationError('');
        setUploadResult(null);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                const fileColumns = results.meta.fields || [];
                setColumns(fileColumns);
                
                const missingColumns = REQUIRED_COLUMNS.filter(c => !fileColumns.includes(c));
                if (missingColumns.length > 0) {
                    setValidationError(`Missing required columns: ${missingColumns.join(', ')}`);
                } else {
                    const invalidRows = data.filter(row => row['IMEI']?.length !== 15 || isNaN(Number(row['IMEI'])));
                    if (invalidRows.length > 0) {
                        setValidationError(`Found ${invalidRows.length} rows with invalid IMEI.`);
                    }
                }
                setPreviewData(data.slice(0, 10)); // Show max 10 for preview
            }
        });
    };

    const handleUpload = async () => {
        if (!file || validationError) return;
        
        setIsUploading(true);
        setUploadProgress(0);
        
        const formData = new FormData();
        formData.append('file', file);
        
        const token = sessionStorage.getItem('access_token');
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://cvipiot-preprod.fca-india.com:40543';

        try {
            const response = await axios.post(`${baseURL}/jeep/bulkprovision/dongle`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            setUploadResult({
                success: true,
                total: previewData.length,
                successful: response.data?.successfulCount || previewData.length,
                failed: response.data?.failedCount || 0,
                failedRecords: response.data?.failedRecords || []
            });
            
            toast({ title: 'Upload Complete', status: 'success', duration: 3000 });

            const history = JSON.parse(localStorage.getItem('upload_history') || '[]');
            history.push({
                time: new Date().toISOString(),
                type: 'Supplier Feed',
                file: file.name,
                total: previewData.length, // approximation
                success: true
            });
            localStorage.setItem('upload_history', JSON.stringify(history));
        } catch (error) {
            toast({ title: 'Upload failed', description: error.message, status: 'error', duration: 5000 });
            setUploadResult({ success: false, error: error.message });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <Box>
            <Heading size="lg" mb={6}>Upload Supplier Feed (TBox / Dongle Data)</Heading>
            
            {!uploadResult ? (
                <VStack align="stretch" spacing={6}>
                    <Box borderWidth="1px" borderRadius="lg" p={6} borderStyle="dashed" bg="gray.50">
                        <VStack spacing={4}>
                            <Text>Step 1: Prepare CSV (Must have header row with specific columns)</Text>
                            <Text>Step 2: Select File</Text>
                            <Input type="file" accept=".csv" onChange={handleFileChange} display="none" ref={fileInputRef} />
                            <Button onClick={() => fileInputRef.current.click()} colorScheme="blue" variant="outline">Browse Files</Button>
                            {file && <Text fontWeight="bold">Selected: {file.name}</Text>}
                        </VStack>
                    </Box>

                    {validationError && (
                        <Alert status="error"><AlertIcon />{validationError}</Alert>
                    )}

                    {file && !validationError && (
                        <Box>
                            <Flex justify="space-between" mb={4}>
                                <Text fontWeight="bold">Preview (first {previewData.length} rows)</Text>
                                <Button size="sm" colorScheme="red" variant="ghost" onClick={() => setFile(null)}>Remove File</Button>
                            </Flex>
                            <Box maxHeight="300px" overflowX="auto" overflowY="auto" borderWidth="1px" borderRadius="md">
                                <Table size="sm" variant="simple">
                                    <Thead>
                                        <Tr>
                                            {columns.map(c => <Th key={c}>{c}</Th>)}
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {previewData.map((row, i) => (
                                            <Tr key={i}>
                                                {columns.map(c => <Td key={c}>{row[c]}</Td>)}
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                            
                            <Box mt={4}>
                                {isUploading ? (
                                    <Box>
                                        <Text mb={2}>Uploading {file.name}... {uploadProgress}%</Text>
                                        <Progress value={uploadProgress} size="sm" colorScheme="blue" />
                                    </Box>
                                ) : (
                                    <Button colorScheme="blue" onClick={handleUpload} w="full">Upload Now</Button>
                                )}
                            </Box>
                        </Box>
                    )}
                </VStack>
            ) : (
                <Box borderWidth="1px" borderRadius="lg" p={6} bg="green.50">
                    <Heading size="md" mb={4} color="green.600">✓ Upload Complete</Heading>
                    <Table size="sm" mb={4}>
                        <Tbody>
                            <Tr><Td>File:</Td><Td>{file.name}</Td></Tr>
                            <Tr><Td>Total Records:</Td><Td>{uploadResult.total}</Td></Tr>
                            <Tr><Td>Successful:</Td><Td>{uploadResult.successful}</Td></Tr>
                            <Tr><Td>Failed:</Td><Td>{uploadResult.failed}</Td></Tr>
                        </Tbody>
                    </Table>
                    <Button mt={6} onClick={() => { setFile(null); setUploadResult(null); setPreviewData([]); }}>Upload Another File</Button>
                </Box>
            )}
        </Box>
    );
};

export default UploadSupplierFeedPage;
