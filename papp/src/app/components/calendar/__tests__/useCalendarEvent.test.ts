import { renderHook, act, waitFor } from "@testing-library/react";
import { useCalendarEvents } from "../hooks/useCalendarEvents";

const pushAlert = jest.fn();

const mockCalendars = [
    { _id: "cal1", name: "Personal", color: "#ff0000", visible: true  },
    { _id: "cal2", name: "Trabajo",  color: "#00ff00", visible: false },
];
const mockCommon = [
    { _id: "com1", name: "Festivos", color: "#0000ff", visible: true },
];
const mockEvents = [
    { _id: "evt1", title: "Reunión", start: "2025-06-01T10:00:00", end: "2025-06-01T11:00:00",
      color: "#ff0000", calendarId: "cal1", useCalendarColor: true, label: "" },
    { _id: "evt2", title: "Oculto",  start: "2025-06-02T10:00:00", end: "2025-06-02T11:00:00",
      color: "#00ff00", calendarId: "cal2", useCalendarColor: true, label: "" },
];
const mockPlanned = [
    { _id: "pln1", title: "Estudio", start: "2025-06-01T12:00:00", end: "2025-06-01T13:00:00",
      calendarId: "cal1", status: "pending" },
];

function makeFetch() {
    return jest.fn().mockImplementation((url: string) => {
        if (url.includes("/calendars/common"))
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockCommon,   message: "OK" }) });
        if (url.includes("/calendars"))
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockCalendars, message: "OK" }) });
        if (url.includes("/plan"))
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockPlanned,  message: "OK" }) });
        if (url.includes("/events"))
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockEvents,   message: "OK" }) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {}, message: "OK" }) });
    }) as jest.Mock;
}

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = makeFetch();
    jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

describe("useCalendarEvents - carga inicial", () => {
    it("carga calendarios y eventos al montar", async () => {
        const { result } = renderHook(() => useCalendarEvents({ pushAlert }));
        await waitFor(() => expect(result.current.calendars.length).toBeGreaterThan(0));
        expect(result.current.calendars.length).toBe(3); // 2 custom + 1 common
    });

    it("filtra eventos de calendarios no visibles", async () => {
        const { result } = renderHook(() => useCalendarEvents({ pushAlert }));
        await waitFor(() => expect(result.current.visibleEvents.length).toBeGreaterThan(0));

        const ids = result.current.visibleEvents.map(e => e.id);
        expect(ids).not.toContain("evt2"); // cal2 visible=false
        expect(ids).toContain("evt1");
    });

    it("incluye los planned events en visibleEvents", async () => {
        const { result } = renderHook(() => useCalendarEvents({ pushAlert }));
        await waitFor(() => expect(result.current.visibleEvents.length).toBeGreaterThan(0));

        const ids = result.current.visibleEvents.map(e => e.id);
        expect(ids).toContain("pln1");
    });

    it("no llama a pushAlert si todo va bien", async () => {
        renderHook(() => useCalendarEvents({ pushAlert }));
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        expect(pushAlert).not.toHaveBeenCalled();
    });

    it("llama a pushAlert con error si falla el fetch de eventos", async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
            if (url.includes("/calendars"))
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockCalendars, message: "OK" }) });
            return Promise.resolve({ ok: false, json: () => Promise.resolve({ data: null, message: "Error eventos" }) });
        }) as jest.Mock;

        renderHook(() => useCalendarEvents({ pushAlert }));
        await waitFor(() => expect(pushAlert).toHaveBeenCalledWith("Error eventos", "error"));
    });
});

describe("useCalendarEvents - updatePlannedEventStatus", () => {
    it("actualiza el status de un planned event sin mutación directa", async () => {
        const { result } = renderHook(() => useCalendarEvents({ pushAlert }));
        await waitFor(() => expect(result.current.visibleEvents.length).toBeGreaterThan(0));

        act(() => { result.current.updatePlannedEventStatus("pln1", "completed"); });

        const updated = result.current.visibleEvents.find(e => e.id === "pln1");
        expect(updated?.status).toBe("completed");
    });
});

describe("useCalendarEvents - removePlannedEvent", () => {
    it("elimina el planned event de visibleEvents", async () => {
        const { result } = renderHook(() => useCalendarEvents({ pushAlert }));
        await waitFor(() => expect(result.current.visibleEvents.length).toBeGreaterThan(0));

        act(() => { result.current.removePlannedEvent("pln1"); });

        const ids = result.current.visibleEvents.map(e => e.id);
        expect(ids).not.toContain("pln1");
    });
});

describe("useCalendarEvents - updateEventDates", () => {
    it("hace PUT a /events/:id con start y end", async () => {
        const { result } = renderHook(() => useCalendarEvents({ pushAlert }));
        await waitFor(() => expect(result.current.calendars.length).toBeGreaterThan(0));

        const start = new Date("2025-06-01T10:00:00");
        const end   = new Date("2025-06-01T12:00:00");

        await act(async () => {
            await result.current.updateEventDates("evt1", start, end, false);
        });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events/evt1"),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("no hace fetch si isPlannedEvent=true", async () => {
        const { result } = renderHook(() => useCalendarEvents({ pushAlert }));
        await waitFor(() => expect(result.current.calendars.length).toBeGreaterThan(0));

        const callsBefore = (global.fetch as jest.Mock).mock.calls.length;

        await act(async () => {
            await result.current.updateEventDates("pln1", new Date(), new Date(), true);
        });

        expect((global.fetch as jest.Mock).mock.calls.length).toBe(callsBefore);
    });
});