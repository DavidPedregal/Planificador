import React from "react";
import "./recurrenceForm.css";
import { useTranslation } from "react-i18next";
import {
    FREQUENCY_TYPE,
    RecurrenceRule,
    FREQ_OPTIONS,
} from "@/app/components/shared/lib/recurrence";

interface Props {
    recurrence: RecurrenceRule;
    start?: Date;
    onChange: (recurrence: RecurrenceRule) => void;
    onToggleWeekday: (day: number) => void;
}

export const RecurrenceForm: React.FC<Props> = ({ recurrence, start, onChange, onToggleWeekday }) => {
    const { t } = useTranslation();
    const weekdaysShort = t("recurrence.weekdaysShort", { returnObjects: true }) as string[];
    const weekdaysLong = t("recurrence.weekdaysLong", { returnObjects: true }) as string[];

    const showWeekdays  = recurrence.frequencyType === FREQUENCY_TYPE.WEEKS;
    const showEndOptions = recurrence.frequencyType !== FREQUENCY_TYPE.NONE;

    const update = (partial: Partial<RecurrenceRule>) =>
        onChange({ ...recurrence, ...partial });

    const minEndDate = start
        ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`
        : undefined;

    return (
        <div className="rf-field">
            <label className="rf-label">{t("recurrence.periodicity")}</label>
            <div className="rf-box">

                {/* Tipo de frecuencia */}
                <select
                    className="rf-input rf-select"
                    value={recurrence.frequencyType}
                    onChange={(e) => update({ frequencyType: e.target.value as RecurrenceRule["frequencyType"] })}
                    aria-label={t("recurrence.typeAriaLabel")}
                >
                    {FREQ_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{t(`recurrence.freq.${o.value}`)}</option>
                    ))}
                </select>

                {/* Intervalo */}
                {recurrence.frequencyType !== FREQUENCY_TYPE.NONE && (
                    <div className="rf-row">
                        <span className="rf-row-label">{t("recurrence.every")}</span>
                        <input
                            className="rf-input"
                            type="number"
                            min={1}
                            max={99}
                            value={recurrence.frequencyInterval}
                            aria-label={t("recurrence.intervalAriaLabel")}
                            onChange={(e) => update({ frequencyInterval: Math.max(1, +e.target.value) })}
                            style={{ width: 64, flex: "none", textAlign: "center" }}
                        />
                        <span className="rf-row-label">
                            {t(`recurrence.interval.${recurrence.frequencyType}`)}
                        </span>
                    </div>
                )}

                {/* Días de la semana */}
                {showWeekdays && (
                    <div className="rf-field">
                        <span className="rf-label">{t("recurrence.weekdays")}</span>
                        <div className="rf-weekdays">
                            {weekdaysShort.map((d, i) => (
                                <button
                                    key={`weekday-${i}`}
                                    className={`rf-wd-btn${recurrence.frequencyDaysOfWeek?.includes(i) ? " active" : ""}`}
                                    onClick={() => onToggleWeekday(i)}
                                    title={weekdaysLong[i]}
                                    aria-label={weekdaysLong[i]}
                                    aria-pressed={recurrence.frequencyDaysOfWeek?.includes(i)}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Opciones de fin */}
                {showEndOptions && (
                    <div className="rf-field">
                        <span className="rf-label">{t("recurrence.ends")}</span>
                        <div className="rf-end-options">

                            <label className="rf-radio-row">
                                <div
                                    className={`rf-radio${recurrence.frequencyEndType === "on" ? " checked" : ""}`}
                                    onClick={() => update({ frequencyEndType: "on" })}
                                />
                                <span className="rf-radio-label" onClick={() => update({ frequencyEndType: "on" })}>
                                    {t("recurrence.onDay")}
                                </span>
                                {recurrence.frequencyEndType === "on" && (
                                    <input
                                        className="rf-input"
                                        type="date"
                                        value={recurrence.frequencyEndDate}
                                        min={minEndDate}
                                        aria-label={t("recurrence.endDateAriaLabel")}
                                        onChange={(e) => update({ frequencyEndDate: e.target.value })}
                                        style={{ marginLeft: 8, flex: 1 }}
                                    />
                                )}
                            </label>

                            <label className="rf-radio-row">
                                <div
                                    className={`rf-radio${recurrence.frequencyEndType === "after" ? " checked" : ""}`}
                                    onClick={() => update({ frequencyEndType: "after" })}
                                />
                                <span className="rf-radio-label" onClick={() => update({ frequencyEndType: "after" })}>
                                    {t("recurrence.afterOccurrences")}
                                </span>
                                {recurrence.frequencyEndType === "after" && (
                                    <div className="rf-row" style={{ marginLeft: 8, flex: 1 }}>
                                        <input
                                            className="rf-input"
                                            type="number"
                                            min={1}
                                            max={999}
                                            value={recurrence.frequencyOccurrencesLeft}
                                            aria-label={t("recurrence.occurrencesAriaLabel")}
                                            onChange={(e) => update({ frequencyOccurrencesLeft: Math.max(1, +e.target.value) })}
                                            style={{ width: 64, flex: "none", textAlign: "center" }}
                                        />
                                        <span className="rf-row-label">{t("recurrence.times")}</span>
                                    </div>
                                )}
                            </label>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
