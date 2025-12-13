import { useState, useEffect } from 'react';

/**
 * Custom hook for managing responsive sidebar state
 * Handles mobile sidebar visibility and breakpoint detection
 */
export const useResponsiveSidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check if viewport is mobile
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            // Automatically close sidebar on desktop, open on mobile if user triggered it
            if (!mobile) {
                setIsSidebarOpen(false);
            }
        };

        // Initial check
        checkMobile();

        // Listen for window resize
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const openSidebar = () => {
        setIsSidebarOpen(true);
    };

    return {
        isSidebarOpen,
        isMobile,
        toggleSidebar,
        closeSidebar,
        openSidebar,
    };
};
