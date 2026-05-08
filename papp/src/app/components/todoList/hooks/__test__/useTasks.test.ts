import { renderHook, act, waitFor } from "@testing-library/react";
import { useTasks } from "../useTasks";

const pushAlert = jest.fn();

const today = new Date();
today.setHours(0, 0, 0, 0);

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const mockRawTasks = [
    { _id: 1, title: "Tarea retrasada", completed: false, finishDate: yesterday.toISOString(), estimatedTime: 30 },
    { _id: 2, title: "Tarea pendiente", completed: false, finishDate: tomorrow.toISOString(), estimatedTime: 60 },
    { _id: 3, title: "Tarea completada", completed: true,  finishDate: yesterday.toISOString(), estimatedTime: 15 },
];

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRawTasks),
    }) as jest.Mock;
    jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

describe("useTasks - fetch inicial", () => {
    it("carga las tareas al montar", async () => {
        const { result } = renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(result.current.tasks.length).toBe(3));
    });

    it("no llama a pushAlert si el fetch es exitoso", async () => {
        renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(pushAlert).not.toHaveBeenCalled());
    });

    it("llama a pushAlert con error si el fetch falla", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error del servidor" }),
        }) as jest.Mock;

        renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(pushAlert).toHaveBeenCalledWith(expect.any(String), "error"));
    });
});

describe("useTasks - clasificación de tareas", () => {
    it("clasifica correctamente en overdue, pending y completed", async () => {
        const { result } = renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(result.current.tasks.length).toBe(3));

        expect(result.current.overdue.length).toBe(1);
        expect(result.current.overdue[0].title).toBe("Tarea retrasada");

        expect(result.current.pending.length).toBe(1);
        expect(result.current.pending[0].title).toBe("Tarea pendiente");

        expect(result.current.completed.length).toBe(1);
        expect(result.current.completed[0].title).toBe("Tarea completada");
    });

    it("una tarea retrasada no aparece en pending", async () => {
        const { result } = renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(result.current.tasks.length).toBe(3));

        const pendingIds = result.current.pending.map(t => t.id);
        expect(pendingIds).not.toContain(1);
    });
});

describe("useTasks - deleteTask", () => {
    beforeEach(() => {
        // Primer fetch: carga inicial. Segundo fetch: recarga tras borrar
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRawTasks) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "Eliminada" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) as jest.Mock;
    });

    it("hace DELETE a /tasks/:id en modo single", async () => {
        const { result } = renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(result.current.tasks.length).toBe(3));

        await act(async () => { await result.current.deleteTask(1, "single"); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/tasks/1"),
            expect.objectContaining({ method: "DELETE" })
        );
    });

    it("hace DELETE a /tasks/forward/:id en modo fromThis", async () => {
        const { result } = renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(result.current.tasks.length).toBe(3));

        await act(async () => { await result.current.deleteTask(1, "fromThis"); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/tasks/forward/1"),
            expect.objectContaining({ method: "DELETE" })
        );
    });

    it("hace DELETE a /tasks/all/:id en modo all", async () => {
        const { result } = renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(result.current.tasks.length).toBe(3));

        await act(async () => { await result.current.deleteTask(1, "all"); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/tasks/all/1"),
            expect.objectContaining({ method: "DELETE" })
        );
    });

    it("llama a pushAlert con success al borrar correctamente", async () => {
        const { result } = renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(result.current.tasks.length).toBe(3));

        await act(async () => { await result.current.deleteTask(1, "single"); });

        expect(pushAlert).toHaveBeenCalledWith(expect.any(String), "success");
    });
});

describe("useTasks - addTasks", () => {
    it("añade tareas al estado local sin hacer fetch", async () => {
        const { result } = renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(result.current.tasks.length).toBe(3));

        const fetchCallsBefore = (global.fetch as jest.Mock).mock.calls.length;

        act(() => {
            result.current.addTasks([{
                _id: 99, title: "Nueva", completed: false,
                finishDate: tomorrow.toISOString(), estimatedTime: 20,
            }]);
        });

        expect(result.current.tasks.length).toBe(4);
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallsBefore);
    });

    it("mantiene el orden por fecha tras añadir", async () => {
        const { result } = renderHook(() => useTasks({ pushAlert }));
        await waitFor(() => expect(result.current.tasks.length).toBe(3));

        act(() => {
            result.current.addTasks([{
                _id: 99, title: "Nueva", completed: false,
                finishDate: tomorrow.toISOString(), estimatedTime: 20,
            }]);
        });

        const dates = result.current.tasks.map(t => t.finishDate.getTime());
        expect(dates).toEqual([...dates].sort((a, b) => a - b));
    });
});