import React, { useState, useEffect } from "react";
import "./edit-plan-event-dialog.css";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { playCompletionSound } from "@/lib/sounds";
import { config } from "@/app/config/config";
import CloseIcon from "@mui/icons-material/Close";

const RATING_VALUES = [0, 1, 2, 3, 4, 5] as const;

interface Props {
    open: boolean;
    planEventId: string;
    status: string;
    onClose: () => void;
    onSave: (status: string) => void;
    onDelete: () => void;
}

const EditReviewPlanEventDialog: React.FC<Props> = ({
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
    const [rating, setRating] = useState<number | null>(null);

    useEffect(() => {
        if (open) { setActualTime(""); setRating(null); }
    }, [open]);

    if (!open) return null;

    const isCompleted = status === "completed";
    const canSubmit = !isCompleted && !!actualTime && rating !== null;

    const handleMarkCompleted = async () => {
        const [hours, minutes] = actualTime.split(":").map(Number);
        const { ok, message } = await apiFetch(`${config.backendUrl}/plan/${planEventId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ userTime: hours * 60 + minutes, rating, status: "completed" }),
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

    return (
        <div
            className="eped-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label={t("planEvent.review.ariaLabel")}
        >
            <div className="eped-dialog">

                {/* Header */}
                <div className="eped-header">
                    <div className="eped-header-left">
                        <div className="eped-header-dot" />
                        <h2 className="eped-title">{t("planEvent.review.title")}</h2>
                    </div>
                    <button className="eped-close" onClick={onClose} aria-label={t("common.close")}>
                        <CloseIcon fontSize="inherit" />
                    </button>
                </div>

                {/* Body */}
                <div className="eped-body">
                    <div className="eped-field">
                        <label className="eped-label">{t("planEvent.actualTime")}</label>
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

                    <div className="eped-field">
                        <label className="eped-label">{t("planEvent.review.ratingLabel")}</label>
                        <div className="eped-rating-grid" role="radiogroup" aria-label={t("planEvent.review.ratingLabel")}>
                            {RATING_VALUES.map((value) => (
                                <div
                                    key={value}
                                    className={[
                                        "eped-rating-option",
                                        rating === value ? "eped-rating-selected" : "",
                                        isCompleted ? "eped-rating-disabled" : "",
                                    ].join(" ")}
                                    onClick={() => !isCompleted && setRating(value)}
                                    role="radio"
                                    aria-checked={rating === value}
                                    aria-label={`${value} — ${t(`planEvent.review.ratings.${value}`)}`}
                                >
                                    <span className="eped-rating-number">{value}</span>
                                    <span className="eped-rating-desc">{t(`planEvent.review.ratings.${value}`)}</span>
                                </div>
                            ))}
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
                        disabled={!canSubmit}
                        title={
                            isCompleted
                                ? t("planEvent.alreadyCompleted")
                                : rating === null
                                ? t("planEvent.review.ratingRequired")
                                : undefined
                        }
                    >
                        {isCompleted ? t("planEvent.completed") : t("planEvent.markCompleted")}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditReviewPlanEventDialog;
