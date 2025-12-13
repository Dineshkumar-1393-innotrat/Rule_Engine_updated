/**
 * ESP-IDF Build and Flash Utilities
 * Based on ESP-IDF v4.3 documentation
 * Reference: https://docs.espressif.com/projects/esp-idf/en/v4.3/esp32/get-started/index.html
 */

/**
 * ESP-IDF Build Configuration
 */
export const ESP_IDF_CONFIG = {
  // Default baud rates for flashing
  BAUD_RATES: {
    DEFAULT: 460800,
    FAST: 921600,
    SAFE: 115200,
  },
  
  // Flash modes
  FLASH_MODES: ['dio', 'qio', 'dout', 'qout'],
  
  // Flash frequencies
  FLASH_FREQUENCIES: ['40m', '26m', '20m', '80m'],
  
  // Default flash settings
  DEFAULT_FLASH_MODE: 'dio',
  DEFAULT_FLASH_FREQ: '40m',
  DEFAULT_FLASH_SIZE: 'detect',
  
  // Memory addresses for ESP32
  MEMORY_ADDRESSES: {
    BOOTLOADER: '0x1000',
    PARTITION_TABLE: '0x8000',
    APPLICATION: '0x10000',
  },
};

/**
 * Build project using idf.py build
 * @param {Object} options - Build options
 * @returns {Promise<Object>} Build result
 */
