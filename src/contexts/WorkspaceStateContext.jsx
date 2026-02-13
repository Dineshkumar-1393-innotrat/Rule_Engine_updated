import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useProject } from "./ProjectContext";
import { autoSaveManager } from "../utils/autoSaveManager";

const WorkspaceStateContext = createContext(null);

// Storage key constants
const STORAGE_KEY_PREFIX = "innoide:workspace:";
const AUTO_SAVE_DELAY = 1500; // 1.5 seconds debounce for faster saves
const EMERGENCY_SAVE_KEY = "innoide:workspace:emergency-save";

/**
 * Get the storage key for a specific user and project
 */
const getStorageKey = (userId, projectId) => {
  if (!userId) return `${STORAGE_KEY_PREFIX}anonymous`;
  if (!projectId) return `${STORAGE_KEY_PREFIX}${userId}:no-project`;
  return `${STORAGE_KEY_PREFIX}${userId}:${projectId}`;
};

/**
 * Load workspace state from localStorage
 */
const loadFromStorage = (userId, projectId) => {
  try {
    const key = getStorageKey(userId, projectId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // console.log("[WorkspaceState] Loaded from storage:", key);
      return parsed;
    }
  } catch (error) {
    console.error("[WorkspaceState] Error loading from storage:", error);
  }
  return null;
};

/**
 * Save workspace state to localStorage
 */
