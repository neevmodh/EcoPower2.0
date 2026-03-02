const fs = require('fs');
const path = require('path');

const publicDataDir = path.join(__dirname, 'public', 'data');

// Utility to offset a YYYY-MM-DD string by N days
function offsetDateString(dateStr, deltaDays) {
    if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr;
    const baseStr = dateStr.substring(0, 10);
    const timeStr = dateStr.length > 10 ? dateStr.substring(10) : '';
    const d = new Date(baseStr);
    d.setUTCDate(d.getUTCDate() + deltaDays);
    const newDateStr = d.toISOString().split('T')[0];
    return newDateStr + timeStr;
}

// Ensure the latest energy reading lands precisely on TODAY (local time)
const todayStr = new Date().toISOString().split('T')[0];

function shiftFileDates(filename, dateColumns) {
    const filePath = path.join(publicDataDir, filename);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    if (lines.length < 2) return;

    const headers = lines[0].split(',');
    const dateColIndices = dateColumns.map(col => headers.indexOf(col)).filter(i => i !== -1);

    if (dateColIndices.length === 0) return;

    // First pass: find the maximum date in the file to compute delta
    let maxDateStr = '1970-01-01';
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(',');
        for (const idx of dateColIndices) {
            const dStr = columns[idx]?.substring(0, 10);
            if (dStr && dStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                if (dStr > maxDateStr) maxDateStr = dStr;
            }
        }
    }

    if (maxDateStr === '1970-01-01') return; // No valid dates found

    const maxDate = new Date(maxDateStr);
    const today = new Date(todayStr);
    const deltaMs = today.getTime() - maxDate.getTime();
    const deltaDays = Math.round(deltaMs / (1000 * 60 * 60 * 24));

    if (deltaDays === 0) {
        console.log(`No offset needed for ${filename}. Latest date is already today.`);
        return;
    }

    console.log(`Shifting ${filename} dates by +${deltaDays} days...`);

    // Second pass: apply offset
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        let columns = lines[i].split(',');
        for (const idx of dateColIndices) {
            if (columns[idx]) {
                columns[idx] = offsetDateString(columns[idx], deltaDays);
            }
        }
        lines[i] = columns.join(',');
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

// 1. Shift Dates dynamically to Today
shiftFileDates('energy_readings.csv', ['date', 'timestamp']);
shiftFileDates('invoices.csv', ['date', 'dueDate']);
shiftFileDates('support_tickets.csv', ['createdAt', 'updatedAt']);
shiftFileDates('grid_transactions.csv', ['date']);
shiftFileDates('notifications.csv', ['date']);
shiftFileDates('subscriptions.csv', ['startDate', 'endDate', 'nextBillingDate']);

// 2. We need at least 7 days of data for EnergyReadings so charts don't look empty.
// If the file only has 2 days, duplicate it to span 10 days.
let erContent = fs.readFileSync(path.join(publicDataDir, 'energy_readings.csv'), 'utf8');
let erLines = erContent.split('\n').filter(l => l.trim().length > 0);
let dataLines = erLines.slice(1);

if (dataLines.length < 24 * 7) {
    console.log("Generating extra historical energy readings...");
    // Just clone the existing days backwards
    const headers = erLines[0];
    const newLines = [];
    let idCounter = 1000;

    // We'll generate 14 days of data total.
    for (let dayOffset = 14; dayOffset >= 1; dayOffset--) {
        const targetDate = new Date();
        targetDate.setUTCDate(targetDate.getUTCDate() - dayOffset);
        const dayStr = targetDate.toISOString().split('T')[0];

        // Grab a random day from the existing set as a template (0 to 23 hours)
        const templateDay = dataLines.slice(0, 24);

        for (let h = 0; h < 24; h++) {
            if (!templateDay[h]) continue;
            let cols = templateDay[h].split(',');
            // Modifying ID and Dates
            cols[0] = `ER${idCounter++}`;
            cols[2] = dayStr;
            cols[11] = `${dayStr} ${cols[3].padStart(2, '0')}:00:00`;

            // Introduce some random noise to solarGen and consumption to make it look realistic
            const solar = Math.max(0, parseFloat(cols[4]) + (Math.random() * 2 - 1));
            const cons = Math.max(0, parseFloat(cols[5]) + (Math.random() * 1.5 - 0.75));
            cols[4] = solar.toFixed(2);
            cols[5] = cons.toFixed(2);

            newLines.push(cols.join(','));
        }
    }

    // Combine headers with new historical lines + the few lines we already had for today/yesterday
    const finalLines = [headers, ...newLines, ...dataLines];
    fs.writeFileSync(path.join(publicDataDir, 'energy_readings.csv'), finalLines.join('\n'), 'utf8');
    console.log("Dynamically padded energy_readings.csv to 14+ days for full chart render.");
}

console.log("Realistic Demo Date Reseeding Complete!");
