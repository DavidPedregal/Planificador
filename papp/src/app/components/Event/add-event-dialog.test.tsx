import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddEventDialog from "./add-event-dialog";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("./hooks/useCalendarList", () => ({
    useCalendarList: () => ({
        calendars: [
            { id: "cal1", name: "Personal", userId: "user1", color: "#ff0000" },
            { id: "cal2", name: "Trabajo", userId: "user1", color: "#00ff00" },
        ],
    }),
}));

jest.mock("@/context/AppContext", () => ({
    useApp: () => ({ pushAlert: jest.fn() }),
}));

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({ ok : true, json: () => Promise.resolve({}) }) as jest.Mock;
});

afterEach(() => {
    jest.restoreAllMocks();
});

// ─── Props base ───────────────────────────────────────────────────────────────

const baseProps = {
    open: true,
    start: new Date("2025-06-01T10:00:00"),
    end: new Date("2025-06-01T11:00:00"),
    onClose: jest.fn(),
    onSave: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AddEventDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<AddEventDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", () => {
        render(<AddEventDialog {...baseProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Nuevo evento")).toBeInTheDocument();
    });
});

describe("AddEventDialog - botón guardar", () => {
    it("está deshabilitado con título vacío", () => {
        render(<AddEventDialog {...baseProps} />);
        expect(screen.getByText("Guardar evento")).toBeDisabled();
    });

    it("se habilita al escribir un título", async () => {
        render(<AddEventDialog {...baseProps} />);
        await userEvent.type(screen.getByPlaceholderText("Añadir título…"), "Mi evento");
        expect(screen.getByText("Guardar evento")).toBeEnabled();
    });
});

describe("AddEventDialog - guardar evento", () => {
    it("llama a onSave y onClose tras guardar con éxito", async () => {
        const onSave = jest.fn();
        const onClose = jest.fn();
        render(<AddEventDialog {...baseProps} onSave={onSave} onClose={onClose} />);

        await userEvent.type(screen.getByPlaceholderText("Añadir título…"), "Reunión");
        await userEvent.click(screen.getByText("Guardar evento"));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("no llama a onSave si el fetch falla", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error")) as jest.Mock;
        const onSave = jest.fn();
        render(<AddEventDialog {...baseProps} onSave={onSave} />);

        await userEvent.type(screen.getByPlaceholderText("Añadir título…"), "Reunión");
        await userEvent.click(screen.getByText("Guardar evento"));

        await waitFor(() => {
            expect(onSave).not.toHaveBeenCalled();
        });
    });
});

describe("AddEventDialog - cerrar", () => {
    it("llama a onClose al pulsar el botón Cancelar", async () => {
        const onClose = jest.fn();
        render(<AddEventDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByText("Cancelar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar el overlay", async () => {
        const onClose = jest.fn();
        render(<AddEventDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByRole("dialog"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar ✕", async () => {
        const onClose = jest.fn();
        render(<AddEventDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe("AddEventDialog - calendarios", () => {
    it("muestra los calendarios disponibles en el select", () => {
        render(<AddEventDialog {...baseProps} />);
        expect(screen.getByText("Personal")).toBeInTheDocument();
        expect(screen.getByText("Trabajo")).toBeInTheDocument();
    });
});
