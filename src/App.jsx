import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
const CertificateVerificationPage = React.lazy(() => import("./pages/CertificateVerificationPage"));


// Auth components
const AuthPage = React.lazy(() => import("./components/Auth/AuthPage"));

// Manufacturing Portal components
const ManufacturingLoginPage = React.lazy(() => import("./components/ManufacturingPortal/ManufacturingLoginPage"));
const ManufacturingPortalLayout = React.lazy(() => import("./components/ManufacturingPortal/ManufacturingPortalLayout"));
const ManufacturingDashboardPage = React.lazy(() => import("./components/ManufacturingPortal/DashboardPage"));
const UploadImeiPage = React.lazy(() => import("./components/ManufacturingPortal/UploadImeiPage"));
const UploadSupplierFeedPage = React.lazy(() => import("./components/ManufacturingPortal/UploadSupplierFeedPage"));
const DeviceListPage = React.lazy(() => import("./components/ManufacturingPortal/DeviceListPage"));
const DeviceSearchPage = React.lazy(() => import("./components/ManufacturingPortal/DeviceSearchPage"));
const DeviceDetailPage = React.lazy(() => import("./components/ManufacturingPortal/DeviceDetailPage"));
const UploadHistoryPage = React.lazy(() => import("./components/ManufacturingPortal/UploadHistoryPage"));

const App = () => {
  // Initialize auto-save system and cleanup old data on app start
  useEffect(() => {
    autoSaveManager.cleanup(7 * 24 * 60 * 60 * 1000);
    autoSaveManager.startGlobalAutoSave();
    return () => {
      autoSaveManager.saveAll({ parallel: false });
    };
  }, []);

  return (
    <ChakraProvider>
      <ProjectProvider>
        <WorkspaceStateProvider>
          <AuthProvider>
            <React.Suspense fallback={
              <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
                <Text fontWeight="800" color="blue.500" letterSpacing="1px">LOADING ENGINE...</Text>
              </Box>
            }>
              <Routes>
                {/* Auth Routes - No MainLayout */}
                <Route path="/login" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />

                {/* Manufacturing Portal */}
                <Route path="/manufacturing/login" element={<ManufacturingLoginPage />} />
                <Route path="/manufacturing" element={<ManufacturingPortalLayout />}>
                  <Route index element={<Navigate to="/manufacturing/dashboard" replace />} />
                  <Route path="dashboard" element={<ManufacturingDashboardPage />} />
                  <Route path="upload/imei" element={<UploadImeiPage />} />
                  <Route path="upload/supplier-feed" element={<UploadSupplierFeedPage />} />
                  <Route path="devices" element={<DeviceListPage />} />
                  <Route path="devices/search" element={<DeviceSearchPage />} />
                  <Route path="devices/:vin" element={<DeviceDetailPage />} />
                  <Route path="history" element={<UploadHistoryPage />} />
                </Route>

                {/* App Routes - With MainLayout */}
                <Route path="/*" element={
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/login" replace />} />
                      <Route path="/iot-rule-engine/:domainId?" element={<IoTRuleEnginePage />} />
                      <Route path="/historical-analysis" element={<HistoricalDataPage />} />
                      <Route path="/bulk-provision" element={<BulkProvisionPage />} />
                      <Route path="/system-console/:vin?" element={<SystemConsolePage />} />
                      <Route path="/payload-dashboard/:vin?" element={<PayloadDashboardPage />} />
                      <Route path="/mqtt-virtual-device" element={<MQTTVirtualDeviceDashboard />} />
                      <Route path="/certificate-verification" element={<CertificateVerificationPage />} />
                      <Route path="*" element={<Navigate to="/payload-dashboard" replace />} />
                    </Routes>
                  </MainLayout>
                } />
              </Routes>
            </React.Suspense>
          </AuthProvider>
        </WorkspaceStateProvider>
      </ProjectProvider>
    </ChakraProvider>
  );
};

export default App;
