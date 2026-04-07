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
    label?: string;
    start: Date | string;
    end: Date | string;
    useCalendarColor: boolean;
    color: string;
    calendarId: string;
    recurrenceRule: RecurrenceRule;
}

export interface Calendar { 
    id: string, 
    name: string, 
    color: string,
    visible: boolean,
};

export interface Subject { 
    id: string, 
    name: string, 
};

export interface RecurrenceRule {
    frequencyType: typeof FREQUENCY_TYPE[keyof typeof FREQUENCY_TYPE];
    frequencyInterval: number;
    frequencyDaysOfWeek?: number[]; // 0=Sun … 6=Sat
    frequencyEndType: "never" | "on" | "after";
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

export function formatDateTimeLocal(d: Date | string): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    const date = typeof d === 'string' ? new Date(d) : d;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const mapToFullCalendarEvent = (event: any, color: string) => {
    const base = {
        id: event._id,
        title: event.title,
        backgroundColor: color,
        borderColor: color,
        label: event.label ? event.label : "",
        extendedProps: {
            calendarId: event.calendarId,
            useCalendarColor: event.useCalendarColor,
            recurrenceRule: {
                frequencyType: event.frequencyType,
                frequencyInterval: event.frequencyInterval,
                frequencyDaysOfWeek: event.frequencyDaysOfWeek,
                frequencyEndType: event.frequencyEndType,
                frequencyEndDate: event.frequencyEndDate,
                frequencyOccurrencesLeft: event.frequencyOccurrencesLeft,
            }
        }
    };

    // Sin recurrencia
    if (!event.frequencyType || event.frequencyType === "none") {
        return { ...base, start: event.start, end: event.end };
    }

    // Con recurrencia — construye el objeto rrule
    const FREQ_MAP: Record<string, string> = {
        day:   "daily",
        week:  "weekly",
        month: "monthly",
        year:  "yearly",
    };

    const rrule: any = {
        freq: FREQ_MAP[event.frequencyType],
        dtstart: event.start,
        interval: event.frequencyInterval || 1,
    };

    if (event.frequencyDaysOfWeek?.length) {
        const DAYS = ["su", "mo", "tu", "we", "th", "fr", "sa"];
        rrule.byweekday = event.frequencyDaysOfWeek.map((d: number) => DAYS[d]);
    }

    if (event.frequencyEndType === "on" && event.frequencyEndDate) {
        rrule.until = new Date(event.frequencyEndDate);
    } else if (event.frequencyEndType === "after" && event.frequencyOccurrencesLeft) {
        rrule.count = event.frequencyOccurrencesLeft;
    }

    const duration = new Date(event.end).getTime() - new Date(event.start).getTime();
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);

    return {
        ...base,
        rrule,
        duration: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    };
};