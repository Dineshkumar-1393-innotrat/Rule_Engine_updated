import React from "react";
import { Box } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { mqttTheme } from "./theme";

export const DynamicWorkspace = ({ activeTab, children }) => {
  return (
    <Box 
      w="full" 
      flex={1} 
      bg={mqttTheme.bg} 
      p={6} 
      overflowY="auto"
      position="relative"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ width: "100%", height: "100%", maxWidth: "1200px", margin: "0 auto" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};
