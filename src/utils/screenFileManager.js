import { ensureProjectFolder, saveProjectFile, sanitizeSegment } from './workspaceStorage';

// Define screen-specific folder mappings
export const SCREEN_FOLDER_MAP = {
  '/simulation': 'Simulation',
  '/blockprogramming': 'Block Programming', 
  '/FlowchartTest': 'Flowchart',
  '/BlockDiagram': 'Block Diagram',
  '/editor': 'Code Editor'
};

// Define default file extensions per screen
export const SCREEN_FILE_EXTENSIONS = {
  '/simulation': '.c',
  '/blockprogramming': '.json',
  '/FlowchartTest': '.json', 
  '/BlockDiagram': '.json',
  '/editor': '.c'
};

// Generate appropriate filename based on screen type and tab name
export const generateFileName = (screenPath, tabName, customExtension = null) => {
  const sanitizedTabName = sanitizeSegment(tabName || 'untitled');
  const extension = customExtension || SCREEN_FILE_EXTENSIONS[screenPath] || '.txt';
  
  // For simulation, use simulation.c as default if no specific name
  if (screenPath === '/simulation' && (!tabName || tabName.includes('Tab'))) {
    return 'simulation.c';
  }
  
  return `${sanitizedTabName}${extension}`;
};

// Automatically save tab content to appropriate screen folder
export const autoSaveTabToFolder = async ({
  userId,
  projectId,
  screenPath,
  tabName,
  content,
  customExtension = null
}) => {
  if (!userId || !projectId || !screenPath) {
    console.warn('Missing required parameters for auto-save');
    return null;
  }

  try {
    // Get the folder name for this screen
    const folderName = SCREEN_FOLDER_MAP[screenPath];
    if (!folderName) {
      console.warn(`No folder mapping found for screen: ${screenPath}`);
      return null;
    }

    // Ensure the screen-specific folder exists
    const folderId = await ensureProjectFolder({
      userId,
      projectId,
      folderName
    });

    // Generate the filename
    const fileName = generateFileName(screenPath, tabName, customExtension);

    // Save the file in the screen-specific folder
    const fileId = await saveProjectFile({
      userId,
      projectId: folderId, // Save to the screen-specific folder
      fileName,
      content: content || ''
    });

    // Trigger file system refresh
    window.dispatchEvent(new Event('file-system-refresh'));

    return {
      fileId,
      fileName,
      folderId,
      folderName
    };
  } catch (error) {
    console.error('Error auto-saving tab to folder:', error);
    return null;
  }
};

// Save exported assets (PNG, JSON) to screen folder
export const saveAssetToScreenFolder = async ({
  userId,
  projectId,
  screenPath,
  fileName,
  content,
  assetType = 'export' // 'export', 'json', 'png'
}) => {
  if (!userId || !projectId || !screenPath || !fileName) {
    console.warn('Missing required parameters for asset save');
    return null;
  }

  try {
    const folderName = SCREEN_FOLDER_MAP[screenPath];
    if (!folderName) {
      console.warn(`No folder mapping found for screen: ${screenPath}`);
      return null;
    }

    // Ensure the screen-specific folder exists
    const folderId = await ensureProjectFolder({
      userId,
      projectId,
      folderName
    });

    // Save the asset in the screen-specific folder
    const fileId = await saveProjectFile({
      userId,
      projectId: folderId,
      fileName: sanitizeSegment(fileName),
      content
    });

    // Trigger file system refresh
    window.dispatchEvent(new Event('file-system-refresh'));

    return {
      fileId,
      fileName,
      folderId,
      folderName
    };
  } catch (error) {
    console.error('Error saving asset to screen folder:', error);
    return null;
  }
};

// Get the appropriate folder name for a screen
export const getScreenFolderName = (screenPath) => {
  return SCREEN_FOLDER_MAP[screenPath] || 'General';
};

// Check if a screen should auto-save tabs
export const shouldAutoSave = (screenPath) => {
  return Object.keys(SCREEN_FOLDER_MAP).includes(screenPath);
};

// Enhanced tab manager for screen-specific file operations
export class ScreenTabManager {
  constructor(screenPath, userId, projectId) {
    this.screenPath = screenPath;
    this.userId = userId;
    this.projectId = projectId;
    this.autoSaveEnabled = shouldAutoSave(screenPath);
    this.fileToTabMap = new Map(); // Maps fileId to tabId
    this.tabToFileMap = new Map(); // Maps tabId to fileId
  }

  // Auto-save tab when content changes
  async saveTab(tabName, content, customExtension = null) {
    if (!this.autoSaveEnabled) return null;
    
    return await autoSaveTabToFolder({
      userId: this.userId,
      projectId: this.projectId,
      screenPath: this.screenPath,
      tabName,
      content,
      customExtension
    });
  }

  // Save exported asset
  async saveAsset(fileName, content, assetType = 'export') {
    if (!this.autoSaveEnabled) return null;
    
    return await saveAssetToScreenFolder({
      userId: this.userId,
      projectId: this.projectId,
      screenPath: this.screenPath,
      fileName,
      content,
      assetType
    });
  }

  // Get folder info for this screen
  getFolderInfo() {
    return {
      folderName: getScreenFolderName(this.screenPath),
      defaultExtension: SCREEN_FILE_EXTENSIONS[this.screenPath] || '.txt',
      autoSaveEnabled: this.autoSaveEnabled
    };
  }

  // Link a tab to a file
  linkTabToFile(tabId, fileId) {
    this.tabToFileMap.set(tabId, fileId);
    this.fileToTabMap.set(fileId, tabId);
  }

  // Unlink a tab from its file
  unlinkTab(tabId) {
    const fileId = this.tabToFileMap.get(tabId);
    if (fileId) {
      this.tabToFileMap.delete(tabId);
      this.fileToTabMap.delete(fileId);
    }
  }

  // Get file ID for a tab
  getFileIdForTab(tabId) {
    return this.tabToFileMap.get(tabId);
  }

  // Get tab ID for a file
  getTabIdForFile(fileId) {
    return this.fileToTabMap.get(fileId);
  }

  // Check if a file is linked to a tab
  isFileLinkedToTab(fileId) {
    return this.fileToTabMap.has(fileId);
  }

  // Get all linked file IDs
  getLinkedFileIds() {
    return Array.from(this.fileToTabMap.keys());
  }
}
