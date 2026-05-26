import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { COLORS, Calendar } from "@/app/components/shared/lib/eventTypes";
import { RecurrenceRule, FREQUENCY_TYPE } from "@/app/components/shared/lib/recurrence";
import { apiFetch } from "@/lib/api";
import { AlertSeverity } from "@/context/AppContext";


interface UseEventFormParams {
    open: boolean;
    propsStart: Date;
    propsEnd: Date;
    calendars: Calendar[];
    pushAlert: (message: string, type: AlertSeverity) => void;
}

export function useEventForm({ open, propsStart, propsEnd, calendars, pushAlert }: UseEventFormParams) {
    const [eventTitle, setEventTitle] = useState("");
    const [label, setLabel] = useState("");
    const [calendarId, setCalendarId] = useState("");
    const [color, setColor] = useState(COLORS[0].value);
    const [useCustomColor, setUseCustomColor] = useState(false);
    const [start, setStart] = useState<Date>(propsStart);
    const [end, setEnd] = useState<Date>(propsEnd);
    const [recurrence, setRecurrence] = useState<RecurrenceRule>(defaultRecurrence());

    // Sync calendarId when calendars load
    useEffect(() => {
        if (calendars.length > 0) {
            setCalendarId(calendars[0].id);
        }
    }, [calendars]);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setEventTitle("");
            setLabel("");
            setStart(propsStart);
            setEnd(propsEnd);
            setUseCustomColor(false);
            setColor(COLORS[0].value);
            setRecurrence(defaultRecurrence());
        }
    }, [open, propsStart, propsEnd]);

    const toggleWeekday = (day: number) => {
        setRecurrence((r) => {
            const currentDays = Array.isArray(r.frequencyDaysOfWeek) ? r.frequencyDaysOfWeek : [];
            const newDays = currentDays.includes(day)
                ? currentDays.filter((d) => d !== day)
                : [...currentDays, day];
            return { ...r, frequencyDaysOfWeek: newDays };
        });
    };

    const resolveColor = (): string => {
        if (useCustomColor) return color;
        const selectedCalendar = calendars.find((cal) => cal.id === calendarId);
        return selectedCalendar?.color ?? COLORS[0].value;
    };

    const handleSave = async (): Promise<boolean> => {
        const selectedCalendar = calendars.find((cal) => cal.id === calendarId);
        const isPlannableCalendar = selectedCalendar?.name?.toLowerCase() === "calendar.plannable";
        if (!eventTitle.trim() && !isPlannableCalendar) return false;

        const newEvent = {
            title: eventTitle.trim() || "Planificable",
            label: label || undefined,
            color: resolveColor(),
            calendarId,
            start,
            end,
            useCalendarColor: !useCustomColor,
            frequencyType: recurrence.frequencyType,
            frequencyInterval: recurrence.frequencyInterval,
            frequencyDaysOfWeek: recurrence.frequencyDaysOfWeek,
            frequencyEndType: recurrence.frequencyEndType,
            frequencyEndDate: recurrence.frequencyEndDate,
            frequencyOccurrencesLeft: recurrence.frequencyOccurrencesLeft,
        };
        
        const { ok, message } = await apiFetch(`${config.backendUrl}/events`, { 
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(newEvent),
        });
        pushAlert(message, ok ? 'success' : 'error');
        return ok;

    };

    return {
        // State
        eventTitle, setEventTitle,
        label, setLabel,
        calendarId, setCalendarId,
        color, setColor,
        useCustomColor, setUseCustomColor,
        start, setStart,
        end, setEnd,
        recurrence, setRecurrence,
        // Actions
        toggleWeekday,
        handleSave,
    };
}

function defaultRecurrence(): RecurrenceRule {
    return {
        frequencyType: FREQUENCY_TYPE.NONE,
        frequencyInterval: 1,
        frequencyDaysOfWeek: [],
        frequencyEndType: "on",
        frequencyEndDate: "",
        frequencyOccurrencesLeft: 1,
    };
}
