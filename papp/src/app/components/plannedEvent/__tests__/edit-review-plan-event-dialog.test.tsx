import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditReviewPlanEventDialog from "../edit-review-plan-event-dialog";

jest.mock("@/context/AppContext", () => ({
    useApp: () => ({ pushAlert: jest.fn() }),
}));

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "OK", data: { scheduledTime: 90, userTime: null } }),
    }) as jest.Mock;
});

afterEach(() => jest.restoreAllMocks());

const baseProps = {
    open: true,
    planEventId: "review-event-1",
    status: "pending",
    onClose: jest.fn(),
    onSave: jest.fn(),
    onDelete: jest.fn(),
};

// ── Visibilidad ───────────────────────────────────────────────────────────────

describe("EditReviewPlanEventDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<EditReviewPlanEventDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Repaso planificado")).toBeInTheDocument();
    });

    it("muestra las 6 opciones de valoración", () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        for (let i = 0; i <= 5; i++) {
            expect(screen.getByRole("radio", { name: new RegExp(`^${i}`) })).toBeInTheDocument();
        }
    });
});

// ── Estado pending ────────────────────────────────────────────────────────────

describe("EditReviewPlanEventDialog - estado pending", () => {
    it("el input de tiempo está habilitado", () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        expect(screen.getByLabelText("Tiempo real dedicado")).toBeEnabled();
    });

    it("el botón de completar está deshabilitado sin tiempo ni valoración", () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        expect(screen.getByText("Marcar como completado")).toBeDisabled();
    });

    it("el botón sigue deshabilitado con tiempo pero sin valoración", () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), {
            target: { value: "01:00" },
        });
        expect(screen.getByText("Marcar como completado")).toBeDisabled();
    });

    it("el botón sigue deshabilitado con valoración pero sin tiempo", async () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        await waitFor(() => expect(screen.getByLabelText("Tiempo real dedicado")).toHaveValue("01:30"));
        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), { target: { value: "" } });
        fireEvent.click(screen.getByRole("radio", { name: /^4/ }));
        expect(screen.getByText("Marcar como completado")).toBeDisabled();
    });

    it("el botón se habilita con tiempo y valoración", () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), {
            target: { value: "01:00" },
        });
        fireEvent.click(screen.getByRole("radio", { name: /^4/ }));
        expect(screen.getByText("Marcar como completado")).toBeEnabled();
    });
});

// ── Selección de valoración ───────────────────────────────────────────────────

describe("EditReviewPlanEventDialog - selección de valoración", () => {
    it("marca la opción seleccionada como aria-checked", () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        const option3 = screen.getByRole("radio", { name: /^3/ });
        fireEvent.click(option3);
        expect(option3).toHaveAttribute("aria-checked", "true");
    });

    it("desmarca la opción anterior al seleccionar otra", () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        const option3 = screen.getByRole("radio", { name: /^3/ });
        const option5 = screen.getByRole("radio", { name: /^5/ });
        fireEvent.click(option3);
        fireEvent.click(option5);
        expect(option3).toHaveAttribute("aria-checked", "false");
        expect(option5).toHaveAttribute("aria-checked", "true");
    });

    it("se puede seleccionar la valoración 0", () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        const option0 = screen.getByRole("radio", { name: /^0/ });
        fireEvent.click(option0);
        expect(option0).toHaveAttribute("aria-checked", "true");
    });
});

// ── Estado completed ──────────────────────────────────────────────────────────

describe("EditReviewPlanEventDialog - estado completed", () => {
    it("muestra 'Completado ✓' deshabilitado", () => {
        render(<EditReviewPlanEventDialog {...baseProps} status="completed" />);
        expect(screen.getByText("Completado ✓")).toBeDisabled();
    });

    it("el input de tiempo está deshabilitado", () => {
        render(<EditReviewPlanEventDialog {...baseProps} status="completed" />);
        expect(screen.getByLabelText("Tiempo real dedicado")).toBeDisabled();
    });
});

// ── Marcar como completado ────────────────────────────────────────────────────

describe("EditReviewPlanEventDialog - marcar como completado", () => {
    it("envía userTime, rating y status en el cuerpo de la petición", async () => {
        render(<EditReviewPlanEventDialog {...baseProps} />);
        await waitFor(() => expect(screen.getByLabelText("Tiempo real dedicado")).toHaveValue("01:30"));
        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), {
            target: { value: "01:30" },
        });
        fireEvent.click(screen.getByRole("radio", { name: /^4/ }));
        await userEvent.click(screen.getByText("Marcar como completado"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/plan/review-event-1"),
                expect.objectContaining({
                    method: "PUT",
                    body: expect.stringContaining('"rating":4'),
                })
            );
            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"userTime":90'),
                })
            );
            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"status":"completed"'),
                })
            );
        });
    });

    it("llama a onSave y onClose tras completar correctamente", async () => {
        const onSave = jest.fn();
        const onClose = jest.fn();
        render(<EditReviewPlanEventDialog {...baseProps} onSave={onSave} onClose={onClose} />);
        await waitFor(() => expect(screen.getByLabelText("Tiempo real dedicado")).toHaveValue("01:30"));
        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), {
            target: { value: "00:30" },
        });
        fireEvent.click(screen.getByRole("radio", { name: /^5/ }));
        await userEvent.click(screen.getByText("Marcar como completado"));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith("completed");
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("no llama a onSave si la API responde con error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error" }),
        }) as jest.Mock;

        const onSave = jest.fn();
        render(<EditReviewPlanEventDialog {...baseProps} onSave={onSave} />);
        fireEvent.change(screen.getByLabelText("Tiempo real dedicado"), {
            target: { value: "01:00" },
        });
        fireEvent.click(screen.getByRole("radio", { name: /^3/ }));
        await userEvent.click(screen.getByText("Marcar como completado"));

        await waitFor(() => expect(onSave).not.toHaveBeenCalled());
    });
});

// ── Eliminar ──────────────────────────────────────────────────────────────────

describe("EditReviewPlanEventDialog - eliminar", () => {
    it("llama a onDelete y onClose tras eliminar correctamente", async () => {
        const onDelete = jest.fn();
        const onClose = jest.fn();
        render(<EditReviewPlanEventDialog {...baseProps} onDelete={onDelete} onClose={onClose} />);
        await userEvent.click(screen.getByText("Eliminar"));

        await waitFor(() => {
            expect(onDelete).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});

// ── Cerrar ────────────────────────────────────────────────────────────────────

describe("EditReviewPlanEventDialog - cerrar", () => {
    it("llama a onClose al pulsar Cancelar", async () => {
        const onClose = jest.fn();
        render(<EditReviewPlanEventDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByText("Cancelar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar ✕", async () => {
        const onClose = jest.fn();
        render(<EditReviewPlanEventDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar el overlay", async () => {
        const onClose = jest.fn();
        render(<EditReviewPlanEventDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByRole("dialog"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
