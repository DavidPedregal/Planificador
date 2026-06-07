import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { Calendar } from "@/app/components/shared/lib/eventTypes";
import { AlertSeverity } from "@/context/AppContext";

interface UseSidebarCalendarsParams {
    enabled: boolean;
    pushAlert: (message: string, severity: AlertSeverity) => void;
    onVisibilityChange?: (visibleIds: string[]) => void;
    onCalendarDeleted?: () => void;
}

function mapCalendar(cal: any): Calendar {
    return {
        id: cal._id,
        name: cal.name,
        color: cal.color,
        visible: cal.visible,
    };
}

export function useSidebarCalendars({
    enabled,
    pushAlert,
    onVisibilityChange,
    onCalendarDeleted,
}: UseSidebarCalendarsParams) {
    const [customCalendars, setCustomCalendars] = useState<Calendar[]>([]);
    const [defaultCalendars, setDefaultCalendars] = useState<Calendar[]>([]);

    const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    useEffect(() => {
        if (enabled) {
            fetchCustomCalendars();
            fetchDefaultCalendars();
        }
    }, [enabled]);

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchCustomCalendars = async () => {
        const { ok, data, message } = await apiFetch(`${config.backendUrl}/calendars`, {
            headers: authHeader(),
        });
        if (!ok) { pushAlert(message, "error"); return; }
        setCustomCalendars(data.map(mapCalendar));
    };

    const fetchDefaultCalendars = async () => {
        const { ok, data, message } = await apiFetch(`${config.backendUrl}/calendars/common`, {
            headers: authHeader(),
        });
        if (!ok) { pushAlert(message, "error"); return; }
        setDefaultCalendars(data.map(mapCalendar));
    };

    const refetchAll = async () => {
        await Promise.all([fetchCustomCalendars(), fetchDefaultCalendars()]);
    };

    // ── Toggle visibility ─────────────────────────────────────────────────────

    const toggleVisibility = async (id: string) => {
        const { ok, message } = await apiFetch(
            `${config.backendUrl}/calendars/toggleVisibility/${id}`,
            { method: "PUT", headers: authHeader() }
        );
        if (!ok) { pushAlert(message, "error"); return; }

        await refetchAll();

        // Notificar al padre con los ids visibles actualizados
        const allUpdated = [...customCalendars, ...defaultCalendars].map(c =>
            c.id === id ? { ...c, visible: !c.visible } : c
        );
        onVisibilityChange?.(allUpdated.filter(c => c.visible).map(c => c.id));
        onCalendarDeleted?.();
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const deleteCalendar = async (id: string): Promise<boolean> => {
        const { ok, message } = await apiFetch(`${config.backendUrl}/calendars/${id}`, {
            method: "DELETE",
            headers: authHeader(),
        });
        pushAlert(message, ok ? "success" : "error");
        if (ok) {
            await fetchCustomCalendars();
            onCalendarDeleted?.();
        }
        return ok;
    };

    // ── Clean ─────────────────────────────────────────────────────────────────

    const cleanCalendar = async (id: string): Promise<boolean> => {
        const { ok, message } = await apiFetch(`${config.backendUrl}/calendars/clean/${id}`, {
            method: "DELETE",
            headers: authHeader(),
        });
        pushAlert(message, ok ? "success" : "error");
        if (ok) {
            onCalendarDeleted?.();
        }
        return ok;
    };

    return {
        customCalendars,
        defaultCalendars,
        fetchCustomCalendars,
        refetchAll,
        toggleVisibility,
        deleteCalendar,
        cleanCalendar,
    };
}