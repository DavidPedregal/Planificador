import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { Subject } from "@/app/components/calendar/calendarHelper";
import { AlertSeverity } from "@/context/AppContext";

interface UseSubjectListParams {
    open: boolean;
    pushAlert: (message: string, severity: AlertSeverity) => void;
}

export function useSubjectList({ open, pushAlert }: UseSubjectListParams) {
    const [subjects, setSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        if (open) fetchSubjects();
    }, [open]);

    const fetchSubjects = async () => {
        const { ok, data, message } = await apiFetch(config.backendUrl + "/subjects", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!ok) { pushAlert(message, "error"); return; }
        setSubjects(data.map((s: any) => ({ id: s._id, name: s.name })));
    };

    return { subjects };
}