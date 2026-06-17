import { renderHook, act, waitFor } from "@testing-library/react";
import { useEditEventForm } from "../useEditEventForm";

const mockCalendars = [
    { id: "cal1", name: "Personal", color: "#ff0000", visible: true },
    { id: "cal2", name: "Trabajo",  color: "#00ff00", visible: true },
];

const mockEventData = {
    title: "Reunión",
    label: "trabajo",
    start: "2025-06-01T10:00:00",
    end: "2025-06-01T11:00:00",
    color: "#7c6ff7",
    calendarId: "cal1",
    useCalendarColor: true,
    isPlannedEvent: false,
};

// Same event but part of a recurring series — handleSaveClicked opens the recurrence dialog
const mockRecurringEventData = { ...mockEventData, groupId: "group1" };

const pushAlert = jest.fn();

function makeHook(eventId = "evt1") {
    return renderHook(() =>
        useEditEventForm({ open: true, eventId, calendars: mockCalendars, pushAlert })
    );
}

// Mock que devuelve los datos del evento en el GET y OK en el resto
function mockFetchOk() {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEventData, message: "OK" }),
    }) as jest.Mock;
}

// Mock para operaciones de update/delete: GET primero, luego PUT/DELETE
function mockFetchSequence(actionResponse = { ok: true, message: "OK" }) {
    global.fetch = jest.fn()
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ data: mockEventData, message: "OK" }),
        })
        .mockResolvedValueOnce({
            ok: actionResponse.ok,
            json: () => Promise.resolve({ data: {}, message: actionResponse.message }),
        }) as jest.Mock;
}

// Igual pero devuelve un evento recurrente en el GET
function mockRecurringFetchSequence(actionResponse = { ok: true, message: "OK" }) {
    global.fetch = jest.fn()
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ data: mockRecurringEventData, message: "OK" }),
        })
        .mockResolvedValueOnce({
            ok: actionResponse.ok,
            json: () => Promise.resolve({ data: {}, message: actionResponse.message }),
        }) as jest.Mock;
}

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    mockFetchOk();
    jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

describe("useEditEventForm - carga de datos", () => {
    it("hace GET a /events/:id al abrir", async () => {
        makeHook("evt1");
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/events/evt1"),
                expect.any(Object)
            );
        });
    });

    it("precarga el título del evento", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));
    });

    it("precarga el label del evento", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.label).toBe("trabajo"));
    });

    it("precarga el calendarId del evento", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.calendarId).toBe("cal1"));
    });

    it("useCustomColor=false cuando useCalendarColor=true", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.useCustomColor).toBe(false));
    });

    it("useCustomColor=true cuando useCalendarColor=false", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { ...mockEventData, useCalendarColor: false }, message: "OK" }),
        }) as jest.Mock;

        const { result } = makeHook();
        await waitFor(() => expect(result.current.useCustomColor).toBe(true));
    });

    it("convierte start string a Date", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.start).toBeInstanceOf(Date));
    });

    it("llama a pushAlert con error si el fetch falla", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ data: null, message: "No encontrado" }),
        }) as jest.Mock;

        makeHook();
        await waitFor(() => expect(pushAlert).toHaveBeenCalledWith("No encontrado", "error"));
    });
});

describe("useEditEventForm - reset al abrir", () => {
    it("limpia el título al cerrar", async () => {
        const { result, rerender } = renderHook(
            ({ open }: { open: boolean }) =>
                useEditEventForm({ open, eventId: "evt1", calendars: mockCalendars, pushAlert }),
            { initialProps: { open: true } }
        );

        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        rerender({ open: false });
        await waitFor(() => expect(result.current.eventTitle).toBe(""));
    });

    it("recarga los datos al reabrir", async () => {
        const { result, rerender } = renderHook(
            ({ open }: { open: boolean }) =>
                useEditEventForm({ open, eventId: "evt1", calendars: mockCalendars, pushAlert }),
            { initialProps: { open: true } }
        );

        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        rerender({ open: false });
        rerender({ open: true });

        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));
        // Se habrá llamado al fetch dos veces (apertura inicial + reapertura)
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});

describe("useEditEventForm - flujo de guardar", () => {
    it("abre recurrenceChoiceOpen al llamar handleSaveClicked con título válido (recurrente)", async () => {
        mockRecurringFetchSequence();
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        act(() => { result.current.handleSaveClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(true);
        expect(result.current.pendingAction).toBe("update");
    });

    it("no abre recurrenceChoiceOpen si el título está vacío", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        act(() => { result.current.setEventTitle(""); });
        act(() => { result.current.handleSaveClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
    });

    it("hace PUT a /events/:id directamente para evento no recurrente", async () => {
        mockFetchSequence();
        const onSuccess = jest.fn();
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        await act(async () => { await result.current.handleSaveClicked(onSuccess); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/evt1"),
            expect.objectContaining({ method: "PUT" })
        );
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("hace PUT a /events/all/:id en modo all (recurrente)", async () => {
        mockRecurringFetchSequence();
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseAll(jest.fn()); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/all/evt1"),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("hace PUT a /events/forward/:id en modo fromThis (recurrente)", async () => {
        mockRecurringFetchSequence();
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseFromThis(jest.fn()); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/forward/evt1"),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("cierra recurrenceChoiceOpen tras confirmar", async () => {
        mockFetchSequence();
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseSingle(jest.fn()); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
    });

    it("no llama a onSuccess si el fetch falla", async () => {
        mockFetchSequence({ ok: false, message: "Error" });
        const onSuccess = jest.fn();
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseSingle(onSuccess); });
        expect(onSuccess).not.toHaveBeenCalled();
    });
});

describe("useEditEventForm - flujo de eliminar", () => {
    it("abre recurrenceChoiceOpen con pendingAction=delete", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        act(() => { result.current.handleDeleteClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(true);
        expect(result.current.pendingAction).toBe("delete");
    });

    it("hace DELETE a /events/:id en modo single", async () => {
        mockFetchSequence();
        const onSuccess = jest.fn();
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        act(() => { result.current.handleDeleteClicked(); });
        await act(async () => { await result.current.onChooseSingle(onSuccess); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/evt1"),
            expect.objectContaining({ method: "DELETE" })
        );
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("hace DELETE a /events/all/:id en modo all", async () => {
        mockFetchSequence();
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        act(() => { result.current.handleDeleteClicked(); });
        await act(async () => { await result.current.onChooseAll(jest.fn()); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/all/evt1"),
            expect.objectContaining({ method: "DELETE" })
        );
    });
});

describe("useEditEventForm - cancelar recurrencia", () => {
    it("cierra el diálogo y limpia el estado al cancelar", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.eventTitle).toBe("Reunión"));

        act(() => { result.current.handleSaveClicked(); });
        act(() => { result.current.onCancel(); });

        expect(result.current.recurrenceChoiceOpen).toBe(false);
        expect(result.current.pendingAction).toBeNull();
    });
});