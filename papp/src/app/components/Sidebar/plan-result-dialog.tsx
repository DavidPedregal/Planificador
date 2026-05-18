import React from "react";
import "../event/add-event-dialog.css";
import "./plan-result-dialog.css";
import { useTranslation } from "react-i18next";

interface PlanWarning {
    taskId: string;
    title: string;
    message: string;
}

interface PlanResultDialogProps {
    open: boolean;
    loading: boolean;
    warnings: PlanWarning[];
    onClose: () => void;
}

const PlanResultDialog: React.FC<PlanResultDialogProps> = ({ open, loading, warnings, onClose }) => {
    const { t } = useTranslation();
    if (!open) return null;

    return (
        <div
            className="aed-overlay"
            onClick={(e) => !loading && e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label={t("planResult.ariaLabel")}
        >
            <div className="aed-dialog" style={{ "--aed-color": "#7c6ff7" } as React.CSSProperties}>

                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">
                            {loading ? t("planResult.planning") : t("planResult.resultTitle")}
                        </span>
                    </div>
                    {!loading && (
                        <button className="aed-close" onClick={onClose} aria-label={t("common.close")}>✕</button>
                    )}
                </div>

                <div className="aed-body prd-body">
                    {loading ? (
                        <div className="prd-loading">
                            <div className="prd-spinner" />
                            <p className="prd-loading-text">{t("planResult.generating")}</p>
                        </div>
                    ) : (
                        <>
                            <div className="prd-success-row">
                                <div className="prd-check">✓</div>
                                <p className="prd-success-text">
                                    {warnings.length === 0
                                        ? t("planResult.success")
                                        : t("planResult.partial", { count: warnings.length })
                                    }
                                </p>
                            </div>

                            {warnings.length > 0 && (
                                <div className="prd-warnings">
                                    <span className="prd-warnings-label">{t("planResult.unplanned")}</span>
                                    <ul className="prd-warnings-list">
                                        {warnings.map((w) => (
                                            <li key={w.taskId} className="prd-warning-item">
                                                <span className="prd-warning-title">{w.title}</span>
                                                <span className="prd-warning-msg">{w.message}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!loading && (
                    <div className="aed-footer">
                        <button className="aed-button primary" onClick={onClose}>
                            {t("planResult.close")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanResultDialog;
