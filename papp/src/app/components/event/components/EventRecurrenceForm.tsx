import React from "react";
import { useTranslation } from "react-i18next";
import {
    FREQUENCY_TYPE,
    RecurrenceRule,
    FREQ_OPTIONS,
} from "@/app/components/shared/lib/recurrence";
import { formatDateTimeLocal } from "@/app/components/shared/lib/eventTypes";

interface Props {
    recurrence: RecurrenceRule;
    start: Date;
    onChange: (recurrence: RecurrenceRule) => void;
    onToggleWeekday: (day: number) => void;
}

export const EventRecurrenceForm: React.FC<Props> = ({ recurrence, start, onChange, onToggleWeekday }) => {
    const { t } = useTranslation();
    const weekdaysShort = t("recurrence.weekdaysShort", { returnObjects: true }) as string[];
    const weekdaysLong = t("recurrence.weekdaysLong", { returnObjects: true }) as string[];

    const showWeekdays = recurrence.frequencyType === FREQUENCY_TYPE.WEEKS;
    const showEndOptions = recurrence.frequencyType !== FREQUENCY_TYPE.NONE;

    const update = (partial: Partial<RecurrenceRule>) => {
        onChange({ ...recurrence, ...partial });
    };

    return (
        <div className="aed-field">
            <label className="aed-label">{t("recurrence.periodicity")}</label>
            <div className="aed-recurrence-box">

                {/* Tipo de frecuencia */}
                <select
                    className="aed-input aed-select"
                    style={{ margin: 0 }}
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
                    <div className="aed-row">
                        <span className="aed-row-label">{t("recurrence.every")}</span>
                        <input
                            className="aed-input"
                            type="number"
                            min={1}
                            max={99}
                            value={recurrence.frequencyInterval}
                            aria-label={t("recurrence.intervalAriaLabel")}
                            onChange={(e) => update({ frequencyInterval: Math.max(1, +e.target.value) })}
                            style={{ width: 64, flex: "none", textAlign: "center" }}
                        />
                        <span className="aed-row-label">
                            {t(`recurrence.interval.${recurrence.frequencyType}`)}
                        </span>
                    </div>
                )}

                {/* Días de la semana */}
                {showWeekdays && (
                    <div className="aed-field">
                        <span className="aed-label">{t("recurrence.weekdays")}</span>
                        <div className="aed-weekdays">
                            {weekdaysShort.map((d, i) => (
                                <button
                                    key={`weekday-${i}`}
                                    className={`aed-wd-btn${recurrence.frequencyDaysOfWeek?.includes(i) ? " active" : ""}`}
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
                    <div className="aed-field">
                        <span className="aed-label">{t("recurrence.ends")}</span>
                        <div className="aed-end-options">

                            <label className="aed-radio-row">
                                <div
                                    className={`aed-radio${recurrence.frequencyEndType === "on" ? " checked" : ""}`}
                                    onClick={() => update({ frequencyEndType: "on" })}
                                />
                                <span
                                    className="aed-radio-label"
                                    onClick={() => update({ frequencyEndType: "on" })}
                                >
                                    {t("recurrence.onDay")}
                                </span>
                                {recurrence.frequencyEndType === "on" && (
                                    <input
                                        className="aed-input"
                                        type="date"
                                        value={recurrence.frequencyEndDate}
                                        min={formatDateTimeLocal(start).slice(0, 10)}
                                        aria-label={t("recurrence.endDateAriaLabel")}
                                        onChange={(e) => update({ frequencyEndDate: e.target.value })}
                                        style={{ marginLeft: 8, flex: 1 }}
                                    />
                                )}
                            </label>

                            <label className="aed-radio-row">
                                <div
                                    className={`aed-radio${recurrence.frequencyEndType === "after" ? " checked" : ""}`}
                                    onClick={() => update({ frequencyEndType: "after" })}
                                />
                                <span
                                    className="aed-radio-label"
                                    onClick={() => update({ frequencyEndType: "after" })}
                                >
                                    {t("recurrence.afterOccurrences")}
                                </span>
                                {recurrence.frequencyEndType === "after" && (
                                    <div className="aed-row" style={{ marginLeft: 8, flex: 1 }}>
                                        <input
                                            className="aed-input"
                                            type="number"
                                            min={1}
                                            max={999}
                                            value={recurrence.frequencyOccurrencesLeft}
                                            aria-label={t("recurrence.occurrencesAriaLabel")}
                                            onChange={(e) =>
                                                update({ frequencyOccurrencesLeft: Math.max(1, +e.target.value) })
                                            }
                                            style={{ width: 64, flex: "none", textAlign: "center" }}
                                        />
                                        <span className="aed-row-label">{t("recurrence.times")}</span>
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
