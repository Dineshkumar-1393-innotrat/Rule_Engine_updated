import { saveProjectFile, ensureProjectFolder } from './workspaceStorage';

// Project structure configuration
export const PROJECT_STRUCTURE = {
  // Diagram type to folder mapping
  DIAGRAM_FOLDERS: {
    'Flowchart': 'Flowchart',
    'Block Diagram': 'BlockDiagram', 
    'Block Programming': 'BlockProgramming',
    'Simulation': 'Simulation',
    'Code Editor': 'CodeEditor'
  },
  
  // File extensions per diagram type
  DIAGRAM_EXTENSIONS: {
    'Flowchart': '.json',
    'Block Diagram': '.json',
    'Block Programming': '.json', 
    'Simulation': '.c',
    'Code Editor': '.c'
  },
  
  // Default files to create
  DEFAULT_FILES: {
    'Flowchart': [
      { name: 'main_flow.json', content: '{"nodes":[],"edges":[],"viewport":null}' }
    ],
    'Block Diagram': [
      { name: 'system_diagram.json', content: '{"nodes":[],"edges":[],"viewport":null}' }
    ],
    'Block Programming': [
      { name: 'logic_blocks.json', content: '{"blocks":[],"connections":[],"canvas":{"zoom":1,"position":{"x":0,"y":0}}}' }
    ],
    'Simulation': [
      { name: 'simulation.c', content: '// Simulation code\n#include <stdio.h>\n\nint main() {\n    printf("Hello Simulation!");\n    return 0;\n}\n' }
    ],
    'Code Editor': [
      { name: 'main.c', content: '// Main program\n#include <stdio.h>\n\nint main() {\n    printf("Hello World!");\n    return 0;\n}\n' }
    ]
  }
};

/**
 * Enhanced Project Manager for creating and managing project structures
 */
export class ProjectManager {
  constructor() {
    this.projectCache = new Map();
    this.loadProjectsFromStorage();
  }

