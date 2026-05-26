import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { FREQUENCY_TYPE, RecurrenceRule } from "@/app/components/shared/lib/recurrence";
import { AlertSeverity } from "@/context/AppContext";

export interface TaskFormState {
    title: string;
    description: string;
    estimatedTime: number;
    finishDate: string;
    givenDate: string;
    subjectId: string;
    plannable: boolean;
    includeReviews: boolean;
    recurrence: RecurrenceRule;
}

interface UseTaskFormParams {
    open: boolean;
    pushAlert: (message: string, severity: AlertSeverity) => void;
}

function todayString(): string {
    return new Date().toISOString().split("T")[0];
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

export function useTaskForm({ open, pushAlert }: UseTaskFormParams) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [estimatedTime, setEstimatedTime] = useState(30);
    const [finishDate, setFinishDate] = useState(todayString());
    const [finishTime, setFinishTime] = useState("00:00");
    const [givenDate, setGivenDate] = useState(todayString());
    const [subjectId, setSubjectId] = useState("");
    const [plannable, setPlannable] = useState(true);
    const [includeReviews, setIncludeReviews] = useState(false);
    const [recurrence, setRecurrence] = useState<RecurrenceRule>(defaultRecurrence());

    // Reset al abrir
    useEffect(() => {
        if (open) {
            const today = todayString();
            setTitle("");
            setDescription("");
            setEstimatedTime(30);
            setFinishDate(today);
            setFinishTime("00:00");
            setGivenDate(today);
            setSubjectId("");
            setPlannable(true);
            setIncludeReviews(false);
            setRecurrence(defaultRecurrence());
        }
    }, [open]);

    const toggleWeekday = (day: number) => {
        setRecurrence((r) => {
            const current = Array.isArray(r.frequencyDaysOfWeek) ? r.frequencyDaysOfWeek : [];
            const next = current.includes(day)
                ? current.filter((d) => d !== day)
                : [...current, day];
            return { ...r, frequencyDaysOfWeek: next };
        });
    };

    const handleSave = async (): Promise<any | null> => {
        if (!title.trim()) return null;

        const newTask = {
            title,
            description: description || undefined,
            estimatedTime,
            finishDate: `${finishDate}T${finishTime}`,
            givenDate,
            subjectId: subjectId || undefined,
            plannable,
            includeReviews,
            frequencyType: recurrence.frequencyType,
            frequencyInterval: recurrence.frequencyInterval,
            frequencyDaysOfWeek: recurrence.frequencyDaysOfWeek,
            frequencyEndType: recurrence.frequencyEndType,
            frequencyEndDate: recurrence.frequencyEndDate,
            frequencyOccurrencesLeft: recurrence.frequencyOccurrencesLeft,
        };

        const { ok, data, message } = await apiFetch(config.backendUrl + "/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(newTask),
        });

        pushAlert(message, ok ? "success" : "error");
        return ok ? data : null;
    };

    return {
        title, setTitle,
        description, setDescription,
        estimatedTime, setEstimatedTime,
        finishDate, setFinishDate,
        finishTime, setFinishTime,
        givenDate, setGivenDate,
        subjectId, setSubjectId,
        plannable, setPlannable,
        includeReviews, setIncludeReviews,
        recurrence, setRecurrence,
        toggleWeekday,
        handleSave,
    };
}