import React from "react";
import "./add-event-dialog.css";
import { useTranslation } from "react-i18next";
import { useCalendarList } from "./hooks/useCalendarList";
import { useEventForm } from "./hooks/useEventForm";
import { EventDateStrip } from "./components/EventDateStrip";
import { EventColorPicker } from "./components/EventColorPicker";
import { RecurrenceForm } from "@/app/components/shared/recurrenceForm/recurrenceForm";
import { FREQUENCY_TYPE } from "@/app/components/shared/lib/recurrence";
import { useApp } from "@/context/AppContext";

interface Props {
    open: boolean;
    start: Date;
    end: Date;
    onClose: () => void;
    onSave: () => void;
}

const AddEventDialog: React.FC<Props> = ({ open, start: propsStart, end: propsEnd, onClose, onSave }) => {
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
        recurrence, setRecurrence,
        toggleWeekday,
        handleSave,
    } = useEventForm({ open, propsStart, propsEnd, calendars, pushAlert });

    if (!open || !start || !end) return null;

    const selectedCalendar = calendars.find(c => c.id === calendarId);
    const isPlannableCalendar = selectedCalendar?.name === "calendar.plannable";
    const recurrenceEndDateMissing =
        recurrence.frequencyType !== FREQUENCY_TYPE.NONE &&
        recurrence.frequencyEndType === "on" &&
        !recurrence.frequencyEndDate;
    const canSave = (!!eventTitle.trim() || isPlannableCalendar) && !recurrenceEndDateMissing;

    const onClickSave = async () => {
        const ok = await handleSave();
        if (ok) {
            onSave();
            onClose();
        }
    };

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label={t("event.createAriaLabel")}
        >
            <div className="aed-dialog" style={{ "--aed-color": color } as React.CSSProperties}>

                {/* Header */}
                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">{t("event.newTitle")}</span>
                    </div>
                    <button className="aed-close" onClick={onClose} aria-label={t("common.close")}>✕</button>
                </div>

                {/* Fechas y horas */}
                <EventDateStrip mode="date" start={start} end={end} onStartChange={setStart} onEndChange={setEnd} />
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
                            onKeyDown={(e) => e.key === "Enter" && onClickSave()}
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

                    {/* Periodicidad */}
                    <RecurrenceForm
                        recurrence={recurrence}
                        start={start}
                        onChange={setRecurrence}
                        onToggleWeekday={toggleWeekday}
                    />

                </div>

                {/* Footer */}
                <div className="aed-footer">
                    <button className="aed-btn aed-btn-cancel" onClick={onClose}>
                        {t("common.cancel")}
                    </button>
                    <button
                        className="aed-btn aed-btn-save"
                        onClick={onClickSave}
                        disabled={!canSave}
                        style={!canSave ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                    >
                        {t("event.save")}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddEventDialog;
