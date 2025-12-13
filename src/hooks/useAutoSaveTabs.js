import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useProject } from '../ProjectContext';
import { ScreenTabManager } from '../utils/screenFileManager';

// Custom hook for managing tabs with automatic file saving
export const useAutoSaveTabs = (initialTabs = [], options = {}) => {
  const location = useLocation();
  const { user, activeProjectId } = useProject();
  
  const {
    maxTabs = 10,
    autoSaveDelay = 2000, // 2 seconds delay after content change
    defaultTabName = 'Tab',
    defaultContent = ''
  } = options;

  const [tabs, setTabs] = useState(initialTabs);
  const [activeTab, setActiveTab] = useState(initialTabs.length > 0 ? initialTabs[0].id : null);
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Initialize screen tab manager
  const userId = user?.userId || user?._id || user?.id;
  const screenPath = location.pathname;
  const tabManager = new ScreenTabManager(screenPath, userId, activeProjectId);

  // Auto-save function with debouncing
  const debouncedSave = useCallback((tabId, tabName, content) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const newTimeout = setTimeout(async () => {
      if (tabManager.autoSaveEnabled && userId && activeProjectId) {
        try {
          const result = await tabManager.saveTab(tabName, content);
          if (result && result.fileId) {
            // Link the tab to the saved file
            tabManager.linkTabToFile(tabId, result.fileId);
            
            // Update tab state with file info
            setTabs(prevTabs => 
              prevTabs.map(tab => 
                tab.id === tabId 
                  ? { 
                      ...tab, 
                      dirty: false, 
                      fileId: result.fileId, 
                      lastSaved: new Date(),
                      filePath: `${result.folderName}/${result.fileName}`
                    }
                  : tab
              )
            );
          }
          console.log(`Auto-saved tab: ${tabName}`);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, autoSaveDelay);

    setSaveTimeout(newTimeout);
  }, [tabManager, userId, activeProjectId, saveTimeout, autoSaveDelay]);

  // Add new tab with auto-save
  const addNewTab = useCallback(() => {
    if (tabs.length >= maxTabs) {
      alert(`Maximum of ${maxTabs} tabs allowed.`);
      return null;
    }

    const newTabId = Math.max(0, ...tabs.map(t => t.id)) + 1;
    const newTabName = `${defaultTabName} ${newTabId}`;
    const newTab = {
      id: newTabId,
      name: newTabName,
      content: defaultContent,
      dirty: false,
      fileId: null,
      lastSaved: null
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTab(newTabId);

    // Auto-save the new tab if content is not empty
    if (defaultContent.trim()) {
      debouncedSave(newTabName, defaultContent);
    }

    return newTab;
  }, [tabs, maxTabs, defaultTabName, defaultContent, debouncedSave]);

  // Update tab content with auto-save
  const updateTabContent = useCallback((tabId, newContent) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === tabId) {
          const updatedTab = { ...tab, content: newContent, dirty: true };
          
          // Trigger auto-save
          debouncedSave(tabId, tab.name, newContent);
          
          return updatedTab;
        }
        return tab;
      })
    );
  }, [debouncedSave]);

  // Rename tab with auto-save
  const renameTab = useCallback((tabId, newName) => {
    const trimmedName = newName?.trim();
    if (!trimmedName) return false;

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === tabId) {
          const updatedTab = { ...tab, name: trimmedName, dirty: true };
          
          // Auto-save with new name
          debouncedSave(trimmedName, tab.content);
          
          return updatedTab;
        }
        return tab;
      })
    );
    return true;
  }, [debouncedSave]);

  // Close tab
  const closeTab = useCallback((tabId) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTab === tabId) {
      if (newTabs.length > 0) {
        setActiveTab(newTabs[newTabs.length - 1].id);
      } else {
        setActiveTab(null);
      }
    }
  }, [tabs, activeTab]);

  // Manually save tab (force save)
  const saveTab = useCallback(async (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !tabManager.autoSaveEnabled) return null;

    try {
      const result = await tabManager.saveTab(tab.name, tab.content);
      
      if (result) {
        setTabs(prevTabs => 
          prevTabs.map(t => 
            t.id === tabId 
              ? { ...t, dirty: false, fileId: result.fileId, lastSaved: new Date() }
              : t
          )
        );
      }
      
      return result;
    } catch (error) {
      console.error('Manual save failed:', error);
      return null;
    }
  }, [tabs, tabManager]);

  // Save asset (exported files, etc.)
  const saveAsset = useCallback(async (fileName, content, assetType = 'export') => {
    if (!tabManager.autoSaveEnabled) return null;

    try {
      return await tabManager.saveAsset(fileName, content, assetType);
    } catch (error) {
      console.error('Asset save failed:', error);
      return null;
    }
  }, [tabManager]);

  // Get active tab
  const getActiveTab = useCallback(() => {
    return tabs.find(tab => tab.id === activeTab) || null;
  }, [tabs, activeTab]);

  // Handle tab click
  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Get folder information
  const getFolderInfo = useCallback(() => {
    return tabManager.getFolderInfo();
  }, [tabManager]);

  // Open file from file explorer as a tab
  const openFileAsTab = useCallback(async (fileId, fileName, fileContent) => {
    try {
      // Check if file is already open as a tab
      const existingTabId = tabManager.getTabIdForFile(fileId);
      if (existingTabId) {
        // Switch to existing tab
        setActiveTab(existingTabId);
        return existingTabId;
      }

      // Create new tab from file
      const newTabId = Math.max(0, ...tabs.map(t => t.id)) + 1;
      const newTab = {
        id: newTabId,
        name: fileName,
        content: fileContent || '',
        dirty: false,
        fileId: fileId,
        lastSaved: new Date(),
        filePath: `${tabManager.getFolderInfo().folderName}/${fileName}`
      };

      // Link tab to file
      tabManager.linkTabToFile(newTabId, fileId);

      // Add tab and make it active
      setTabs(prevTabs => [...prevTabs, newTab]);
      setActiveTab(newTabId);

      return newTabId;
    } catch (error) {
      console.error('Failed to open file as tab:', error);
      return null;
    }
  }, [tabs, tabManager]);

  // Close tab and handle file unlinking
  const closeTabEnhanced = useCallback((tabId) => {
    // Unlink from file
    tabManager.unlinkTab(tabId);
    
    // Remove tab
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTab === tabId) {
      if (newTabs.length > 0) {
        setActiveTab(newTabs[newTabs.length - 1].id);
      } else {
        setActiveTab(null);
      }
    }
  }, [tabs, activeTab, tabManager]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  return {
    // Tab state
    tabs,
    activeTab,
    setActiveTab,
    
    // Tab operations
    addNewTab,
    closeTab: closeTabEnhanced,
    updateTabContent,
    renameTab,
    handleTabClick,
    
    // File integration
    openFileAsTab,
    
    // Saving operations  
    saveTab,
    saveAsset,
    
    // Utility functions
    getActiveTab,
    getFolderInfo,
    
    // Manager instance for advanced operations
    tabManager
  };
};

export default useAutoSaveTabs;