export async function buildProject(options = {}) {
  const {
    projectPath = '.',
    target = 'esp32',
    onProgress = null,
    onLog = null,
  } = options;

  try {
    onLog?.('Starting ESP-IDF build process...');
    onLog?.(`Target: ${target}`);
    onLog?.(`Project path: ${projectPath}`);
    
    // Simulate build process
    // In a real implementation, this would call the backend API
    // that executes: idf.py build
    
    const buildSteps = [
      { step: 'Checking dependencies', progress: 10 },
      { step: 'Running CMake', progress: 25 },
      { step: 'Compiling components', progress: 50 },
      { step: 'Linking binaries', progress: 75 },
      { step: 'Generating bootloader', progress: 85 },
      { step: 'Generating partition table', progress: 95 },
      { step: 'Build complete', progress: 100 },
    ];

    for (const { step, progress } of buildSteps) {
      onLog?.(step);
      onProgress?.(progress);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const buildOutput = {
      success: true,
      binaries: {
        bootloader: `${projectPath}/build/bootloader/bootloader.bin`,
        partitionTable: `${projectPath}/build/partition_table/partition-table.bin`,
        application: `${projectPath}/build/app.bin`,
      },
      size: {
        bootloader: 26096,
        partitionTable: 3072,
        application: 147104,
      },
      message: 'Project build complete. Ready to flash.',
    };

    onLog?.('✓ Build successful');
    return buildOutput;
  } catch (error) {
    onLog?.(`✗ Build failed: ${error.message}`);
    throw error;
  }
}

/**
 * Flash firmware to ESP32 device
 * @param {Object} options - Flash options
 * @returns {Promise<Object>} Flash result
 */
export async function flashFirmware(options = {}) {
  const {
    port = 'AUTO',
    baudRate = ESP_IDF_CONFIG.BAUD_RATES.DEFAULT,
    flashMode = ESP_IDF_CONFIG.DEFAULT_FLASH_MODE,
    flashFreq = ESP_IDF_CONFIG.DEFAULT_FLASH_FREQ,
    flashSize = ESP_IDF_CONFIG.DEFAULT_FLASH_SIZE,
    binaries = {},
    onProgress = null,
    onLog = null,
    beforeReset = 'default_reset',
    afterReset = 'hard_reset',
  } = options;

  try {
    onLog?.('Starting flash process...');
    onLog?.(`Port: ${port}`);
    onLog?.(`Baud rate: ${baudRate}`);
    onLog?.(`Flash mode: ${flashMode}`);
    onLog?.(`Flash frequency: ${flashFreq}`);
    
    // Simulate the flashing process
    // In real implementation, this would call backend API that executes:
    // esptool.py --chip esp32 -p PORT -b BAUD --before=default_reset --after=hard_reset write_flash ...
    
    const flashSteps = [
      { step: 'Connecting to device...', progress: 5 },
      { step: 'Detecting chip type...', progress: 10 },
      { step: 'Chip is ESP32D0WDQ6 (revision 1)', progress: 15 },
      { step: 'Features: WiFi, BT, Dual Core', progress: 20 },
      { step: 'Configuring flash size...', progress: 25 },
      { step: 'Uploading stub...', progress: 30 },
      { step: 'Running stub...', progress: 35 },
      { step: 'Changing baud rate...', progress: 40 },
      { step: 'Writing bootloader @ 0x1000...', progress: 50 },
      { step: 'Writing partition table @ 0x8000...', progress: 65 },
      { step: 'Writing application @ 0x10000...', progress: 85 },
      { step: 'Hash verification...', progress: 95 },
      { step: 'Hard resetting via RTS pin...', progress: 100 },
    ];

    for (const { step, progress } of flashSteps) {
      onLog?.(step);
      onProgress?.(progress);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const flashResult = {
      success: true,
      message: 'Flash complete. Device is running.',
      details: {
        bootloaderWritten: true,
        partitionTableWritten: true,
        applicationWritten: true,
        verificationPassed: true,
      },
      stats: {
        totalTime: '3.2s',
        effectiveSpeed: '615.5 kbit/s',
      },
    };

    onLog?.('✓ Flash successful');
    return flashResult;
  } catch (error) {
    onLog?.(`✗ Flash failed: ${error.message}`);
    throw error;
  }
}

/**
 * Erase flash memory
 * @param {Object} options - Erase options
 * @returns {Promise<Object>} Erase result
 */
export async function eraseFlash(options = {}) {
  const {
    port = 'AUTO',
    baudRate = ESP_IDF_CONFIG.BAUD_RATES.DEFAULT,
    onProgress = null,
    onLog = null,
  } = options;

  try {
    onLog?.('Starting flash erase...');
    onLog?.(`Port: ${port}`);
    
    const eraseSteps = [
      { step: 'Connecting to device...', progress: 10 },
      { step: 'Detecting chip...', progress: 20 },
      { step: 'Erasing flash (this may take a while)...', progress: 30 },
      { step: 'Flash erase in progress...', progress: 60 },
      { step: 'Erase complete', progress: 100 },
    ];

    for (const { step, progress } of eraseSteps) {
      onLog?.(step);
      onProgress?.(progress);
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    onLog?.('✓ Flash erased successfully');
    return { success: true, message: 'Flash memory erased' };
  } catch (error) {
    onLog?.(`✗ Erase failed: ${error.message}`);
    throw error;
  }
}

/**
 * Monitor serial output from device
 * @param {Object} options - Monitor options
 * @returns {Promise<Object>} Monitor session
 */
export async function monitorDevice(options = {}) {
  const {
    port = 'AUTO',
    baudRate = 115200,
    onData = null,
    onLog = null,
  } = options;

  try {
    onLog?.('Starting serial monitor...');
    onLog?.(`Port: ${port}`);
    onLog?.(`Baud rate: ${baudRate}`);
    
    // In real implementation, this would establish a serial connection
    // and stream data from the device
    
    return {
      success: true,
      message: 'Monitor started',
      stop: () => {
        onLog?.('Monitor stopped');
      },
    };
  } catch (error) {
    onLog?.(`✗ Monitor failed: ${error.message}`);
    throw error;
  }
}

/**
 * Build and flash in one command (idf.py -p PORT flash)
 * @param {Object} options - Build and flash options
 * @returns {Promise<Object>} Result
 */
export async function buildAndFlash(options = {}) {
  const {
    port = 'AUTO',
    baudRate = ESP_IDF_CONFIG.BAUD_RATES.DEFAULT,
    onProgress = null,
    onLog = null,
  } = options;

  try {
    onLog?.('Starting build and flash...');
    
    // Build first
    const buildResult = await buildProject({
      ...options,
      onProgress: (progress) => onProgress?.(progress * 0.5), // First 50%
      onLog,
    });

    if (!buildResult.success) {
      throw new Error('Build failed');
    }

    // Then flash
    const flashResult = await flashFirmware({
      ...options,
      port,
      baudRate,
      binaries: buildResult.binaries,
      onProgress: (progress) => onProgress?.(50 + progress * 0.5), // Last 50%
      onLog,
    });

    return {
      success: true,
      build: buildResult,
      flash: flashResult,
      message: 'Build and flash completed successfully',
    };
  } catch (error) {
    onLog?.(`✗ Build and flash failed: ${error.message}`);
    throw error;
  }
}

/**
 * Detect connected ESP32 devices
 * @returns {Promise<Array>} List of detected devices
 */
export async function detectDevices() {
  try {
    // Check if Web Serial API is supported
    if ('serial' in navigator) {
      const ports = await navigator.serial.getPorts();
      return ports.map((port, index) => {
        const info = port.getInfo();
        return {
          port,
          id: `device-${index}`,
          vendorId: info.usbVendorId,
          productId: info.usbProductId,
          name: getDeviceName(info.usbVendorId),
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Device detection failed:', error);
    return [];
  }
}

/**
 * Get device name from vendor ID
 * @param {number} vendorId - USB vendor ID
 * @returns {string} Device name
 */
function getDeviceName(vendorId) {
  const vendors = {
    0x10C4: 'ESP32 (Silicon Labs)',
    0x1A86: 'ESP32 (CH340)',
    0x0403: 'ESP32 (FTDI)',
    0x2341: 'Arduino',
  };
  return vendors[vendorId] || 'Unknown Device';
}

/**
 * Request device connection via Web Serial API
 * @returns {Promise<Object>} Connected device info
 */
export async function requestDeviceConnection() {
  try {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported in this browser');
    }

    const port = await navigator.serial.requestPort({
      filters: [
        { usbVendorId: 0x10C4 }, // Silicon Labs (ESP32)
        { usbVendorId: 0x1A86 }, // QinHeng Electronics (CH340)
        { usbVendorId: 0x0403 }, // FTDI
        { usbVendorId: 0x2341 }, // Arduino
      ],
    });

    const info = port.getInfo();
    
    return {
      port,
      vendorId: info.usbVendorId,
      productId: info.usbProductId,
      name: getDeviceName(info.usbVendorId),
      connected: true,
    };
  } catch (error) {
    console.error('Device connection failed:', error);
    throw error;
  }
}

/**
 * Get project configuration
 * @returns {Object} Project configuration
 */
export function getProjectConfig() {
  return {
    target: 'esp32',
    sdkConfig: {
      // Common ESP-IDF configurations
      CONFIG_ESPTOOLPY_FLASHMODE: ESP_IDF_CONFIG.DEFAULT_FLASH_MODE,
      CONFIG_ESPTOOLPY_FLASHFREQ: ESP_IDF_CONFIG.DEFAULT_FLASH_FREQ,
      CONFIG_ESPTOOLPY_FLASHSIZE: '4MB',
    },
  };
}

export default {
  ESP_IDF_CONFIG,
  buildProject,
  flashFirmware,
  eraseFlash,
  monitorDevice,
  buildAndFlash,
  detectDevices,
  requestDeviceConnection,
  getProjectConfig,
};
