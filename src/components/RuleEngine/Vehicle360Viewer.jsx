import React, { useState, useEffect, useRef } from 'react';
import { Box, Image, Spinner, Center, Text } from '@chakra-ui/react';

const Vehicle360Viewer = ({ baseUrl, imageCount = 60, format = 'jpg' }) => {
    const [currentFrame, setCurrentFrame] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [loading, setLoading] = useState(true);
    const imagesLoaded = useRef(0);
    const containerRef = useRef(null);

    // Preload images
    useEffect(() => {
        let mounted = true;
        const preloadImages = () => {
            const promises = [];
            for (let i = 1; i <= imageCount; i++) {
                const img = new window.Image();
                img.src = `${baseUrl}${i}.${format}`;
                img.onload = () => {
                    if (mounted) {
                        imagesLoaded.current += 1;
                        if (imagesLoaded.current === imageCount) {
                            setLoading(false);
                        }
                    }
                };
                promises.push(img);
            }
        };
        preloadImages();
        return () => { mounted = false; };
    }, [baseUrl, imageCount, format]);

    // Handle drag interaction
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.clientX);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        if (Math.abs(deltaX) > 10) { // Throttling sensitivity
            const direction = deltaX > 0 ? -1 : 1; // Drag right -> rotate left (prev frame), Drag left -> rotate right (next frame)

            let nextFrame = currentFrame + direction;
            if (nextFrame > imageCount) nextFrame = 1;
            if (nextFrame < 1) nextFrame = imageCount;

            setCurrentFrame(nextFrame);
            setStartX(e.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Auto-rotate effect on mount (optional, stops on interaction)
    useEffect(() => {
        let interval;
        if (!isDragging && loading === false) {
            interval = setInterval(() => {
                setCurrentFrame(prev => (prev >= imageCount ? 1 : prev + 1));
            }, 100); // Speed of auto-rotation
        }
        return () => clearInterval(interval);
    }, [isDragging, loading, imageCount]);


    return (
        <Box
            ref={containerRef}
            w="100%"
            h="100%"
            position="relative"
            cursor={isDragging ? 'grabbing' : 'grab'}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => handleMouseDown(e.touches[0])}
            onTouchMove={(e) => handleMouseMove(e.touches[0])}
            onTouchEnd={handleMouseUp}
            userSelect="none"
        >
            {loading && (
                <Center position="absolute" top="0" left="0" w="100%" h="100%" bg="whiteAlpha.800" zIndex="10">
                    <Spinner size="xl" color="brand.500" />
                    <Text ml={3}>Loading 360 View...</Text>
                </Center>
            )}

            <Image
                src={`${baseUrl}${currentFrame}.${format}?wm=1&q=80&v=20190220013344`}
                alt="Vehicle 360 View"
                w="100%"
                h="100%"
                objectFit="contain"
                draggable="false"
            />

            <Center position="absolute" bottom="10px" w="100%" pointerEvents="none">
                <Text fontSize="xs" color="gray.500" bg="whiteAlpha.700" px={2} borderRadius="md">
                    Drag to Rotate
                </Text>
            </Center>
        </Box>
    );
};

export default Vehicle360Viewer;
