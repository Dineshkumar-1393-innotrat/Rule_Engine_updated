import { projectManager } from './projectManager';

/**
 * Canvas Integration System for loading files into appropriate editors
 */
export class CanvasIntegration {
  constructor() {
    this.canvasHandlers = new Map();
    this.activeCanvas = null;
    this.setupEventListeners();
  }

  /**
   * Register canvas handler for a specific diagram type
   */
  registerCanvasHandler(diagramType, handler) {
    this.canvasHandlers.set(diagramType, handler);
    console.log(`Registered canvas handler for ${diagramType}`);
  }
  /**
   * Load file content into appropriate canvas
   */
  async loadFileToCanvas(fileData, projectId) {
    try {
      console.log('Loading file to canvas:', fileData);

      const { diagramType, parsedContent, name, id } = fileData;
      const handler = this.canvasHandlers.get(diagramType);

      if (!handler) {
        console.error(`No canvas handler registered for ${diagramType}`);
        return false;
      }

      // Set active canvas
      this.activeCanvas = { diagramType, fileId: id, projectId };

      // Load content into canvas
      const success = await handler.loadContent(parsedContent, {
        fileName: name,
        fileId: id,
        projectId,
        diagramType
      });

      if (success) {
        // Notify canvas loaded
        window.dispatchEvent(new CustomEvent('canvas:file-loaded', {
          detail: { fileData, diagramType }
        }));

        console.log(`Successfully loaded ${name} into ${diagramType} canvas`);
      }

      return success;
    } catch (error) {
      console.error('Failed to load file to canvas:', error);
      return false;
    }
  }

  /**
   * Save canvas content to file
   */
  async saveCanvasToFile() {
    if (!this.activeCanvas) {
      console.warn('No active canvas to save');
      return false;
    }

    try {
      const { diagramType, fileId, projectId } = this.activeCanvas;
      const handler = this.canvasHandlers.get(diagramType);

      if (!handler) {
        console.error(`No canvas handler registered for ${diagramType}`);
        return false;
      }

      // Get content from canvas
      const content = await handler.getContent();
      if (!content) {
        console.warn('No content to save from canvas');
        return false;
      }

      // Save to project manager
      const success = await projectManager.saveFileFromCanvas(
        fileId, 
        projectId, 
        content, 
        diagramType
      );

      if (success) {
        // Notify save complete
        window.dispatchEvent(new CustomEvent('canvas:file-saved', {
          detail: { fileId, projectId, diagramType }
        }));

        console.log(`Successfully saved canvas content to file ${fileId}`);
      }

      return success;
    } catch (error) {
      console.error('Failed to save canvas to file:', error);
      return false;
    }
  }

  /**
   * Auto-save canvas content periodically
   */
  startAutoSave(interval = 5000) {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      if (this.activeCanvas) {
        this.saveCanvasToFile();
      }
    }, interval);

    console.log(`Started auto-save with ${interval}ms interval`);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('Stopped auto-save');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for canvas changes
    window.addEventListener('canvas:content-changed', () => {
      // Trigger save after short delay
      if (this.contentChangeTimer) {
        clearTimeout(this.contentChangeTimer);
      }
      
      this.contentChangeTimer = setTimeout(() => {
        this.saveCanvasToFile();
      }, 2000);
    });

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.activeCanvas) {
        // Save before page becomes hidden
        this.saveCanvasToFile();
      }
    });

    // Listen for beforeunload to save
    window.addEventListener('beforeunload', () => {
      if (this.activeCanvas) {
        this.saveCanvasToFile();
      }
    });
  }

  /**
   * Get current canvas state
   */
  getActiveCanvas() {
    return this.activeCanvas;
  }

  /**
   * Clear active canvas
   */
  clearActiveCanvas() {
    this.activeCanvas = null;
  }
}

/**
 * Canvas Handler Interface
 * Each diagram type should implement this interface
 */
export class BaseCanvasHandler {
  constructor(canvasType) {
    this.canvasType = canvasType;
  }

  /**
   * Load content into canvas
   * @param {*} content - Parsed content from file
   * @param {Object} metadata - File metadata
   * @returns {Promise<boolean>} - Success status
   */
  async loadContent(content, metadata) {
    throw new Error('loadContent method must be implemented');
  }

  /**
   * Get current canvas content
   * @returns {Promise<*>} - Canvas content ready for saving
   */
  async getContent() {
    throw new Error('getContent method must be implemented');
  }

  /**
   * Clear canvas content
   */
  async clearContent() {
    // Optional: implement if needed
  }

  /**
   * Validate content before loading
   * @param {*} content - Content to validate
   * @returns {boolean} - Is content valid
   */
  validateContent(content) {
    return true; // Default: accept all content
  }
}

/**
 * React Flow Canvas Handler (for Block Diagram & Flowchart)
 */
export class ReactFlowCanvasHandler extends BaseCanvasHandler {
  constructor(canvasType, reactFlowInstance, setNodes, setEdges) {
    super(canvasType);
    this.reactFlowInstance = reactFlowInstance;
    this.setNodes = setNodes;
    this.setEdges = setEdges;
  }

  async loadContent(content, metadata) {
    try {
      // Validate content structure
      if (!this.validateContent(content)) {
        console.error('Invalid content structure for ReactFlow');
        return false;
      }

      const { nodes = [], edges = [], viewport } = content;

      // Update ReactFlow state
      this.setNodes(nodes);
      this.setEdges(edges);

      // Set viewport if available
      if (viewport && this.reactFlowInstance) {
        setTimeout(() => {
          this.reactFlowInstance.setViewport(viewport);
        }, 100);
      }

      return true;
    } catch (error) {
      console.error('Failed to load content to ReactFlow:', error);
      return false;
    }
  }

  async getContent() {
    try {
      if (!this.reactFlowInstance) {
        return null;
      }

      const nodes = this.reactFlowInstance.getNodes();
      const edges = this.reactFlowInstance.getEdges();
      const viewport = this.reactFlowInstance.getViewport();

      return {
        nodes: nodes.map(node => ({
          ...node,
          selected: false, // Don't save selection state
          dragging: false  // Don't save dragging state
        })),
        edges: edges.map(edge => ({
          ...edge,
          selected: false  // Don't save selection state
        })),
        viewport
      };
    } catch (error) {
      console.error('Failed to get content from ReactFlow:', error);
      return null;
    }
  }

  validateContent(content) {
    if (typeof content !== 'object' || content === null) {
      return false;
    }

    // Check for required structure
    if (content.nodes && !Array.isArray(content.nodes)) {
      return false;
    }

    if (content.edges && !Array.isArray(content.edges)) {
      return false;
    }

    return true;
  }
}

/**
 * Text Editor Canvas Handler (for Code Editor & Simulation)
 */
export class TextEditorCanvasHandler extends BaseCanvasHandler {
  constructor(canvasType, textAreaRef) {
    super(canvasType);
    this.textAreaRef = textAreaRef;
  }

  async loadContent(content, metadata) {
    try {
      if (this.textAreaRef?.current) {
        this.textAreaRef.current.value = content || '';
        
        // Trigger change event for any listeners
        const event = new Event('input', { bubbles: true });
        this.textAreaRef.current.dispatchEvent(event);
      }

      return true;
    } catch (error) {
      console.error('Failed to load content to text editor:', error);
      return false;
    }
  }

  async getContent() {
    try {
      return this.textAreaRef?.current?.value || '';
    } catch (error) {
      console.error('Failed to get content from text editor:', error);
      return null;
    }
  }
}

// Export singleton instance
export const canvasIntegration = new CanvasIntegration();
