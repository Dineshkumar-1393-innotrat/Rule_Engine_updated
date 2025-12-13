import { useState, useCallback } from 'react';
import { projectManager } from '../utils/projectManager';
import { useProject } from '../ProjectContext';

/**
 * Hook for managing project creation workflow
 */
export const useProjectCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState(null);
  const { user, setActiveProjectId } = useProject();

  const createProject = useCallback(async (projectData) => {
    setIsCreating(true);
    setCreationError(null);

    try {
      const userId = user?.userId || user?._id || user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Parse additional options to determine diagram types
      const selectedDiagramTypes = [];
      
      if (projectData.additionalOptions?.writeCode) {
        selectedDiagramTypes.push('Code Editor');
      }
      if (projectData.additionalOptions?.flowChart) {
        selectedDiagramTypes.push('Flowchart');
      }
      if (projectData.additionalOptions?.blockDiagram) {
        selectedDiagramTypes.push('Block Diagram');
      }
      if (projectData.additionalOptions?.simulation) {
        selectedDiagramTypes.push('Simulation');
      }

      // Always include Block Programming as it's a core feature
      if (!selectedDiagramTypes.includes('Block Programming')) {
        selectedDiagramTypes.push('Block Programming');
      }

      console.log('Creating project with diagram types:', selectedDiagramTypes);

      const project = await projectManager.createProject({
        projectName: projectData.projectName,
        projectType: projectData.projectType,
        board: projectData.board,
        selectedDiagramTypes,
        userId,
        additionalOptions: projectData.additionalOptions || {}
      });

      // Set as active project
      if (setActiveProjectId) {
        setActiveProjectId(project.id);
      }

      // Notify success
      window.dispatchEvent(new CustomEvent('project:created', {
        detail: { project }
      }));

      console.log('Project created successfully:', project);
      return project;

    } catch (error) {
      console.error('Failed to create project:', error);
      setCreationError(error.message);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [user, setActiveProjectId]);

  const parseFormData = useCallback((formData) => {
    // Parse form data into structured format
    const projectData = {
      projectName: formData.get('projectName') || '',
      projectType: formData.get('projectType') || 'Bare Metal',
      board: formData.get('board') || 'STM32 L5',
      additionalOptions: {}
    };

    // Parse checkboxes for additional options
    const checkboxes = ['writeCode', 'flowChart', 'blockDiagram', 'simulation'];
    checkboxes.forEach(option => {
      projectData.additionalOptions[option] = formData.get(option) === 'on';
    });

    return projectData;
  }, []);

  const createProjectFromForm = useCallback(async (formElement) => {
    const formData = new FormData(formElement);
    const projectData = parseFormData(formData);
    
    if (!projectData.projectName.trim()) {
      throw new Error('Project name is required');
    }

    return await createProject(projectData);
  }, [createProject, parseFormData]);

  return {
    createProject,
    createProjectFromForm,
    isCreating,
    creationError,
    clearError: () => setCreationError(null)
  };
};
