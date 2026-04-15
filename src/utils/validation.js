/**
 * VIN Validation Utilities
 */

/**
 * Checks if a string is a valid 17-character alphanumeric VIN.
 * @param {string} vin 
 * @returns {boolean}
 */
export const isValidVin = (vin) => {
    if (!vin) return false;
    // Strict 17 characters, alphanumeric (A-Z, 0-9)
    const vinRegex = /^[A-Z0-9]{17}$/i;
    return vinRegex.test(vin);
};

/**
 * Formats a VIN string by converting to uppercase and removing non-alphanumeric characters.
 * @param {string} vin 
 * @returns {string}
 */
export const formatVin = (vin) => {
    if (!vin) return '';
    // Convert to uppercase and keep only A-Z and 0-9
    return vin.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
};
