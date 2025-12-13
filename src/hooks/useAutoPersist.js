import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useWorkspaceState } from '../contexts/WorkspaceStateContext';

/**
 * useAutoPersist - A hook for screen components to easily integrate with global state persistence
 * 
 * @param {Object} options
 * @param {string} options.screenKey - Unique identifier for the screen (e.g., '/rule-engine')
 * @param {Object} options.initialState - Default state if nothing is stored
 * @param {number} options.autoSaveDelay - Debounce delay in ms (default: handled by context)
 * @param {boolean} options.enabled - Whether persistence is enabled (default: true)
 * 
 * @returns {Object} State and actions for the screen
 */
export const useAutoPersist = ({
    screenKey,
    initialState = {},
    enabled = true,
}) => {
    const {
        getScreenState,
        updateScreenState,
        registerScreen,
        saveNow,
        isLoading,
        lastSaved,
        isDirty,
        setActiveScreen,
    } = useWorkspaceState();

    const isRegisteredRef = useRef(false);

    // Register screen with initial state on mount
    useEffect(() => {
        if (enabled && !isRegisteredRef.current) {
            registerScreen(screenKey, initialState);
            setActiveScreen(screenKey);
            isRegisteredRef.current = true;
        }

        // Cleanup on unmount - save current state
        return () => {
            if (enabled) {
                saveNow();
            }
        };
    }, [screenKey, enabled, registerScreen, initialState, setActiveScreen, saveNow]);

    // Get current screen state
    const state = useMemo(() => {
        if (!enabled) return initialState;
        const stored = getScreenState(screenKey);
        // Merge initial state with stored state (stored takes precedence)
        return { ...initialState, ...stored };
    }, [enabled, getScreenState, screenKey, initialState]);

    // Update state with automatic persistence
    const updateState = useCallback((updater, options = {}) => {
        if (!enabled) return;

        updateScreenState(screenKey, (currentState) => {
            const current = currentState || initialState;
            const updates = typeof updater === 'function' ? updater(current) : updater;
            return { ...current, ...updates };
        }, options);
    }, [enabled, screenKey, updateScreenState, initialState]);

    // Replace entire state
    const setState = useCallback((newState, options = {}) => {
        if (!enabled) return;
        updateScreenState(screenKey, newState, options);
    }, [enabled, screenKey, updateScreenState]);

    // Force save immediately
    const forceSave = useCallback(() => {
        if (!enabled) return Promise.resolve(false);
        return saveNow();
    }, [enabled, saveNow]);

    // Reset to initial state
    const resetState = useCallback(() => {
        if (!enabled) return;
        updateScreenState(screenKey, initialState);
    }, [enabled, screenKey, updateScreenState, initialState]);

    return {
        // State
        state,
        isLoading,
        isDirty,
        lastSaved,

        // Actions
        updateState,    // Partial update (merge)
        setState,       // Full state replacement
        forceSave,      // Immediate save
        resetState,     // Reset to initial
    };
};

/**
 * useScreenPersistence - Simplified hook for components that just need basic persistence
 * Returns [state, setState] similar to useState but persisted
 */
export const useScreenPersistence = (screenKey, initialState = {}) => {
    const { state, setState, isLoading } = useAutoPersist({ screenKey, initialState });

    if (isLoading) {
        return [initialState, () => { }, true];
    }

    return [state, setState, isLoading];
};

export default useAutoPersist;
