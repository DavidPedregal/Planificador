import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddCalendarDialog from "../add-calendar-dialog";

jest.mock("@/context/AppContext", () => ({
    useApp: () => ({ pushAlert: jest.fn() }),
}));

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Calendario creado", data: {} }),
    }) as jest.Mock;
});

afterEach(() => jest.restoreAllMocks());

const baseProps = {
    open: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
};

// ── Visibilidad ───────────────────────────────────────────────────────────────

describe("AddCalendarDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<AddCalendarDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", () => {
        render(<AddCalendarDialog {...baseProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Nuevo calendario")).toBeInTheDocument();
    });
});

// ── Botón guardar ─────────────────────────────────────────────────────────────

describe("AddCalendarDialog - botón guardar", () => {
    it("está deshabilitado cuando el nombre está vacío", () => {
        render(<AddCalendarDialog {...baseProps} />);
        expect(screen.getByText("Guardar calendario")).toBeDisabled();
    });

    it("se habilita al escribir un nombre", async () => {
        render(<AddCalendarDialog {...baseProps} />);
        await userEvent.type(screen.getByPlaceholderText("Nombre del calendario…"), "Personal");
        expect(screen.getByText("Guardar calendario")).toBeEnabled();
    });

    it("vuelve a deshabilitarse si el nombre queda vacío tras borrar", async () => {
        render(<AddCalendarDialog {...baseProps} />);
        const input = screen.getByPlaceholderText("Nombre del calendario…");
        await userEvent.type(input, "Test");
        await userEvent.clear(input);
        expect(screen.getByText("Guardar calendario")).toBeDisabled();
    });
});

// ── Guardar con éxito ─────────────────────────────────────────────────────────

describe("AddCalendarDialog - guardar con éxito", () => {
    it("llama a onSave y onClose tras guardar correctamente", async () => {
        const onSave  = jest.fn();
        const onClose = jest.fn();
        render(<AddCalendarDialog {...baseProps} onSave={onSave} onClose={onClose} />);

        await userEvent.type(screen.getByPlaceholderText("Nombre del calendario…"), "Trabajo");
        await userEvent.click(screen.getByText("Guardar calendario"));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("envía el nombre y el color al endpoint correcto", async () => {
        render(<AddCalendarDialog {...baseProps} />);
        await userEvent.type(screen.getByPlaceholderText("Nombre del calendario…"), "Trabajo");
        await userEvent.click(screen.getByText("Guardar calendario"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/calendars"),
                expect.objectContaining({ method: "POST" })
            );
        });
    });
});

// ── Guardar con error ─────────────────────────────────────────────────────────

describe("AddCalendarDialog - error al guardar", () => {
    it("no llama a onSave si el servidor responde con error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error del servidor" }),
        }) as jest.Mock;

        const onSave = jest.fn();
        render(<AddCalendarDialog {...baseProps} onSave={onSave} />);
        await userEvent.type(screen.getByPlaceholderText("Nombre del calendario…"), "Trabajo");
        await userEvent.click(screen.getByText("Guardar calendario"));

        await waitFor(() => expect(onSave).not.toHaveBeenCalled());
    });
});

// ── Cerrar ────────────────────────────────────────────────────────────────────

describe("AddCalendarDialog - cerrar", () => {
    it("llama a onClose al pulsar Cancelar", async () => {
        const onClose = jest.fn();
        render(<AddCalendarDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByText("Cancelar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar ✕", async () => {
        const onClose = jest.fn();
        render(<AddCalendarDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar el overlay", async () => {
        const onClose = jest.fn();
        render(<AddCalendarDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByRole("dialog"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
