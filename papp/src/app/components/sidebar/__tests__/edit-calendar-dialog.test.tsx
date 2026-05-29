import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditCalendarDialog from "../edit-calendar-dialog";

jest.mock("@/context/AppContext", () => ({
    useApp: () => ({ pushAlert: jest.fn() }),
}));

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Calendario actualizado", data: {} }),
    }) as jest.Mock;
});

afterEach(() => jest.restoreAllMocks());

const mockCalendar = { id: "cal-1", name: "Trabajo", color: "#7c6ff7", visible: true };

const baseProps = {
    open: true,
    calendar: mockCalendar,
    onClose: jest.fn(),
    onSave: jest.fn(),
};

// ── Visibilidad ───────────────────────────────────────────────────────────────

describe("EditCalendarDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<EditCalendarDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", () => {
        render(<EditCalendarDialog {...baseProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Editar calendario")).toBeInTheDocument();
    });

    it("pre-rellena el nombre con el del calendario actual", () => {
        render(<EditCalendarDialog {...baseProps} />);
        expect(screen.getByDisplayValue("Trabajo")).toBeInTheDocument();
    });
});

// ── Botón guardar ─────────────────────────────────────────────────────────────

describe("EditCalendarDialog - botón guardar", () => {
    it("está deshabilitado si el nombre se borra", async () => {
        render(<EditCalendarDialog {...baseProps} />);
        await userEvent.clear(screen.getByDisplayValue("Trabajo"));
        expect(screen.getByText("Guardar cambios")).toBeDisabled();
    });

    it("está habilitado con el nombre pre-rellenado", () => {
        render(<EditCalendarDialog {...baseProps} />);
        expect(screen.getByText("Guardar cambios")).toBeEnabled();
    });
});

// ── Guardar con éxito ─────────────────────────────────────────────────────────

describe("EditCalendarDialog - guardar con éxito", () => {
    it("llama a onSave y onClose tras guardar correctamente", async () => {
        const onSave  = jest.fn();
        const onClose = jest.fn();
        render(<EditCalendarDialog {...baseProps} onSave={onSave} onClose={onClose} />);
        await userEvent.click(screen.getByText("Guardar cambios"));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("envía la petición PUT al endpoint correcto", async () => {
        render(<EditCalendarDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Guardar cambios"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/calendars/cal-1"),
                expect.objectContaining({ method: "PUT" })
            );
        });
    });
});

// ── Error al guardar ──────────────────────────────────────────────────────────

describe("EditCalendarDialog - error al guardar", () => {
    it("no llama a onSave si el servidor responde con error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error" }),
        }) as jest.Mock;

        const onSave = jest.fn();
        render(<EditCalendarDialog {...baseProps} onSave={onSave} />);
        await userEvent.click(screen.getByText("Guardar cambios"));

        await waitFor(() => expect(onSave).not.toHaveBeenCalled());
    });
});

// ── Sincronización de props ───────────────────────────────────────────────────

describe("EditCalendarDialog - sincronización de props", () => {
    it("actualiza el nombre en el input cuando cambia el prop calendar", async () => {
        const { rerender } = render(<EditCalendarDialog {...baseProps} />);
        expect(screen.getByDisplayValue("Trabajo")).toBeInTheDocument();

        rerender(
            <EditCalendarDialog
                {...baseProps}
                calendar={{ ...mockCalendar, name: "Personal" }}
            />
        );
        expect(screen.getByDisplayValue("Personal")).toBeInTheDocument();
    });
});

// ── Cerrar ────────────────────────────────────────────────────────────────────

describe("EditCalendarDialog - cerrar", () => {
    it("llama a onClose al pulsar Cancelar", async () => {
        const onClose = jest.fn();
        render(<EditCalendarDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByText("Cancelar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar ✕", async () => {
        const onClose = jest.fn();
        render(<EditCalendarDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
