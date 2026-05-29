import React, { useState, useEffect } from "react";
import "../event/add-event-dialog.css";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { config } from "@/app/config/config";
import { Subject } from "@/app/components/shared/lib/subject";

interface Props {
    open: boolean;
    subject: Subject;
    onClose: () => void;
    onSave: () => void;
}

const EditSubjectDialog: React.FC<Props> = ({ open, subject, onClose, onSave }) => {
    const { pushAlert } = useApp();
    const { t } = useTranslation();
    const [name, setName] = useState(subject.name);

    useEffect(() => {
        if (open) setName(subject.name);
    }, [open, subject]);

    if (!open) return null;

    const handleSave = async () => {
        if (!name.trim()) return;

        const { ok, message } = await apiFetch(`${config.backendUrl}/subjects/${subject.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ name }),
        });

        pushAlert(message, ok ? "success" : "error");
        if (ok) { onSave(); onClose(); }
    };

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog" aria-modal="true" aria-label={t("subject.editAriaLabel")}
        >
            <div className="aed-dialog" style={{ "--aed-color": "#34d399" } as React.CSSProperties}>

                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">{t("subject.editTitle")}</span>
                    </div>
                    <button className="aed-close" onClick={onClose} aria-label={t("common.close")}>✕</button>
                </div>

                <div className="aed-body">
                    <div className="aed-field">
                        <label className="aed-label">{t("subject.nameLabel")}</label>
                        <input
                            className="aed-input"
                            type="text"
                            placeholder={t("subject.namePlaceholder")}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        />
                    </div>
                </div>

                <div className="aed-footer">
                    <button className="aed-btn aed-btn-cancel" onClick={onClose}>{t("common.cancel")}</button>
                    <button
                        className="aed-btn aed-btn-save"
                        onClick={handleSave}
                        disabled={!name.trim()}
                        style={!name.trim() ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                    >
                        {t("common.saveChanges")}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditSubjectDialog;
