/**
 * Project Import/Export System
 * Handles backup and restore of complete projects with all files and metadata
 */

import projectFileManager from './projectFileManager';

/**
 * Export a single project as JSON
 */
export const exportProject = async (projectId) => {
  try {
    const project = projectFileManager.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const projectFiles = projectFileManager.getProjectFiles()[projectId] || {};
    
    // Create export package
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      project: {
        ...project,
        // Remove internal IDs for clean import
        id: undefined
      },
      files: projectFiles,
      metadata: {
        fileCount: Object.keys(projectFiles).length,
        projectSize: JSON.stringify(projectFiles).length,
        originalId: projectId
      }
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_backup_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Project exported successfully:', project.name);
    return {
      success: true,
      projectName: project.name,
      fileCount: exportData.metadata.fileCount
    };

  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

/**
 * Export all projects as a single backup file
 */
export const exportAllProjects = async () => {
  try {
    const allProjects = projectFileManager.getAllProjects();
    const allProjectFiles = projectFileManager.getProjectFiles();
    
    if (Object.keys(allProjects).length === 0) {
      throw new Error('No projects to export');
    }

    // Create comprehensive backup
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      type: 'full_backup',
      projects: Object.values(allProjects).map(project => ({
        ...project,
        id: undefined // Remove for clean import
      })),
      projectFiles: allProjectFiles,
      metadata: {
        totalProjects: Object.keys(allProjects).length,
        totalFiles: Object.values(allProjectFiles).reduce((acc, files) => acc + Object.keys(files).length, 0),
        backupSize: JSON.stringify(allProjectFiles).length,
        originalProjectIds: Object.keys(allProjects)
      }
    };

    // Create and download backup file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InnoIDE_Full_Backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Full backup exported successfully');
    return {
      success: true,
      projectCount: exportData.metadata.totalProjects,
      fileCount: exportData.metadata.totalFiles
    };

  } catch (error) {
    console.error('Full backup export failed:', error);
    throw error;
  }
};

/**
 * Import a project from backup file
 */
export const importProject = async (file, options = {}) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Read file content
    const content = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });

    // Parse backup data
    let importData;
    try {
      importData = JSON.parse(content);
    } catch (e) {
      throw new Error('Invalid backup file format');
    }

    // Validate backup format
    if (!importData.version || (!importData.project && !importData.projects)) {
      throw new Error('Invalid backup file structure');
    }

    const results = [];

    if (importData.type === 'full_backup' && importData.projects) {
      // Full backup import
      for (const projectData of importData.projects) {
        const result = await importSingleProject(projectData, importData.projectFiles, options);
        results.push(result);
      }
    } else if (importData.project) {
      // Single project import
      const result = await importSingleProject(importData.project, { [importData.metadata?.originalId || 'unknown']: importData.files }, options);
      results.push(result);
    } else {
      throw new Error('Unsupported backup format');
    }

    // Trigger file system refresh
    window.dispatchEvent(new CustomEvent('file-system-refresh'));
    window.dispatchEvent(new CustomEvent('projects-imported', { 
      detail: { results, count: results.length } 
    }));

    console.log('Import completed successfully:', results);
    return {
      success: true,
      imported: results.length,
      results
    };

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
};

/**
 * Import a single project with conflict resolution
 */
const importSingleProject = async (projectData, allFiles, options = {}) => {
  const { 
    overwriteExisting = false, 
    renameConflicts = true,
    preserveIds = false 
  } = options;

  try {
    let projectName = projectData.name;
    let finalProjectName = projectName;

    // Check for name conflicts
    const existingProjects = Object.values(projectFileManager.getAllProjects());
    const nameExists = existingProjects.some(p => p.name === projectName);

    if (nameExists && !overwriteExisting) {
      if (renameConflicts) {
        let counter = 1;
        while (existingProjects.some(p => p.name === `${projectName} (${counter})`)) {
          counter++;
        }
        finalProjectName = `${projectName} (${counter})`;
      } else {
        throw new Error(`Project "${projectName}" already exists`);
      }
    }

    // Create new project
    const newProject = projectFileManager.createProject({
      projectName: finalProjectName,
      projectType: projectData.type || 'bare metal',
      boardType: projectData.board || 'STM32 U5',
      selectedFeature: projectData.selectedFeature || 'writeCode',
      userId: projectData.userId || 'imported_user'
    });

    // Import files
    const originalProjectId = Object.keys(allFiles)[0];
    const projectFiles = allFiles[originalProjectId] || {};
    let importedFileCount = 0;

    for (const [filePath, fileData] of Object.entries(projectFiles)) {
      try {
        projectFileManager.saveFile(newProject.id, filePath, fileData.content);
        importedFileCount++;
      } catch (fileError) {
        console.warn(`Failed to import file ${filePath}:`, fileError);
      }
    }

    return {
      projectId: newProject.id,
      originalName: projectName,
      importedName: finalProjectName,
      fileCount: importedFileCount,
      renamed: finalProjectName !== projectName,
      success: true
    };

  } catch (error) {
    return {
      originalName: projectData.name,
      error: error.message,
      success: false
    };
  }
};

/**
 * Utility to create project backup trigger
 */
export const triggerProjectBackup = (projectId) => {
  return exportProject(projectId);
};

/**
 * Utility to create full backup trigger
 */
export const triggerFullBackup = () => {
  return exportAllProjects();
};

/**
 * Utility to handle file import
 */
export const handleFileImport = (inputElement, options = {}) => {
  return new Promise((resolve, reject) => {
    const input = inputElement || document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const result = await importProject(file, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('No file selected'));
      }
    };

    input.click();
  });
};

/**
 * Get backup statistics
 */
export const getBackupStats = () => {
  const allProjects = projectFileManager.getAllProjects();
  const allFiles = projectFileManager.getProjectFiles();
  
  return {
    totalProjects: Object.keys(allProjects).length,
    totalFiles: Object.values(allFiles).reduce((acc, files) => acc + Object.keys(files).length, 0),
    totalSize: JSON.stringify(allFiles).length,
    lastModified: Math.max(...Object.values(allProjects).map(p => new Date(p.lastModified).getTime())),
    projects: Object.values(allProjects).map(p => ({
      id: p.id,
      name: p.name,
      fileCount: Object.keys(allFiles[p.id] || {}).length,
      lastModified: p.lastModified
    }))
  };
};

export default {
  exportProject,
  exportAllProjects,
  importProject,
  triggerProjectBackup,
  triggerFullBackup,
  handleFileImport,
  getBackupStats
};
