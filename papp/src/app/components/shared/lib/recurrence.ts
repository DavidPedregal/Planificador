export const FREQUENCY_TYPE = {
    NONE: "none",
    DAYS: "day",
    WEEKS: "week",
    MONTHS: "month",
    YEARS: "year",
}

export interface RecurrenceRule {
    frequencyType: typeof FREQUENCY_TYPE[keyof typeof FREQUENCY_TYPE];
    frequencyInterval: number;
    frequencyDaysOfWeek?: number[]; // 0=Sun … 6=Sat
    frequencyEndType: "on" | "after";
    frequencyEndDate?: string;
    frequencyOccurrencesLeft?: number;
}

export const WEEKDAYS = ["D", "L", "M", "X", "J", "V", "S"];

export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const FREQ_OPTIONS = [
    { value: FREQUENCY_TYPE.NONE,   label: "Sin repetición" },
    { value: FREQUENCY_TYPE.DAYS,   label: "Diario" },
    { value: FREQUENCY_TYPE.WEEKS,  label: "Semanal" },
    { value: FREQUENCY_TYPE.MONTHS, label: "Mensual" },
    { value: FREQUENCY_TYPE.YEARS,  label: "Anual" },
];