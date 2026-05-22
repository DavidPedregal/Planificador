const { calculateReviewDuration, calculateNextReviewDate } = require('../../services/business/taskHelper');

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
    });
});
