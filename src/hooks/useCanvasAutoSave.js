/**
 * useCanvasAutoSave - Dedicated Canvas Auto-Save Hook
 *
 * This hook provides automatic saving and restoration of canvas state
 * (nodes, edges, viewport, dropped items) for all canvas-based screens.
 *
 * It saves directly to localStorage to ensure data persists across:
 * - Page refresh
 * - Tab switching
 * - Screen navigation
 * - Logout/Login
 * - Browser close
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProject } from '../ProjectContext';

// Storage key prefix
const CANVAS_STORAGE_PREFIX = 'innoide:canvas:';

// Debounce delay for auto-save (ms)
const AUTO_SAVE_DELAY = 1000;

// Screen type configurations
const SCREEN_CONFIGS = {
    '/FlowchartTest': {
        name: 'flowchart',
        dataKeys: ['nodes', 'edges', 'viewport'],
        defaultState: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
    },
    '/BlockDiagram': {
        name: 'blockdiagram',
        dataKeys: ['nodes', 'edges', 'viewport'],
        defaultState: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
    },
    '/simulation': {
        name: 'simulation',
        dataKeys: ['droppedItems', 'connections', 'canvasState'],
        defaultState: { droppedItems: [], connections: [], canvasState: {} }
    },
    '/blockprogramming': {
        name: 'blockprogramming',
        dataKeys: ['blocks', 'connections', 'workspaceState'],
        defaultState: { blocks: [], connections: [], workspaceState: {} }
    },
    '/mathcodeeditor': {
        name: 'mathcodeeditor',
        dataKeys: ['equations', 'canvasState'],
        defaultState: { equations: [], canvasState: {} }
    },
    '/rule-engine': {
        name: 'ruleengine',
        dataKeys: ['rules', 'connections', 'canvasState'],
        defaultState: { rules: [], connections: [], canvasState: {} }
    }
};

/**
 * Generate storage key for canvas state
 */
const getStorageKey = (screenPath, userId, projectId) => {
    const screenConfig = SCREEN_CONFIGS[screenPath];
    const screenName = screenConfig?.name || screenPath.replace('/', '');
    const userKey = userId || 'anonymous';
    const projKey = projectId || 'default';
    return `${CANVAS_STORAGE_PREFIX}${userKey}:${projKey}:${screenName}`;
};

/**
 * Save canvas state to localStorage
 */
const saveToLocalStorage = (key, state) => {
    try {
        const payload = {
            state,
            timestamp: Date.now(),
            version: '1.0'
        };
        localStorage.setItem(key, JSON.stringify(payload));

        // Also save to sessionStorage as backup
        sessionStorage.setItem(key, JSON.stringify(payload));

        console.log(`[CanvasAutoSave] Saved to ${key}`, {
            itemCount: state.nodes?.length || state.droppedItems?.length || 0
        });
        return true;
    } catch (error) {
        console.error('[CanvasAutoSave] Save failed:', error);
        return false;
    }
};

/**
 * Load canvas state from localStorage
 */
const loadFromLocalStorage = (key, defaultState) => {
    try {
        // Try localStorage first
        let stored = localStorage.getItem(key);

        // Fall back to sessionStorage
        if (!stored) {
            stored = sessionStorage.getItem(key);
        }

        if (stored) {
            const parsed = JSON.parse(stored);
            const state = parsed.state || parsed;

            console.log(`[CanvasAutoSave] Loaded from ${key}`, {
                timestamp: parsed.timestamp ? new Date(parsed.timestamp).toISOString() : 'unknown',
                itemCount: state.nodes?.length || state.droppedItems?.length || 0
            });

            return state;
        }
    } catch (error) {
        console.error('[CanvasAutoSave] Load failed:', error);
    }

    return defaultState;
};

/**
 * Clear canvas state from storage
 */
const clearFromStorage = (key) => {
    try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
        console.log(`[CanvasAutoSave] Cleared ${key}`);
        return true;
    } catch (error) {
        console.error('[CanvasAutoSave] Clear failed:', error);
        return false;
    }
};

/**
 * Main Canvas Auto-Save Hook
 *
 * @param {Object} options - Configuration options
 * @param {string} options.screenPath - Screen path (e.g., '/FlowchartTest')
 * @param {Function} options.getState - Function that returns current canvas state
 * @param {Function} options.setState - Function to restore canvas state
 * @param {boolean} options.enabled - Whether auto-save is enabled (default: true)
 * @param {number} options.saveDelay - Debounce delay in ms (default: 1000)
 * @param {Function} options.onSave - Callback after successful save
 * @param {Function} options.onLoad - Callback after successful load
 * @param {Function} options.onError - Callback on error
 */
