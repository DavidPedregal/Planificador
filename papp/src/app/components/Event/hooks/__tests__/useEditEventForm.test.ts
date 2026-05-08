import { renderHook, act } from "@testing-library/react";
import { useEditEventForm } from "../useEditEventForm";
import { CalendarEvent } from "@/app/components/calendar/calendarHelper";

const mockCalendars = [
    { id: "cal1", name: "Personal", color: "#ff0000", visible: true },
    { id: "cal2", name: "Trabajo", color: "#00ff00", visible: true },
];

const mockEvent: CalendarEvent = {
    id: "evt1",
    title: "Reunión",
    label: "trabajo",
    start: "2025-06-01T10:00:00",
    end: "2025-06-01T11:00:00",
    color: "#7c6ff7",
    calendarId: "cal1",
    useCalendarColor: true,
    isPlannedEvent: false,
};

const pushAlert = jest.fn();

function makeHook(event = mockEvent) {
    return renderHook(() =>
        useEditEventForm({ open: true, event, calendars: mockCalendars, pushAlert })
    );
}

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "OK" }),
    }) as jest.Mock;
    jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

describe("useEditEventForm - estado inicial", () => {
    it("precarga el título del evento", () => {
        const { result } = makeHook();
        expect(result.current.eventTitle).toBe("Reunión");
    });

    it("precarga el label del evento", () => {
        const { result } = makeHook();
        expect(result.current.label).toBe("trabajo");
    });

    it("precarga el calendarId del evento", () => {
        const { result } = makeHook();
        expect(result.current.calendarId).toBe("cal1");
    });

    it("useCustomColor=false cuando useCalendarColor=true", () => {
        const { result } = makeHook();
        expect(result.current.useCustomColor).toBe(false);
    });

    it("useCustomColor=true cuando useCalendarColor=false", () => {
        const { result } = makeHook({ ...mockEvent, useCalendarColor: false });
        expect(result.current.useCustomColor).toBe(true);
    });

    it("convierte start string a Date", () => {
        const { result } = makeHook();
        expect(result.current.start).toBeInstanceOf(Date);
    });
});

describe("useEditEventForm - reset al abrir", () => {
    it("restaura el título original al reabrir", () => {
        const { result, rerender } = renderHook(
            ({ open }: { open: boolean }) =>
                useEditEventForm({ open, event: mockEvent, calendars: mockCalendars, pushAlert }),
            { initialProps: { open: true } }
        );

        act(() => { result.current.setEventTitle("Modificado"); });
        rerender({ open: false });
        rerender({ open: true });

        expect(result.current.eventTitle).toBe("Reunión");
    });
});

describe("useEditEventForm - flujo de guardar", () => {
    it("abre recurrenceChoiceOpen al llamar handleSaveClicked con título válido", () => {
        const { result } = makeHook();
        act(() => { result.current.handleSaveClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(true);
        expect(result.current.pendingAction).toBe("update");
    });

    it("no abre recurrenceChoiceOpen si el título está vacío", () => {
        const { result } = makeHook();
        act(() => { result.current.setEventTitle(""); });
        act(() => { result.current.handleSaveClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
    });

    it("performUpdate single hace PUT a /events/:id", async () => {
        const onSuccess = jest.fn();
        const { result } = makeHook();
        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseSingle(onSuccess); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/evt1"),
            expect.objectContaining({ method: "PUT" })
        );
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("performUpdate all hace PUT a /events/all/:id", async () => {
        const onSuccess = jest.fn();
        const { result } = makeHook();
        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseAll(onSuccess); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/all/evt1"),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("performUpdate fromThis hace PUT a /events/forward/:id", async () => {
        const onSuccess = jest.fn();
        const { result } = makeHook();
        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseFromThis(onSuccess); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/forward/evt1"),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("cierra recurrenceChoiceOpen tras confirmar", async () => {
        const { result } = makeHook();
        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseSingle(jest.fn()); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
    });

    it("no llama a onSuccess si el fetch falla", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error" }),
        }) as jest.Mock;

        const onSuccess = jest.fn();
        const { result } = makeHook();
        act(() => { result.current.handleSaveClicked(); });
        await act(async () => { await result.current.onChooseSingle(onSuccess); });
        expect(onSuccess).not.toHaveBeenCalled();
    });
});

describe("useEditEventForm - flujo de eliminar", () => {
    it("abre recurrenceChoiceOpen con pendingAction=delete", () => {
        const { result } = makeHook();
        act(() => { result.current.handleDeleteClicked(); });
        expect(result.current.recurrenceChoiceOpen).toBe(true);
        expect(result.current.pendingAction).toBe("delete");
    });

    it("performDelete single hace DELETE a /events/:id", async () => {
        const onSuccess = jest.fn();
        const { result } = makeHook();
        act(() => { result.current.handleDeleteClicked(); });
        await act(async () => { await result.current.onChooseSingle(onSuccess); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/evt1"),
            expect.objectContaining({ method: "DELETE" })
        );
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("performDelete all hace DELETE a /events/all/:id", async () => {
        const { result } = makeHook();
        act(() => { result.current.handleDeleteClicked(); });
        await act(async () => { await result.current.onChooseAll(jest.fn()); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/all/evt1"),
            expect.objectContaining({ method: "DELETE" })
        );
    });
});

describe("useEditEventForm - cancelar recurrencia", () => {
    it("cierra el diálogo y limpia el estado al cancelar", () => {
        const { result } = makeHook();
        act(() => { result.current.handleSaveClicked(); });
        act(() => { result.current.onCancel(); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
        expect(result.current.pendingAction).toBeNull();
    });
});