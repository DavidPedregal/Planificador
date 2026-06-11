import { renderHook, act, waitFor } from "@testing-library/react";
import { useTaskForm } from "../useTaskForm";

const pushAlert = jest.fn();

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { _id: "new-task" }, message: "Tarea creada" }),
    }) as jest.Mock;
    jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

// ── Estado inicial ────────────────────────────────────────────────────────────

describe("useTaskForm - estado inicial", () => {
    it("título empieza vacío", () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        expect(result.current.title).toBe("");
    });

    it("estimatedTime empieza en 30", () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        expect(result.current.estimatedTime).toBe(30);
    });

    it("plannable empieza en true", () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        expect(result.current.plannable).toBe(true);
    });

    it("includeReviews empieza en false", () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        expect(result.current.includeReviews).toBe(false);
    });

    it("recurrencia empieza con frequencyType NONE", () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        expect(result.current.recurrence.frequencyType).toBe("none");
    });
});

// ── Reset al abrir ────────────────────────────────────────────────────────────

describe("useTaskForm - reset al abrir", () => {
    it("restaura el título al abrirse", () => {
        const { result, rerender } = renderHook(
            ({ open }: { open: boolean }) => useTaskForm({ open, pushAlert }),
            { initialProps: { open: false } }
        );
        act(() => { result.current.setTitle("algo"); });
        rerender({ open: true });
        expect(result.current.title).toBe("");
    });

    it("restaura estimatedTime a 30 al abrirse", () => {
        const { result, rerender } = renderHook(
            ({ open }: { open: boolean }) => useTaskForm({ open, pushAlert }),
            { initialProps: { open: false } }
        );
        act(() => { result.current.setEstimatedTime(120); });
        rerender({ open: true });
        expect(result.current.estimatedTime).toBe(30);
    });

    it("restaura plannable a true al abrirse", () => {
        const { result, rerender } = renderHook(
            ({ open }: { open: boolean }) => useTaskForm({ open, pushAlert }),
            { initialProps: { open: false } }
        );
        act(() => { result.current.setPlannable(false); });
        rerender({ open: true });
        expect(result.current.plannable).toBe(true);
    });
});

// ── toggleWeekday ─────────────────────────────────────────────────────────────

describe("useTaskForm - toggleWeekday", () => {
    it("añade un día al aplicar toggle", () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        act(() => { result.current.toggleWeekday(1); });
        expect(result.current.recurrence.frequencyDaysOfWeek).toContain(1);
    });

    it("elimina el día si ya estaba presente", () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        act(() => { result.current.toggleWeekday(1); });
        act(() => { result.current.toggleWeekday(1); });
        expect(result.current.recurrence.frequencyDaysOfWeek).not.toContain(1);
    });

    it("permite añadir varios días distintos", () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        act(() => { result.current.toggleWeekday(1); });
        act(() => { result.current.toggleWeekday(3); });
        expect(result.current.recurrence.frequencyDaysOfWeek).toContain(1);
        expect(result.current.recurrence.frequencyDaysOfWeek).toContain(3);
    });
});

// ── handleSave ────────────────────────────────────────────────────────────────

describe("useTaskForm - handleSave", () => {
    it("retorna null sin llamar a fetch si el título está vacío", async () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        let returned: any;
        await act(async () => { returned = await result.current.handleSave(); });
        expect(returned).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("hace POST a /tasks cuando el título es válido", async () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        act(() => { result.current.setTitle("Mi tarea"); });
        await act(async () => { await result.current.handleSave(); });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/tasks"),
            expect.objectContaining({ method: "POST" })
        );
    });

    it("retorna el dato y llama a pushAlert con success", async () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        act(() => { result.current.setTitle("Mi tarea"); });
        let returned: any;
        await act(async () => { returned = await result.current.handleSave(); });
        expect(returned).toEqual({ _id: "new-task" });
        expect(pushAlert).toHaveBeenCalledWith(expect.any(String), "success");
    });

    it("retorna null y llama a pushAlert con error si el fetch falla", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error", data: null }),
        }) as jest.Mock;
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        act(() => { result.current.setTitle("Mi tarea"); });
        let returned: any;
        await act(async () => { returned = await result.current.handleSave(); });
        expect(returned).toBeNull();
        expect(pushAlert).toHaveBeenCalledWith(expect.any(String), "error");
    });

    it("incluye el título en el body de la petición", async () => {
        const { result } = renderHook(() => useTaskForm({ open: true, pushAlert }));
        act(() => { result.current.setTitle("Matemáticas"); });
        await act(async () => { await result.current.handleSave(); });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining('"title":"Matemáticas"'),
            })
        );
    });
});