export const useCanvasAutoSave = (options = {}) => {
    console.log('[CanvasAutoSave] Initializing Hook v2 (Fix Applied)');
    const location = useLocation();
    const projectContext = useProject?.() ?? {};
    const { user, activeProjectId } = projectContext;

    const {
        screenPath = location.pathname,
        getState,
        setState,
        enabled = true,
        saveDelay = AUTO_SAVE_DELAY,
        onSave,
        onLoad,
        onError
    } = options;

    // Get user and project IDs
    const userId = user?.userId || user?._id || user?.id;

    // State
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // Refs to avoid stale closures
    const getStateRef = useRef(getState);
    const setStateRef = useRef(setState);
    const saveTimerRef = useRef(null);
    const storageKeyRef = useRef('');
    const isUnmountingRef = useRef(false);

    // Update refs when callbacks change
    useEffect(() => {
        getStateRef.current = getState;
    }, [getState]);

    useEffect(() => {
        setStateRef.current = setState;
    }, [setState]);

    // Calculate storage key
    // We use a ref to track the previous key to handle switching correctly
    const prevKeyRef = useRef(getStorageKey(screenPath, userId, activeProjectId));

    /**
     * Save current state immediately
     */
    const saveNow = useCallback(() => {
        if (!enabled || !getStateRef.current) return false;

        try {
            setIsSaving(true);
            setError(null);

            const currentState = getStateRef.current();

            if (!currentState) {
                console.log('[CanvasAutoSave] No state to save');
                setIsSaving(false);
                return false;
            }

            const key = storageKeyRef.current;
            const success = saveToLocalStorage(key, currentState);

            if (success) {
                setLastSaveTime(Date.now());
                onSave?.(currentState);
            } else {
                setError('Failed to save');
                onError?.(new Error('Failed to save to localStorage'));
            }

            setIsSaving(false);
            return success;
        } catch (err) {
            console.error('[CanvasAutoSave] Save error:', err);
            setError(err.message);
            setIsSaving(false);
            onError?.(err);
            return false;
        }
    }, [enabled, onSave, onError]);

    /**
     * Schedule a debounced save
     */
    const scheduleSave = useCallback((delay = saveDelay) => {
        if (!enabled) return;

        // Clear existing timer
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        // Schedule new save
        saveTimerRef.current = setTimeout(() => {
            saveNow();
            saveTimerRef.current = null;
        }, delay);
    }, [enabled, saveDelay, saveNow]);

    /**
     * Load saved state
     */
    const loadSavedState = useCallback(() => {
        if (!enabled) return null;

        try {
            const key = storageKeyRef.current;
            const config = SCREEN_CONFIGS[screenPath];
            const defaultState = config?.defaultState || {};

            const loadedState = loadFromLocalStorage(key, defaultState);

            if (loadedState && setStateRef.current) {
                setStateRef.current(loadedState);
                onLoad?.(loadedState);
                setIsLoaded(true);
                return loadedState;
            }

            setIsLoaded(true);
            return null;
        } catch (err) {
            console.error('[CanvasAutoSave] Load error:', err);
            setError(err.message);
            onError?.(err);
            setIsLoaded(true);
            return null;
        }
    }, [enabled, screenPath, onLoad, onError]);

    /**
     * Clear saved state
     */
    const clearSavedState = useCallback(() => {
        const key = storageKeyRef.current;
        return clearFromStorage(key);
    }, []);

    /**
     * Force save (bypasses debounce)
     */
    const forceSave = useCallback(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        return saveNow();
    }, [saveNow]);

    // Load saved state on mount
    useEffect(() => {
        if (!enabled || isLoaded) return;

        // Small delay to ensure component is ready
        const loadTimer = setTimeout(() => {
            loadSavedState();
        }, 100);

        return () => clearTimeout(loadTimer);
    }, [enabled, isLoaded, loadSavedState]);

    // Setup event listeners for auto-save triggers
    useEffect(() => {
        if (!enabled) return;

        // Save before page unload (refresh, close)
        const handleBeforeUnload = () => {
            console.log('[CanvasAutoSave] beforeunload triggered');
            forceSave();
        };

        // Save when tab becomes hidden
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                console.log('[CanvasAutoSave] visibility hidden, saving...');
                forceSave();
            }
        };

        // Save when window loses focus
        const handleBlur = () => {
            console.log('[CanvasAutoSave] window blur, saving...');
            scheduleSave(500); // Quick save on blur
        };

        // Save when navigating away (popstate)
        const handlePopState = () => {
            console.log('[CanvasAutoSave] popstate, saving...');
            forceSave();
        };

        // Add event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('popstate', handlePopState);

        // Listen for custom save request events
        const handleSaveRequest = (event) => {
            const { screenKey } = event.detail || {};
            if (!screenKey || screenKey === screenPath) {
                forceSave();
            }
        };
        window.addEventListener('canvas:save-request', handleSaveRequest);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('canvas:save-request', handleSaveRequest);
        };
    }, [enabled, screenPath, forceSave, scheduleSave]);

    // Cleanup and final save on unmount
    useEffect(() => {
        isUnmountingRef.current = false;

        return () => {
            isUnmountingRef.current = true;

            console.log('[CanvasAutoSave] Unmounting, performing final save...');

            // Clear any pending saves
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }

            // Perform final save
            if (enabled && getStateRef.current) {
                try {
                    const currentState = getStateRef.current();
                    if (currentState) {
                        const key = storageKeyRef.current;
                        saveToLocalStorage(key, currentState);
                        console.log('[CanvasAutoSave] Final save completed on unmount');
                    }
                } catch (err) {
                    console.error('[CanvasAutoSave] Final save failed:', err);
                }
            }
        };
    }, [enabled]);

    // Handle storage key changes (project/user switch)
    useEffect(() => {
        const nextKey = getStorageKey(screenPath, userId, activeProjectId);

        // Initial setup or update
        storageKeyRef.current = nextKey;

        // Detect change
        if (nextKey !== prevKeyRef.current) {
            console.log(`[CanvasAutoSave] Storage key changed: ${prevKeyRef.current} -> ${nextKey}`);

            // 1. Save current state to OLD key (if loaded)
            if (isLoaded && enabled && getStateRef.current) {
                console.log('[CanvasAutoSave] Saving to old key before switch...');
                const currentState = getStateRef.current();
                if (currentState) {
                    saveToLocalStorage(prevKeyRef.current, currentState);
                }
            }

            // 2. Update ref for future
            prevKeyRef.current = nextKey;

            // 3. Load state from NEW key (if enabled)
            if (enabled) {
                console.log('[CanvasAutoSave] Loading from new key...');
                // We need to set isLoaded to true after loading, which loadSavedState does
                loadSavedState();
            }
        }
    }, [screenPath, userId, activeProjectId, isLoaded, enabled, loadSavedState]);

    return {
        // State
        isSaving,
        lastSaveTime,
        isLoaded,
        error,

        // Actions
        saveNow: forceSave,
        scheduleSave,
        loadSavedState,
        clearSavedState,

        // Utilities
        storageKey: storageKeyRef.current
    };
};

