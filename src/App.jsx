import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ChakraProvider, Box } from "@chakra-ui/react";
import { AuthProvider } from "./contexts/AuthContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { WorkspaceStateProvider } from "./contexts/WorkspaceStateContext";

import { autoSaveManager } from "./utils/autoSaveManager";
import RuleEngineDashboard from "./components/RuleEngine/RuleEngineDashboard";
import IoTRuleEnginePage from "./components/RuleEngine/IoTRuleEnginePage";

const App = () => {


  // Initialize auto-save system and cleanup old data on app start
  useEffect(() => {
    // Clean up old auto-save data (older than 7 days)
    autoSaveManager.cleanup(7 * 24 * 60 * 60 * 1000);

    // Start global auto-save
    autoSaveManager.startGlobalAutoSave();

    // console.log("[App] Auto-save system initialized");

    return () => {
      // Save all data before app unmounts
      autoSaveManager.saveAll({ parallel: false });
      // console.log("[App] Auto-save cleanup completed");
    };
  }, []);

  return (
    <ChakraProvider>
      <ProjectProvider>
        <WorkspaceStateProvider>
          <AuthProvider>

            <Routes>
              <Route path="/" element={<RuleEngineDashboard />} />
              <Route path="/iot-rule-engine" element={<IoTRuleEnginePage />} />
            </Routes>


          </AuthProvider>
        </WorkspaceStateProvider>
      </ProjectProvider>
    </ChakraProvider>
  );
};

export default App;
