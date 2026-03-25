export const FREQUENCY_TYPE = {
    NONE: "none",
    DAYS: "day",
    WEEKS: "week",
    MONTHS: "month",
    YEARS: "year",
}

export const EVENT_COLORS = [
    { label: "Índigo",    value: "#7c6ff7" },
    { label: "Cielo",     value: "#38bdf8" },
    { label: "Esmeralda", value: "#34d399" },
    { label: "Ámbar",     value: "#fbbf24" },
    { label: "Rosa",      value: "#f472b6" },
    { label: "Coral",     value: "#f76f6f" },
    { label: "Violeta",   value: "#c084fc" },
    { label: "Lima",      value: "#a3e635" },
];

export const CALENDAR_COLORS = [
    { label: "Índigo",    value: "#7c6ff7" },
    { label: "Cielo",     value: "#38bdf8" },
    { label: "Esmeralda", value: "#34d399" },
    { label: "Ámbar",     value: "#fbbf24" },
    { label: "Rosa",      value: "#f472b6" },
    { label: "Coral",     value: "#f76f6f" },
    { label: "Violeta",   value: "#c084fc" },
    { label: "Lima",      value: "#a3e635" },
];

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date | string;
    end: Date | string;
    color: string;
    calendarId: string;
}

export interface Calendar { 
    id: string, 
    name: string, 
    color: string,
    visible: boolean,
};

export interface RecurrenceRule {
    frequency: typeof FREQUENCY_TYPE[keyof typeof FREQUENCY_TYPE];
    interval: number;
    daysOfWeek?: number[]; // 0=Sun … 6=Sat
    endType: "never" | "on" | "after";
    endDate?: string;
    occurrences?: number;
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

export function formatDateTimeLocal(d: Date | string): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    const date = typeof d === 'string' ? new Date(d) : d;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
