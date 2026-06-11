import { renderHook, act, waitFor } from "@testing-library/react";
import { useEditTaskForm } from "../useEditTaskForm";

const pushAlert = jest.fn();

const mockTaskData = {
    _id: "task-1",
    title: "Tarea de prueba",
    description: "Descripción de prueba",
    estimatedTime: 90,
    finishDate: "2026-06-15T14:30:00.000Z",
    givenDate: "2026-06-01T00:00:00.000Z",
    subjectId: "sub-1",
    plannable: true,
    includeReviews: false,
    groupId: null,
};

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTaskData, message: "OK" }),
    }) as jest.Mock;
    jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

// ── Fetch al abrir ────────────────────────────────────────────────────────────

describe("useEditTaskForm - fetch al abrir", () => {
    it("carga título y estimatedTime de la tarea", async () => {
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.title).toBe("Tarea de prueba"));
        expect(result.current.estimatedTime).toBe(90);
    });

    it("carga subjectId correctamente", async () => {
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.subjectId).toBe("sub-1"));
    });

    it("no llama a fetch si open=false", () => {
        renderHook(() =>
            useEditTaskForm({ open: false, taskId: "task-1", pushAlert })
        );
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("recurring=false cuando la tarea no tiene groupId", async () => {
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.title).toBe("Tarea de prueba"));
        expect(result.current.recurring).toBe(false);
    });

    it("recurring=true cuando la tarea tiene groupId", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { ...mockTaskData, groupId: "grp-1" }, message: "OK" }),
        }) as jest.Mock;
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.recurring).toBe(true));
    });

    it("llama a pushAlert con error si el fetch falla", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error del servidor", data: null }),
        }) as jest.Mock;
        renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() =>
            expect(pushAlert).toHaveBeenCalledWith(expect.any(String), "error")
        );
    });
});

// ── handleSaveClicked ─────────────────────────────────────────────────────────

describe("useEditTaskForm - handleSaveClicked", () => {
    it("abre recurrenceChoiceOpen si el título no está vacío", async () => {
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.title).toBe("Tarea de prueba"));
        act(() => { result.current.handleSaveClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(true);
    });

    it("no abre recurrenceChoiceOpen si el título está vacío", async () => {
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.title).toBe("Tarea de prueba"));
        act(() => { result.current.setTitle(""); });
        act(() => { result.current.handleSaveClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
    });
});

// ── onChoose* ─────────────────────────────────────────────────────────────────

describe("useEditTaskForm - onChoose*", () => {
    beforeEach(() => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: mockTaskData, message: "OK" }),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ message: "Actualizada" }),
            }) as jest.Mock;
    });

    it("onChooseSingle llama a PUT /tasks/:id y ejecuta onSuccess", async () => {
        const onSuccess = jest.fn();
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.title).toBe("Tarea de prueba"));
        await act(async () => { await result.current.onChooseSingle(onSuccess); });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringMatching(/\/tasks\/task-1$/),
            expect.objectContaining({ method: "PUT" })
        );
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("onChooseFromThis llama a PUT /tasks/forward/:id", async () => {
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.title).toBe("Tarea de prueba"));
        await act(async () => { await result.current.onChooseFromThis(jest.fn()); });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/tasks/forward/task-1"),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("onChooseAll llama a PUT /tasks/all/:id", async () => {
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.title).toBe("Tarea de prueba"));
        await act(async () => { await result.current.onChooseAll(jest.fn()); });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/tasks/all/task-1"),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("cierra recurrenceChoiceOpen tras confirmar", async () => {
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.title).toBe("Tarea de prueba"));
        act(() => { result.current.handleSaveClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(true);
        await act(async () => { await result.current.onChooseSingle(jest.fn()); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
    });

    it("no llama a onSuccess si el PUT falla", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: mockTaskData, message: "OK" }),
            })
            .mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ message: "Error" }),
            }) as jest.Mock;

        const onSuccess = jest.fn();
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.title).toBe("Tarea de prueba"));
        await act(async () => { await result.current.onChooseSingle(onSuccess); });
        expect(onSuccess).not.toHaveBeenCalled();
    });
});

// ── onCancel ──────────────────────────────────────────────────────────────────

describe("useEditTaskForm - onCancel", () => {
    it("cierra recurrenceChoiceOpen sin llamar a fetch adicional", async () => {
        const { result } = renderHook(() =>
            useEditTaskForm({ open: true, taskId: "task-1", pushAlert })
        );
        await waitFor(() => expect(result.current.title).toBe("Tarea de prueba"));
        act(() => { result.current.handleSaveClicked(); });
        const callsBefore = (global.fetch as jest.Mock).mock.calls.length;
        act(() => { result.current.onCancel(); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(callsBefore);
    });
});
