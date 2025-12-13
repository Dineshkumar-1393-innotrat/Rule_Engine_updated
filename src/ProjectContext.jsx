import { createContext, useContext, useState, useEffect } from "react";
import { getUserInfo } from "./utilities";

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  // Load user info from localStorage
  const [user, setUser] = useState(getUserInfo);

  // Load project details from localStorage
  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem("activeProjectId") || null;
  });
  const [activeProjectName, setActiveProjectName] = useState(() => {
    return localStorage.getItem("activeProjectName") || null;
  });

  // Load product details from localStorage
  const [activeProductId, setActiveProductId] = useState(() => {
    return localStorage.getItem("activeProductId") || null;
  });
  const [activeProductName, setActiveProductName] = useState(() => {
    return localStorage.getItem("activeProductName") || null;
  });

  // Update localStorage when activeProjectId changes
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem("activeProjectId", activeProjectId);
    } else {
      localStorage.removeItem("activeProjectId");
    }
  }, [activeProjectId]);

  // Update localStorage when activeProjectName changes
  useEffect(() => {
    if (activeProjectName) {
      localStorage.setItem("activeProjectName", activeProjectName);
    } else {
      localStorage.removeItem("activeProjectName");
    }
  }, [activeProjectName]);

  // Update localStorage when activeProductId changes
  useEffect(() => {
    if (activeProductId) {
      localStorage.setItem("activeProductId", activeProductId);
    } else {
      localStorage.removeItem("activeProductId");
    }
  }, [activeProductId]);

  // Update localStorage when activeProductName changes
  useEffect(() => {
    if (activeProductName) {
      localStorage.setItem("activeProductName", activeProductName);
    } else {
      localStorage.removeItem("activeProductName");
    }
  }, [activeProductName]);

  useEffect(() => {
    console.log("Updated Project:", activeProjectId, activeProjectName);
  }, [activeProjectId, activeProjectName]);

  return (
    <ProjectContext.Provider
      value={{
        user,
        setUser,
        activeProjectId,
        setActiveProjectId,
        activeProjectName,
        setActiveProjectName,
        activeProductId,
        setActiveProductId,
        activeProductName,
        setActiveProductName,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}

