export const formatFullDate = (ts) => {
    if (!ts) return '-';
    try {
        let date = new Date(ts);
        // Handle numeric strings (Unix timestamps like 1775055158075)
        if (isNaN(date.getTime()) && !isNaN(Number(ts))) {
            date = new Date(Number(ts));
        }
        if (isNaN(date.getTime())) return String(ts);
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        const h = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        return `${d}/${m}/${y} ${h}:${min}:${s}`;
    } catch (e) {
        return String(ts);
    }
};

/**
 * Deeply traverses an object or array and formats any 13-digit numbers
 * into a human-readable DD/MM/YYYY HH:MM:SS string.
 */
export const deepFormatDates = (obj) => {
    if (!obj || typeof obj !== 'object') {
        if ((typeof obj === 'number' || (typeof obj === 'string' && !isNaN(Number(obj)))) && String(obj).length === 13) {
            return formatFullDate(obj);
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepFormatDates(item));
    }

    const formatted = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            if ((key.toLowerCase().includes('time') || key.toLowerCase().includes('stamp') || key.toLowerCase().includes('date')) &&
                (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)))) && String(val).length === 13) {
                formatted[key] = formatFullDate(val);
            } else {
                formatted[key] = deepFormatDates(val);
            }
        }
    }
    return formatted;
};