/**
 * Hook specifically for ReactFlow-based canvases (Flowchart, Block Diagram)
 */
export const useReactFlowAutoSave = (
    nodes,
    edges,
    setNodes,
    setEdges,
    reactFlowInstance,
    options = {}
) => {
    const getState = useCallback(() => {
        return {
            nodes: nodes || [],
            edges: edges || [],
            viewport: reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 },
            timestamp: Date.now()
        };
    }, [nodes, edges, reactFlowInstance]);

    const setState = useCallback((state) => {
        if (!state) return;

        if (state.nodes && Array.isArray(state.nodes)) {
            setNodes(state.nodes);
        }

        if (state.edges && Array.isArray(state.edges)) {
            setEdges(state.edges);
        }

        if (state.viewport && reactFlowInstance) {
            setTimeout(() => {
                reactFlowInstance.setViewport(state.viewport);
            }, 100);
        }
    }, [setNodes, setEdges, reactFlowInstance]);

    const autoSave = useCanvasAutoSave({
        ...options,
        getState,
        setState
    });

    // Auto-save when nodes or edges change
    useEffect(() => {
        if (nodes.length > 0 || edges.length > 0) {
            autoSave.scheduleSave();
        }
    }, [nodes, edges, autoSave.scheduleSave]);

    return autoSave;
};

/**
 * Hook specifically for Simulation canvas (dropped items)
 */
export const useSimulationCanvasAutoSave = (
    droppedItems,
    connections,
    setDroppedItems,
    setConnections,
    options = {}
) => {
    const getState = useCallback(() => {
        return {
            droppedItems: droppedItems || [],
            connections: Array.isArray(connections) ? connections : Array.from(connections || []),
            timestamp: Date.now()
        };
    }, [droppedItems, connections]);

    const setState = useCallback((state) => {
        if (!state) return;

        if (state.droppedItems && Array.isArray(state.droppedItems)) {
            setDroppedItems(state.droppedItems);
        }

        if (state.connections) {
            const connectionsArray = Array.isArray(state.connections)
                ? state.connections
                : Array.from(state.connections || []);
            setConnections(connectionsArray);
        }
    }, [setDroppedItems, setConnections]);

    const autoSave = useCanvasAutoSave({
        screenPath: '/simulation',
        ...options,
        getState,
        setState
    });

    // Auto-save when items or connections change
    useEffect(() => {
        if (droppedItems.length > 0 || (connections && (connections.length > 0 || connections.size > 0))) {
            autoSave.scheduleSave();
        }
    }, [droppedItems, connections, autoSave.scheduleSave]);

    return autoSave;
};

/**
 * Utility function to trigger save on all canvas screens
 */
export const triggerGlobalCanvasSave = () => {
    window.dispatchEvent(new CustomEvent('canvas:save-request', { detail: {} }));
};

/**
 * Utility function to trigger save on a specific screen
 */
export const triggerCanvasSave = (screenPath) => {
    window.dispatchEvent(new CustomEvent('canvas:save-request', {
        detail: { screenKey: screenPath }
    }));
};

export default useCanvasAutoSave;
