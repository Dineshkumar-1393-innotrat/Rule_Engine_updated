import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { ChakraProvider, Box } from "@chakra-ui/react";
import { AuthProvider } from "./contexts/AuthContext";
import { ProjectProvider } from "./ProjectContext";
import { WorkspaceStateProvider } from "./contexts/WorkspaceStateContext";
// import AutoSaveStatus from "./components/AutoSaveStatus";
import { autoSaveManager } from "./utils/autoSaveManager";
import RuleEngineDashboard from "./components/RuleEngine/RuleEngineDashboard";

const App = () => {
  const [currentPanel, setCurrentPanel] = useState("fileExplorer");

  const handleToggleDebug = () => {
    setCurrentPanel((prevPanel) =>
      prevPanel === "debug" ? "fileExplorer" : "debug",
    );
  };

  const handleToggleFlash = () => {
    setCurrentPanel((prevPanel) =>
      prevPanel === "flash" ? "fileExplorer" : "flash",
    );
  };

  // Initialize auto-save system and cleanup old data on app start
  useEffect(() => {
    // Clean up old auto-save data (older than 7 days)
    autoSaveManager.cleanup(7 * 24 * 60 * 60 * 1000);

    // Start global auto-save
    autoSaveManager.startGlobalAutoSave();

    console.log("[App] Auto-save system initialized");

    return () => {
      // Save all data before app unmounts
      autoSaveManager.saveAll({ parallel: false });
      console.log("[App] Auto-save cleanup completed");
    };
  }, []);

  return (
    <ChakraProvider>
      <ProjectProvider>
        <WorkspaceStateProvider>
          <AuthProvider>
            {/* <Navbar /> */}

            <Routes>
              <Route path="/" element={<RuleEngineDashboard />} />
             
            </Routes>

            {/* Auto-save status indicator */}
            {/* <AutoSaveStatus position="corner" /> */}

            {/* <Footer /> */}
          </AuthProvider>
        </WorkspaceStateProvider>
      </ProjectProvider>
    </ChakraProvider>
  );
};

export default App;
