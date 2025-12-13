/**
 * Project File Management System
 * Handles project creation, folder structures, and file operations using localStorage
 */

// Storage keys
const STORAGE_KEYS = {
  PROJECTS: 'ide_projects',
  ACTIVE_PROJECT: 'ide_active_project',
  PROJECT_FILES: 'ide_project_files'
};

const hasLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Project structure template
const PROJECT_STRUCTURE = {
  // Default files created for every project
  DEFAULT_FILES: {
    'simulation.c': '// Simulation code\n#include <stdio.h>\n\nint main() {\n    printf("Hello World from ${PROJECT_NAME}!");\n    return 0;\n}\n',
  },

  // Diagram-specific subfolders and their default files
  DIAGRAM_FOLDERS: {
    'FlowchartTest': {
      folder: 'Flowchart',
      defaultFiles: {
        'main_flow.json': '{"nodes":[],"edges":[],"viewport":null}',
        'flow_tabs.json': '[]'
      }
    },
    'blockDiagram': {
      folder: 'BlockDiagram', 
      defaultFiles: {
        'system_diagram.json': '{"nodes":[],"edges":[],"viewport":null}',
        'diagram_tabs.json': '[]'
      }
    },
    'Blockprogramming': {
      folder: 'BlockProgramming',
      defaultFiles: {
        'logic_blocks.json': '{"blocks":[],"connections":[],"canvas":{"zoom":1,"position":{"x":0,"y":0}}}',
        'blocks_tabs.json': '[]'
      }
    },
    'simulation': {
      folder: 'Simulation',
      defaultFiles: {
        'simulation_data.json': '{"components":[],"connections":[]}',
        'sim_tabs.json': '[]'
      }
    }
  }
};

/**
 * ProjectFileManager Class
 */
