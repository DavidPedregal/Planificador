const { validateEventData, generateRecurringEvents } = require('../../services/business/eventHelper');

describe('eventHelper', () => {
    describe('validateEventData', () => {
        const base = {
            title: 'Test',
            start: '2026-01-01T09:00:00Z',
            end: '2026-01-01T10:00:00Z',
            calendarId: '507f1f77bcf86cd799439011',
        };

        it('returns valid for a non-recurring event (frequencyType none)', () => {
            const result = validateEventData({ ...base, frequencyType: 'none', frequencyEndType: 'on', frequencyEndDate: '' }, { isCreation: true });
            expect(result.valid).toBe(true);
        });

        it('returns error when end type is "on" and end date is empty', () => {
            const result = validateEventData({ ...base, frequencyType: 'day', frequencyInterval: 1, frequencyEndType: 'on', frequencyEndDate: '' }, { isCreation: true });
            expect(result.valid).toBe(false);
            expect(result.error).toBe('api.event.recurrenceEndDate');
        });

        it('returns error when end type is "on" and end date is absent', () => {
            const result = validateEventData({ ...base, frequencyType: 'week', frequencyInterval: 1, frequencyEndType: 'on' }, { isCreation: true });
            expect(result.valid).toBe(false);
            expect(result.error).toBe('api.event.recurrenceEndDate');
        });

        it('returns valid when end type is "on" and end date is set', () => {
            const result = validateEventData({ ...base, frequencyType: 'day', frequencyInterval: 1, frequencyEndType: 'on', frequencyEndDate: '2026-06-30' }, { isCreation: true });
            expect(result.valid).toBe(true);
        });

        it('returns valid when end type is "after" with no end date', () => {
            const result = validateEventData({ ...base, frequencyType: 'day', frequencyInterval: 1, frequencyEndType: 'after', frequencyOccurrencesLeft: 5 }, { isCreation: true });
            expect(result.valid).toBe(true);
        });

        it('does not check recurrence end date on updates', () => {
            const result = validateEventData({ title: 'Updated' }, { isCreation: false, existingEvent: base });
            expect(result.valid).toBe(true);
        });
    });

    describe('generateRecurringEvents', () => {
        const base = {
            title: 'Test',
            start: new Date('2026-01-01T09:00:00Z'),
            end: new Date('2026-01-01T10:00:00Z'),
            frequencyInterval: 1,
        };

        it('returns only the base event when end date is missing (infinite-loop guard)', () => {
            const event = { ...base, frequencyType: 'day', frequencyEndType: 'on', frequencyEndDate: '' };
            const result = generateRecurringEvents(event);
            expect(result).toHaveLength(1);
        });

        it('generates multiple events when a valid end date is provided', () => {
            const event = { ...base, frequencyType: 'day', frequencyEndType: 'on', frequencyEndDate: '2026-01-05' };
            const result = generateRecurringEvents(event);
            expect(result.length).toBeGreaterThan(1);
        });
    });
});
