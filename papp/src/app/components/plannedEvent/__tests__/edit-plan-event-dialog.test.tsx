import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditPlanEventDialog from "../edit-plan-event-dialog";

jest.mock("@/context/AppContext", () => ({
    useApp: () => ({ pushAlert: jest.fn() }),
}));

jest.mock("@/lib/sounds", () => ({ playCompletionSound: jest.fn() }));

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "OK", data: null }),
    }) as jest.Mock;
});

afterEach(() => jest.restoreAllMocks());

const baseProps = {
    open: true,
    planEventId: "plan-event-1",
    status: "pending",
    onClose: jest.fn(),
    onSave: jest.fn(),
    onDelete: jest.fn(),
};

async function renderDialog(overrides: Partial<typeof baseProps> = {}) {
    await act(async () => {
        render(<EditPlanEventDialog {...baseProps} {...overrides} />);
    });
}

// ── Visibilidad ───────────────────────────────────────────────────────────────

describe("EditPlanEventDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<EditPlanEventDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", async () => {
        await renderDialog();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Evento planificado")).toBeInTheDocument();
    });
});

// ── Estado pending ────────────────────────────────────────────────────────────

describe("EditPlanEventDialog - estado pending", () => {
    it("el input de tiempo está habilitado", async () => {
        await renderDialog({ status: "pending" });
        expect(screen.getByLabelText("Tiempo real dedicado")).toBeEnabled();
    });

    it("el botón 'Marcar como completado' está deshabilitado sin tiempo introducido", async () => {
        await renderDialog({ status: "pending" });
        expect(screen.getByText("Marcar como completado")).toBeDisabled();
    });

    it("el botón se habilita al introducir un tiempo", async () => {
        await renderDialog({ status: "pending" });
        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), {
            target: { value: "01:30" },
        });
        expect(screen.getByText("Marcar como completado")).toBeEnabled();
    });
});

// ── Estado completed ──────────────────────────────────────────────────────────

describe("EditPlanEventDialog - estado completed", () => {
    it("el input de tiempo está deshabilitado", async () => {
        await renderDialog({ status: "completed" });
        expect(screen.getByLabelText("Tiempo real dedicado")).toBeDisabled();
    });

    it("muestra 'Completado ✓' en lugar del botón de marcar", async () => {
        await renderDialog({ status: "completed" });
        expect(screen.getByText("Completado ✓")).toBeInTheDocument();
    });

    it("el botón 'Completado ✓' está deshabilitado", async () => {
        await renderDialog({ status: "completed" });
        expect(screen.getByText("Completado ✓")).toBeDisabled();
    });
});

// ── Marcar como completado ────────────────────────────────────────────────────

describe("EditPlanEventDialog - marcar como completado", () => {
    it("llama a onSave y onClose tras marcar correctamente", async () => {
        const onSave  = jest.fn();
        const onClose = jest.fn();
        await renderDialog({ onSave, onClose });

        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), {
            target: { value: "01:30" },
        });
        await userEvent.click(screen.getByText("Marcar como completado"));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith("completed");
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("envía la petición PUT al endpoint correcto con status completed", async () => {
        await renderDialog();
        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), {
            target: { value: "02:00" },
        });
        await userEvent.click(screen.getByText("Marcar como completado"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/plan/plan-event-1"),
                expect.objectContaining({
                    method: "PUT",
                    body: expect.stringContaining('"status":"completed"'),
                })
            );
        });
    });

    it("convierte HH:MM a minutos correctamente (1:30 → 90)", async () => {
        await renderDialog();
        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), {
            target: { value: "01:30" },
        });
        await userEvent.click(screen.getByText("Marcar como completado"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"userTime":90'),
                })
            );
        });
    });

    it("no llama a onSave si la API responde con error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error", data: null }),
        }) as jest.Mock;

        const onSave = jest.fn();
        await renderDialog({ onSave });
        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), {
            target: { value: "01:00" },
        });
        await userEvent.click(screen.getByText("Marcar como completado"));

        await waitFor(() => expect(onSave).not.toHaveBeenCalled());
    });
});

// ── Eliminar ──────────────────────────────────────────────────────────────────

describe("EditPlanEventDialog - eliminar", () => {
    it("llama a onDelete y onClose tras eliminar correctamente", async () => {
        const onDelete = jest.fn();
        const onClose  = jest.fn();
        await renderDialog({ onDelete, onClose });

        await userEvent.click(screen.getByText("Eliminar"));

        await waitFor(() => {
            expect(onDelete).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("envía la petición DELETE al endpoint correcto", async () => {
        await renderDialog();
        await userEvent.click(screen.getByText("Eliminar"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/plan/plan-event-1"),
                expect.objectContaining({ method: "DELETE" })
            );
        });
    });

    it("no llama a onDelete si la API responde con error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error", data: null }),
        }) as jest.Mock;

        const onDelete = jest.fn();
        await renderDialog({ onDelete });
        await userEvent.click(screen.getByText("Eliminar"));

        await waitFor(() => expect(onDelete).not.toHaveBeenCalled());
    });
});

// ── Cerrar ────────────────────────────────────────────────────────────────────

describe("EditPlanEventDialog - cerrar", () => {
    it("llama a onClose al pulsar Cancelar", async () => {
        const onClose = jest.fn();
        await renderDialog({ onClose });
        await userEvent.click(screen.getByText("Cancelar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar ✕", async () => {
        const onClose = jest.fn();
        await renderDialog({ onClose });
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar el overlay", async () => {
        const onClose = jest.fn();
        await renderDialog({ onClose });
        await userEvent.click(screen.getByRole("dialog"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
