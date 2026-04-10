import React, { useState, useEffect } from "react";
import "./add-task-dialog.css";
import { config } from "@/app/config/config";
import { FREQUENCY_TYPE, RecurrenceRule, WEEKDAYS, 
    WEEKDAY_LABELS, FREQ_OPTIONS, formatDateTimeLocal, 
    Calendar} from "../calendar/calendarHelper";

interface Subject {
    id: string;
    name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: (newTask: any) => void;
}

const AddTaskDialog: React.FC<Props> = ({open, onClose, onSave}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [estimatedTime, setEstimatedTime] = useState(30);
    const [finishDate, setFinishDate] = useState("");
    const [givenDate, setGivenDate] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [recurrence, setRecurrence] = useState<RecurrenceRule>({
        frequencyType: FREQUENCY_TYPE.NONE, frequencyInterval: 1, frequencyDaysOfWeek: [],
        frequencyEndType: "never", frequencyEndDate: "", frequencyOccurrencesLeft: 1,
    });

    // Reset when dialog opens
    useEffect(() => {
        if (open) {
            fetchSubjects();
            const today = new Date().toISOString().split('T')[0];
            setTitle("");
            setDescription("");
            setEstimatedTime(30);
            setFinishDate(today);
            setGivenDate(today);
            setRecurrence({ frequencyType: FREQUENCY_TYPE.NONE, frequencyInterval: 1, frequencyDaysOfWeek: [], frequencyEndType: "never", frequencyEndDate: "", frequencyOccurrencesLeft: 1 });
        }
    }, [open]);

    useEffect(() => {
        if (subjects.length > 0) {
            setSubjectId("");
        }
    }, [subjects]);

    const fetchSubjects = async () => {
        try {
            const res = await fetch(config.backendUrl + "/subjects", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            setSubjects(data.map((subj: any) => ({ id: subj._id, name: subj.name })));
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    if (!open) return null;

    const toggleWeekday = (day: number) => {
        setRecurrence(r => {
            // Ensure frequencyDaysOfWeek is always an array
            const currentDays = Array.isArray(r.frequencyDaysOfWeek) ? r.frequencyDaysOfWeek : [];
            const newDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day];
            
            return {
                ...r,
                frequencyDaysOfWeek: newDays,
            };
        });
    };

    const handleSave = async () => {
        if (!title.trim()) return;

        const newTask = {
            title: title,
            description: description || undefined,
            estimatedTime,
            finishDate,
            givenDate,
            subjectId,
            frequencyType: recurrence.frequencyType,
            frequencyInterval: recurrence.frequencyInterval,
            frequencyDaysOfWeek: recurrence.frequencyDaysOfWeek,
            frequencyEndType: recurrence.frequencyEndType,
            frequencyEndDate: recurrence.frequencyEndDate,
            frequencyOccurrencesLeft: recurrence.frequencyOccurrencesLeft,
        };
        try {
            const response = await fetch(config.backendUrl + "/tasks", {
                method: "POST",
                 headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(newTask),
            });

            const createdTask = await response.json();
            onSave(createdTask);
            onClose();
        } catch (error) {
            console.error("Error guardando tarea:", error);
        }
    };

    const showWeekdays = recurrence.frequencyType === FREQUENCY_TYPE.WEEKS;
    const showEndOptions = recurrence.frequencyType !== FREQUENCY_TYPE.NONE;

    return (
        <>
            <div
                className="atd-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
                role="dialog" aria-modal="true" aria-label="Crear tarea"
            >
                <div className="atd-dialog">

                    {/* Header */}
                    <div className="atd-header">
                        <div className="atd-header-left">
                            <div className="atd-header-dot" />
                            <span className="atd-title">Nueva tarea</span>
                        </div>
                        <button className="atd-close" onClick={onClose} aria-label="Cerrar">✕</button>
                    </div>

                    {/* Body */}
                    <div className="atd-body">

                        {/* Título */}
                        <div className="atd-field">
                            <label className="atd-label">Título</label>
                            <input
                                className="atd-input"
                                type="text"
                                placeholder="Añadir título…"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                autoFocus
                                onKeyDown={e => e.key === "Enter" && handleSave()}
                            />
                        </div>

                        {/* Descripción */}
                        <div className="atd-field">
                            <label className="atd-label">Descripción (opcional)</label>
                            <textarea
                                className="atd-input atd-textarea"
                                placeholder="Añadir descripción…"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Tiempo estimado */}
                        <div className="atd-field">
                            <label className="atd-label">Tiempo estimado (minutos)</label>
                            <input
                                className="atd-input"
                                type="number"
                                min={1}
                                max={1440}
                                value={estimatedTime}
                                onChange={e => setEstimatedTime(Math.max(1, +e.target.value))}
                            />
                        </div>

                        {/* Fecha de entrega */}
                        <div className="atd-field">
                            <label className="atd-label">Fecha de entrega</label>
                            <input
                                className="atd-input"
                                type="date"
                                value={finishDate}
                                onChange={e => setFinishDate(e.target.value)}
                            />
                        </div>

                        {/* Fecha de creación */}
                        <div className="atd-field">
                            <label className="atd-label">Fecha de creación</label>
                            <input
                                className="atd-input"
                                type="date"
                                value={givenDate}
                                onChange={e => setGivenDate(e.target.value)}
                            />
                        </div>

                        {/* Asignatura */}
                        <div className="atd-field">
                            <label className="atd-label">Asignatura (opcional)</label>
                            <select
                                className="atd-input atd-select"
                                value={subjectId}
                                onChange={e => setSubjectId(e.target.value)}
                            >
                                <option value="">Ninguna</option>
                                {subjects.map(subj => (
                                    <option key={subj.id} value={subj.id}>{subj.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Periodicidad */}
                        <div className="atd-field">
                            <label className="atd-label">Periodicidad</label>
                            <div className="atd-recurrence-box">
                                <select
                                    className="atd-input atd-select"
                                    style={{ margin: 0 }}
                                    value={recurrence.frequencyType}
                                    onChange={e => setRecurrence(r => ({ ...r, frequencyType: e.target.value as RecurrenceRule["frequencyType"] }))}
                                >
                                    {FREQ_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>

                                {recurrence.frequencyType !== FREQUENCY_TYPE.NONE && (
                                    <div className="atd-row">
                                        <span className="atd-row-label">Cada</span>
                                        <input
                                            className="atd-input"
                                            type="number" min={1} max={99}
                                            value={recurrence.frequencyInterval}
                                            onChange={e => setRecurrence(r => ({ ...r, frequencyInterval: Math.max(1, +e.target.value) }))}
                                            style={{ width: 64, flex: "none", textAlign: "center" }}
                                        />
                                        <span className="atd-row-label">
                      {{ daily: "día(s)", weekly: "semana(s)", monthly: "mes(es)", yearly: "año(s)" }[recurrence.frequencyType]}
                    </span>
                                    </div>
                                )}

                                {showWeekdays && (
                                    <div className="atd-field">
                                        <span className="atd-label">Días de la semana</span>
                                        <div className="atd-weekdays">
                                            {WEEKDAYS.map((d, i) => (
                                                <button
                                                    key={`weekday-${i}`}
                                                    className={`atd-wd-btn${recurrence.frequencyDaysOfWeek?.includes(i) ? " active" : ""}`}
                                                    onClick={() => toggleWeekday(i)}
                                                    title={WEEKDAY_LABELS[i]}
                                                >{d}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {showEndOptions && (
                                    <div className="atd-field">
                                        <span className="atd-label">Finaliza</span>
                                        <div className="atd-end-options">
                                            {(["never", "on", "after"] as const).map(type => (
                                                <label key={type} className="atd-radio-row">
                                                    <div
                                                        className={`atd-radio${recurrence.frequencyEndType === type ? " checked" : ""}`}
                                                        onClick={() => setRecurrence(r => ({ ...r, frequencyEndType: type }))}
                                                    />
                                                    <span className="atd-radio-label" onClick={() => setRecurrence(r => ({ ...r, frequencyEndType: type }))}>
                            {{ never: "Nunca", on: "El día", after: "Después de" }[type]}
                          </span>
                                                    {type === "on" && recurrence.frequencyEndType === "on" && (
                                                        <input
                                                            className="atd-input"
                                                            type="date"
                                                            value={recurrence.frequencyEndDate}
                                                            onChange={e => setRecurrence(r => ({ ...r, frequencyEndDate: e.target.value }))}
                                                            style={{ marginLeft: 8, flex: 1 }}
                                                        />
                                                    )}
                                                    {type === "after" && recurrence.frequencyEndType === "after" && (
                                                        <div className="atd-row" style={{ marginLeft: 8, flex: 1 }}>
                                                            <input
                                                                className="atd-input"
                                                                type="number" min={1} max={999}
                                                                value={recurrence.frequencyOccurrencesLeft}
                                                                onChange={e => setRecurrence(r => ({ ...r, frequencyOccurrencesLeft: Math.max(1, +e.target.value) }))}
                                                                style={{ width: 64, flex: "none", textAlign: "center" }}
                                                            />
                                                            <span className="atd-row-label">ocurrencias</span>
                                                        </div>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="atd-footer">
                        <button className="atd-btn atd-btn-cancel" onClick={onClose}>Cancelar</button>
                        <button
                            className="atd-btn atd-btn-save"
                            onClick={handleSave}
                            disabled={!title.trim()}
                            style={!title.trim() ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                        >
                            Guardar tarea
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddTaskDialog;