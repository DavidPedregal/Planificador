import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { CalendarEvent, EVENT_COLORS, Calendar } from "@/app/components/calendar/calendarHelper";
import { AlertSeverity } from "@/context/AppContext";

export type RecurrenceMode = "single" | "fromThis" | "all";
export type PendingAction = "update" | "delete";

interface UseEditEventFormParams {
    open: boolean;
    event: CalendarEvent;
    calendars: Calendar[];
    pushAlert: (message: string, severity: AlertSeverity) => void;
}

export function useEditEventForm({ open, event, calendars, pushAlert }: UseEditEventFormParams) {
    const [eventTitle, setEventTitle] = useState(event.title);
    const [label, setLabel] = useState(event.label || "");
    const [calendarId, setCalendarId] = useState(event.calendarId);
    const [color, setColor] = useState(event.color);
    const [useCustomColor, setUseCustomColor] = useState(!event.useCalendarColor);
    const [start, setStart] = useState<Date>(toDate(event.start));
    const [end, setEnd] = useState<Date>(toDate(event.end));

    // Flujo de confirmación de recurrencia
    const [recurrenceChoiceOpen, setRecurrenceChoiceOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [pendingEventData, setPendingEventData] = useState<any>(null);

    // Reset al abrir
    useEffect(() => {
        if (open) {
            setEventTitle(event.title);
            setLabel(event.label || "");
            setCalendarId(event.calendarId);
            setStart(toDate(event.start));
            setEnd(toDate(event.end));
            setColor(event.color);
            setUseCustomColor(!event.useCalendarColor);
        }
    }, [open, event]);

    const resolveColor = (): string => {
        if (useCustomColor) return color;
        const selectedCalendar = calendars.find((cal) => cal.id === calendarId);
        return selectedCalendar?.color ?? EVENT_COLORS[0].value;
    };

    // ── Guardar ──────────────────────────────────────────────────────────────

    const handleSaveClicked = () => {
        if (!eventTitle.trim()) return;

        const updatedEvent = {
            title: eventTitle,
            label: label || undefined,
            color: resolveColor(),
            calendarId,
            start,
            end,
            useCalendarColor: !useCustomColor,
        };

        setPendingEventData(updatedEvent);
        setPendingAction("update");
        setRecurrenceChoiceOpen(true);
    };

    const performUpdate = async (mode: RecurrenceMode) => {
        const url = buildUrl(event.id, mode);
        const { ok, message } = await apiFetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(pendingEventData),
        });
        pushAlert(message, ok ? "success" : "error");
        return ok;
    };

    // ── Eliminar ─────────────────────────────────────────────────────────────

    const handleDeleteClicked = () => {
        setPendingAction("delete");
        setRecurrenceChoiceOpen(true);
    };

    const performDelete = async (mode: RecurrenceMode) => {
        const url = buildUrl(event.id, mode);
        const { ok, message } = await apiFetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        pushAlert(message, ok ? "success" : "error");
        return ok;
    };

    // ── Gestión del RecurrenceChoiceDialog ───────────────────────────────────

    const closeRecurrenceChoice = () => {
        setRecurrenceChoiceOpen(false);
        setPendingAction(null);
        setPendingEventData(null);
    };

    const onChooseSingle = async (onSuccess: () => void) => {
        const ok = pendingAction === "update"
            ? await performUpdate("single")
            : await performDelete("single");
        closeRecurrenceChoice();
        if (ok) onSuccess();
    };

    const onChooseFromThis = async (onSuccess: () => void) => {
        const ok = pendingAction === "update"
            ? await performUpdate("fromThis")
            : await performDelete("fromThis");
        closeRecurrenceChoice();
        if (ok) onSuccess();
    };

    const onChooseAll = async (onSuccess: () => void) => {
        const ok = pendingAction === "update"
            ? await performUpdate("all")
            : await performDelete("all");
        closeRecurrenceChoice();
        if (ok) onSuccess();
    };

    return {
        // Estado del formulario
        eventTitle, setEventTitle,
        label, setLabel,
        calendarId, setCalendarId,
        color, setColor,
        useCustomColor, setUseCustomColor,
        start, setStart,
        end, setEnd,
        // Estado del diálogo de recurrencia
        recurrenceChoiceOpen,
        pendingAction,
        // Acciones
        handleSaveClicked,
        handleDeleteClicked,
        onChooseSingle,
        onChooseFromThis,
        onChooseAll,
        onCancel: closeRecurrenceChoice,
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDate(value: Date | string): Date {
    return typeof value === "string" ? new Date(value) : value;
}

function buildUrl(eventId: string, mode: RecurrenceMode): string {
    const base = config.backendUrl;
    if (mode === "all") return `${base}/events/all/${eventId}`;
    if (mode === "fromThis") return `${base}/events/forward/${eventId}`;
    return `${base}/events/${eventId}`;
}