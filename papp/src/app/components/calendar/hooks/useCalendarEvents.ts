import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { Calendar, CalendarEvent, mapToFullCalendarEvent } from "@/app/components/shared/lib/eventTypes";
import { AlertSeverity } from "@/context/AppContext";

interface UseCalendarEventsParams {
    refreshTrigger?: number;
    pushAlert: (message: string, severity: AlertSeverity) => void;
}

function resolveColor(
    useCalendarColor: boolean,
    eventColor: string,
    calendarId: string,
    calendarsList: Calendar[]
): string {
    if (useCalendarColor) {
        return calendarsList.find(cal => cal.id === calendarId)?.color ?? "#7c6ff7";
    }
    return eventColor || "#7c6ff7";
}

function filterByVisibility(allEvents: CalendarEvent[], calendarsList: Calendar[]): CalendarEvent[] {
    return allEvents.filter(event => {
        const calendar = calendarsList.find(cal => cal.id === event.calendarId);
        return calendar?.visible ?? true;
    });
}

export function useCalendarEvents({ refreshTrigger = 0, pushAlert }: UseCalendarEventsParams) {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
    const [visibleEvents, setVisibleEvents] = useState<CalendarEvent[]>([]);

    const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    // ── Fetch calendars ───────────────────────────────────────────────────────

    const fetchCalendars = async (): Promise<Calendar[]> => {
        const [customRes, commonRes] = await Promise.all([
            apiFetch(`${config.backendUrl}/calendars`, { headers: authHeader() }),
            apiFetch(`${config.backendUrl}/calendars/common`, { headers: authHeader() }),
        ]);

        if (!customRes.ok) { pushAlert(customRes.message, "error"); return []; }
        if (!commonRes.ok) { pushAlert(commonRes.message, "error"); return []; }

        const mapped: Calendar[] = [
            ...customRes.data.map((cal: any) => ({
                id: cal._id, name: cal.name, color: cal.color, visible: cal.visible,
            })),
            ...commonRes.data.map((cal: any) => ({
                id: cal._id, name: cal.name, color: cal.color, visible: cal.visible,
            })),
        ];

        setCalendars(mapped);
        return mapped;
    };

    // ── Fetch events ──────────────────────────────────────────────────────────

    const fetchEvents = async (calendarsList: Calendar[]) => {
        const [eventsRes, planRes] = await Promise.all([
            apiFetch(`${config.backendUrl}/events`, { headers: authHeader() }),
            apiFetch(`${config.backendUrl}/plan`, { headers: authHeader() }),
        ]);

        if (!eventsRes.ok) { pushAlert(eventsRes.message, "error"); return; }
        if (!planRes.ok)   { pushAlert(planRes.message,   "error"); return; }

        const mappedEvents: CalendarEvent[] = eventsRes.data.map((event: any) => {
            const color = resolveColor(event.useCalendarColor, event.color, event.calendarId, calendarsList);
            return mapToFullCalendarEvent(event, color);
        });

        const mappedPlanned: CalendarEvent[] = planRes.data.map((event: any) => {
            const color = resolveColor(true, "", event.calendarId, calendarsList);
            return mapToFullCalendarEvent(event, color, true, event.status);
        });

        const all = [...mappedEvents, ...mappedPlanned];
        setAllEvents(all);
        setVisibleEvents(filterByVisibility(all, calendarsList));
    };

    // ── Load all ──────────────────────────────────────────────────────────────

    const loadAll = async () => {
        const calendarsList = await fetchCalendars();
        await fetchEvents(calendarsList);
    };

    useEffect(() => { loadAll(); }, [refreshTrigger]);

    // Re-filtrar cuando cambian calendarios (toggle visibilidad desde Sidebar)
    useEffect(() => {
        setVisibleEvents(filterByVisibility(allEvents, calendars));
    }, [calendars]);

    // ── Planned event updates (sin mutación directa) ──────────────────────────

    const updatePlannedEventStatus = (id: string, status: string) => {
        setAllEvents(prev => {
            const updated = prev.map(e => e.id === id ? { ...e, status } : e);
            setVisibleEvents(filterByVisibility(updated, calendars));
            return updated;
        });
    };

    const removePlannedEvent = (id: string) => {
        setAllEvents(prev => {
            const updated = prev.filter(e => e.id !== id);
            setVisibleEvents(filterByVisibility(updated, calendars));
            return updated;
        });
    };

    // ── Drag & drop / resize ──────────────────────────────────────────────────

    const updateEventDates = async (id: string, start: Date, end: Date, isPlannedEvent: boolean) => {
        if (isPlannedEvent) return;
        const { ok, message } = await apiFetch(`${config.backendUrl}/events/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authHeader() },
            body: JSON.stringify({ start, end }),
        });
        if (!ok) pushAlert(message, "error");
    };

    return {
        calendars,
        visibleEvents,
        loadAll,
        fetchEvents: () => fetchEvents(calendars),
        updateEventDates,
        updatePlannedEventStatus,
        removePlannedEvent,
    };
}