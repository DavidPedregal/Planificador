import React from "react";
import "../event/add-event-dialog.css";
import "./plan-result-dialog.css";

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
    if (!open) return null;

    return (
        <div
            className="aed-overlay"
            onClick={(e) => !loading && e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label="Resultado de planificación"
        >
            <div className="aed-dialog" style={{ "--aed-color": "#7c6ff7" } as React.CSSProperties}>

                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">
                            {loading ? "Planificando…" : "Resultado del plan"}
                        </span>
                    </div>
                    {!loading && (
                        <button className="aed-close" onClick={onClose} aria-label="Cerrar">✕</button>
                    )}
                </div>

                <div className="aed-body prd-body">
                    {loading ? (
                        <div className="prd-loading">
                            <div className="prd-spinner" />
                            <p className="prd-loading-text">Generando tu plan…</p>
                        </div>
                    ) : (
                        <>
                            <div className="prd-success-row">
                                <div className="prd-check">✓</div>
                                <p className="prd-success-text">
                                    {warnings.length === 0
                                        ? "¡Plan creado con éxito! Todas las tareas han sido planificadas."
                                        : `Plan creado. ${warnings.length === 1 ? "1 tarea no pudo" : `${warnings.length} tareas no pudieron`} ser planificada${warnings.length === 1 ? "" : "s"}.`
                                    }
                                </p>
                            </div>

                            {warnings.length > 0 && (
                                <div className="prd-warnings">
                                    <span className="prd-warnings-label">Tareas sin planificar</span>
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
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanResultDialog;
