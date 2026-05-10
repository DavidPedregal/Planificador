import { useState } from "react";

interface UseConfirmDeleteParams<T extends string | number> {
    onConfirm: (id: T) => Promise<boolean>;
}

// Hook genérico reutilizable para cualquier flujo de confirmación de borrado
export function useConfirmDelete<T extends string | number>({ onConfirm }: UseConfirmDeleteParams<T>) {
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<T | null>(null);

    const handleDelete = (id: T) => {
        setSelectedId(id);
        setOpen(true);
    };

    const confirm = async () => {
        if (selectedId === null) return;
        const ok = await onConfirm(selectedId);
        if (ok) {
            setOpen(false);
            setSelectedId(null);
        }
    };

    const cancel = () => {
        setOpen(false);
        setSelectedId(null);
    };

    return { open, selectedId, handleDelete, confirm, cancel };
}