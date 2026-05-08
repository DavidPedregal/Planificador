import React from "react";
import "./recurrenceForm.css";
import {
    FREQUENCY_TYPE,
    RecurrenceRule,
    WEEKDAYS,
    WEEKDAY_LABELS,
    FREQ_OPTIONS,
} from "@/app/components/calendar/calendarHelper";

interface Props {
    recurrence: RecurrenceRule;
    start?: Date;           // opcional — solo necesario si se muestra el date picker de fin
    onChange: (recurrence: RecurrenceRule) => void;
    onToggleWeekday: (day: number) => void;
}

const INTERVAL_LABELS: Record<string, string> = {
    day:   "día(s)",
    week:  "semana(s)",
    month: "mes(es)",
    year:  "año(s)",
};

export const RecurrenceForm: React.FC<Props> = ({ recurrence, start, onChange, onToggleWeekday }) => {
    const showWeekdays  = recurrence.frequencyType === FREQUENCY_TYPE.WEEKS;
    const showEndOptions = recurrence.frequencyType !== FREQUENCY_TYPE.NONE;

    const update = (partial: Partial<RecurrenceRule>) =>
        onChange({ ...recurrence, ...partial });

    const minEndDate = start
        ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`
        : undefined;

    return (
        <div className="rf-field">
            <label className="rf-label">Periodicidad</label>
            <div className="rf-box">

                {/* Tipo de frecuencia */}
                <select
                    className="rf-input rf-select"
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
                    <div className="rf-row">
                        <span className="rf-row-label">Cada</span>
                        <input
                            className="rf-input"
                            type="number"
                            min={1}
                            max={99}
                            value={recurrence.frequencyInterval}
                            aria-label="Intervalo de repetición"
                            onChange={(e) => update({ frequencyInterval: Math.max(1, +e.target.value) })}
                            style={{ width: 64, flex: "none", textAlign: "center" }}
                        />
                        <span className="rf-row-label">
                            {INTERVAL_LABELS[recurrence.frequencyType]}
                        </span>
                    </div>
                )}

                {/* Días de la semana */}
                {showWeekdays && (
                    <div className="rf-field">
                        <span className="rf-label">Días de la semana</span>
                        <div className="rf-weekdays">
                            {WEEKDAYS.map((d, i) => (
                                <button
                                    key={`weekday-${i}`}
                                    className={`rf-wd-btn${recurrence.frequencyDaysOfWeek?.includes(i) ? " active" : ""}`}
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
                    <div className="rf-field">
                        <span className="rf-label">Finaliza</span>
                        <div className="rf-end-options">

                            <label className="rf-radio-row">
                                <div
                                    className={`rf-radio${recurrence.frequencyEndType === "on" ? " checked" : ""}`}
                                    onClick={() => update({ frequencyEndType: "on" })}
                                />
                                <span className="rf-radio-label" onClick={() => update({ frequencyEndType: "on" })}>
                                    El día
                                </span>
                                {recurrence.frequencyEndType === "on" && (
                                    <input
                                        className="rf-input"
                                        type="date"
                                        value={recurrence.frequencyEndDate}
                                        min={minEndDate}
                                        aria-label="Fecha de fin de recurrencia"
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
                                    Después de ocurrencias
                                </span>
                                {recurrence.frequencyEndType === "after" && (
                                    <div className="rf-row" style={{ marginLeft: 8, flex: 1 }}>
                                        <input
                                            className="rf-input"
                                            type="number"
                                            min={1}
                                            max={999}
                                            value={recurrence.frequencyOccurrencesLeft}
                                            aria-label="Número de ocurrencias"
                                            onChange={(e) => update({ frequencyOccurrencesLeft: Math.max(1, +e.target.value) })}
                                            style={{ width: 64, flex: "none", textAlign: "center" }}
                                        />
                                        <span className="rf-row-label">veces</span>
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