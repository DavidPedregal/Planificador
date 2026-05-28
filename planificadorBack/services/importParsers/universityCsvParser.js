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

        const subject  = parts[0].trim();
        const startDate = parts[1].trim();
        const startTime = parts[2].trim();
        const endDate  = parts[3].trim();
        const endTime  = parts[4].trim();
        // parts[5] = description (ignored)
        const location = parts.slice(6).join(',').trim();

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
