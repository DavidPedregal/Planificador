const PlanEvent = require('../../repository/models/PlanEventModel');
const StatisticService = require('../../services/statisticService');

jest.mock('../../repository/models/PlanEventModel', () => ({ aggregate: jest.fn() }));

afterEach(() => {
    jest.clearAllMocks();
});

const mockUserId = '507f1f77bcf86cd799439011';

describe('statisticService', () => {
    describe('getSubjectTimeStatistics', () => {
        it('should return aggregated time per subject', async () => {
            const mockResult = [
                { name: 'Mathematics', minutes: 120 },
                { name: 'Physics', minutes: 60 },
            ];
            PlanEvent.aggregate.mockResolvedValue(mockResult);

            const result = await StatisticService.getSubjectTimeStatistics(mockUserId);

            expect(result).toEqual(mockResult);
            expect(PlanEvent.aggregate).toHaveBeenCalledTimes(1);
        });

        it('should return an empty array when no completed events exist', async () => {
            PlanEvent.aggregate.mockResolvedValue([]);

            const result = await StatisticService.getSubjectTimeStatistics(mockUserId);

            expect(result).toEqual([]);
        });

        it('should return null name for events with no subject', async () => {
            PlanEvent.aggregate.mockResolvedValue([{ name: null, minutes: 45 }]);

            const result = await StatisticService.getSubjectTimeStatistics(mockUserId);

            expect(result[0].name).toBeNull();
        });

        it('should include $gte and $lte in the match stage when both dates are provided', async () => {
            PlanEvent.aggregate.mockResolvedValue([]);

            await StatisticService.getSubjectTimeStatistics(mockUserId, '2026-01-01', '2026-06-01');

            const pipeline = PlanEvent.aggregate.mock.calls[0][0];
            const matchStage = pipeline[0].$match;
            expect(matchStage.start.$gte).toEqual(new Date('2026-01-01'));
            expect(matchStage.start.$lte).toEqual(new Date('2026-06-01'));
        });

        it('should include only $gte when only from is provided', async () => {
            PlanEvent.aggregate.mockResolvedValue([]);

            await StatisticService.getSubjectTimeStatistics(mockUserId, '2026-01-01', undefined);

            const pipeline = PlanEvent.aggregate.mock.calls[0][0];
            const matchStage = pipeline[0].$match;
            expect(matchStage.start.$gte).toEqual(new Date('2026-01-01'));
            expect(matchStage.start.$lte).toBeUndefined();
        });

        it('should not include start filter when no dates are provided', async () => {
            PlanEvent.aggregate.mockResolvedValue([]);

            await StatisticService.getSubjectTimeStatistics(mockUserId);

            const pipeline = PlanEvent.aggregate.mock.calls[0][0];
            const matchStage = pipeline[0].$match;
            expect(matchStage.start).toBeUndefined();
        });

        it('should always match only completed events', async () => {
            PlanEvent.aggregate.mockResolvedValue([]);

            await StatisticService.getSubjectTimeStatistics(mockUserId);

            const pipeline = PlanEvent.aggregate.mock.calls[0][0];
            expect(pipeline[0].$match.status).toBe('completed');
        });
    });

    describe('getComparisonTimeStatistics', () => {
        it('should return planned and actual time per subject', async () => {
            const mockResult = [
                { name: 'Mathematics', planned: 180, actual: 120 },
                { name: 'Physics', planned: 90, actual: 75 },
            ];
            PlanEvent.aggregate.mockResolvedValue(mockResult);

            const result = await StatisticService.getComparisonTimeStatistics(mockUserId);

            expect(result).toEqual(mockResult);
            expect(PlanEvent.aggregate).toHaveBeenCalledTimes(1);
        });

        it('should return an empty array when no completed events exist', async () => {
            PlanEvent.aggregate.mockResolvedValue([]);

            const result = await StatisticService.getComparisonTimeStatistics(mockUserId);

            expect(result).toEqual([]);
        });

        it('should return null name for events with no subject', async () => {
            PlanEvent.aggregate.mockResolvedValue([{ name: null, planned: 60, actual: 45 }]);

            const result = await StatisticService.getComparisonTimeStatistics(mockUserId);

            expect(result[0].name).toBeNull();
        });

        it('should include date filters when provided', async () => {
            PlanEvent.aggregate.mockResolvedValue([]);

            await StatisticService.getComparisonTimeStatistics(mockUserId, '2026-01-01', '2026-06-01');

            const pipeline = PlanEvent.aggregate.mock.calls[0][0];
            const matchStage = pipeline[0].$match;
            expect(matchStage.start.$gte).toEqual(new Date('2026-01-01'));
            expect(matchStage.start.$lte).toEqual(new Date('2026-06-01'));
        });

        it('should always match only completed events', async () => {
            PlanEvent.aggregate.mockResolvedValue([]);

            await StatisticService.getComparisonTimeStatistics(mockUserId);

            const pipeline = PlanEvent.aggregate.mock.calls[0][0];
            expect(pipeline[0].$match.status).toBe('completed');
        });
    });
});
