/**
 * IoT Simulator — generates realistic solar energy readings every 10 seconds.
 * Solar curve follows a sine wave peaking at noon.
 * Consumption varies by time-of-day with evening and afternoon peaks.
 */

let intervalId = null;
let liveData = {};
let batteryLevel = 65; // Start at 65%

/**
 * Get base consumption (kW) by hour of day
 */
function getBaseConsumption(hour) {
    if (hour >= 0 && hour <= 5) return 0.8;
    if (hour >= 6 && hour <= 8) return 2.2;
    if (hour >= 9 && hour <= 11) return 1.6;
    if (hour >= 12 && hour <= 14) return 3.0; // AC peak
    if (hour >= 15 && hour <= 17) return 1.8;
    if (hour >= 18 && hour <= 21) return 3.5; // Evening peak
    return 1.2; // 22-23
}

/**
 * Generate a single realistic energy reading
 */
export function generateReading(userId, solarKw, hour) {
    const h = hour ?? new Date().getHours();

    // Solar generation — sine curve from 6AM to 6PM, zero outside
    const solarMultiplier = Math.max(0, Math.sin(((h - 6) * Math.PI) / 12));
    const solarGen = solarKw * solarMultiplier * (0.85 + Math.random() * 0.15);

    // Consumption with slight randomness
    const baseConsumption = getBaseConsumption(h);
    const consumption = baseConsumption * (0.9 + Math.random() * 0.2);

    // Grid import/export
    const gridImport = Math.max(0, consumption - solarGen);
    const gridExport = Math.max(0, solarGen - consumption);

    // Battery: charges when exporting, drains when importing
    if (gridExport > 0) {
        batteryLevel = Math.min(100, batteryLevel + 2);
    } else if (gridImport > 0) {
        batteryLevel = Math.max(20, batteryLevel - 2);
    }

    // Voltage and frequency with realistic fluctuations
    const voltage = 230 + (Math.random() - 0.5) * 8;
    const frequency = 50 + (Math.random() - 0.5) * 0.4;

    const reading = {
        userId,
        hour: h,
        solarGen: parseFloat(solarGen.toFixed(2)),
        consumption: parseFloat(consumption.toFixed(2)),
        gridImport: parseFloat(gridImport.toFixed(2)),
        gridExport: parseFloat(gridExport.toFixed(2)),
        batteryLevel: Math.round(batteryLevel),
        voltage: parseFloat(voltage.toFixed(2)),
        frequency: parseFloat(frequency.toFixed(2)),
        timestamp: new Date().toISOString(),
    };

    return reading;
}

/**
 * Start the IoT simulation — generates a new reading every 10 seconds.
 * Calls onUpdate immediately with the first reading.
 * Returns a stop function.
 */
export function startSimulation(userId, solarKw, onUpdate) {
    // Clear any existing simulation
    if (intervalId) {
        clearInterval(intervalId);
    }

    // Generate and send first reading immediately
    const firstReading = generateReading(userId, solarKw);
    liveData = firstReading;
    onUpdate(firstReading);

    // Continue generating every 10 seconds
    intervalId = setInterval(() => {
        const reading = generateReading(userId, solarKw);
        liveData = reading;
        onUpdate(reading);
    }, 10000);

    // Create stop function
    const stopFn = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    // Store globally for cleanup on logout
    window.__ecoIoTStopFn = stopFn;

    console.log('[IoT] Simulation started for', userId, '— Solar:', solarKw, 'kW');
    return stopFn;
}

/**
 * Stop the current simulation
 */
export function stopSimulation() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[IoT] Simulation stopped');
    }
}

/**
 * Get the most recent live reading
 */
export function getLiveData() {
    return liveData;
}

/**
 * Reset battery level (useful for testing)
 */
export function resetBattery(level = 65) {
    batteryLevel = level;
}
