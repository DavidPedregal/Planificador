// tests/service/universityCsvParser.test.js
const { parseUniversityCsv } = require('../../services/importParsers/universityCsvParser');

const HEADER = 'Subject, Start Date, Start Time, End Date, End Time,  Description, Location';
const ROW1   = 'DLP.T.I-1, 27/01/2026,  9.00,27/01/2026, 11.00,Hora de clase número 2 de DLP.T.I-1, A-S-03';
const ROW2   = 'DLP.T.I-1, 03/02/2026,  9.00,03/02/2026, 11.00,Hora de clase número 4 de DLP.T.I-1, A-S-03';

describe('parseUniversityCsv', () => {
    it('should return an empty array for a header-only CSV', () => {
        expect(parseUniversityCsv(HEADER)).toEqual([]);
    });

    it('should parse a single valid row', () => {
        const result = parseUniversityCsv(`${HEADER}\n${ROW1}`);
        expect(result).toHaveLength(1);
    });

    it('should build title as "Subject - Location"', () => {
        const [event] = parseUniversityCsv(`${HEADER}\n${ROW1}`);
        expect(event.title).toBe('DLP.T.I-1 - A-S-03');
    });

    it('should parse start date correctly', () => {
        const [event] = parseUniversityCsv(`${HEADER}\n${ROW1}`);
        expect(event.start.getFullYear()).toBe(2026);
        expect(event.start.getMonth()).toBe(0); // January (0-indexed)
        expect(event.start.getDate()).toBe(27);
    });

    it('should parse start time correctly', () => {
        const [event] = parseUniversityCsv(`${HEADER}\n${ROW1}`);
        expect(event.start.getHours()).toBe(9);
        expect(event.start.getMinutes()).toBe(0);
    });

    it('should parse end date and time correctly', () => {
        const [event] = parseUniversityCsv(`${HEADER}\n${ROW1}`);
        expect(event.end.getHours()).toBe(11);
        expect(event.end.getMinutes()).toBe(0);
        expect(event.end.getDate()).toBe(27);
    });

    it('should parse multiple rows', () => {
        const result = parseUniversityCsv(`${HEADER}\n${ROW1}\n${ROW2}`);
        expect(result).toHaveLength(2);
    });

    it('should skip blank lines', () => {
        const result = parseUniversityCsv(`${HEADER}\n${ROW1}\n\n${ROW2}`);
        expect(result).toHaveLength(2);
    });

    it('should skip rows with fewer than 7 fields', () => {
        const result = parseUniversityCsv(`${HEADER}\nDLP.T.I-1, 27/01/2026,  9.00`);
        expect(result).toEqual([]);
    });

    it('should use subject alone as title when location is empty', () => {
        const row = 'DLP.T.I-1, 27/01/2026,  9.00,27/01/2026, 11.00,desc,';
        const result = parseUniversityCsv(`${HEADER}\n${row}`);
        expect(result[0]?.title).toBe('DLP.T.I-1');
    });

    it('should handle non-zero minutes in time (e.g. 9.30 → 9:30)', () => {
        const row = 'DLP.T.I-1, 27/01/2026,  9.30,27/01/2026, 10.45,desc, A-S-03';
        const [event] = parseUniversityCsv(`${HEADER}\n${row}`);
        expect(event.start.getHours()).toBe(9);
        expect(event.start.getMinutes()).toBe(30);
        expect(event.end.getHours()).toBe(10);
        expect(event.end.getMinutes()).toBe(45);
    });

    it('should return Date objects for start and end', () => {
        const [event] = parseUniversityCsv(`${HEADER}\n${ROW1}`);
        expect(event.start).toBeInstanceOf(Date);
        expect(event.end).toBeInstanceOf(Date);
    });
});