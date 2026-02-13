/**
 * Enhanced Auto-Save Manager
 * Provides unified auto-save functionality across all IDE screens
 * Prevents data loss on tab changes, refresh, logout, and navigation
 */

class AutoSaveManager {
  constructor() {
    this.saveStrategies = new Map();
    this.activeScreens = new Set();
    this.autoSaveTimers = new Map();
    this.isInitialized = false;
    this.globalSaveTimer = null;
    this.lastSaveTime = new Map();

    // Configuration
    this.config = {
      autoSaveInterval: 30000, // 30 seconds global auto-save
      debounceDelay: 2000,     // 2 seconds debounce for changes
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: false
    };

    this.init();
  }

  /**
   * Initialize auto-save manager
   */
  init() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.startGlobalAutoSave();
    this.isInitialized = true;

    this.log('AutoSaveManager initialized');
  }

  /**
   * Register a save strategy for a specific screen
   * @param {string} screenKey - Unique identifier for the screen
   * @param {Function} saveFunction - Function that returns data to save
   * @param {Object} options - Save options
   */
  registerSaveStrategy(screenKey, saveFunction, options = {}) {
    const strategy = {
      save: saveFunction,
      options: {
        priority: options.priority || 1, // Higher priority = save first
        async: options.async !== false,
        skipEmpty: options.skipEmpty !== false,
        compression: options.compression || false,
        ...options
      },
      lastSaveTime: null,
      saveCount: 0,
      errorCount: 0
    };

    this.saveStrategies.set(screenKey, strategy);
    this.activeScreens.add(screenKey);

    this.log(`Registered save strategy for ${screenKey}`);
  }

  /**
   * Unregister a save strategy
   * @param {string} screenKey - Screen identifier to unregister
   */
  unregisterSaveStrategy(screenKey) {
    // Clear any pending timers
    if (this.autoSaveTimers.has(screenKey)) {
      clearTimeout(this.autoSaveTimers.get(screenKey));
      this.autoSaveTimers.delete(screenKey);
    }

    this.saveStrategies.delete(screenKey);
    this.activeScreens.delete(screenKey);
    this.lastSaveTime.delete(screenKey);

    this.log(`Unregistered save strategy for ${screenKey}`);
  }

  /**
   * Trigger immediate save for a specific screen
   * @param {string} screenKey - Screen to save
   * @param {Object} options - Save options
   */
  async saveScreen(screenKey, options = {}) {
    const strategy = this.saveStrategies.get(screenKey);
    if (!strategy) {
      this.log(`No save strategy found for ${screenKey}`, 'warn');
      return false;
    }

    try {
      const data = await strategy.save();

      // Skip if no data and skipEmpty is true
      if (strategy.options.skipEmpty && (!data || this.isEmpty(data))) {
        this.log(`Skipping empty save for ${screenKey}`);
        return true;
      }

      // Save to appropriate storage
      const success = await this.persistData(screenKey, data, strategy.options);

      if (success) {
        strategy.lastSaveTime = Date.now();
        strategy.saveCount++;
        strategy.errorCount = 0;
        this.lastSaveTime.set(screenKey, Date.now());

        this.log(`Successfully saved ${screenKey}`);

        // Dispatch save event
        window.dispatchEvent(new CustomEvent('autosave:screen-saved', {
          detail: { screenKey, data, timestamp: Date.now() }
        }));
      } else {
        strategy.errorCount++;
        this.log(`Failed to save ${screenKey}`, 'error');
      }

      return success;
    } catch (error) {
      strategy.errorCount++;
      this.log(`Error saving ${screenKey}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Trigger save for all registered screens
   * @param {Object} options - Save options
   */
  async saveAll(options = {}) {
    const { priority = false, parallel = true } = options;

    if (this.saveStrategies.size === 0) {
      this.log('No save strategies registered');
      return true;
    }

    this.log(`Starting save all (${this.saveStrategies.size} screens)`);

    // Get screens sorted by priority if requested
    let screensToSave = Array.from(this.saveStrategies.keys());
    if (priority) {
      screensToSave.sort((a, b) => {
        const priorityA = this.saveStrategies.get(a).options.priority;
        const priorityB = this.saveStrategies.get(b).options.priority;
        return priorityB - priorityA; // Higher priority first
      });
    }

    let results;
    if (parallel) {
      // Save all screens in parallel
      results = await Promise.allSettled(
        screensToSave.map(screenKey => this.saveScreen(screenKey))
      );
    } else {
      // Save screens sequentially
      results = [];
      for (const screenKey of screensToSave) {
        const result = await this.saveScreen(screenKey);
        results.push({ status: 'fulfilled', value: result });
      }
    }

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;

    this.log(`Save all completed: ${successful} successful, ${failed} failed`);

    // Dispatch global save event
    window.dispatchEvent(new CustomEvent('autosave:all-saved', {
      detail: { successful, failed, total: results.length, timestamp: Date.now() }
    }));

    return failed === 0;
  }

  /**
   * Schedule a debounced save for a specific screen
   * @param {string} screenKey - Screen to save
   * @param {number} delay - Debounce delay in milliseconds
   */
  scheduleSave(screenKey, delay = this.config.debounceDelay) {
    // Clear existing timer
    if (this.autoSaveTimers.has(screenKey)) {
      clearTimeout(this.autoSaveTimers.get(screenKey));
    }

    // Schedule new save
    const timer = setTimeout(async () => {
      await this.saveScreen(screenKey);
      this.autoSaveTimers.delete(screenKey);
    }, delay);

    this.autoSaveTimers.set(screenKey, timer);
    this.log(`Scheduled save for ${screenKey} in ${delay}ms`);
  }

  /**
   * Persist data to storage
   * @param {string} screenKey - Screen identifier
   * @param {*} data - Data to persist
   * @param {Object} options - Persistence options
   */
  async persistData(screenKey, data, options = {}) {
    try {
      let serializedData = data;

      // Serialize data if needed
      if (typeof data === 'object' && data !== null) {
        serializedData = JSON.stringify(data, null, options.compression ? 0 : 2);
      }

      // Get storage key
      const storageKey = this.getStorageKey(screenKey);

      // Add metadata
      const payload = {
        data: serializedData,
        metadata: {
          screenKey,
          timestamp: Date.now(),
          version: '1.0',
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };

      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(payload));

      // Also save to sessionStorage as backup
      sessionStorage.setItem(storageKey, JSON.stringify(payload));

      return true;
    } catch (error) {
      this.log(`Failed to persist data for ${screenKey}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Load data from storage
   * @param {string} screenKey - Screen identifier
   * @returns {*} - Loaded data or null
   */
  loadData(screenKey) {
    try {
      const storageKey = this.getStorageKey(screenKey);

      // Try localStorage first
      let stored = localStorage.getItem(storageKey);

      // Fallback to sessionStorage
      if (!stored) {
        stored = sessionStorage.getItem(storageKey);
      }

      if (!stored) {
        return null;
      }

      const payload = JSON.parse(stored);
      const { data, metadata } = payload;

      // Parse data if it's a JSON string
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // Data is not JSON, return as is
          parsedData = data;
        }
      }

      this.log(`Loaded data for ${screenKey} (saved at ${new Date(metadata.timestamp).toISOString()})`);
      return parsedData;
    } catch (error) {
      this.log(`Failed to load data for ${screenKey}: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Clear saved data for a screen
   * @param {string} screenKey - Screen identifier
   */
  clearData(screenKey) {
    try {
      const storageKey = this.getStorageKey(screenKey);
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
      this.log(`Cleared data for ${screenKey}`);
      return true;
    } catch (error) {
      this.log(`Failed to clear data for ${screenKey}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Setup event listeners for auto-save triggers
   */
  setupEventListeners() {
    // Save before page unload
    window.addEventListener('beforeunload', () => {
      this.log('Page unloading, triggering emergency save');
      this.saveAll({ parallel: false }); // Sequential to ensure completion
    });

    // Save when page becomes hidden (tab switch, minimize, etc.)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.log('Page hidden, triggering auto-save');
        this.saveAll();
      }
    });

    // Save on focus loss (alt+tab, clicking other window)
    window.addEventListener('blur', () => {
      this.log('Window lost focus, triggering auto-save');
      this.scheduleSave('global', 1000); // Quick save
    });

    // Save on route changes (for SPAs)
    if (window.history && window.history.pushState) {
      const originalPushState = window.history.pushState;
      window.history.pushState = (...args) => {
        this.log('Route change detected, triggering auto-save');
        this.saveAll({ parallel: false });
        return originalPushState.apply(window.history, args);
      };
    }

    // Listen for custom save requests
    window.addEventListener('autosave:request', (event) => {
      const { screenKey, immediate } = event.detail || {};
      if (screenKey) {
        if (immediate) {
          this.saveScreen(screenKey);
        } else {
          this.scheduleSave(screenKey);
        }
      } else {
        this.saveAll();
      }
    });

    // Listen for network status changes
    window.addEventListener('online', () => {
      this.log('Network restored, triggering sync save');
      this.saveAll();
    });

    window.addEventListener('offline', () => {
      this.log('Network lost, data will be saved locally');
    });

    this.log('Event listeners setup complete');
  }

  /**
   * Start global auto-save timer
   */
  startGlobalAutoSave() {
    if (this.globalSaveTimer) {
      clearInterval(this.globalSaveTimer);
    }

    this.globalSaveTimer = setInterval(() => {
      this.log('Global auto-save timer triggered');
      this.saveAll();
    }, this.config.autoSaveInterval);

    this.log(`Global auto-save started (${this.config.autoSaveInterval}ms interval)`);
  }

  /**
   * Stop global auto-save timer
   */
  stopGlobalAutoSave() {
    if (this.globalSaveTimer) {
      clearInterval(this.globalSaveTimer);
      this.globalSaveTimer = null;
      this.log('Global auto-save stopped');
    }
  }

  /**
   * Generate storage key for a screen
   * @param {string} screenKey - Screen identifier
   * @returns {string} - Storage key
   */
  getStorageKey(screenKey) {
    const userId = this.getCurrentUserId();
    const projectId = this.getCurrentProjectId();
    return `innoide:autosave:${userId}:${projectId}:${screenKey}`;
  }

  /**
   * Get current user ID from various sources
   * @returns {string} - User ID or 'anonymous'
   */
  getCurrentUserId() {
    // Try to get from various sources
    const sources = [
      () => window.localStorage.getItem('userId'),
      () => window.sessionStorage.getItem('userId'),
      () => window.localStorage.getItem('currentUserIdentity') && JSON.parse(window.localStorage.getItem('currentUserIdentity'))?.id,
      () => 'anonymous'
    ];

    for (const source of sources) {
      try {
        const userId = source();
        if (userId) return userId;
      } catch (e) {
        continue;
      }
    }

    return 'anonymous';
  }

  /**
   * Get current project ID
   * @returns {string} - Project ID or 'default'
   */
  getCurrentProjectId() {
    try {
      const stored = window.localStorage.getItem('currentProject');
      if (stored) {
        const project = JSON.parse(stored);
        return project.id || 'default';
      }
    } catch (e) {
      // Ignore
    }
    return 'default';
  }

  /**
   * Check if data is empty
   * @param {*} data - Data to check
   * @returns {boolean} - True if empty
   */
  isEmpty(data) {
    if (data === null || data === undefined) return true;
    if (typeof data === 'string') return data.trim().length === 0;
    if (Array.isArray(data)) return data.length === 0;
    if (typeof data === 'object') return Object.keys(data).length === 0;
    return false;
  }

  /**
   * Get save statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    const stats = {
      totalScreens: this.saveStrategies.size,
      activeScreens: this.activeScreens.size,
      totalSaves: 0,
      totalErrors: 0,
      lastSaveTime: null,
      screens: {}
    };

    for (const [screenKey, strategy] of this.saveStrategies) {
      stats.totalSaves += strategy.saveCount;
      stats.totalErrors += strategy.errorCount;

      if (strategy.lastSaveTime && (!stats.lastSaveTime || strategy.lastSaveTime > stats.lastSaveTime)) {
        stats.lastSaveTime = strategy.lastSaveTime;
      }

      stats.screens[screenKey] = {
        saveCount: strategy.saveCount,
        errorCount: strategy.errorCount,
        lastSaveTime: strategy.lastSaveTime,
        priority: strategy.options.priority
      };
    }

    return stats;
  }

  /**
   * Clean up old auto-save data
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    const now = Date.now();
    const keysToRemove = [];

    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('innoide:autosave:')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.metadata && data.metadata.timestamp) {
            const age = now - data.metadata.timestamp;
            if (age > maxAge) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          // Remove malformed entries
          keysToRemove.push(key);
        }
      }
    }

    // Remove old entries
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    this.log(`Cleaned up ${keysToRemove.length} old auto-save entries`);
  }

  /**
   * Logging utility
   * @param {string} message - Log message
   * @param {string} level - Log level
   */
  log(message, level = 'info') {
    if (!this.config.enableLogging) return;

    const timestamp = new Date().toISOString();
    const prefix = `[AutoSave][${timestamp}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  /**
   * Destroy the auto-save manager
   */
  destroy() {
    // Clear all timers
    for (const timer of this.autoSaveTimers.values()) {
      clearTimeout(timer);
    }
    this.autoSaveTimers.clear();

    if (this.globalSaveTimer) {
      clearInterval(this.globalSaveTimer);
      this.globalSaveTimer = null;
    }

    // Clear all registered strategies
    this.saveStrategies.clear();
    this.activeScreens.clear();
    this.lastSaveTime.clear();

    this.isInitialized = false;
    this.log('AutoSaveManager destroyed');
  }
}

// Create singleton instance
export const autoSaveManager = new AutoSaveManager();

// Export class for testing or custom instances
export { AutoSaveManager };

// Helper functions for common use cases
export const registerAutoSave = (screenKey, saveFunction, options) => {
  return autoSaveManager.registerSaveStrategy(screenKey, saveFunction, options);
};

export const triggerSave = (screenKey, options) => {
  return autoSaveManager.saveScreen(screenKey, options);
};

export const scheduleSave = (screenKey, delay) => {
  return autoSaveManager.scheduleSave(screenKey, delay);
};

export const loadAutoSaveData = (screenKey) => {
  return autoSaveManager.loadData(screenKey);
};

export const clearAutoSaveData = (screenKey) => {
  return autoSaveManager.clearData(screenKey);
};

// Export default
export default autoSaveManager;
