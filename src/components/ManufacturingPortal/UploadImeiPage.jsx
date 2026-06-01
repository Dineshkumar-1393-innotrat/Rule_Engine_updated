import React, { useState, useRef } from 'react';
import { Box, Heading, Text, VStack, Button, Input, Progress, useToast, Alert, AlertIcon, Table, Thead, Tbody, Tr, Th, Td, Badge, Flex } from '@chakra-ui/react';
import Papa from 'papaparse';
import axios from 'axios';

const UploadImeiPage = () => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
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
            setPreviewData([]);
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
            setValidationError('Max size: 10 MB');
            setFile(null);
            setPreviewData([]);
            return;
        }

        setFile(selectedFile);
        setValidationError('');
        setUploadResult(null);

        Papa.parse(selectedFile, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                const invalidRows = data.filter(row => row[0].length !== 15 || isNaN(Number(row[0])));
                if (invalidRows.length > 0) {
                    setValidationError(`Found ${invalidRows.length} rows with invalid IMEI. IMEI must be exactly 15 numeric digits.`);
                }
                setPreviewData(data.slice(0, 50));
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
            const response = await axios.post(`${baseURL}/jeep/bulkprovision/imei`, formData, {
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
                type: 'IMEI Upload',
                file: file.name,
                total: previewData.length,
                success: true
            });
            localStorage.setItem('upload_history', JSON.stringify(history));

        } catch (error) {
            toast({ title: 'Upload failed', description: error.message, status: 'error', duration: 5000 });
            setUploadResult({
                success: false,
                error: error.message
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <Box>
            <Heading size="lg" mb={6}>Upload IMEI</Heading>
            
            {!uploadResult ? (
                <VStack align="stretch" spacing={6}>
                    <Box borderWidth="1px" borderRadius="lg" p={6} borderStyle="dashed" bg="gray.50">
                        <VStack spacing={4}>
                            <Text>Step 1: Prepare CSV (Single column of 15-digit IMEI numbers, no header)</Text>
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
                            <Box maxHeight="300px" overflowY="auto" borderWidth="1px" borderRadius="md">
                                <Table size="sm">
                                    <Thead><Tr><Th>#</Th><Th>IMEI</Th></Tr></Thead>
                                    <Tbody>
                                        {previewData.map((row, i) => (
                                            <Tr key={i}><Td>{i + 1}</Td><Td>{row[0]}</Td></Tr>
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
                    {uploadResult.failed > 0 && uploadResult.failedRecords?.length > 0 && (
                        <Box>
                            <Text fontWeight="bold" mb={2}>Failed Records:</Text>
                            <Table size="sm">
                                <Thead><Tr><Th>IMEI</Th><Th>Reason</Th></Tr></Thead>
                                <Tbody>
                                    {uploadResult.failedRecords.map((r, i) => (
                                        <Tr key={i}><Td>{r.imei}</Td><Td>{r.reason}</Td></Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    )}
                    <Button mt={6} onClick={() => { setFile(null); setUploadResult(null); setPreviewData([]); }}>Upload Another File</Button>
                </Box>
            )}
        </Box>
    );
};

export default UploadImeiPage;
