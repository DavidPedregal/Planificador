const ical = require('node-ical');

/**
 * Parses a Google Calendar .ics export.
 * Extracts VEVENT components: SUMMARY → title, DTSTART → start, DTEND → end.
 */
function parseGoogleCalendar(icsText) {
    const parsed = ical.parseICS(icsText);
    const events = [];

    for (const component of Object.values(parsed)) {
        if (component.type !== 'VEVENT') continue;

        const title = component.summary?.trim();
        const start = component.start;
        const end   = component.end;

        if (!title || !start || !end) continue;
        if (isNaN(new Date(start).getTime()) || isNaN(new Date(end).getTime())) continue;

        events.push({ title, start: new Date(start), end: new Date(end) });
    }

    return events;
}

module.exports = { parseGoogleCalendar };