const saveToStorage = (userId, projectId, state) => {
  try {
    const key = getStorageKey(userId, projectId);
    const payload = {
      ...state,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
    // console.log("[WorkspaceState] Saved to storage:", key);
    return true;
  } catch (error) {
    console.error("[WorkspaceState] Error saving to storage:", error);
    return false;
  }
};

/**
 * Default empty state for each screen type
 */
const DEFAULT_SCREEN_STATES = {
  "/editor": {
    openTabs: [],
    activeTabId: null,
    tabContents: {},
    lastModified: null,
  },
  "/BlockDiagram": {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    lastModified: null,
  },
  "/FlowchartTest": {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    lastModified: null,
  },
  "/simulation": { droppedItems: [], connections: [], lastModified: null },
  "/blockprogramming": {
    workspaceXml: "",
    generatedCode: "",
    lastModified: null,
  },
  "/mathcodeeditor": { equations: [], calculatorState: {}, lastModified: null },
  "/rule-engine": {
    rules: [],
    driverProfiles: [],
    activeProfile: null,
    events: [],
    lastModified: null,
  },
};

// Screen keys for auto-save manager registration
const SCREEN_KEYS = Object.keys(DEFAULT_SCREEN_STATES);

/**
 * WorkspaceStateProvider - Manages global workspace state across all screens
 */
export const WorkspaceStateProvider = ({ children }) => {
  const { user, activeProjectId, activeProjectName } = useProject?.() ?? {};
  const userId = user?.userId || user?._id || user?.id;

  // Core state
  const [screenStates, setScreenStates] = useState({});
  const [activeScreen, setActiveScreen] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);

  // Refs for debouncing and preventing stale closures
  const saveTimeoutRef = useRef(null);
  const screenStatesRef = useRef(screenStates);
  const isHydratedRef = useRef(false);
  const autoSaveRegisteredRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    screenStatesRef.current = screenStates;
  }, [screenStates]);

  // Register with global auto-save manager
  useEffect(() => {
    if (!autoSaveRegisteredRef.current) {
      // Register workspace state save strategy
      autoSaveManager.registerSaveStrategy(
        "workspace:global",
        () => ({
          screenStates: screenStatesRef.current,
          activeScreen,
          userId,
          projectId: activeProjectId,
          timestamp: Date.now(),
        }),
        { priority: 3, skipEmpty: false },
      );

      // Register individual screen save strategies
      SCREEN_KEYS.forEach((screenKey) => {
        autoSaveManager.registerSaveStrategy(
          `workspace:${screenKey}`,
          () =>
            screenStatesRef.current[screenKey] ||
            DEFAULT_SCREEN_STATES[screenKey],
          { priority: 2, skipEmpty: true },
        );
      });

      autoSaveRegisteredRef.current = true;
      // console.log("[WorkspaceState] Registered with auto-save manager");
    }

    return () => {
      // Unregister on cleanup
      if (autoSaveRegisteredRef.current) {
        autoSaveManager.unregisterSaveStrategy("workspace:global");
        SCREEN_KEYS.forEach((screenKey) => {
          autoSaveManager.unregisterSaveStrategy(`workspace:${screenKey}`);
        });
        autoSaveRegisteredRef.current = false;
      }
    };
  }, [activeScreen, userId, activeProjectId]);

  /**
   * Hydrate state from localStorage on mount or when user/project changes
   */
  useEffect(() => {
    const hydrate = () => {
      setIsLoading(true);
      const stored = loadFromStorage(userId, activeProjectId);

      if (stored && stored.screenStates) {
        setScreenStates(stored.screenStates);
        setActiveScreen(stored.activeScreen || null);
        setLastSaved(stored.lastSaved || null);
        isHydratedRef.current = true;
        // console.log(
        //   "[WorkspaceState] Hydrated state for user:",
        //   userId,
        //   "project:",
        //   activeProjectId,
        // );
      } else {
        // Initialize with empty states
        setScreenStates({});
        isHydratedRef.current = true;
        // console.log("[WorkspaceState] No stored state found, starting fresh");
      }

      setIsLoading(false);
      setIsDirty(false);
    };

    hydrate();

    // Cleanup any pending saves when dependencies change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Force save before switching context
        saveToStorage(userId, activeProjectId, {
          screenStates: screenStatesRef.current,
          activeScreen,
        });
      }
    };
  }, [userId, activeProjectId]);

  /**
   * Save state immediately
   */
  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const stateToSave = {
      screenStates: screenStatesRef.current,
      activeScreen,
      timestamp: Date.now(),
    };

    const success = saveToStorage(userId, activeProjectId, stateToSave);

    if (success) {
      setIsDirty(false);
      setLastSaved(new Date().toISOString());

      // Also trigger auto-save manager
      autoSaveManager.saveScreen("workspace:global");
    }

    return success;
  }, [userId, activeProjectId, activeScreen]);

  /**
   * Emergency save - saves immediately without debouncing
   * Used for critical moments like beforeunload
   */
  const emergencySave = useCallback(() => {
    try {
      const emergencyData = {
        screenStates: screenStatesRef.current,
        activeScreen,
        userId,
        projectId: activeProjectId,
        timestamp: Date.now(),
        isEmergency: true,
      };

      // Save to both localStorage and sessionStorage for redundancy
      localStorage.setItem(EMERGENCY_SAVE_KEY, JSON.stringify(emergencyData));
      sessionStorage.setItem(EMERGENCY_SAVE_KEY, JSON.stringify(emergencyData));

      // Also save to normal storage
      saveToStorage(userId, activeProjectId, {
        screenStates: screenStatesRef.current,
        activeScreen,
      });

      // console.log("[WorkspaceState] Emergency save completed");
      return true;
    } catch (error) {
      console.error("[WorkspaceState] Emergency save failed:", error);
      return false;
    }
  }, [userId, activeProjectId, activeScreen]);

  /**
   * Schedule a debounced save
   */
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNow();
      saveTimeoutRef.current = null;
    }, AUTO_SAVE_DELAY);
  }, [saveNow]);

  /**
   * Get state for a specific screen
   */
  const getScreenState = useCallback(
    (screenKey) => {
      return screenStates[screenKey] || DEFAULT_SCREEN_STATES[screenKey] || {};
    },
    [screenStates],
  );

  /**
   * Update state for a specific screen
   */
  const updateScreenState = useCallback(
    (screenKey, updater, options = {}) => {
      setScreenStates((prev) => {
        const currentState =
          prev[screenKey] || DEFAULT_SCREEN_STATES[screenKey] || {};
        const nextState =
          typeof updater === "function" ? updater(currentState) : updater;

        return {
          ...prev,
          [screenKey]: {
            ...nextState,
            lastModified: Date.now(),
          },
        };
      });

      setIsDirty(true);

      // Schedule autosave unless disabled
      if (options.skipSave !== true) {
        scheduleSave();

        // Also notify auto-save manager about the change
        autoSaveManager.scheduleSave(`workspace:${screenKey}`, AUTO_SAVE_DELAY);
      }
    },
    [scheduleSave],
  );

  /**
   * Register a screen with initial state if not already present
   */
  const registerScreen = useCallback((screenKey, initialState) => {
    setScreenStates((prev) => {
      // Only set initial state if screen hasn't been registered and no stored state exists
      if (prev[screenKey] === undefined) {
        const defaultState = DEFAULT_SCREEN_STATES[screenKey] || {};
        return {
          ...prev,
          [screenKey]: { ...defaultState, ...initialState },
        };
      }
      return prev;
    });
  }, []);

  /**
   * Clear state for a specific screen
   */
  const clearScreenState = useCallback(
    (screenKey) => {
      setScreenStates((prev) => {
        const next = { ...prev };
        delete next[screenKey];
        return next;
      });
      setIsDirty(true);
      scheduleSave();
    },
    [scheduleSave],
  );

  /**
   * Clear all workspace state (for logout)
   */
  const clearAllState = useCallback(() => {
    setScreenStates({});
    setActiveScreen(null);
    setIsDirty(false);
    setLastSaved(null);

    // Clear from localStorage too
    const key = getStorageKey(userId, activeProjectId);
    try {
      localStorage.removeItem(key);
      // console.log("[WorkspaceState] Cleared all state");
    } catch (error) {
      console.error("[WorkspaceState] Error clearing storage:", error);
    }
  }, [userId, activeProjectId]);

  // Save on window unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // Always perform emergency save on unload
      emergencySave();

      // Also trigger global auto-save
      autoSaveManager.saveAll({ parallel: false });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [emergencySave]);

  // Save when visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Save immediately when tab becomes hidden
        saveNow();
        autoSaveManager.saveAll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [saveNow]);

  // Save when window loses focus
  useEffect(() => {
    const handleBlur = () => {
      if (isDirty) {
        saveNow();
      }
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [isDirty, saveNow]);

  // Restore from emergency save if available
  useEffect(() => {
    try {
      const emergencyData =
        localStorage.getItem(EMERGENCY_SAVE_KEY) ||
        sessionStorage.getItem(EMERGENCY_SAVE_KEY);

      if (emergencyData) {
        const parsed = JSON.parse(emergencyData);
        const savedAge = Date.now() - (parsed.timestamp || 0);

        // Only restore if saved within last 5 minutes and matches current user/project
        if (savedAge < 5 * 60 * 1000) {
          if (
            parsed.userId === userId &&
            parsed.projectId === activeProjectId
          ) {
            // console.log(
            //   "[WorkspaceState] Found recent emergency save, will restore",
            // );
            // Emergency save will be handled by normal hydration
          }
        }

        // Clear emergency save after checking
        localStorage.removeItem(EMERGENCY_SAVE_KEY);
        sessionStorage.removeItem(EMERGENCY_SAVE_KEY);
      }
    } catch (error) {
      console.error("[WorkspaceState] Error checking emergency save:", error);
    }
  }, [userId, activeProjectId]);

  const value = {
    // State
    screenStates,
    activeScreen,
    isDirty,
    isLoading,
    lastSaved,

    // Actions
    getScreenState,
    updateScreenState,
    registerScreen,
    clearScreenState,
    clearAllState,
    setActiveScreen,
    saveNow,
    emergencySave,

    // Metadata
    userId,
    projectId: activeProjectId,
    projectName: activeProjectName,
  };

  return (
    <WorkspaceStateContext.Provider value={value}>
      {children}
    </WorkspaceStateContext.Provider>
  );
};

/**
 * Hook to access workspace state context
 */
export const useWorkspaceState = () => {
  const context = useContext(WorkspaceStateContext);
  if (!context) {
    throw new Error(
      "useWorkspaceState must be used within a WorkspaceStateProvider",
    );
  }
  return context;
};

export default WorkspaceStateContext;
