import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditSubjectDialog from "../edit-subject-dialog";

jest.mock("@/context/AppContext", () => ({
    useApp: () => ({ pushAlert: jest.fn() }),
}));

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Asignatura actualizada", data: {} }),
    }) as jest.Mock;
});

afterEach(() => jest.restoreAllMocks());

const mockSubject = { id: "subj-1", name: "Matemáticas" };

const baseProps = {
    open: true,
    subject: mockSubject,
    onClose: jest.fn(),
    onSave: jest.fn(),
};

// ── Visibilidad ───────────────────────────────────────────────────────────────

describe("EditSubjectDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<EditSubjectDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", () => {
        render(<EditSubjectDialog {...baseProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Editar asignatura")).toBeInTheDocument();
    });

    it("pre-rellena el nombre con el de la asignatura actual", () => {
        render(<EditSubjectDialog {...baseProps} />);
        expect(screen.getByDisplayValue("Matemáticas")).toBeInTheDocument();
    });
});

// ── Botón guardar ─────────────────────────────────────────────────────────────

describe("EditSubjectDialog - botón guardar", () => {
    it("está deshabilitado si el nombre se borra", async () => {
        render(<EditSubjectDialog {...baseProps} />);
        await userEvent.clear(screen.getByDisplayValue("Matemáticas"));
        expect(screen.getByText("Guardar cambios")).toBeDisabled();
    });

    it("está habilitado con el nombre pre-rellenado", () => {
        render(<EditSubjectDialog {...baseProps} />);
        expect(screen.getByText("Guardar cambios")).toBeEnabled();
    });
});

// ── Guardar con éxito ─────────────────────────────────────────────────────────

describe("EditSubjectDialog - guardar con éxito", () => {
    it("llama a onSave y onClose tras guardar correctamente", async () => {
        const onSave  = jest.fn();
        const onClose = jest.fn();
        render(<EditSubjectDialog {...baseProps} onSave={onSave} onClose={onClose} />);
        await userEvent.click(screen.getByText("Guardar cambios"));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("envía la petición PUT al endpoint correcto", async () => {
        render(<EditSubjectDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Guardar cambios"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/subjects/subj-1"),
                expect.objectContaining({ method: "PUT" })
            );
        });
    });
});

// ── Error al guardar ──────────────────────────────────────────────────────────

describe("EditSubjectDialog - error al guardar", () => {
    it("no llama a onSave si el servidor responde con error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error" }),
        }) as jest.Mock;

        const onSave = jest.fn();
        render(<EditSubjectDialog {...baseProps} onSave={onSave} />);
        await userEvent.click(screen.getByText("Guardar cambios"));

        await waitFor(() => expect(onSave).not.toHaveBeenCalled());
    });
});

// ── Sincronización de props ───────────────────────────────────────────────────

describe("EditSubjectDialog - sincronización de props", () => {
    it("actualiza el nombre en el input cuando cambia el prop subject", () => {
        const { rerender } = render(<EditSubjectDialog {...baseProps} />);
        expect(screen.getByDisplayValue("Matemáticas")).toBeInTheDocument();

        rerender(
            <EditSubjectDialog
                {...baseProps}
                subject={{ id: "subj-2", name: "Historia" }}
            />
        );
        expect(screen.getByDisplayValue("Historia")).toBeInTheDocument();
    });
});

// ── Cerrar ────────────────────────────────────────────────────────────────────

describe("EditSubjectDialog - cerrar", () => {
    it("llama a onClose al pulsar Cancelar", async () => {
        const onClose = jest.fn();
        render(<EditSubjectDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByText("Cancelar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar ✕", async () => {
        const onClose = jest.fn();
        render(<EditSubjectDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
