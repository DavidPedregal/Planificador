import React, { useEffect } from "react";
import "./add-task-dialog.css";
import InfoIcon from "@mui/icons-material/Info";
import Tooltip from "@mui/material/Tooltip";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useTaskForm } from "./hooks/useTaskForm";
import { RecurrenceForm } from "@/app/components/shared/recurrenceForm/recurrenceForm";
import { FREQUENCY_TYPE } from "@/app/components/shared/lib/recurrence";
import { useSubjects } from "../shared/hooks/useSubjects";

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: (newTask: any) => void;
}

const AddTaskDialog: React.FC<Props> = ({ open, onClose, onSave }) => {
    const { user, pushAlert } = useApp();
    const { t } = useTranslation();
    const enabled = !!user;
    const { subjects, fetchSubjects } = useSubjects({ enabled, pushAlert });

    useEffect(() => { if (open) fetchSubjects(); }, [open, fetchSubjects]);
    const {
        title, setTitle,
        description, setDescription,
        estimatedTime, setEstimatedTime,
        finishDate, setFinishDate,
        finishTime, setFinishTime,
        givenDate, setGivenDate,
        subjectId, setSubjectId,
        plannable, setPlannable,
        includeReviews, setIncludeReviews,
        recurrence, setRecurrence,
        toggleWeekday,
        handleSave,
    } = useTaskForm({ open, pushAlert });

    if (!open) return null;

    const recurrenceEndDateMissing =
        recurrence.frequencyType !== FREQUENCY_TYPE.NONE &&
        recurrence.frequencyEndType === "on" &&
        !recurrence.frequencyEndDate;

    const onClickSave = async () => {
        const created = await handleSave();
        if (created) {
            onSave(created);
            onClose();
        }
    };

    return (
        <div
            className="atd-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label={t("task.createAriaLabel")}
        >
            <div className="atd-dialog">

                {/* Header */}
                <div className="atd-header">
                    <div className="atd-header-left">
                        <div className="atd-header-dot" />
                        <span className="atd-title">{t("task.newTitle")}</span>
                    </div>
                    <button className="atd-close" onClick={onClose} aria-label={t("common.close")}>✕</button>
                </div>

                {/* Body */}
                <div className="atd-body">

                    {/* Título */}
                    <div className="atd-field">
                        <label className="atd-label">{t("task.titleLabel")}</label>
                        <input
                            className="atd-input"
                            type="text"
                            placeholder={t("task.titlePlaceholder")}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && onClickSave()}
                        />
                    </div>

                    {/* Descripción */}
                    <div className="atd-field">
                        <label className="atd-label">{t("task.description")}</label>
                        <textarea
                            className="atd-input atd-textarea"
                            placeholder={t("task.descriptionPlaceholder")}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Tiempo estimado */}
                    <div className="atd-field">
                        <label className="atd-label">{t("task.estimatedTime")}</label>
                        <div className="aed-date-strip">
                            <div className="aed-date-field">
                                <input
                                    className="aed-date-input"
                                    type="number"
                                    min={0}
                                    max={99}
                                    value={String(Math.floor(estimatedTime / 60)).padStart(2, "0")}
                                    aria-label={t("task.hoursAriaLabel")}
                                    onChange={(e) => {
                                        const hours = Math.min(99, Math.max(0, +e.target.value));
                                        setEstimatedTime(hours * 60 + (estimatedTime % 60));
                                    }}
                                />
                                <span className="aed-date-icon">{t("task.hoursUnit")}</span>
                            </div>
                            <div className="aed-date-field">
                                <input
                                    className="aed-date-input"
                                    type="number"
                                    min={0}
                                    max={59}
                                    value={String(estimatedTime % 60).padStart(2, "0")}
                                    aria-label={t("task.minutesAriaLabel")}
                                    onChange={(e) => {
                                        const minutes = Math.min(59, Math.max(0, +e.target.value));
                                        setEstimatedTime(Math.floor(estimatedTime / 60) * 60 + minutes);
                                    }}
                                />
                                <span className="aed-date-icon">{t("task.minutesUnit")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Fecha de entrega */}
                    <div className="atd-field">
                        <label className="atd-label">{t("task.dueDate")}</label>
                        <div className="atd-date-time-row">
                            <input
                                className="atd-input"
                                type="date"
                                value={finishDate}
                                onChange={(e) => setFinishDate(e.target.value)}
                            />
                            <input
                                className="atd-input atd-time-input"
                                type="time"
                                value={finishTime}
                                onChange={(e) => setFinishTime(e.target.value)}
                                aria-label={t("task.dueTime")}
                            />
                        </div>
                    </div>

                    {/* Fecha de impartición */}
                    <div className="atd-field">
                        <label className="atd-label">
                            {t("task.givenDate")}
                            <Tooltip title={t("task.givenDateTooltip")}>
                                <InfoIcon sx={{ fontSize: "1rem", marginLeft: "6px", cursor: "help", color: "var(--accent, #7c6ff7)" }} />
                            </Tooltip>
                        </label>
                        <input
                            className="atd-input"
                            type="date"
                            value={givenDate}
                            onChange={(e) => setGivenDate(e.target.value)}
                        />
                    </div>

                    {/* Asignatura */}
                    <div className="atd-field">
                        <label className="atd-label">{t("task.subject")}</label>
                        <select
                            className="atd-input atd-select"
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            aria-label={t("task.subject")}
                        >
                            <option value="">{t("common.none")}</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Plannable */}
                    <div className="atd-field">
                        <label className="atd-label">
                            <input
                                type="checkbox"
                                checked={plannable}
                                onChange={(e) => setPlannable(e.target.checked)}
                                style={{ marginRight: "8px" }}
                            />
                            {t("task.includePlanning")}
                        </label>
                    </div>

                    {/* Reviews */}
                    <div className="atd-field">
                        <label className="atd-label">
                            <input
                                type="checkbox"
                                checked={includeReviews}
                                onChange={(e) => setIncludeReviews(e.target.checked)}
                                style={{ marginRight: "8px" }}
                            />
                            {t("task.addReviews")}
                        </label>
                    </div>

                    {/* Periodicidad */}
                    <RecurrenceForm
                        recurrence={recurrence}
                        onChange={setRecurrence}
                        onToggleWeekday={toggleWeekday}
                    />

                </div>

                {/* Footer */}
                <div className="atd-footer">
                    <button className="atd-btn atd-btn-cancel" onClick={onClose}>{t("common.cancel")}</button>
                    <button
                        className="atd-btn atd-btn-save"
                        onClick={onClickSave}
                        disabled={!title.trim() || recurrenceEndDateMissing}
                        style={!title.trim() || recurrenceEndDateMissing ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                    >
                        {t("task.save")}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddTaskDialog;
