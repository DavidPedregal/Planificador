const { calculateReviewDuration, calculateNextReviewDate, validateData, generateRecurringTasks } = require('../../services/business/taskHelper');

describe('taskHelper', () => {
    describe('calculateReviewDuration', () => {
        it('should return a value no lower than 15 minutes', () => {
            const result = calculateReviewDuration(15, 10, 2.5);
            expect(result).toBeGreaterThanOrEqual(15);
        });

        it('should return at most the full estimated time on the first review', () => {
            const result = calculateReviewDuration(60, 1, 2.5);
            expect(result).toBeLessThanOrEqual(60);
        });

        it('should decrease as n increases', () => {
            const first = calculateReviewDuration(60, 1, 2.5);
            const second = calculateReviewDuration(60, 2, 2.5);
            const third = calculateReviewDuration(60, 3, 2.5);
            expect(first).toBeGreaterThan(second);
            expect(second).toBeGreaterThan(third);
        });

        it('should return a rounded integer', () => {
            const result = calculateReviewDuration(60, 2, 2.5);
            expect(Number.isInteger(result)).toBe(true);
        });
    });

    describe('calculateNextReviewDate', () => {
        it('should return interval of 1 day on first review (n=1)', () => {
            const { interval } = calculateNextReviewDate(0, 1, 2.5);
            expect(interval).toBe(1);
        });

        it('should return interval of 6 days on second review (n=2)', () => {
            const { interval } = calculateNextReviewDate(1, 2, 2.5);
            expect(interval).toBe(6);
        });

        it('should apply SM-2 formula for n >= 3', () => {
            const lastInterval = 6;
            const ef = 2.5;
            const { interval } = calculateNextReviewDate(lastInterval, 3, ef);
            expect(interval).toBe(Math.round(lastInterval * ef));
        });

        it('should return a margin of at least 1 day', () => {
            const { margin } = calculateNextReviewDate(0, 1, 2.5);
            expect(margin).toBeGreaterThanOrEqual(1);
        });

        it('should return a margin of roughly 20% of the interval', () => {
            const { interval, margin } = calculateNextReviewDate(6, 3, 2.5);
            expect(margin).toBe(Math.max(1, Math.round(interval * 0.2)));
        });

        it('should increase interval with higher ef', () => {
            const { interval: low } = calculateNextReviewDate(6, 3, 1.5);
            const { interval: high } = calculateNextReviewDate(6, 3, 3.0);
            expect(high).toBeGreaterThan(low);
        });

        it('should apply SM-2 formula for n=3: lastInterval=6, ef=2.5 → 15 days', () => {
            const { interval } = calculateNextReviewDate(6, 3, 2.5);
            expect(interval).toBe(15);
        });

        it('should round the interval to the nearest integer', () => {
            const { interval } = calculateNextReviewDate(6, 3, 2.6);
            expect(interval).toBe(Math.round(6 * 2.6)); // 16
        });

        it('should produce proportionally larger margin for longer intervals', () => {
            const { margin: short } = calculateNextReviewDate(6, 3, 2.5);   // interval=15, margin=3
            const { margin: long } = calculateNextReviewDate(50, 5, 2.5);   // interval=125, margin=25
            expect(long).toBeGreaterThan(short);
        });

        it('should follow the full SM-2 chain: 1 → 6 → lastInterval*ef', () => {
            const { interval: first }  = calculateNextReviewDate(0, 1, 2.5);
            const { interval: second } = calculateNextReviewDate(first, 2, 2.5);
            const { interval: third }  = calculateNextReviewDate(second, 3, 2.5);
            expect(first).toBe(1);
            expect(second).toBe(6);
            expect(third).toBe(Math.round(6 * 2.5));
        });
    });

    describe('validateData', () => {
        const base = { title: 'Test', estimatedTime: 60, finishDate: '2026-12-31', givenDate: '2026-01-01' };

        it('returns valid for a non-recurring task (frequencyType none)', () => {
            const result = validateData({ ...base, frequencyType: 'none', frequencyEndType: 'on', frequencyEndDate: '' }, true);
            expect(result.valid).toBe(true);
        });

        it('returns error when end type is "on" and end date is empty', () => {
            const result = validateData({ ...base, frequencyType: 'day', frequencyInterval: 1, frequencyEndType: 'on', frequencyEndDate: '' }, true);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('api.task.recurrenceEndDate');
        });

        it('returns error when end type is "on" and end date is absent', () => {
            const result = validateData({ ...base, frequencyType: 'week', frequencyInterval: 1, frequencyEndType: 'on' }, true);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('api.task.recurrenceEndDate');
        });

        it('returns valid when end type is "on" and end date is set', () => {
            const result = validateData({ ...base, frequencyType: 'day', frequencyInterval: 1, frequencyEndType: 'on', frequencyEndDate: '2026-06-30' }, true);
            expect(result.valid).toBe(true);
        });

        it('returns valid when end type is "after" with no end date', () => {
            const result = validateData({ ...base, frequencyType: 'day', frequencyInterval: 1, frequencyEndType: 'after', frequencyOccurrencesLeft: 5 }, true);
            expect(result.valid).toBe(true);
        });

        it('does not check recurrence when checkRecurrence is false', () => {
            const result = validateData({ ...base, frequencyType: 'day', frequencyEndType: 'on', frequencyEndDate: '' });
            expect(result.valid).toBe(true);
        });
    });

    describe('generateRecurringTasks', () => {
        const base = {
            title: 'Test',
            estimatedTime: 60,
            finishDate: new Date('2026-01-01'),
            givenDate: new Date('2026-01-01'),
            frequencyInterval: 1,
        };

        it('returns only the base task when end date is missing (infinite-loop guard)', () => {
            const task = { ...base, frequencyType: 'day', frequencyEndType: 'on', frequencyEndDate: '' };
            const result = generateRecurringTasks(task);
            expect(result).toHaveLength(1);
        });

        it('generates multiple tasks when a valid end date is provided', () => {
            const task = { ...base, frequencyType: 'day', frequencyEndType: 'on', frequencyEndDate: '2026-01-05' };
            const result = generateRecurringTasks(task);
            expect(result.length).toBeGreaterThan(1);
        });
    });
});
