import { useState } from "react";
import { DeleteMode } from "./useTasks";

interface UseDeleteTaskParams {
    deleteTask: (id: string, mode: DeleteMode) => Promise<boolean>;
}

// Gestiona el flujo de confirmación de recurrencia para el borrado
export function useDeleteTask({ deleteTask }: UseDeleteTaskParams) {
    const [recurrenceChoiceOpen, setRecurrenceChoiceOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string>("");

    const handleDeleteTask = (id: string) => {
        setSelectedTaskId(id);
        setRecurrenceChoiceOpen(true);
    };

    const confirmDelete = async (mode: DeleteMode) => {
        if (selectedTaskId === "") return;
        await deleteTask(selectedTaskId, mode);
        setRecurrenceChoiceOpen(false);
        setSelectedTaskId("");
    };

    const cancelDelete = () => {
        setRecurrenceChoiceOpen(false);
        setSelectedTaskId("");
    };

    return {
        recurrenceChoiceOpen,
        handleDeleteTask,
        confirmDelete,
        cancelDelete,
    };
}