  /**
   * Create a new project with automatic subfolder structure
   */
  async createProject({
    projectName,
    projectType = 'Bare Metal',
    board = 'STM32 L5',
    selectedDiagramTypes = [],
    userId,
    additionalOptions = {}
  }) {
    try {
      console.log('Creating project:', { projectName, projectType, selectedDiagramTypes });

      // Create main project folder
      const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const projectData = {
        id: projectId,
        name: projectName,
        type: projectType,
        board,
        createdAt: new Date().toISOString(),
        diagramTypes: selectedDiagramTypes,
        additionalOptions,
        folders: [],
        files: []
      };

      // Create diagram subfolders and default files
      for (const diagramType of selectedDiagramTypes) {
        const folderName = PROJECT_STRUCTURE.DIAGRAM_FOLDERS[diagramType];
        if (!folderName) continue;

        // Create subfolder
        const folderId = await this.createProjectFolder({
          userId,
          projectId,
          folderName,
          diagramType
        });

        projectData.folders.push({
          id: folderId,
          name: folderName,
          type: diagramType,
          createdAt: new Date().toISOString()
        });

        // Create default files for this diagram type
        const defaultFiles = PROJECT_STRUCTURE.DEFAULT_FILES[diagramType] || [];
        for (const fileTemplate of defaultFiles) {
          const fileId = await this.createProjectFile({
            userId,
            projectId: folderId,
            fileName: fileTemplate.name,
            content: fileTemplate.content,
            diagramType
          });

          projectData.files.push({
            id: fileId,
            name: fileTemplate.name,
            content: fileTemplate.content,
            folderId,
            folderName,
            diagramType,
            createdAt: new Date().toISOString(),
            path: `${projectName}/${folderName}/${fileTemplate.name}`
          });
        }
      }

      // Save project metadata
      await this.saveProjectMetadata(projectId, projectData);
      
      // Cache project data
      this.projectCache.set(projectId, projectData);

      // Trigger UI refresh
      this.notifyProjectChange('created', projectData);

      console.log('Project created successfully:', projectData);
      return projectData;

    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  /**
   * Create a project folder
   */
  async createProjectFolder({ userId, projectId, folderName, diagramType }) {
    try {
      const folderId = await ensureProjectFolder({
        userId,
        projectId,
        folderName
      });

      console.log(`Created folder: ${folderName} (${folderId})`);
      return folderId;
    } catch (error) {
      console.error(`Failed to create folder ${folderName}:`, error);
      throw error;
    }
  }

  /**
   * Create a project file
   */
  async createProjectFile({ userId, projectId, fileName, content, diagramType }) {
    try {
      const result = await saveProjectFile({
        userId,
        projectId,
        fileName,
        content
      });

      console.log(`Created file: ${fileName}`);
      return result.fileId || `file_${Date.now()}`;
    } catch (error) {
      console.error(`Failed to create file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Load file content for canvas
   */
  async loadFileForCanvas(fileId, projectId) {
    try {
      const project = this.projectCache.get(projectId);
      if (!project) {
        console.error('Project not found:', projectId);
        return null;
      }

      const file = project.files.find(f => f.id === fileId);
      if (!file) {
        console.error('File not found:', fileId);
        return null;
      }

      // Parse content based on diagram type
      let parsedContent = file.content;
      if (file.diagramType === 'Flowchart' || file.diagramType === 'Block Diagram') {
        try {
          parsedContent = JSON.parse(file.content);
        } catch (e) {
          console.warn('Failed to parse JSON content:', e);
        }
      }

      return {
        ...file,
        parsedContent
      };
    } catch (error) {
      console.error('Failed to load file for canvas:', error);
      return null;
    }
  }

  /**
   * Save file content from canvas
   */
  async saveFileFromCanvas(fileId, projectId, content, diagramType) {
    try {
      const project = this.projectCache.get(projectId);
      if (!project) return false;

      const fileIndex = project.files.findIndex(f => f.id === fileId);
      if (fileIndex === -1) return false;

      // Serialize content based on diagram type
      let serializedContent = content;
      if (diagramType === 'Flowchart' || diagramType === 'Block Diagram') {
        serializedContent = JSON.stringify(content, null, 2);
      }

      // Update cache
      project.files[fileIndex].content = serializedContent;
      project.files[fileIndex].lastModified = new Date().toISOString();

      // Save to storage
      await this.saveProjectMetadata(projectId, project);

      // Notify changes
      this.notifyProjectChange('file_updated', {
        projectId,
        fileId,
        fileName: project.files[fileIndex].name
      });

      return true;
    } catch (error) {
      console.error('Failed to save file from canvas:', error);
      return false;
    }
  }

  /**
   * Get project structure for File Explorer
   */
  getProjectStructure(projectId) {
    const project = this.projectCache.get(projectId);
    if (!project) return null;

    return {
      id: projectId,
      name: project.name,
      type: project.type,
      folders: project.folders.map(folder => ({
        ...folder,
        files: project.files.filter(f => f.folderId === folder.id)
      })),
      rootFiles: project.files.filter(f => !f.folderId)
    };
  }

  /**
   * Get all projects
   */
  getAllProjects() {
    return Array.from(this.projectCache.values());
  }

  /**
   * Save project metadata to storage
   */
  async saveProjectMetadata(projectId, projectData) {
    try {
      // Save to localStorage for persistence
      const storageKey = `project_${projectId}`;
      localStorage.setItem(storageKey, JSON.stringify(projectData));

      // Also save to projects index
      const projectsIndex = JSON.parse(localStorage.getItem('projects_index') || '[]');
      if (!projectsIndex.includes(projectId)) {
        projectsIndex.push(projectId);
        localStorage.setItem('projects_index', JSON.stringify(projectsIndex));
      }

      console.log('Project metadata saved:', projectId);
    } catch (error) {
      console.error('Failed to save project metadata:', error);
    }
  }

  /**
   * Load projects from storage
   */
  loadProjectsFromStorage() {
    try {
      const projectsIndex = JSON.parse(localStorage.getItem('projects_index') || '[]');
      
      for (const projectId of projectsIndex) {
        const storageKey = `project_${projectId}`;
        const projectData = localStorage.getItem(storageKey);
        
        if (projectData) {
          const parsed = JSON.parse(projectData);
          this.projectCache.set(projectId, parsed);
        }
      }

      console.log(`Loaded ${this.projectCache.size} projects from storage`);
    } catch (error) {
      console.error('Failed to load projects from storage:', error);
    }
  }

  /**
   * Notify UI about project changes
   */
  notifyProjectChange(action, data) {
    window.dispatchEvent(new CustomEvent('project:change', {
      detail: { action, data }
    }));
  }

  /**
   * Add file to existing project
   */
  async addFileToProject(projectId, folderId, fileName, content, diagramType) {
    try {
      const project = this.projectCache.get(projectId);
      if (!project) return null;

      const folder = project.folders.find(f => f.id === folderId);
      if (!folder) return null;

      const fileId = await this.createProjectFile({
        userId: 'current_user', // TODO: Get from context
        projectId: folderId,
        fileName,
        content,
        diagramType
      });

      const fileData = {
        id: fileId,
        name: fileName,
        content,
        folderId,
        folderName: folder.name,
        diagramType,
        createdAt: new Date().toISOString(),
        path: `${project.name}/${folder.name}/${fileName}`
      };

      project.files.push(fileData);
      await this.saveProjectMetadata(projectId, project);

      this.notifyProjectChange('file_added', fileData);
      return fileData;
    } catch (error) {
      console.error('Failed to add file to project:', error);
      return null;
    }
  }
}

// Export singleton instance
export const projectManager = new ProjectManager();
