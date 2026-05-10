import React from "react";
import {
    FREQUENCY_TYPE,
    RecurrenceRule,
    WEEKDAYS,
    WEEKDAY_LABELS,
    FREQ_OPTIONS,
} from "@/app/components/shared/lib/recurrence";
import { formatDateTimeLocal } from "@/app/components/shared/lib/eventTypes";

interface Props {
    recurrence: RecurrenceRule;
    start: Date;
    onChange: (recurrence: RecurrenceRule) => void;
    onToggleWeekday: (day: number) => void;
}

const INTERVAL_LABELS: Record<string, string> = {
    daily: "día(s)",
    weekly: "semana(s)",
    monthly: "mes(es)",
    yearly: "año(s)",
};

export const EventRecurrenceForm: React.FC<Props> = ({ recurrence, start, onChange, onToggleWeekday }) => {
    const showWeekdays = recurrence.frequencyType === FREQUENCY_TYPE.WEEKS;
    const showEndOptions = recurrence.frequencyType !== FREQUENCY_TYPE.NONE;

    const update = (partial: Partial<RecurrenceRule>) => {
        onChange({ ...recurrence, ...partial });
    };

    return (
        <div className="aed-field">
            <label className="aed-label">Periodicidad</label>
            <div className="aed-recurrence-box">

                {/* Tipo de frecuencia */}
                <select
                    className="aed-input aed-select"
                    style={{ margin: 0 }}
                    value={recurrence.frequencyType}
                    onChange={(e) => update({ frequencyType: e.target.value as RecurrenceRule["frequencyType"] })}
                    aria-label="Tipo de periodicidad"
                >
                    {FREQ_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {/* Intervalo */}
                {recurrence.frequencyType !== FREQUENCY_TYPE.NONE && (
                    <div className="aed-row">
                        <span className="aed-row-label">Cada</span>
                        <input
                            className="aed-input"
                            type="number"
                            min={1}
                            max={99}
                            value={recurrence.frequencyInterval}
                            aria-label="Intervalo de repetición"
                            onChange={(e) => update({ frequencyInterval: Math.max(1, +e.target.value) })}
                            style={{ width: 64, flex: "none", textAlign: "center" }}
                        />
                        <span className="aed-row-label">
                            {INTERVAL_LABELS[recurrence.frequencyType]}
                        </span>
                    </div>
                )}

                {/* Días de la semana */}
                {showWeekdays && (
                    <div className="aed-field">
                        <span className="aed-label">Días de la semana</span>
                        <div className="aed-weekdays">
                            {WEEKDAYS.map((d, i) => (
                                <button
                                    key={`weekday-${i}`}
                                    className={`aed-wd-btn${recurrence.frequencyDaysOfWeek?.includes(i) ? " active" : ""}`}
                                    onClick={() => onToggleWeekday(i)}
                                    title={WEEKDAY_LABELS[i]}
                                    aria-label={WEEKDAY_LABELS[i]}
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
                        <span className="aed-label">Finaliza</span>
                        <div className="aed-end-options">

                            {/* Finaliza el día X */}
                            <label className="aed-radio-row">
                                <div
                                    className={`aed-radio${recurrence.frequencyEndType === "on" ? " checked" : ""}`}
                                    onClick={() => update({ frequencyEndType: "on" })}
                                />
                                <span
                                    className="aed-radio-label"
                                    onClick={() => update({ frequencyEndType: "on" })}
                                >
                                    El día
                                </span>
                                {recurrence.frequencyEndType === "on" && (
                                    <input
                                        className="aed-input"
                                        type="date"
                                        value={recurrence.frequencyEndDate}
                                        min={formatDateTimeLocal(start).slice(0, 10)}
                                        aria-label="Fecha de fin de recurrencia"
                                        onChange={(e) => update({ frequencyEndDate: e.target.value })}
                                        style={{ marginLeft: 8, flex: 1 }}
                                    />
                                )}
                            </label>

                            {/* Finaliza después de N ocurrencias */}
                            <label className="aed-radio-row">
                                <div
                                    className={`aed-radio${recurrence.frequencyEndType === "after" ? " checked" : ""}`}
                                    onClick={() => update({ frequencyEndType: "after" })}
                                />
                                <span
                                    className="aed-radio-label"
                                    onClick={() => update({ frequencyEndType: "after" })}
                                >
                                    Después de ocurrencias
                                </span>
                                {recurrence.frequencyEndType === "after" && (
                                    <div className="aed-row" style={{ marginLeft: 8, flex: 1 }}>
                                        <input
                                            className="aed-input"
                                            type="number"
                                            min={1}
                                            max={999}
                                            value={recurrence.frequencyOccurrencesLeft}
                                            aria-label="Número de ocurrencias"
                                            onChange={(e) =>
                                                update({ frequencyOccurrencesLeft: Math.max(1, +e.target.value) })
                                            }
                                            style={{ width: 64, flex: "none", textAlign: "center" }}
                                        />
                                        <span className="aed-row-label">veces</span>
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
