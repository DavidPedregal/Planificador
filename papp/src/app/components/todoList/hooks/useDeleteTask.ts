import { useState } from "react";
import { DeleteMode } from "./useTasks";

interface UseDeleteTaskParams {
    deleteTask: (id: number, mode: DeleteMode) => Promise<boolean>;
}

// Gestiona el flujo de confirmación de recurrencia para el borrado
export function useDeleteTask({ deleteTask }: UseDeleteTaskParams) {
    const [recurrenceChoiceOpen, setRecurrenceChoiceOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

    const handleDeleteTask = (id: number) => {
        setSelectedTaskId(id);
        setRecurrenceChoiceOpen(true);
    };

    const confirmDelete = async (mode: DeleteMode) => {
        if (selectedTaskId === null) return;
        await deleteTask(selectedTaskId, mode);
        setRecurrenceChoiceOpen(false);
        setSelectedTaskId(null);
    };

    const cancelDelete = () => {
        setRecurrenceChoiceOpen(false);
        setSelectedTaskId(null);
    };

    return {
        recurrenceChoiceOpen,
        handleDeleteTask,
        confirmDelete,
        cancelDelete,
    };
}