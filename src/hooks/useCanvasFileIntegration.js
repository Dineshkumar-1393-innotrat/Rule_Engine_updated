/**
 * Canvas File Integration Hook
 * Handles loading files from projects into canvas components
 */
import { useState, useEffect, useCallback } from 'react';
import projectFileManager from '../utils/projectFileManager';

export const useCanvasFileIntegration = (canvasType = 'Flowchart') => {
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load file content into canvas
   */
  const loadFileToCanvas = useCallback(async (filePath, fileName, parsedContent, fileData) => {
    try {
      setIsLoading(true);
      
      console.log('Loading file to canvas:', fileName, parsedContent);
      
      // Update current file state
      setCurrentFile({
        path: filePath,
        name: fileName,
        content: parsedContent,
        projectId: fileData?.projectId
      });

      // Add to loaded files list if not already present
      setLoadedFiles(prev => {
        const exists = prev.find(f => f.path === filePath);
        if (!exists) {
          return [...prev, { path: filePath, name: fileName }];
        }
        return prev;
      });

      // Return the loaded content for the canvas to use
      return {
        success: true,
        content: parsedContent,
        fileName,
        filePath
      };

    } catch (error) {
      console.error('Error loading file to canvas:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save canvas content to file
   */
  const saveCanvasToFile = useCallback(async (content, filePath, projectId) => {
    try {
      if (!projectId || !filePath) {
        console.warn('Missing projectId or filePath for save operation');
        return false;
      }

      // Serialize content based on type
      const serializedContent = typeof content === 'object' 
        ? JSON.stringify(content, null, 2) 
        : content;

      // Save to project file system
      projectFileManager.saveFile(projectId, filePath, serializedContent);

      console.log('Canvas content saved to file:', filePath);
      return true;

    } catch (error) {
      console.error('Error saving canvas to file:', error);
      return false;
    }
  }, []);

  /**
   * Export canvas as PNG and save to project
   */
  const exportCanvasAsPNG = useCallback(async (dataUrl, fileName, projectId) => {
    try {
      if (!projectId) {
        console.warn('No project ID provided for PNG export');
        return false;
      }

      // Determine canvas type for proper folder structure
      const canvasTypeMap = {
        'Flowchart': 'FlowchartTest',
        'Block Diagram': 'blockDiagram', 
        'Block Programming': 'Blockprogramming',
        'Simulation': 'simulation'
      };

      const diagramType = canvasTypeMap[canvasType] || 'FlowchartTest';
      
      // Save PNG to appropriate project folder
      const pngPath = projectFileManager.savePNGExport(projectId, diagramType, fileName, dataUrl);
      
      if (pngPath) {
        console.log('PNG exported to project:', pngPath);
        
        // Trigger file system refresh
        window.dispatchEvent(new CustomEvent('file-system-refresh'));
        
        return pngPath;
      }

      return false;

    } catch (error) {
      console.error('Error exporting PNG:', error);
      return false;
    }
  }, [canvasType]);

  /**
   * Auto-save canvas content periodically
   */
  const setupAutoSave = useCallback((getCanvasContent, projectId, filePath, intervalMs = 5000) => {
    if (!projectId || !filePath || typeof getCanvasContent !== 'function') {
      console.warn('Auto-save setup failed: missing required parameters');
      return null;
    }

    const interval = setInterval(async () => {
      try {
        const content = getCanvasContent();
        if (content) {
          await saveCanvasToFile(content, filePath, projectId);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, intervalMs);

    console.log('Auto-save enabled for:', filePath);
    return interval;
  }, [saveCanvasToFile]);

  /**
   * Auto-save canvas content on changes (debounced)
   */
  const setupAutoSaveOnChange = useCallback((getCanvasContent, projectId, filePath, debounceMs = 2000) => {
    if (!projectId || !filePath || typeof getCanvasContent !== 'function') {
      console.warn('Auto-save on change setup failed: missing required parameters');
      return null;
    }

    let debounceTimer = null;
    let lastSavedContent = null;

    const saveIfChanged = async () => {
      try {
        const content = getCanvasContent();
        const contentString = JSON.stringify(content);
        
        // Only save if content has actually changed
        if (contentString !== lastSavedContent) {
          await saveCanvasToFile(content, filePath, projectId);
          lastSavedContent = contentString;
          console.log('Auto-saved canvas changes to:', filePath);
        }
      } catch (error) {
        console.error('Auto-save on change failed:', error);
      }
    };

    const debouncedSave = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(saveIfChanged, debounceMs);
    };

    // Return both trigger function and cleanup function
    return {
      triggerSave: debouncedSave,
      cleanup: () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
      }
    };
  }, [saveCanvasToFile]);

  /**
   * Get active project for canvas operations
   */
  const getActiveProject = useCallback(() => {
    return projectFileManager.getActiveProject();
  }, []);

  /**
   * Create new file in active project
   */
  const createNewFile = useCallback(async (fileName, initialContent = null, folderType = null) => {
    const activeProject = getActiveProject();
    if (!activeProject) {
      console.warn('No active project for file creation');
      return false;
    }

    try {
      // Determine file path based on folder type or canvas type
      const targetFolderType = folderType || canvasType;
      const canvasTypeMap = {
        'Flowchart': 'FlowchartTest',
        'Block Diagram': 'blockDiagram',
        'Block Programming': 'Blockprogramming', 
        'Simulation': 'simulation'
      };

      const diagramType = canvasTypeMap[targetFolderType];
      let filePath = fileName;

      // If it's a diagram type, put it in appropriate subfolder
      if (diagramType && projectFileManager.PROJECT_STRUCTURE?.DIAGRAM_FOLDERS[diagramType]) {
        const folderConfig = projectFileManager.PROJECT_STRUCTURE.DIAGRAM_FOLDERS[diagramType];
        filePath = `${folderConfig.folder}/${fileName}`;
      }

      // Set default content based on file type
      let content = initialContent;
      if (!content) {
        if (fileName.endsWith('.json')) {
          content = targetFolderType === 'Block Programming' 
            ? '{"blocks":[],"connections":[],"canvas":{"zoom":1,"position":{"x":0,"y":0}}}'
            : '{"nodes":[],"edges":[],"viewport":null}';
        } else if (fileName.endsWith('.c')) {
          content = `// ${fileName}\n#include <stdio.h>\n\nint main() {\n    return 0;\n}\n`;
        } else {
          content = `// New ${targetFolderType} file\n`;
        }
      }

      // Save the new file
      projectFileManager.saveFile(activeProject.id, filePath, content);

      // Trigger refresh
      window.dispatchEvent(new CustomEvent('file-system-refresh'));

      console.log('New file created:', filePath);
      return { filePath, content, projectId: activeProject.id };

    } catch (error) {
      console.error('Error creating new file:', error);
      return false;
    }
  }, [canvasType, getActiveProject]);

  return {
    // State
    loadedFiles,
    currentFile,
    isLoading,

    // File operations
    loadFileToCanvas,
    saveCanvasToFile,
    exportCanvasAsPNG,
    createNewFile,

    // Utilities
    setupAutoSave,
    setupAutoSaveOnChange,
    getActiveProject
  };
};

export default useCanvasFileIntegration;
