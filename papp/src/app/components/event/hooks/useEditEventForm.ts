import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { COLORS, Calendar } from "@/app/components/shared/lib/eventTypes";
import { AlertSeverity } from "@/context/AppContext";

export type RecurrenceMode = "single" | "fromThis" | "all";
export type PendingAction = "update" | "delete";

interface UseEditEventFormParams {
    open: boolean;
    eventId: string;
    calendars: Calendar[];
    pushAlert: (message: string, severity: AlertSeverity) => void;
}

export function useEditEventForm({ open, eventId, calendars, pushAlert }: UseEditEventFormParams) {
    const [eventTitle, setEventTitle] = useState("");
    const [label, setLabel] = useState("");
    const [calendarId, setCalendarId] = useState("");
    const [color, setColor] = useState("");
    const [useCustomColor, setUseCustomColor] = useState(false);
    const [start, setStart] = useState<Date>(new Date());
    const [end, setEnd] = useState<Date>(new Date());

    const [recurring, setRecurring] = useState(false);

    // Flujo de confirmación de recurrencia
    const [recurrenceChoiceOpen, setRecurrenceChoiceOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [pendingEventData, setPendingEventData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Reset al abrir
    useEffect(() => {
        if (open && eventId) {
            fetchEvent(eventId);
        } else if (!open) {
            setEventTitle("");
            setLabel("");
            setLoading(false);
        }
    }, [open, eventId]);

    const fetchEvent = async (id: string) => {
        setLoading(true);
        const { ok, data, message } = await apiFetch(`${config.backendUrl}/events/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setLoading(false);
        if (!ok) { pushAlert(message, "error"); return; }

        setEventTitle(data.title);
        setLabel(data.label || "");
        setCalendarId(data.calendarId);
        setStart(new Date(data.start));
        setEnd(new Date(data.end));
        setColor(data.color);
        setUseCustomColor(!data.useCalendarColor);
        setRecurring(!!data.groupId);
    };

    const resolveColor = (): string => {
        if (useCustomColor) return color;
        const selectedCalendar = calendars.find((cal) => cal.id === calendarId);
        return selectedCalendar?.color ?? COLORS[0].value;
    };

    // ── Guardar ──────────────────────────────────────────────────────────────

    const handleSaveClicked = async (onSuccess?: () => void) => {
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

        if (recurring) {
            setPendingEventData(updatedEvent);
            setPendingAction("update");
            setRecurrenceChoiceOpen(true);
            return;
        }

        const url = buildUrl(eventId, "single");
        const { ok, message } = await apiFetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(updatedEvent),
        });
        pushAlert(message, ok ? "success" : "error");
        if (ok) onSuccess?.();
    };

    const performUpdate = async (mode: RecurrenceMode) => {
        const url = buildUrl(eventId, mode);
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
        const url = buildUrl(eventId, mode);
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
        loading,
        recurring,
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

function buildUrl(eventId: string, mode: RecurrenceMode): string {
    const base = config.backendUrl;
    if (mode === "all") return `${base}/events/all/${eventId}`;
    if (mode === "fromThis") return `${base}/events/forward/${eventId}`;
    return `${base}/events/${eventId}`;
}