import React, { useState, useEffect } from "react";
import "./add-task-dialog.css";
import { config } from "@/app/config/config";
import { FREQUENCY_TYPE, RecurrenceRule, WEEKDAYS, 
    WEEKDAY_LABELS, FREQ_OPTIONS} from "../calendar/calendarHelper";
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from "@mui/material/Tooltip";

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
    const [plannable, setPlannable] = useState(true);
    const [includeReviews, setIncludeReviews] = useState(false);
    const [recurrence, setRecurrence] = useState<RecurrenceRule>({
        frequencyType: FREQUENCY_TYPE.NONE, frequencyInterval: 1, frequencyDaysOfWeek: [],
        frequencyEndType: "on", frequencyEndDate: "", frequencyOccurrencesLeft: 1,
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
            setPlannable(true);
            setIncludeReviews(false);
            setRecurrence({ frequencyType: FREQUENCY_TYPE.NONE, frequencyInterval: 1, frequencyDaysOfWeek: [], frequencyEndType: "on", frequencyEndDate: "", frequencyOccurrencesLeft: 1 });
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
            plannable,
            includeReviews,
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

            const createdTasks = await response.json();
            onSave(createdTasks);
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
                            <label className="atd-label">Tiempo estimado</label>
                            <div className="aed-date-strip">
                                <div className="aed-date-field">
                                    <input
                                        className="aed-date-input"
                                        type="number"
                                        min={0}
                                        max={99}
                                        value={String(Math.floor(estimatedTime / 60)).padStart(2, '0')}
                                        onChange={e => {
                                            const hours = Math.min(99, Math.max(0, +e.target.value));
                                            const minutes = estimatedTime % 60;
                                            setEstimatedTime(hours * 60 + minutes);
                                        }}
                                    />
                                    <span className="aed-date-icon">h</span>
                                </div>
                                <div className="aed-date-field">
                                    <input
                                        className="aed-date-input"
                                        type="number"
                                        min={0}
                                        max={59}
                                        value={String(estimatedTime % 60).padStart(2, '0')}
                                        onChange={e => {
                                            const minutes = Math.min(59, Math.max(0, +e.target.value));
                                            const hours = Math.floor(estimatedTime / 60);
                                            setEstimatedTime(hours * 60 + minutes);
                                        }}
                                    />
                                    <span className="aed-date-icon">min</span>
                                </div>
                            </div>
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
                            <label className="atd-label">
                                Fecha de impartición
                                <Tooltip title="Fecha en la que se adquirieron los conocimientos para realizar la tarea">
                                    <InfoIcon sx={{ fontSize: '1rem', marginLeft: '6px', cursor: 'help', color: 'var(--accent, #7c6ff7)' }} />
                                </Tooltip>
                            </label>
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

                        {/* Plannable */}
                        <div className="atd-field">
                            <label className="atd-label">
                                <input
                                    type="checkbox"
                                    checked={plannable}
                                    onChange={e => setPlannable(e.target.checked)}
                                    style={{ marginRight: '8px' }}
                                />
                                Incluir en planificación
                            </label>
                        </div>

                        {/* Reviews */}
                        <div className="atd-field">
                            <label className="atd-label">
                                <input
                                    type="checkbox"
                                    checked={includeReviews}
                                    onChange={e => setIncludeReviews(e.target.checked)}
                                    style={{ marginRight: '8px' }}
                                />
                                Añadir repasos
                            </label>
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
                                            {(["on", "after"] as const).map(type => (
                                                <label key={type} className="atd-radio-row">
                                                    <div
                                                        className={`atd-radio${recurrence.frequencyEndType === type ? " checked" : ""}`}
                                                        onClick={() => setRecurrence(r => ({ ...r, frequencyEndType: type }))}
                                                    />
                                                    <span className="atd-radio-label" onClick={() => setRecurrence(r => ({ ...r, frequencyEndType: type }))}>
                            {{on: "El día", after: "Después de ocurrencias" }[type]}
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
                                                            <span className="atd-row-label">veces</span>
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