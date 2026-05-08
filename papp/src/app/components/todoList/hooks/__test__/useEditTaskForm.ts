import { renderHook, act, waitFor } from "@testing-library/react";
import { useEditTaskForm } from "../useEditTaskForm";

const pushAlert = jest.fn();

const mockTaskData = {
    title: "Estudiar tema 3",
    description: "Repasar apuntes",
    estimatedTime: 90,
    finishDate: "2025-06-10T00:00:00.000Z",
    givenDate: "2025-06-01T00:00:00.000Z",
    subjectId: "subj1",
    plannable: true,
    includeReviews: false,
};

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTaskData),
    }) as jest.Mock;
    jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

function makeHook(taskId: number | null = 1) {
    return renderHook(() => useEditTaskForm({ open: true, taskId, pushAlert }));
}

describe("useEditTaskForm - carga de datos", () => {
    it("hace GET a /tasks/:id al abrir", async () => {
        makeHook(42);
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/tasks/42"),
                expect.any(Object)
            );
        });
    });

    it("precarga el título de la tarea", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.title).toBe("Estudiar tema 3"));
    });

    it("precarga estimatedTime", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.estimatedTime).toBe(90));
    });

    it("precarga finishDate sin la parte de tiempo", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.finishDate).toBe("2025-06-10"));
    });

    it("precarga subjectId", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.subjectId).toBe("subj1"));
    });

    it("llama a pushAlert con error si el fetch falla", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "No encontrada" }),
        }) as jest.Mock;

        makeHook();
        await waitFor(() => expect(pushAlert).toHaveBeenCalledWith("No encontrada", "error"));
    });

    it("no hace fetch si taskId es null", () => {
        makeHook(null);
        expect(global.fetch).not.toHaveBeenCalled();
    });
});

describe("useEditTaskForm - flujo de guardar", () => {
    it("abre recurrenceChoiceOpen al llamar handleSaveClicked con título válido", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.title).toBe("Estudiar tema 3"));

        act(() => { result.current.handleSaveClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(true);
    });

    it("no abre recurrenceChoiceOpen si el título está vacío", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.title).toBe("Estudiar tema 3"));

        act(() => { result.current.setTitle(""); });
        act(() => { result.current.handleSaveClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
    });

    it("hace PUT a /tasks/:id en modo single", async () => {
        // fetch 1: GET tarea, fetch 2: PUT update
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTaskData) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "Actualizada" }) }) as jest.Mock;

        const onSuccess = jest.fn();
        const { result } = makeHook(1);
        await waitFor(() => expect(result.current.title).toBe("Estudiar tema 3"));

        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseSingle(onSuccess); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/tasks/1"),
            expect.objectContaining({ method: "PUT" })
        );
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("hace PUT a /tasks/forward/:id en modo fromThis", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTaskData) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "OK" }) }) as jest.Mock;

        const { result } = makeHook(1);
        await waitFor(() => expect(result.current.title).toBe("Estudiar tema 3"));

        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseFromThis(jest.fn()); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/tasks/forward/1"),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("hace PUT a /tasks/all/:id en modo all", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTaskData) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "OK" }) }) as jest.Mock;

        const { result } = makeHook(1);
        await waitFor(() => expect(result.current.title).toBe("Estudiar tema 3"));

        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseAll(jest.fn()); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/tasks/all/1"),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("no llama a onSuccess si el PUT falla", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTaskData) })
            .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: "Error" }) }) as jest.Mock;

        const onSuccess = jest.fn();
        const { result } = makeHook(1);
        await waitFor(() => expect(result.current.title).toBe("Estudiar tema 3"));

        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseSingle(onSuccess); });

        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("cierra recurrenceChoiceOpen tras confirmar", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTaskData) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "OK" }) }) as jest.Mock;

        const { result } = makeHook(1);
        await waitFor(() => expect(result.current.title).toBe("Estudiar tema 3"));

        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseSingle(jest.fn()); });

        expect(result.current.recurrenceChoiceOpen).toBe(false);
    });
});

describe("useEditTaskForm - cancelar", () => {
    it("cierra el diálogo sin hacer PUT", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.title).toBe("Estudiar tema 3"));

        act(() => { result.current.handleSaveClicked(); });
        act(() => { result.current.onCancel(); });

        expect(result.current.recurrenceChoiceOpen).toBe(false);
        // Solo el GET inicial, ningún PUT
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
});