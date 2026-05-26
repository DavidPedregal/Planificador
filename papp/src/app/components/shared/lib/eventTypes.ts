export const COLORS = [
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
    useCalendarColor?: boolean;
    color: string;
    calendarId: string;
    isPlannedEvent: boolean;
    isReview?: boolean;
    status?: string; // "pending", "completed", "uncompleted"
}

export interface Calendar { 
    id: string, 
    name: string, 
    color: string,
    visible: boolean,
};

export function formatDateTimeLocal(d: Date | string): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    const date = typeof d === 'string' ? new Date(d) : d;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const mapToFullCalendarEvent = (event: any, color: string, isPlannedEvent: boolean = false, status?: string) => {
    const base : CalendarEvent = {
        id: event._id,
        title: event.title,
        start: event.start,
        end: event.end,
        color: color,
        calendarId: event.calendarId,
        isPlannedEvent: isPlannedEvent,
        isReview: event.isReview ?? false,
        status: status,
    };

    return base;
};