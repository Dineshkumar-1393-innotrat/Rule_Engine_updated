import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  VStack,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Text,
  useToast,
  Flex
} from '@chakra-ui/react';
import { FiUploadCloud, FiFileText, FiCheckCircle } from 'react-icons/fi';

const VerificationForm = ({ onSubmit, isLoading, initialData }) => {
  const [certInputMode, setCertInputMode] = useState(initialData?.certificate ? 1 : 0); // 0 = File, 1 = Text
  const toast = useToast();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      vehicleId: initialData?.vehicleId || '',
      imeiNo: initialData?.imeiNo || '',
      TboxSerialNum: initialData?.TboxSerialNum || '',
      certificate: initialData?.certificate || ''
    }
  });

  // Sync initialData if it arrives late or changes
  React.useEffect(() => {
    if (initialData) {
      reset({
        vehicleId: initialData.vehicleId || '',
        imeiNo: initialData.imeiNo || '',
        TboxSerialNum: initialData.TboxSerialNum || '',
        certificate: initialData.certificate || ''
      });
      if (initialData.certificate) setCertInputMode(1);
    }
  }, [initialData, reset]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        setValue('certificate', base64);
        toast({
          title: "File uploaded",
          description: `${file.name} converted successfully`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const onFormSubmit = (data) => {
    if (!data.certificate) {
      toast({
        title: "Missing Certificate",
        description: "Please upload a file or paste the Base64 content",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onSubmit(data);
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onFormSubmit)} w="full">
      <VStack spacing={4}>
        <FormControl isInvalid={errors.vehicleId}>
          <FormLabel fontWeight="600" fontSize="sm">VIN (Vehicle ID)</FormLabel>
          <Input 
            placeholder="Enter VIN"
            {...register('vehicleId', { required: 'VIN is required' })}
          />
          <FormErrorMessage>{errors.vehicleId?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={errors.imeiNo}>
          <FormLabel fontWeight="600" fontSize="sm">IMEI Number</FormLabel>
          <Input 
            placeholder="15-16 digit IMEI"
            {...register('imeiNo', { 
              required: 'IMEI is required',
              minLength: { value: 15, message: 'IMEI must be 15-16 digits' },
              maxLength: { value: 16, message: 'IMEI must be 15-16 digits' }
            })}
          />
          <FormErrorMessage>{errors.imeiNo?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={errors.TboxSerialNum}>
          <FormLabel fontWeight="600" fontSize="sm">TBOX Serial Number</FormLabel>
          <Input 
            placeholder="5-20 characters"
            {...register('TboxSerialNum', { 
              required: 'Serial Number is required',
              minLength: { value: 5, message: 'Minimum 5 characters' },
              maxLength: { value: 20, message: 'Maximum 20 characters' }
            })}
          />
          <FormErrorMessage>{errors.TboxSerialNum?.message}</FormErrorMessage>
        </FormControl>

        <FormControl w="full">
          <FormLabel fontWeight="600" fontSize="sm">Device Certificate</FormLabel>
          <Tabs 
            isFitted 
            variant="soft-rounded" 
            colorScheme="blue" 
            index={certInputMode} 
            onChange={(index) => setCertInputMode(index)}
          >
            <TabList mb="1em">
              <Tab fontSize="xs"><Icon as={FiUploadCloud} mr={2} /> Upload File</Tab>
              <Tab fontSize="xs"><Icon as={FiFileText} mr={2} /> Paste Base64</Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={0}>
                <Flex 
                  direction="column" 
                  align="center" 
                  justify="center" 
                  border="2px dashed" 
                  borderColor="gray.200" 
                  borderRadius="lg" 
                  p={6}
                  _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                  cursor="pointer"
                  onClick={() => document.getElementById('cert-file').click()}
                >
                  <Icon as={FiUploadCloud} w={8} h={8} color="gray.400" mb={2} />
                  <Text fontSize="sm" color="gray.600">Click to upload .pem or .der file</Text>
                  <Input 
                    id="cert-file"
                    type="file" 
                    display="none" 
                    accept=".pem,.der,.crt"
                    onChange={handleFileChange}
                  />
                  {watch('certificate') && (
                    <Flex mt={2} align="center" color="green.500">
                      <Icon as={FiCheckCircle} mr={1} />
                      <Text fontSize="xs" fontWeight="600">Certificate loaded</Text>
                    </Flex>
                  )}
                </Flex>
              </TabPanel>
              <TabPanel p={0}>
                <Textarea 
                  placeholder="Paste Base64 encoded certificate string here..."
                  h="120px"
                  fontSize="xs"
                  fontFamily="mono"
                  {...register('certificate')}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </FormControl>

        <Button 
          type="submit" 
          colorScheme="blue" 
          w="full" 
          isLoading={isLoading}
          loadingText="Verifying..."
          size="lg"
          mt={4}
        >
          Verify Certificate
        </Button>
      </VStack>
    </Box>
  );
};

export default VerificationForm;
