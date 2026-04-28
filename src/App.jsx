import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ChakraProvider, Box, Text } from "@chakra-ui/react";
import { AuthProvider } from "./contexts/AuthContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { WorkspaceStateProvider } from "./contexts/WorkspaceStateContext";

import { autoSaveManager } from "./utils/autoSaveManager";
import MainLayout from "./components/Layout/MainLayout";

// Lazy loading for route-level components
const RuleEngineDashboard = React.lazy(() => import("./components/RuleEngine/RuleEngineDashboard"));
const IoTRuleEnginePage = React.lazy(() => import("./components/RuleEngine/IoTRuleEnginePage"));
const PayloadDashboardPage = React.lazy(() => import("./components/PayloadDashboard/PayloadDashboardPage"));
const HistoricalDataPage = React.lazy(() => import("./components/HistoricalData/HistoricalDataPage"));
const BulkProvisionPage = React.lazy(() => import("./components/BulkProvision/BulkProvisionPage"));
const SystemConsolePage = React.lazy(() => import("./components/SystemOverview/SystemConsolePage"));
const MQTTVirtualDeviceDashboard = React.lazy(() => import("./components/MQTTVirtualDevice/MQTTVirtualDeviceDashboard"));


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

            <MainLayout>
              <React.Suspense fallback={
                <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
                  <Text fontWeight="800" color="blue.500" letterSpacing="1px">LOADING ENGINE...</Text>
                </Box>
              }>
                <Routes>
                  <Route path="/" element={<RuleEngineDashboard />} />
                  <Route path="/iot-rule-engine" element={<IoTRuleEnginePage />} />
                  <Route path="/historical-analysis" element={<HistoricalDataPage />} />
                  <Route path="/bulk-provision" element={<BulkProvisionPage />} />
                  <Route path="/system-console/:vin?" element={<SystemConsolePage />} />
                  <Route path="/payload-dashboard/:vin" element={<PayloadDashboardPage />} />
                  <Route path="/mqtt-virtual-device" element={<MQTTVirtualDeviceDashboard />} />
                </Routes>
              </React.Suspense>
            </MainLayout>


          </AuthProvider>
        </WorkspaceStateProvider>
      </ProjectProvider>
    </ChakraProvider>
  );
};

export default App;
