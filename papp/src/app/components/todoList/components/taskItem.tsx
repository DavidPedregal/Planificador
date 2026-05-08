import React from "react";
import { EditIcon } from "lucide-react";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Task } from "../hooks/useTasks";

interface Props {
    task: Task;
    onEdit:   (id: number) => void;
    onDelete: (id: number) => void;
}

export const TaskItem: React.FC<Props> = ({ task, onEdit, onDelete }) => (
    <div className={`todo-item${task.completed ? " completed" : ""}`}>
        <div className="todo-content">
            <span className="todo-text">{task.title}</span>
            <div className="todo-meta">
                <span className="todo-time">⏱ {task.estimatedTime}m</span>
                <span className="todo-date">📅 {task.finishDate.toLocaleDateString("es-ES")}</span>
            </div>
        </div>
        <button
            className="todo-edit"
            onClick={() => onEdit(task.id)}
            aria-label="Editar tarea"
        >
            <EditIcon size="1rem" />
        </button>
        <button
            className="todo-delete"
            onClick={() => onDelete(task.id)}
            aria-label="Eliminar tarea"
        >
            <DeleteForeverIcon fontSize="small" />
        </button>
    </div>
);