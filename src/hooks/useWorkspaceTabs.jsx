import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useProject } from '../ProjectContext';
import {
  loadWorkspaceSnapshots,
  saveWorkspaceSnapshot,
  buildWorkspaceFileName,
} from '../utils/workspaceStorage';

const WorkspaceTabsContext = createContext(null);

const createTabId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ensureFactory = (factory) => {
  if (typeof factory === 'function') {
    return factory;
  }
  return () => ({ nodes: [], edges: [] });
};

const AUTO_SAVE_DELAY = 1200;

export const WorkspaceTabsProvider = ({ kind, createInitialState, children }) => {
  const stateFactory = ensureFactory(createInitialState);
  const { user, activeProjectId, activeProjectName } = useProject?.() ?? {};
  const userId = user?.userId || user?._id || user?.id;

  const [tabs, setTabs] = useState([]);
  const tabsRef = useRef(tabs);
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);

  const [activeTabId, setActiveTabId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingTabIds, setSavingTabIds] = useState(new Set());

  const saveTimersRef = useRef({});
  const unmountedRef = useRef(false);

  const persistTab = useCallback(
    async (tabId) => {
      const projectId = activeProjectId;
      if (!userId || !projectId || !activeProjectName) {
        return;
      }

      // Use ref to get latest tabs without adding to dependency
      const currentTabs = tabsRef.current;
      const tab = currentTabs.find((t) => t.id === tabId);
      if (!tab || !tab.dirty) return;

      setSavingTabIds((prev) => new Set(prev).add(tabId));
      try {
        const result = await saveWorkspaceSnapshot({
          userId,
          projectId,
          projectName: activeProjectName,
          kind,
          tabName: tab.name,
          state: tab.state,
          existingFileId: tab.fileId,
        });

        if (!unmountedRef.current) {
          setTabs((current) =>
            current.map((item) =>
              item.id === tabId
                ? {
                  ...item,
                  fileId: result.fileId,
                  fileName: result.fileName,
                  dirty: false,
                }
                : item
            )
          );
        }
      } catch (error) {
        console.error('Failed to persist workspace tab', error);
      } finally {
        if (!unmountedRef.current) {
          setSavingTabIds((prev) => {
            const next = new Set(prev);
            next.delete(tabId);
            return next;
          });
        }
      }
    },
    [activeProjectId, activeProjectName, kind, userId]
  );

  const scheduleSave = useCallback(
    (tabId) => {
      if (!tabId) return;
      if (saveTimersRef.current[tabId]) {
        clearTimeout(saveTimersRef.current[tabId]);
      }
      saveTimersRef.current[tabId] = setTimeout(() => {
        delete saveTimersRef.current[tabId];
        persistTab(tabId);
      }, AUTO_SAVE_DELAY);
    },
    [persistTab]
  );

  const cancelSave = useCallback((tabId) => {
    if (saveTimersRef.current[tabId]) {
      clearTimeout(saveTimersRef.current[tabId]);
      delete saveTimersRef.current[tabId];
    }
  }, []);

  const hydrateFromStorage = useCallback(async () => {
    if (!userId || !activeProjectId || !activeProjectName) {
      setTabs([]);
      setActiveTabId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const snapshots = await loadWorkspaceSnapshots({
        userId,
        projectId: activeProjectId,
        projectName: activeProjectName,
        kind,
      });

      if (unmountedRef.current) return;

      if (snapshots.length) {
        const mappedTabs = snapshots.map((snap, index) => ({
          id: createTabId(),
          name: snap.tabName || `Tab ${index + 1}`,
          state: snap.state || stateFactory(),
          fileId: snap.fileId,
          fileName: snap.fileName,
          dirty: false,
        }));
        setTabs(mappedTabs);
        setActiveTabId(mappedTabs[0]?.id ?? null);
      } else {
        const initialState = stateFactory();
        const firstTabId = createTabId();
        setTabs([
          {
            id: firstTabId,
            name: 'Tab 1',
            state: initialState,
            fileId: null,
            fileName: buildWorkspaceFileName(activeProjectName, kind, 'Tab-1'),
            dirty: true,
          },
        ]);
        setActiveTabId(firstTabId);
      }
    } catch (error) {
      console.error('Failed to load workspace snapshots', error);
      setTabs([]);
      setActiveTabId(null);
    } finally {
      if (!unmountedRef.current) {
        setLoading(false);
      }
    }
  }, [activeProjectId, activeProjectName, kind, stateFactory, userId]);

  useEffect(() => {
    hydrateFromStorage();
    return () => {
      unmountedRef.current = true;
      Object.values(saveTimersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, [hydrateFromStorage]);

  const selectTab = useCallback((tabId) => {
    // If we're already on this tab, do nothing
    if (tabId === activeTabId) return;

    // Save current tab before switching (fire event for components to save their state)
    if (activeTabId) {
      console.log('[WorkspaceTabs] Switching tabs, saving current tab:', activeTabId);
      // Dispatch event so components can save their state before tab switch
      window.dispatchEvent(new CustomEvent('workspace:before-tab-switch', {
        detail: { fromTabId: activeTabId, toTabId: tabId }
      }));
      // Do not persist immediately here, because the state update from the event 
      // hasn't processed yet. We rely on the component calling updateActiveTabState 
      // which triggers scheduleSave.
    }

    setActiveTabId(tabId);

    // Dispatch event so components can restore state from new tab
    window.dispatchEvent(new CustomEvent('workspace:after-tab-switch', {
      detail: { tabId }
    }));
  }, [activeTabId, persistTab]);

  const updateTab = useCallback((tabId, updater, options = {}) => {
    setTabs((current) =>
      current.map((tab) => {
        if (tab.id !== tabId) return tab;
        const nextState = typeof updater === 'function' ? updater(tab) : updater;
        const dirty = options.markDirty !== false;
        return dirty ? { ...nextState, dirty: true } : nextState;
      })
    );
    if (options.scheduleSave !== false) {
      scheduleSave(tabId);
    }
  }, [scheduleSave]);

  const updateActiveTabState = useCallback(
    (updater, options = {}) => {
      if (!activeTabId) return;
      updateTab(
        activeTabId,
        (tab) => ({
          ...tab,
          state: typeof updater === 'function' ? updater(tab.state) : updater,
        }),
        options
      );
    },
    [activeTabId, updateTab]
  );

  const createTab = useCallback(() => {
    const newId = createTabId();
    const state = stateFactory();
    const baseIndex = tabs.length + 1;
    const newName = `Tab ${baseIndex}`;
    setTabs((current) => [
      ...current,
      {
        id: newId,
        name: newName,
        state,
        fileId: null,
        fileName: buildWorkspaceFileName(activeProjectName, kind, newName.replace(/\s+/g, '-')),
        dirty: true,
      },
    ]);
    setActiveTabId(newId);
    scheduleSave(newId);
    return newId;
  }, [activeProjectName, kind, scheduleSave, stateFactory, tabs.length]);

  const closeTab = useCallback(
    (tabId) => {
      setTabs((current) => current.filter((tab) => tab.id !== tabId));
      cancelSave(tabId);
      setSavingTabIds((prev) => {
        const next = new Set(prev);
        next.delete(tabId);
        return next;
      });

      setActiveTabId((currentActive) => {
        if (currentActive !== tabId) return currentActive;
        const nextTabs = tabs.filter((tab) => tab.id !== tabId);
        return nextTabs[0]?.id ?? null;
      });
    },
    [cancelSave, tabs]
  );

  const renameTab = useCallback(
    (tabId, newName) => {
      const trimmed = newName?.trim();
      if (!trimmed) return;
      updateTab(
        tabId,
        (tab) => ({
          ...tab,
          name: trimmed,
          fileName: buildWorkspaceFileName(activeProjectName, kind, trimmed.replace(/\s+/g, '-')),
        })
      );
    },
    [activeProjectName, kind, updateTab]
  );

  const saveTabNow = useCallback(
    (tabId) => {
      cancelSave(tabId);
      return persistTab(tabId);
    },
    [cancelSave, persistTab]
  );

  const saveActiveTabNow = useCallback(() => {
    if (!activeTabId) return Promise.resolve();
    return saveTabNow(activeTabId);
  }, [activeTabId, saveTabNow]);

  const value = useMemo(() => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;
    return {
      kind,
      tabs,
      activeTabId,
      activeTab,
      loading,
      savingTabIds,
      createTab,
      closeTab,
      selectTab,
      renameTab,
      updateActiveTabState,
      saveActiveTabNow,
      hydrateFromStorage,
    };
  }, [activeTabId, closeTab, createTab, hydrateFromStorage, kind, loading, renameTab, saveActiveTabNow, savingTabIds, selectTab, tabs, updateActiveTabState]);

  return <WorkspaceTabsContext.Provider value={value}>{children}</WorkspaceTabsContext.Provider>;
};

export const useWorkspaceTabs = () => {
  const context = useContext(WorkspaceTabsContext);
  if (!context) {
    throw new Error('useWorkspaceTabs must be used within a WorkspaceTabsProvider');
  }
  return context;
};
