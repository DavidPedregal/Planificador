import React, { useState } from "react";
import "./add-event-dialog.css";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useCalendarList } from "./hooks/useCalendarList";
import { useEditEventForm } from "./hooks/useEditEventForm";
import { EventDateStrip } from "./components/EventDateStrip";
import { EventColorPicker } from "./components/EventColorPicker";
import RecurrenceChoiceDialog from "@/app/components/shared/recurrenceChoiceDialog/recurrence-choice-dialog";
import ConfirmDialog from "@/app/components/sidebar/confirm-dialog";

interface Props {
    open: boolean;
    eventId: string;
    onClose: () => void;
    onSave: () => void;
    onDelete: () => void;
}

const EditEventDialog: React.FC<Props> = ({ open, eventId, onClose, onSave, onDelete }) => {
    const { pushAlert } = useApp();
    const { t } = useTranslation();
    const { calendars } = useCalendarList(open, pushAlert);
    const {
        eventTitle, setEventTitle,
        label, setLabel,
        calendarId, setCalendarId,
        color, setColor,
        useCustomColor, setUseCustomColor,
        start, setStart,
        end, setEnd,
        recurrenceChoiceOpen,
        pendingAction,
        loading,
        recurring,
        handleSaveClicked,
        handleDeleteClicked,
        onChooseSingle,
        onChooseFromThis,
        onChooseAll,
        onCancel,
    } = useEditEventForm({ open, eventId, calendars, pushAlert });

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    if (!open) return null;

    const handleSuccess = (action: "save" | "delete") => {
        if (action === "save") onSave();
        else onDelete();
        onClose();
    };

    const handleSave   = recurring ? handleSaveClicked : () => onChooseSingle(() => handleSuccess("save"));
    const handleDelete = recurring ? handleDeleteClicked : () => setConfirmDeleteOpen(true);

    return (
        <>
            <div
                className="aed-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
                role="dialog"
                aria-modal="true"
                aria-label={t("event.editAriaLabel")}
            >
                <div className="aed-dialog" style={{ "--aed-color": color } as React.CSSProperties}>

                    {/* Header */}
                    <div className="aed-header">
                        <div className="aed-header-left">
                            <div className="aed-header-dot" />
                            <span className="aed-title">
                                {loading ? t("event.loadingTitle") : t("event.editTitle")}
                            </span>
                        </div>
                        <button className="aed-close" onClick={onClose} aria-label={t("common.close")}>✕</button>
                    </div>

                    {/* Fechas y horas */}
                    <EventDateStrip mode="date" start={start} end={end} onStartChange={setStart} onEndChange={setEnd} disabled={recurring} />
                    <EventDateStrip mode="time" start={start} end={end} onStartChange={setStart} onEndChange={setEnd} />

                    {/* Body */}
                    <div className="aed-body">

                        {/* Título */}
                        <div className="aed-field">
                            <label className="aed-label">{t("event.titleLabel")}</label>
                            <input
                                className="aed-input"
                                type="text"
                                placeholder={t("event.titlePlaceholder")}
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            />
                        </div>

                        {/* Calendario */}
                        <div className="aed-field">
                            <label className="aed-label">{t("event.calendarLabel")}</label>
                            <select
                                className="aed-input aed-select"
                                value={calendarId}
                                onChange={(e) => setCalendarId(e.target.value)}
                                aria-label={t("event.selectCalendarAriaLabel")}
                            >
                                {calendars.map((cal) => (
                                    <option key={cal.id} value={cal.id}>
                                        {cal.name.startsWith("calendar.") ? t(cal.name) : cal.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Etiqueta */}
                        <div className="aed-field">
                            <label className="aed-label">{t("event.labelField")}</label>
                            <input
                                className="aed-input"
                                type="text"
                                placeholder={t("event.labelPlaceholder")}
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                            />
                        </div>

                        {/* Color */}
                        <EventColorPicker
                            useCustomColor={useCustomColor}
                            color={color}
                            onToggleCustomColor={setUseCustomColor}
                            onColorChange={setColor}
                        />

                    </div>

                    {/* Footer */}
                    <div className="aed-footer">
                        <button className="aed-btn aed-btn-cancel" onClick={onClose}>
                            {t("common.cancel")}
                        </button>
                        <button className="aed-btn aed-btn-delete" onClick={handleDelete}>
                            {t("event.delete")}
                        </button>
                        <button
                            className="aed-btn aed-btn-save"
                            onClick={handleSave}
                            disabled={!eventTitle.trim() || loading}
                            style={(!eventTitle.trim() || loading) ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                        >
                            {t("event.update")}
                        </button>
                    </div>

                </div>
            </div>

            <RecurrenceChoiceDialog
                open={recurrenceChoiceOpen}
                action={pendingAction ?? "update"}
                title={pendingAction === "delete" ? t("event.deleteRecurringTitle") : t("event.updateRecurringTitle")}
                message={
                    pendingAction === "delete"
                        ? t("event.deleteRecurringMsg")
                        : t("event.updateRecurringMsg")
                }
                onChooseSingle={() => onChooseSingle(() => handleSuccess(pendingAction === "delete" ? "delete" : "save"))}
                onChooseFromThis={() => onChooseFromThis(() => handleSuccess(pendingAction === "delete" ? "delete" : "save"))}
                onChooseAll={() => onChooseAll(() => handleSuccess(pendingAction === "delete" ? "delete" : "save"))}
                onCancel={onCancel}
            />

            <ConfirmDialog
                open={confirmDeleteOpen}
                title={t("event.deleteConfirmTitle")}
                message={t("event.deleteConfirmMsg")}
                confirmText={t("common.delete")}
                isDangerous
                onConfirm={() => { setConfirmDeleteOpen(false); onChooseSingle(() => handleSuccess("delete")); }}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </>
    );
};

export default EditEventDialog;
