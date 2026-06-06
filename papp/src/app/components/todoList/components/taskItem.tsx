import React from "react";
import { useTranslation } from "react-i18next";
import { EditIcon, Repeat2 } from "lucide-react";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Task } from "../hooks/useTasks";

interface Props {
    task: Task;
    onEdit:   (id: string) => void;
    onDelete: (id: string, recurring: boolean) => void;
}

export const TaskItem: React.FC<Props> = ({ task, onEdit, onDelete }) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === "es" ? "es-ES" : "en-US";

    return (
        <div className={`todo-item${task.completed ? " completed" : ""}`}>
            <div className="todo-content">
                <span className="todo-text">
                        {task.title}
                        {task.recurring && <Repeat2 size="0.8rem" style={{ marginLeft: "6px", opacity: 0.55, verticalAlign: "middle" }} />}
                    </span>
                <div className="todo-meta">
                    <span className="todo-time">⏱ {task.estimatedTime}m</span>
                    <span className="todo-date">📅 {task.finishDate.toLocaleDateString(locale)}</span>
                </div>
            </div>
            <button
                className="todo-edit"
                onClick={() => onEdit(task.id)}
                aria-label={t("task.editAriaLabel")}
            >
                <EditIcon size="1rem" />
            </button>
            <button
                className="todo-delete"
                onClick={() => onDelete(task.id, task.recurring)}
                aria-label={t("task.deleteAriaLabel")}
            >
                <DeleteForeverIcon fontSize="small" />
            </button>
        </div>
    );
};
