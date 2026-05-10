import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { AlertSeverity } from "@/context/AppContext";

export type UpdateMode = "single" | "fromThis" | "all";

interface UseEditTaskFormParams {
    open: boolean;
    taskId: string;
    pushAlert: (message: string, severity: AlertSeverity) => void;
}

export function useEditTaskForm({ open, taskId, pushAlert }: UseEditTaskFormParams) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [estimatedTime, setEstimatedTime] = useState(30);
    const [finishDate, setFinishDate] = useState("");
    const [givenDate, setGivenDate] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [plannable, setPlannable] = useState(true);
    const [includeReviews, setIncludeReviews] = useState(false);
    const [loading, setLoading] = useState(false);

    // Flujo de confirmación de recurrencia
    const [recurrenceChoiceOpen, setRecurrenceChoiceOpen] = useState(false);

    useEffect(() => {
        if (open && taskId) fetchTask(taskId);
    }, [open, taskId]);

    const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    const fetchTask = async (id: string) => {
        setLoading(true);
        const { ok, data, message } = await apiFetch(`${config.backendUrl}/tasks/${id}`, {
            headers: authHeader(),
        });
        setLoading(false);
        if (!ok) { pushAlert(message, "error"); return; }

        setTitle(data.title);
        setDescription(data.description || "");
        setEstimatedTime(data.estimatedTime);
        setFinishDate(data.finishDate.split("T")[0]);
        setGivenDate(data.givenDate.split("T")[0]);
        setSubjectId(data.subjectId || "");
        setPlannable(data.plannable !== false);
        setIncludeReviews(data.includeReviews || false);
    };

    // ── Guardar ───────────────────────────────────────────────────────────────

    const handleSaveClicked = () => {
        if (!title.trim()) return;
        setRecurrenceChoiceOpen(true);
    };

    const performUpdate = async (mode: UpdateMode): Promise<boolean> => {
        const urls: Record<UpdateMode, string> = {
            single:   `${config.backendUrl}/tasks/${taskId}`,
            fromThis: `${config.backendUrl}/tasks/forward/${taskId}`,
            all:      `${config.backendUrl}/tasks/all/${taskId}`,
        };

        const updatedTask = {
            title,
            description: description || undefined,
            estimatedTime,
            finishDate,
            givenDate,
            subjectId: subjectId || undefined,
            plannable,
            includeReviews,
        };

        const { ok, message } = await apiFetch(urls[mode], {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...authHeader(),
            },
            body: JSON.stringify(updatedTask),
        });

        pushAlert(message, ok ? "success" : "error");
        return ok;
    };

    // ── Gestión del RecurrenceChoiceDialog ────────────────────────────────────

    const onChooseSingle = async (onSuccess: () => void) => {
        const ok = await performUpdate("single");
        setRecurrenceChoiceOpen(false);
        if (ok) onSuccess();
    };

    const onChooseFromThis = async (onSuccess: () => void) => {
        const ok = await performUpdate("fromThis");
        setRecurrenceChoiceOpen(false);
        if (ok) onSuccess();
    };

    const onChooseAll = async (onSuccess: () => void) => {
        const ok = await performUpdate("all");
        setRecurrenceChoiceOpen(false);
        if (ok) onSuccess();
    };

    const onCancel = () => setRecurrenceChoiceOpen(false);

    return {
        // Estado del formulario
        title, setTitle,
        description, setDescription,
        estimatedTime, setEstimatedTime,
        finishDate, setFinishDate,
        givenDate, setGivenDate,
        subjectId, setSubjectId,
        plannable, setPlannable,
        includeReviews, setIncludeReviews,
        loading,
        // Estado del diálogo de recurrencia
        recurrenceChoiceOpen,
        // Acciones
        handleSaveClicked,
        onChooseSingle,
        onChooseFromThis,
        onChooseAll,
        onCancel,
    };
}