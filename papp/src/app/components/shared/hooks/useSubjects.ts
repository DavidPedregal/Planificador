import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { Subject } from "@/app/components/shared/lib/subject";
import { AlertSeverity } from "@/context/AppContext";

interface UseSubjectsParams {
    enabled: boolean;
    pushAlert: (message: string, severity: AlertSeverity) => void;
}

export function useSubjects({ enabled, pushAlert }: UseSubjectsParams) {
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    useEffect(() => {
        if (enabled) fetchSubjects();
    }, [enabled]);

    const fetchSubjects = async () => {
        const { ok, data, message } = await apiFetch(`${config.backendUrl}/subjects`, {
            headers: authHeader(),
        });
        if (!ok) { pushAlert(message, "error"); return; }
        setSubjects(data.map((s: any) => ({ id: s._id, name: s.name })));
    };

    const deleteSubject = async (id: string): Promise<boolean> => {
        const { ok, message } = await apiFetch(`${config.backendUrl}/subjects/${id}`, {
            method: "DELETE",
            headers: authHeader(),
        });
        pushAlert(message, ok ? "success" : "error");
        if (ok) await fetchSubjects();
        return ok;
    };

    return { subjects, fetchSubjects, deleteSubject };
}