class ProjectFileManager {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    if (!hasLocalStorage()) {
      console.warn('localStorage not available; project manager disabled');
      return;
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROJECT_FILES)) {
      localStorage.setItem(STORAGE_KEYS.PROJECT_FILES, JSON.stringify({}));
    }
  }

  /**
   * Create a new project with organized folder structure
   */
  createProject({
    projectName,
    projectType = 'bare metal',
    boardType = 'STM32 U5', 
    selectedFeature = 'writeCode',
    userId = 'default_user'
  }) {
    if (!hasLocalStorage()) {
      throw new Error('localStorage not available in this environment');
    }
    try {
      const projectId = this.generateProjectId(projectName);
      const timestamp = new Date().toISOString();

      // Create project metadata
      const projectData = {
        id: projectId,
        name: projectName,
        type: projectType,
        board: boardType,
        selectedFeature,
        userId,
        createdAt: timestamp,
        lastModified: timestamp,
        structure: this.generateProjectStructure(projectName, selectedFeature)
      };

      // Save project to storage
      const projects = this.getAllProjects();
      projects[projectId] = projectData;
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

      // Create project files
      this.createProjectFiles(projectId, projectName, selectedFeature);

      // Set as active project
      this.setActiveProject(projectId);

      // Trigger file system refresh event
      window.dispatchEvent(new CustomEvent('project-created', { 
        detail: { project: projectData } 
      }));
      window.dispatchEvent(new CustomEvent('file-system-refresh'));

      console.log('Project created successfully:', projectData);
      return projectData;

    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Generate unique project ID
   */
  generateProjectId(projectName) {
    const sanitized = projectName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    return `proj_${sanitized}_${timestamp}`;
  }

  /**
   * Generate project folder structure
   */
  generateProjectStructure(projectName, selectedFeature) {
    const structure = {
      name: projectName,
      type: 'folder',
      id: `root_${Date.now()}`,
      children: []
    };

    // Add default simulation.c file
    structure.children.push({
      name: 'simulation.c',
      type: 'file',
      id: `file_simulation_${Date.now()}`,
      content: PROJECT_STRUCTURE.DEFAULT_FILES['simulation.c'].replace('${PROJECT_NAME}', projectName)
    });

    // Add diagram-specific folder if selected
    if (PROJECT_STRUCTURE.DIAGRAM_FOLDERS[selectedFeature]) {
      const diagramConfig = PROJECT_STRUCTURE.DIAGRAM_FOLDERS[selectedFeature];
      const diagramFolder = {
        name: diagramConfig.folder,
        type: 'folder',
        id: `folder_${diagramConfig.folder.toLowerCase()}_${Date.now()}`,
        children: []
      };

      // Add default files to diagram folder
      Object.entries(diagramConfig.defaultFiles).forEach(([fileName, content]) => {
        diagramFolder.children.push({
          name: fileName,
          type: 'file',
          id: `file_${fileName}_${Date.now()}`,
          content: content
        });
      });

      structure.children.push(diagramFolder);
    }

    return structure;
  }

  /**
   * Create project files in storage
   */
  createProjectFiles(projectId, projectName, selectedFeature) {
    if (!hasLocalStorage()) return;
    const projectFiles = this.getProjectFiles();
    
    if (!projectFiles[projectId]) {
      projectFiles[projectId] = {};
    }

    // Create default simulation.c file
    const simulationContent = PROJECT_STRUCTURE.DEFAULT_FILES['simulation.c']
      .replace('${PROJECT_NAME}', projectName);
    
    this.saveFile(projectId, 'simulation.c', simulationContent);

    // Create diagram-specific files
    if (PROJECT_STRUCTURE.DIAGRAM_FOLDERS[selectedFeature]) {
      const config = PROJECT_STRUCTURE.DIAGRAM_FOLDERS[selectedFeature];
      const folderPath = `${config.folder}/`;
      
      Object.entries(config.defaultFiles).forEach(([fileName, content]) => {
        this.saveFile(projectId, folderPath + fileName, content);
      });
    }

    localStorage.setItem(STORAGE_KEYS.PROJECT_FILES, JSON.stringify(projectFiles));
  }

  /**
   * Save file content
   */
  saveFile(projectId, filePath, content) {
    const projectFiles = this.getProjectFiles();
    
    if (!projectFiles[projectId]) {
      projectFiles[projectId] = {};
    }

    projectFiles[projectId][filePath] = {
      content,
      lastModified: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.PROJECT_FILES, JSON.stringify(projectFiles));

    // Update project's last modified time
    const projects = this.getAllProjects();
    if (projects[projectId]) {
      projects[projectId].lastModified = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    }

    // Trigger file change event
    window.dispatchEvent(new CustomEvent('file-changed', { 
      detail: { projectId, filePath, content } 
    }));
  }

  /**
   * Load file content
   */
  loadFile(projectId, filePath) {
    const projectFiles = this.getProjectFiles();
    return projectFiles[projectId]?.[filePath]?.content || '';
  }

  /**
   * Get all projects
   */
  getAllProjects() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '{}');
  }

  /**
   * Get project files
   */
  getProjectFiles() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECT_FILES) || '{}');
  }

  /**
   * Get specific project
   */
  getProject(projectId) {
    const projects = this.getAllProjects();
    return projects[projectId] || null;
  }

  /**
   * Set active project
   */
  setActiveProject(projectId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, projectId);
    
    // Trigger active project change event
    const project = this.getProject(projectId);
    window.dispatchEvent(new CustomEvent('active-project-changed', { 
      detail: { projectId, project } 
    }));
  }

  /**
   * Get active project
   */
  getActiveProject() {
    const activeProjectId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT);
    return activeProjectId ? this.getProject(activeProjectId) : null;
  }

  /**
   * Delete project
   */
  deleteProject(projectId) {
    const projects = this.getAllProjects();
    const projectFiles = this.getProjectFiles();

    delete projects[projectId];
    delete projectFiles[projectId];

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    localStorage.setItem(STORAGE_KEYS.PROJECT_FILES, JSON.stringify(projectFiles));

    // Clear active project if it was deleted
    if (localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT) === projectId) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT);
    }

    window.dispatchEvent(new CustomEvent('project-deleted', { 
      detail: { projectId } 
    }));
    window.dispatchEvent(new CustomEvent('file-system-refresh'));
  }

  /**
   * Export project as PNG (for diagrams)
   */
  savePNGExport(projectId, diagramType, fileName, dataUrl) {
    const diagramConfig = PROJECT_STRUCTURE.DIAGRAM_FOLDERS[diagramType];
    if (diagramConfig) {
      const pngPath = `${diagramConfig.folder}/${fileName}`;
      this.saveFile(projectId, pngPath, dataUrl);
      
      console.log(`PNG exported to: ${pngPath}`);
      return pngPath;
    }
  }

  /**
   * Save tab data
   */
  saveTabData(projectId, diagramType, tabsData) {
    const diagramConfig = PROJECT_STRUCTURE.DIAGRAM_FOLDERS[diagramType];
    if (diagramConfig) {
      const tabsPath = `${diagramConfig.folder}/${diagramConfig.folder.toLowerCase()}_tabs.json`;
      this.saveFile(projectId, tabsPath, JSON.stringify(tabsData));
    }
  }

  /**
   * Load tab data
   */
  loadTabData(projectId, diagramType) {
    const diagramConfig = PROJECT_STRUCTURE.DIAGRAM_FOLDERS[diagramType];
    if (diagramConfig) {
      const tabsPath = `${diagramConfig.folder}/${diagramConfig.folder.toLowerCase()}_tabs.json`;
      const content = this.loadFile(projectId, tabsPath);
      return content ? JSON.parse(content) : [];
    }
    return [];
  }

  /**
   * Get project file tree for File Explorer
   */
  getProjectFileTree(projectId) {
    const project = this.getProject(projectId);
    if (!project) return null;

    const projectFiles = this.getProjectFiles()[projectId] || {};
    
    // Build file tree from saved files
    const tree = {
      name: project.name,
      type: 'folder',
      id: project.id,
      children: []
    };

    // Organize files into folder structure
    const folderMap = new Map();
    
    Object.keys(projectFiles).forEach(filePath => {
      const parts = filePath.split('/');
      const fileName = parts.pop();
      const folderPath = parts.join('/');
      
      if (folderPath) {
        // File is in a subfolder
        if (!folderMap.has(folderPath)) {
          folderMap.set(folderPath, []);
        }
        folderMap.get(folderPath).push({
          name: fileName,
          type: 'file',
          id: `file_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
          path: filePath
        });
      } else {
        // File is in root
        tree.children.push({
          name: fileName,
          type: 'file', 
          id: `file_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`,
          path: filePath
        });
      }
    });

    // Add folders to tree
    folderMap.forEach((files, folderPath) => {
      tree.children.push({
        name: folderPath,
        type: 'folder',
        id: `folder_${folderPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        children: files
      });
    });

    return tree;
  }
}

// Create singleton instance
const projectFileManager = new ProjectFileManager();

export default projectFileManager;
export { STORAGE_KEYS, PROJECT_STRUCTURE };
