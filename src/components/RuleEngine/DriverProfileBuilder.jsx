import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Input,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Button,
    Heading,
    useColorModeValue,
    Select,
    Divider,
    Text,
} from '@chakra-ui/react';
import { FaSave, FaPlay } from 'react-icons/fa';

const DriverProfileBuilder = ({ savedProfiles = [], onSaveProfile, onActivateProfile }) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    const [profileName, setProfileName] = useState('');
    const [aggressiveness, setAggressiveness] = useState(50);
    const [baseSpeed, setBaseSpeed] = useState(60);

    const handleLoadProfile = (profileId) => {
        const profile = savedProfiles.find(p => p.id === profileId);
        if (profile) {
            setProfileName(profile.name);
            setAggressiveness(profile.aggressiveness);
            setBaseSpeed(profile.baseSpeed);
        }
    };

    const createProfileObject = () => {
        if (!profileName) return null;
        return {
            id: `profile-${Date.now()}`,
            name: profileName,
            aggressiveness,
            baseSpeed,
        };
    };

    const handleSave = () => {
        const profile = createProfileObject();
        if (profile && onSaveProfile) {
            onSaveProfile(profile);
        }
    };

    const handleActivate = () => {
        const profile = createProfileObject();
        if (profile && onActivateProfile) {
            onActivateProfile(profile);
        }
    };

    return (
        <VStack spacing={6} align="stretch">
            <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <Heading size="md" mb={4}>Driver Profile</Heading>

                {/* Load Profile */}
                <FormControl mb={4}>
                    <FormLabel>Load Profile</FormLabel>
                    <Select placeholder="Select a saved profile..." onChange={(e) => handleLoadProfile(e.target.value)} color="black">
                        {savedProfiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </Select>
                </FormControl>
                <Divider mb={4} />

                <VStack spacing={6}>
                    <FormControl isRequired>
                        <FormLabel>Profile Name</FormLabel>
                        <Input
                            placeholder="e.g., Aggressive Racer"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            color="black"
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Aggressiveness ({aggressiveness}%)</FormLabel>
                        <Slider
                            aria-label="aggressiveness-slider"
                            value={aggressiveness}
                            onChange={(val) => setAggressiveness(val)}
                            min={0}
                            max={100}
                        >
                            <SliderTrack>
                                <SliderFilledTrack bg="red.500" />
                            </SliderTrack>
                            <SliderThumb />
                        </Slider>
                        <Text fontSize="xs" color="gray.500">Higher aggressiveness leads to erratic speed and higher RPM.</Text>
                    </FormControl>

                    <FormControl>
                        <FormLabel>Base Speed ({baseSpeed} km/h)</FormLabel>
                        <Slider
                            aria-label="speed-slider"
                            value={baseSpeed}
                            onChange={(val) => setBaseSpeed(val)}
                            min={0}
                            max={200}
                        >
                            <SliderTrack>
                                <SliderFilledTrack bg="blue.500" />
                            </SliderTrack>
                            <SliderThumb />
                        </Slider>
                        <Text fontSize="xs" color="gray.500">Target cruising speed.</Text>
                    </FormControl>

                    <HStack width="100%" spacing={4}>
                        <Button leftIcon={<FaSave />} variant="outline" flex={1} onClick={handleSave}>
                            Save Profile
                        </Button>
                        <Button leftIcon={<FaPlay />} colorScheme="green" flex={1} onClick={handleActivate}>
                            Activate Profile
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        </VStack>
    );
};

export default DriverProfileBuilder;
