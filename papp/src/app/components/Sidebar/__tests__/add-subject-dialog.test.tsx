import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddSubjectDialog from "../add-subject-dialog";

jest.mock("@/context/AppContext", () => ({
    useApp: () => ({ pushAlert: jest.fn() }),
}));

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Asignatura creada", data: {} }),
    }) as jest.Mock;
});

afterEach(() => jest.restoreAllMocks());

const baseProps = {
    open: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
};

// ── Visibilidad ───────────────────────────────────────────────────────────────

describe("AddSubjectDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<AddSubjectDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", () => {
        render(<AddSubjectDialog {...baseProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Nueva asignatura")).toBeInTheDocument();
    });
});

// ── Botón guardar ─────────────────────────────────────────────────────────────

describe("AddSubjectDialog - botón guardar", () => {
    it("está deshabilitado cuando el nombre está vacío", () => {
        render(<AddSubjectDialog {...baseProps} />);
        expect(screen.getByText("Guardar asignatura")).toBeDisabled();
    });

    it("se habilita al escribir un nombre", async () => {
        render(<AddSubjectDialog {...baseProps} />);
        await userEvent.type(screen.getByPlaceholderText("Nombre de la asignatura…"), "Física");
        expect(screen.getByText("Guardar asignatura")).toBeEnabled();
    });
});

// ── Guardar con éxito ─────────────────────────────────────────────────────────

describe("AddSubjectDialog - guardar con éxito", () => {
    it("llama a onSave y onClose tras guardar correctamente", async () => {
        const onSave  = jest.fn();
        const onClose = jest.fn();
        render(<AddSubjectDialog {...baseProps} onSave={onSave} onClose={onClose} />);

        await userEvent.type(screen.getByPlaceholderText("Nombre de la asignatura…"), "Física");
        await userEvent.click(screen.getByText("Guardar asignatura"));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("envía el nombre al endpoint correcto", async () => {
        render(<AddSubjectDialog {...baseProps} />);
        await userEvent.type(screen.getByPlaceholderText("Nombre de la asignatura…"), "Física");
        await userEvent.click(screen.getByText("Guardar asignatura"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/subjects"),
                expect.objectContaining({ method: "POST" })
            );
        });
    });
});

// ── Error al guardar ──────────────────────────────────────────────────────────

describe("AddSubjectDialog - error al guardar", () => {
    it("no llama a onSave si el servidor responde con error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error" }),
        }) as jest.Mock;

        const onSave = jest.fn();
        render(<AddSubjectDialog {...baseProps} onSave={onSave} />);
        await userEvent.type(screen.getByPlaceholderText("Nombre de la asignatura…"), "Física");
        await userEvent.click(screen.getByText("Guardar asignatura"));

        await waitFor(() => expect(onSave).not.toHaveBeenCalled());
    });
});

// ── Cerrar ────────────────────────────────────────────────────────────────────

describe("AddSubjectDialog - cerrar", () => {
    it("llama a onClose al pulsar Cancelar", async () => {
        const onClose = jest.fn();
        render(<AddSubjectDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByText("Cancelar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar ✕", async () => {
        const onClose = jest.fn();
        render(<AddSubjectDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar el overlay", async () => {
        const onClose = jest.fn();
        render(<AddSubjectDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByRole("dialog"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
