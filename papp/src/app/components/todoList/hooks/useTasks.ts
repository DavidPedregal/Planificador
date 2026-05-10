import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { AlertSeverity } from "@/context/AppContext";

export interface Task {
    id: number;
    title: string;
    completed: boolean;
    estimatedTime: number;
    finishDate: Date;
}

export type DeleteMode = "single" | "fromThis" | "all";

export function mapTask(data: any): Task {
    return {
        id: data._id,
        title: data.title,
        completed: data.completed,
        finishDate: new Date(data.finishDate),
        estimatedTime: data.estimatedTime,
    };
}

interface UseTasksParams {
    pushAlert: (message: string, severity: AlertSeverity) => void;
}

export function useTasks({ pushAlert }: UseTasksParams) {
    const [tasks, setTasks] = useState<Task[]>([]);

    const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    const sortByDate = (arr: Task[]) =>
        [...arr].sort((a, b) => a.finishDate.getTime() - b.finishDate.getTime());

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchTasks = async () => {
        const { ok, data, message } = await apiFetch(config.backendUrl + "/tasks", {
            headers: authHeader(),
        });
        if (!ok) { pushAlert(message, "error"); return; }
        setTasks(sortByDate(data.map(mapTask)));
    };

    useEffect(() => { fetchTasks(); }, []);

    // ── Delete ────────────────────────────────────────────────────────────────

    const deleteTask = async (id: number, mode: DeleteMode): Promise<boolean> => {
        const urls: Record<DeleteMode, string> = {
            single:   `${config.backendUrl}/tasks/${id}`,
            fromThis: `${config.backendUrl}/tasks/forward/${id}`,
            all:      `${config.backendUrl}/tasks/all/${id}`,
        };
        const { ok, message } = await apiFetch(urls[mode], {
            method: "DELETE",
            headers: authHeader(),
        });
        pushAlert(message, ok ? "success" : "error");
        if (ok) await fetchTasks();
        return ok;
    };

    // ── Derived state ─────────────────────────────────────────────────────────

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue   = tasks.filter(t => !t.completed && t.finishDate < today);
    const pending   = tasks.filter(t => !t.completed && t.finishDate >= today);
    const completed = tasks.filter(t => t.completed);

    return {
        tasks,
        overdue,
        pending,
        completed,
        fetchTasks,
        deleteTask,
        addTasks: (newTasks: any[]) => {
            setTasks(prev => sortByDate([...prev, ...newTasks.map(mapTask)]));
        },
    };
}