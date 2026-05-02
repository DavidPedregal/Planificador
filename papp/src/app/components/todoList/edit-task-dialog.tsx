import React, { useState, useEffect } from "react";
import "./add-task-dialog.css";
import { config } from "@/app/config/config";
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from "@mui/material/Tooltip";
import RecurrenceChoiceDialog from "@/app/components/Event/recurrence-choice-dialog";

interface Subject {
    id: string;
    name: string;
}

interface Props {
    open: boolean;
    taskId: number | null;
    onClose: () => void;
    onSave: () => void;
}

const EditTaskDialog: React.FC<Props> = ({open, taskId, onClose, onSave}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [estimatedTime, setEstimatedTime] = useState(30);
    const [finishDate, setFinishDate] = useState("");
    const [givenDate, setGivenDate] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [plannable, setPlannable] = useState(true);
    const [includeReviews, setIncludeReviews] = useState(false);
    const [recurrenceChoiceOpen, setRecurrenceChoiceOpen] = useState(false);

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

    const fetchTask = async (id: number) => {
        try {
            const res = await fetch(config.backendUrl + `/tasks/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            setTitle(data.title);
            setDescription(data.description || "");
            setEstimatedTime(data.estimatedTime);
            setFinishDate(data.finishDate.split('T')[0]);
            setGivenDate(data.givenDate.split('T')[0]);
            setSubjectId(data.subjectId || "");
            setPlannable(data.plannable !== false);
        } catch (error) {
            console.error("Error fetching task:", error);
        }
    };

    // Reset when dialog opens
    useEffect(() => {
        if (open) {
            fetchSubjects();
            if (taskId) {
                fetchTask(taskId);
            }
        }
    }, [open, taskId]);

    const handleSave = () => {
        if (!title.trim()) return;
        setRecurrenceChoiceOpen(true);
    };

    const updateSingleTask = async () => {
        await updateTask(`/tasks/${taskId}`);
    };

    const updateTaskFromThis = async () => {
        await updateTask(`/tasks/forward/${taskId}`);
    };

    const updateTaskSeries = async () => {
        await updateTask(`/tasks/all/${taskId}`);
    };

    const updateTask = async (url: string) => {
        if (!title.trim()) return;

        const updatedTask = {
            title: title,
            description: description || undefined,
            estimatedTime,
            finishDate,
            givenDate,
            subjectId,
            plannable,
            includeReviews
        };

        try {
            const response = await fetch(config.backendUrl + url, {
                method: "PUT",
                 headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(updatedTask),
            });

            await response.json();
            onSave();
            onClose();
        } catch (error) {
            console.error("Error actualizando tarea:", error);
        }
    };

    if (!open) return null;

    return (
        <>
            <div
                className="atd-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
                role="dialog" aria-modal="true" aria-label="Editar tarea"
            >
                <div className="atd-dialog">

                    {/* Header */}
                    <div className="atd-header">
                        <div className="atd-header-left">
                            <div className="atd-header-dot" />
                            <span className="atd-title">Editar tarea</span>
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
                            Actualizar tarea
                        </button>
                    </div>
                </div>

                <RecurrenceChoiceDialog
                    open={recurrenceChoiceOpen}
                    action="update"
                    title="Actualizar tarea recurrente"
                    message="¿Quieres actualizar solo esta tarea o todas las tareas de la serie?"
                    onChooseSingle={() => {
                        updateSingleTask();
                        setRecurrenceChoiceOpen(false);
                    }}
                    onChooseFromThis={() => {
                        updateTaskFromThis();
                        setRecurrenceChoiceOpen(false);
                    }}
                    onChooseAll={() => {
                        updateTaskSeries();
                        setRecurrenceChoiceOpen(false);
                    }}
                    onCancel={() => setRecurrenceChoiceOpen(false)}
                />
            </div>
        </>
    );
};

export default EditTaskDialog;