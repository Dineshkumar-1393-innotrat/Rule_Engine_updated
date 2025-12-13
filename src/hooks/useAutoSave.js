/**
 * Enhanced useAutoSave Hook
 * Provides component-level auto-save functionality with integration to the global auto-save manager
 */
import { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { autoSaveManager } from '../utils/autoSaveManager';
import { useProject } from '../ProjectContext';
import { useWorkspaceState } from '../contexts/WorkspaceStateContext';

/**
 * Hook for component-level auto-save functionality
 * @param {Object} options - Configuration options
 * @returns {Object} - Auto-save utilities and state
 */
export const useAutoSave = (options = {}) => {
  const location = useLocation();
  const { user, activeProjectId } = useProject?.() ?? {};
  const workspaceState = useWorkspaceState?.();

  const {
    screenKey = location.pathname,
    data = null,
    saveFunction = null,
    loadFunction = null,
    autoSaveDelay = 2000,
    priority = 1,
    enabled = true,
    skipEmpty = true,
    compression = false,
    onSave = null,
    onLoad = null,
    onError = null
  } = options;

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs
  const saveTimeoutRef = useRef(null);
  const currentDataRef = useRef(data);
  const registeredRef = useRef(false);

  // Update current data ref when data changes
  useEffect(() => {
    currentDataRef.current = data;
  }, [data]);

  /**
   * Default save function - saves to workspace state or localStorage
   */
  const defaultSaveFunction = useCallback(async () => {
    try {
      const dataToSave = currentDataRef.current;

      if (!dataToSave) return null;

      // If workspace state is available, use it
      if (workspaceState && workspaceState.updateScreenState) {
        workspaceState.updateScreenState(screenKey, dataToSave);
        return dataToSave;
      }

      // Otherwise return data for auto-save manager to handle
      return dataToSave;
    } catch (error) {
      throw new Error(`Default save failed: ${error.message}`);
    }
  }, [screenKey, workspaceState]);

  /**
   * Default load function - loads from workspace state or localStorage
   */
  const defaultLoadFunction = useCallback(async () => {
    try {
      // If workspace state is available, use it
      if (workspaceState && workspaceState.getScreenState) {
        return workspaceState.getScreenState(screenKey);
      }

      // Otherwise use auto-save manager
      return autoSaveManager.loadData(screenKey);
    } catch (error) {
      throw new Error(`Default load failed: ${error.message}`);
    }
  }, [screenKey, workspaceState]);

  /**
   * Enhanced save function with error handling and callbacks
   */
  const enhancedSaveFunction = useCallback(async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const saveFn = saveFunction || defaultSaveFunction;
      const result = await saveFn();

      setLastSaveTime(Date.now());

      if (onSave) {
        onSave(result);
      }

      return result;
    } catch (error) {
      setSaveError(error.message);
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [saveFunction, defaultSaveFunction, onSave, onError]);

  /**
   * Register with auto-save manager
   */
  useEffect(() => {
    if (!enabled) return;

    const registerOptions = {
      priority,
      skipEmpty,
      compression,
      async: true
    };

    autoSaveManager.registerSaveStrategy(screenKey, enhancedSaveFunction, registerOptions);
    registeredRef.current = true;

    return () => {
      if (registeredRef.current) {
        autoSaveManager.unregisterSaveStrategy(screenKey);
        registeredRef.current = false;
      }
    };
  }, [screenKey, enhancedSaveFunction, enabled, priority, skipEmpty, compression]);

  /**
   * Load data on mount
   */
  useEffect(() => {
    if (!enabled || isLoaded) return;

    const loadData = async () => {
      try {
        const loadFn = loadFunction || defaultLoadFunction;
        const loadedData = await loadFn();

        if (loadedData && onLoad) {
          onLoad(loadedData);
        }

        setIsLoaded(true);
      } catch (error) {
        setSaveError(error.message);
        if (onError) {
          onError(error);
        }
        setIsLoaded(true); // Mark as loaded even if failed
      }
    };

    loadData();
  }, [enabled, isLoaded, loadFunction, defaultLoadFunction, onLoad, onError]);

  /**
   * Schedule debounced save
   */
  const scheduleSave = useCallback((delay = autoSaveDelay) => {
    if (!enabled) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSaveManager.scheduleSave(screenKey);
      saveTimeoutRef.current = null;
    }, delay);
  }, [enabled, screenKey, autoSaveDelay]);

  /**
   * Trigger immediate save
   */
  const saveNow = useCallback(async () => {
    if (!enabled) return false;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    return await autoSaveManager.saveScreen(screenKey);
  }, [enabled, screenKey]);

  /**
   * Clear saved data
   */
  const clearSavedData = useCallback(() => {
    return autoSaveManager.clearData(screenKey);
  }, [screenKey]);

  /**
   * Get save statistics
   */
  const getStats = useCallback(() => {
    const globalStats = autoSaveManager.getStats();
    return globalStats.screens[screenKey] || {
      saveCount: 0,
      errorCount: 0,
      lastSaveTime: null,
      priority
    };
  }, [screenKey, priority]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isSaving,
    lastSaveTime,
    saveError,
    isLoaded,

    // Actions
    scheduleSave,
    saveNow,
    clearSavedData,

    // Utilities
    getStats,

    // Configuration
    screenKey,
    enabled
  };
};

/**
 * Hook specifically for code editor auto-save
 */
export const useCodeEditorAutoSave = (editorContent, options = {}) => {
  const [content, setContent] = useState(editorContent);

  useEffect(() => {
    setContent(editorContent);
  }, [editorContent]);

  return useAutoSave({
    data: { content, tabs: options.tabs, activeTab: options.activeTab },
    screenKey: options.screenKey || '/editor',
    priority: 2, // High priority for code
    ...options
  });
};

/**
 * Hook specifically for canvas/diagram auto-save
 */
export const useCanvasAutoSave = (nodes, edges, viewport, options = {}) => {
  const canvasData = {
    nodes: nodes || [],
    edges: edges || [],
    viewport: viewport || { x: 0, y: 0, zoom: 1 },
    timestamp: Date.now()
  };

  return useAutoSave({
    data: canvasData,
    screenKey: options.screenKey || location.pathname,
    priority: 3, // High priority for canvas data
    skipEmpty: false, // Always save canvas state
    ...options
  });
};

/**
 * Hook for simulation component auto-save
 */
export const useSimulationAutoSave = (droppedItems, connections, options = {}) => {
  const simulationData = {
    droppedItems: droppedItems || [],
    connections: Array.isArray(connections) ? connections : Array.from(connections || []),
    timestamp: Date.now()
  };

  return useAutoSave({
    data: simulationData,
    screenKey: options.screenKey || '/simulation',
    priority: 3, // High priority for simulation state
    ...options
  });
};

/**
 * Hook for form/input auto-save
 */
export const useFormAutoSave = (formData, options = {}) => {
  return useAutoSave({
    data: formData,
    screenKey: options.screenKey || '/form',
    priority: 1, // Normal priority for forms
    autoSaveDelay: 1000, // Faster save for forms
    ...options
  });
};

/**
 * Hook to trigger global save operations
 */
export const useGlobalAutoSave = () => {
  const saveAll = useCallback(async (options = {}) => {
    return await autoSaveManager.saveAll(options);
  }, []);

  const getGlobalStats = useCallback(() => {
    return autoSaveManager.getStats();
  }, []);

  const cleanup = useCallback((maxAge) => {
    return autoSaveManager.cleanup(maxAge);
  }, []);

  return {
    saveAll,
    getGlobalStats,
    cleanup
  };
};

// Default export
export default useAutoSave;
