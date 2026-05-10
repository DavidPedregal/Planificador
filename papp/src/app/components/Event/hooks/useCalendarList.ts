import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { Calendar } from "@/app/components/shared/lib/eventTypes";
import { AlertSeverity } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";

export function useCalendarList(open: boolean, pushAlert: (message: string, type: AlertSeverity) => void) {
    const [calendars, setCalendars] = useState<Calendar[]>([]);

    useEffect(() => {
        if (open) fetchCalendars();
    }, [open]);

    const fetchCalendars = async () => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [customRes, commonRes] = await Promise.all([
            apiFetch(`${config.backendUrl}/calendars`, { headers }),
            apiFetch(`${config.backendUrl}/calendars/common`, { headers }),
        ]);

        if (!customRes.ok || !commonRes.ok) {
            pushAlert(
                !customRes.ok ? customRes.message : commonRes.message,
                "error"
            );
            return;
        }

        const customCalendars: Calendar[] = customRes.data.map((cal: any) => ({
            id: cal._id, 
            name: cal.name, 
            color: cal.color,
            visible: cal.visible,
        }));

        const commonCalendars: Calendar[] = commonRes.data
            .filter((cal: any) => cal.name !== "Planned")
            .map((cal: any) => ({
                id: cal._id, 
                name: cal.name, 
                color: cal.color,
                visible: cal.visible,
            }));

        setCalendars([...customCalendars, ...commonCalendars]);
    };

    return { calendars };
}
