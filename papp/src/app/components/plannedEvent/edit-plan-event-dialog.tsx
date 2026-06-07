import React, { useState, useEffect } from "react";
import "./edit-plan-event-dialog.css";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { playCompletionSound } from "@/lib/sounds";
import { config } from "@/app/config/config";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
    open: boolean;
    planEventId: string;
    status: string;
    onClose: () => void;
    onSave: (status: string) => void;
    onDelete: () => void;
}

function minutesToTimeString(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

const EditPlanEventDialog: React.FC<Props> = ({
    open,
    planEventId,
    status,
    onClose,
    onSave,
    onDelete,
}) => {
    const { pushAlert } = useApp();
    const { t } = useTranslation();
    const [actualTime, setActualTime] = useState("");
    const [taskTitle, setTaskTitle] = useState("");
    const [scheduledTimeStr, setScheduledTimeStr] = useState("");

    useEffect(() => {
        if (!open || !planEventId) return;

        const fetchEvent = async () => {
            const { ok, data } = await apiFetch(`${config.backendUrl}/plan/${planEventId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (ok && data) {
                setTaskTitle(data.title ?? "");
                const planned = minutesToTimeString(data.scheduledTime ?? 0);
                setScheduledTimeStr(planned);
                const defaultTime = data.userTime != null
                    ? minutesToTimeString(data.userTime)
                    : planned;
                setActualTime(defaultTime);
            } else {
                setActualTime("");
                setTaskTitle("");
                setScheduledTimeStr("");
            }
        };

        fetchEvent();
    }, [open, planEventId]);

    if (!open) return null;

    const isCompleted = status === "completed";

    const handleMarkCompleted = async () => {
        const [hours, minutes] = actualTime.split(":").map(Number);
        const { ok, message } = await apiFetch(`${config.backendUrl}/plan/${planEventId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ userTime: hours * 60 + minutes, status: "completed" }),
        });
        pushAlert(message, ok ? "success" : "error");
        if (ok) { playCompletionSound(); onSave("completed"); onClose(); }
    };

    const handleDelete = async () => {
        const { ok, message } = await apiFetch(`${config.backendUrl}/plan/${planEventId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        pushAlert(message, ok ? "success" : "error");
        if (ok) { onDelete(); onClose(); }
    };

    const timeLabel = taskTitle
        ? `${taskTitle}${scheduledTimeStr ? ` (${scheduledTimeStr})` : ""}`
        : t("planEvent.actualTime");

    return (
        <div
            className="eped-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label={t("planEvent.ariaLabel")}
        >
            <div className="eped-dialog">

                {/* Header */}
                <div className="eped-header">
                    <div className="eped-header-left">
                        <div className="eped-header-dot" />
                        <h2 className="eped-title">
                            {taskTitle || t("planEvent.title")}
                        </h2>
                    </div>
                    <button className="eped-close" onClick={onClose} aria-label={t("common.close")}>
                        <CloseIcon fontSize="inherit" />
                    </button>
                </div>

                {/* Body */}
                <div className="eped-body">
                    <div className="eped-field">
                        <label className="eped-label">{timeLabel}</label>
                        <div className="eped-time-row">
                            <input
                                type="time"
                                value={actualTime}
                                onChange={(e) => setActualTime(e.target.value)}
                                className="eped-input eped-time-input"
                                aria-label={t("planEvent.actualTimeAriaLabel")}
                                disabled={isCompleted}
                            />
                            <button className="eped-btn eped-btn-danger" onClick={handleDelete}>
                                {t("common.delete")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="eped-footer">
                    <button className="eped-btn eped-btn-cancel" onClick={onClose}>
                        {t("common.cancel")}
                    </button>
                    <button
                        className="eped-btn eped-btn-primary"
                        onClick={handleMarkCompleted}
                        disabled={isCompleted || !actualTime}
                        title={isCompleted ? t("planEvent.alreadyCompleted") : undefined}
                    >
                        {isCompleted ? t("planEvent.completed") : t("planEvent.markCompleted")}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditPlanEventDialog;
