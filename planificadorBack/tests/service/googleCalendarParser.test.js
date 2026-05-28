// tests/service/googleCalendarParser.test.js
const { parseGoogleCalendar } = require('../../services/importParsers/googleCalendarParser');

const singleEventIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
DTSTART:20260127T090000Z
DTEND:20260127T110000Z
SUMMARY:DLP Class
END:VEVENT
END:VCALENDAR`;

const multiEventIcs = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260127T090000Z
DTEND:20260127T110000Z
SUMMARY:Event 1
END:VEVENT
BEGIN:VEVENT
DTSTART:20260203T090000Z
DTEND:20260203T110000Z
SUMMARY:Event 2
END:VEVENT
END:VCALENDAR`;

const noSummaryIcs = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART:20260127T090000Z
DTEND:20260127T110000Z
END:VEVENT
END:VCALENDAR`;

describe('parseGoogleCalendar', () => {
    it('should parse a single VEVENT', () => {
        const result = parseGoogleCalendar(singleEventIcs);
        expect(result).toHaveLength(1);
    });

    it('should extract title from SUMMARY', () => {
        const [event] = parseGoogleCalendar(singleEventIcs);
        expect(event.title).toBe('DLP Class');
    });

    it('should extract start as a Date', () => {
        const [event] = parseGoogleCalendar(singleEventIcs);
        expect(event.start).toBeInstanceOf(Date);
        expect(event.start.toISOString()).toBe('2026-01-27T09:00:00.000Z');
    });

    it('should extract end as a Date', () => {
        const [event] = parseGoogleCalendar(singleEventIcs);
        expect(event.end).toBeInstanceOf(Date);
        expect(event.end.toISOString()).toBe('2026-01-27T11:00:00.000Z');
    });

    it('should parse multiple VEVENTs', () => {
        const result = parseGoogleCalendar(multiEventIcs);
        expect(result).toHaveLength(2);
        expect(result[0].title).toBe('Event 1');
        expect(result[1].title).toBe('Event 2');
    });

    it('should return empty array for a VCALENDAR with no events', () => {
        const result = parseGoogleCalendar('BEGIN:VCALENDAR\nEND:VCALENDAR');
        expect(result).toEqual([]);
    });

    it('should skip VEVENTs without a SUMMARY', () => {
        const result = parseGoogleCalendar(noSummaryIcs);
        expect(result).toEqual([]);
    });

    it('should skip VEVENTs missing DTSTART or DTEND', () => {
        const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:No Dates
END:VEVENT
END:VCALENDAR`;
        const result = parseGoogleCalendar(ics);
        expect(result).toEqual([]);
    });
});