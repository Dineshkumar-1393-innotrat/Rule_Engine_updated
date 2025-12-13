import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import theme from "./theme";
import '@dytesdk/ui-kit/dist/collection/components/dyte-ui-provider/dyte-ui-provider.css';
import '@dytesdk/ui-kit/dist/collection/components/dyte-meeting/dyte-meeting.css';
import '@dytesdk/ui-kit/dist/collection/components/dyte-grid/dyte-grid.css';
import '@dytesdk/ui-kit/dist/collection/components/dyte-controlbar/dyte-controlbar.css';
import '@dytesdk/ui-kit/dist/collection/components/dyte-participant/dyte-participant.css';
import '@dytesdk/ui-kit/dist/collection/components/dyte-participants/dyte-participants.css';
import '@dytesdk/ui-kit/dist/collection/components/dyte-mic-toggle/dyte-mic-toggle.css';
import '@dytesdk/ui-kit/dist/collection/components/dyte-camera-toggle/dyte-camera-toggle.css';
import '@dytesdk/ui-kit/dist/collection/components/dyte-screen-share-toggle/dyte-screen-share-toggle.css';
import '@dytesdk/ui-kit/dist/collection/components/dyte-leave-button/dyte-leave-button.css';
import '@dytesdk/ui-kit/dist/collection/components/dyte-setup-screen/dyte-setup-screen.css';
const router = createBrowserRouter([
  {
    path: "/*",
    element: <App />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
      onScriptLoadError={(err) => console.error('Google OAuth script failed to load:', err)}
    >
      <ChakraProvider theme={theme}>
        <RouterProvider router={router} />
      </ChakraProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
