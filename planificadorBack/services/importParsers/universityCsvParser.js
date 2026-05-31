/**
 * Parses the university CSV export format.
 * Columns: Subject, Start Date, Start Time, End Date, End Time, Description, Location
 * Date format: DD/MM/YYYY   Time format: H.MM  (dot separates hours from minutes)
 * Event title: "Subject - Location"
 */

function parseDateTime(dateStr, timeStr) {
    const [day, month, year] = dateStr.trim().split('/').map(Number);
    const timeParts = timeStr.trim().split('.');
    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1] !== undefined ? parseInt(timeParts[1].padEnd(2, '0'), 10) : 0;
    return new Date(year, month - 1, day, hours, minutes, 0);
}

function unquote(s) {
    s = s.trim();
    if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/""/g, '"');
    return s;
}

function parseUniversityCsv(csvText) {
    const lines = csvText.split('\n').map(l => l.trimEnd());
    const events = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma but keep up to 7 fields (description may contain commas)
        const parts = line.split(',');
        if (parts.length < 7) continue;

        const subject   = unquote(parts[0]);
        const startDate = unquote(parts[1]);
        const startTime = unquote(parts[2]);
        const endDate   = unquote(parts[3]);
        const endTime   = unquote(parts[4]);
        // parts[5] = description (ignored)
        const location  = unquote(parts.slice(6).join(','));

        if (!subject || !startDate || !startTime || !endDate || !endTime) continue;

        const start = parseDateTime(startDate, startTime);
        const end   = parseDateTime(endDate, endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

        events.push({
            title: location ? `${subject} - ${location}` : subject,
            start,
            end,
        });
    }

    return events;
}

module.exports = { parseUniversityCsv };
