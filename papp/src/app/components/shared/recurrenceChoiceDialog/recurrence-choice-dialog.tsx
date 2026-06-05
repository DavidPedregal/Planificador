import React from "react";
import "./recurrence-choice-dialog.css";
import { useTranslation } from "react-i18next";

interface Props {
    open: boolean;
    action: "update" | "delete";
    kind?: "event" | "task";
    title: string;
    message: string;
    onChooseSingle: () => void;
    onChooseFromThis: () => void;
    onChooseAll: () => void;
    onCancel: () => void;
}

const RecurrenceChoiceDialog: React.FC<Props> = ({
    open,
    action,
    kind = "event",
    title,
    message,
    onChooseSingle,
    onChooseFromThis,
    onChooseAll,
    onCancel,
}) => {
    const { t } = useTranslation();
    if (!open) return null;

    const actionLabel = action === "delete" ? t("recurrenceChoice.actionDelete") : t("recurrenceChoice.actionUpdate");
    const singleKey   = kind === "task" ? "recurrenceChoice.singleTask"   : "recurrenceChoice.single";
    const fromThisKey = kind === "task" ? "recurrenceChoice.fromThisTask" : "recurrenceChoice.fromThis";

    return (
        <div
            className="rcd-overlay"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div
                className="rcd-dialog"
                style={{ "--rcd-color": action === "delete" ? "#ef4444" : "#7c6ff7" } as React.CSSProperties}
            >
                {/* Header */}
                <div className="rcd-header">
                    <div className="rcd-header-left">
                        <div className="rcd-header-dot" />
                        <span className="rcd-title">{title}</span>
                    </div>
                    <button className="rcd-close" onClick={onCancel} aria-label={t("common.close")}>
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="rcd-body">
                    <p style={{ margin: 0, fontSize: "0.95rem", color: "#b8b8cc", lineHeight: 1.5 }}>
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="rcd-footer">
                    <button className="rcd-btn rcd-btn-cancel" onClick={onCancel}>
                        {t("common.cancel")}
                    </button>
                    <button className="rcd-btn rcd-btn-save" onClick={onChooseSingle}>
                        {t(singleKey, { action: actionLabel })}
                    </button>
                    <button className="rcd-btn rcd-btn-save" onClick={onChooseFromThis}>
                        {t(fromThisKey, { action: actionLabel })}
                    </button>
                    <button className="rcd-btn rcd-btn-save" onClick={onChooseAll}>
                        {t("recurrenceChoice.all", { action: actionLabel })}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecurrenceChoiceDialog;
