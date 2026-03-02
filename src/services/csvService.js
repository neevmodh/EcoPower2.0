import Papa from 'papaparse';

// In-memory cache: Map<filename, { data: [], timestamp: number }>
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Load and parse a CSV file from /public/data/
 * Results are cached for 30 seconds.
 */
export async function loadCSV(filename) {
    // Check cache
    const cached = cache.get(filename);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const response = await fetch('/data/' + filename);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filename}: ${response.status}`);
        }
        const text = await response.text();
        const result = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
        });

        const rows = result.data;
        console.log('[CSV] Loaded:', filename, rows.length, 'rows');

        // Cache the result
        cache.set(filename, { data: rows, timestamp: Date.now() });

        return rows;
    } catch (error) {
        console.error('[CSV] Error loading', filename, error);
        return [];
    }
}

/**
 * Convert an array of objects to CSV and trigger a browser download.
 */
export function saveToCSV(filename, dataArray) {
    try {
        const csvString = Papa.unparse(dataArray);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('[CSV] Downloaded:', filename);
        return true;
    } catch (error) {
        console.error('[CSV] Error saving', filename, error);
        return false;
    }
}

/**
 * Append a new row to a CSV dataset.
 * Updates in-memory cache and offers download.
 */
export async function appendToCSV(filename, newRow) {
    const data = await loadCSV(filename);
    data.push(newRow);

    // Update cache
    cache.set(filename, { data, timestamp: Date.now() });

    // Offer download
    saveToCSV(filename, data);

    console.log('[CSV] Appended row to', filename, '→ total', data.length, 'rows');
    return data;
}

/**
 * Update a row in a CSV dataset by ID.
 * Merges updatedFields into the existing row.
 */
export async function updateInCSV(filename, id, updatedFields) {
    const data = await loadCSV(filename);
    const index = data.findIndex((row) => row.id === id);

    if (index === -1) {
        console.warn('[CSV] Row not found:', id, 'in', filename);
        return data;
    }

    data[index] = { ...data[index], ...updatedFields };

    // Update cache
    cache.set(filename, { data, timestamp: Date.now() });

    console.log('[CSV] Updated row', id, 'in', filename);
    return data;
}

/**
 * Delete a row from a CSV dataset by ID.
 */
export async function deleteFromCSV(filename, id) {
    const data = await loadCSV(filename);
    const filtered = data.filter((row) => row.id !== id);

    // Update cache
    cache.set(filename, { data: filtered, timestamp: Date.now() });

    console.log('[CSV] Deleted row', id, 'from', filename, '→', filtered.length, 'remaining');
    return filtered;
}

/**
 * Update the in-memory cache directly (for React Context mutations).
 */
export function updateCache(filename, data) {
    cache.set(filename, { data, timestamp: Date.now() });
}

/**
 * Clear all cached data.
 */
export function clearCache() {
    cache.clear();
    console.log('[CSV] Cache cleared');
}

/**
 * Export the cached version of a file (triggers download).
 */
export function exportCSV(filename) {
    const cached = cache.get(filename);
    if (cached) {
        return saveToCSV(filename, cached.data);
    }
    console.warn('[CSV] No cached data for', filename);
    return false;
}
