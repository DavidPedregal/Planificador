import React, { useState, useEffect } from "react";
import "../event/add-event-dialog.css";
import { useTranslation } from "react-i18next";

interface DeleteByLabelDialogProps {
    open: boolean;
    onConfirm: (label: string) => void;
    onCancel: () => void;
}

const DeleteByLabelDialog: React.FC<DeleteByLabelDialogProps> = ({ open, onConfirm, onCancel }) => {
    const { t } = useTranslation();
    const [label, setLabel] = useState("");

    useEffect(() => {
        if (open) setLabel("");
    }, [open]);

    if (!open) return null;

    const handleConfirm = () => {
        if (label.trim()) onConfirm(label.trim());
    };

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
            role="dialog"
            aria-modal="true"
            aria-label={t("sidebar.toolsDeleteByLabel")}
        >
            <div className="aed-dialog" style={{ "--aed-color": "#ef4444" } as React.CSSProperties}>
                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">{t("sidebar.toolsDeleteByLabel")}</span>
                    </div>
                    <button className="aed-close" onClick={onCancel} aria-label={t("common.close")}>✕</button>
                </div>

                <div className="aed-body">
                    <div className="aed-field">
                        <label className="aed-label">{t("sidebar.deleteByLabelInputLabel")}</label>
                        <input
                            className="aed-input"
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                            placeholder={t("sidebar.deleteByLabelPlaceholder")}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="aed-footer">
                    <button className="aed-button" onClick={onCancel}>
                        {t("common.cancel")}
                    </button>
                    <button
                        className="aed-button danger"
                        onClick={handleConfirm}
                        disabled={!label.trim()}
                    >
                        {t("common.delete")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteByLabelDialog;
