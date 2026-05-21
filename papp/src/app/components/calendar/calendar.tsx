"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import esLocale from "@fullcalendar/core/locales/es";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
import AddEventDialog from "../event/add-event-dialog";
import EditEventDialog from "../event/edit-event-dialog";
import EditPlanEventDialog from "../plannedEvent/edit-plan-event-dialog";
import "./calendar.css";

interface CalendarProps {
    refreshTrigger?: number;
}

export default function Calendar({ refreshTrigger = 0 }: CalendarProps) {
    const { i18n, t } = useTranslation();
    const { pushAlert } = useApp();
    const {
        visibleEvents,
        calendars,
        fetchEvents,
        updateEventDates,
        updatePlannedEventStatus,
        removePlannedEvent,
    } = useCalendarEvents({ refreshTrigger, pushAlert });

    // ── Add event ─────────────────────────────────────────────────────────────
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const openAddDialog = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
        setAddDialogOpen(true);
    };

    // ── Edit event ────────────────────────────────────────────────────────────
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // ── Edit planned event ────────────────────────────────────────────────────
    const [editPlanEventDialogOpen, setEditPlanEventDialogOpen] = useState(false);
    const [selectedPlanEventId, setSelectedPlanEventId] = useState<string | null>(null);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleEventClick = (info: any) => {
        if (info.event.extendedProps.isPlannedEvent) {
            setSelectedPlanEventId(info.event.id);
            setEditPlanEventDialogOpen(true);
        } else {
            setSelectedEventId(info.event.id);
            setEditDialogOpen(true);
        }
    };

    const handleEventDrop = (info: any) => {
        updateEventDates(
            info.event.id,
            info.event.start,
            info.event.end,
            info.event.extendedProps.isPlannedEvent
        );
    };

    const handleEventResize = (info: any) => {
        updateEventDates(
            info.event.id,
            info.event.start,
            info.event.end,
            info.event.extendedProps.isPlannedEvent
        );
    };

    return (
        <>
            <div className="calendar-wrapper">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="timeGridWeek"
                    locale={i18n.language === "es" ? esLocale : undefined}
                    buttonText={{
                        today:    t("fullcalendar.today"),
                        month:    t("fullcalendar.month"),
                        week:     t("fullcalendar.week"),
                        day:      t("fullcalendar.day"),
                        listWeek: t("fullcalendar.listWeek"),
                    }}
                    slotMinTime="08:00:00"
                    slotMaxTime="22:00:00"
                    headerToolbar={{
                        left: "prev next today",
                        center: "title",
                        right: "dayGridMonth timeGridWeek timeGridDay listWeek",
                    }}
                    events={visibleEvents}
                    dateClick={(info) => openAddDialog(
                        info.date,
                        new Date(info.date.getTime() + 60 * 60 * 1000)
                    )}
                    selectable={true}
                    select={(info) => openAddDialog(info.start, info.end)}
                    editable={true}
                    eventResizableFromStart={true}
                    eventClick={handleEventClick}
                    eventDrop={handleEventDrop}
                    eventResize={handleEventResize}
                    eventContent={(arg) => (
                        <EventContent
                            title={arg.event.title}
                            color={arg.event.backgroundColor}
                            status={arg.event.extendedProps.status}
                        />
                    )}
                />
            </div>

            <AddEventDialog
                open={addDialogOpen}
                start={startDate}
                end={endDate}
                onClose={() => setAddDialogOpen(false)}
                onSave={fetchEvents}
            />

            <EditEventDialog
                open={editDialogOpen}
                eventId={selectedEventId ?? ""}
                onClose={() => { setEditDialogOpen(false); setSelectedEventId(null); }}
                onSave={fetchEvents}
                onDelete={fetchEvents}
            />

            <EditPlanEventDialog
                open={editPlanEventDialogOpen}
                planEventId={selectedPlanEventId ?? ""}
                status={visibleEvents.find(e => e.id === selectedPlanEventId)?.status ?? "pending"}
                onClose={() => { setEditPlanEventDialogOpen(false); setSelectedPlanEventId(null); }}
                onSave={(status) => updatePlannedEventStatus(selectedPlanEventId ?? "", status)}
                onDelete={() => removePlannedEvent(selectedPlanEventId ?? "")}
            />
        </>
    );
}

// ── EventContent ──────────────────────────────────────────────────────────────

interface EventContentProps {
    title: string;
    color: string;
    status?: string;
}

const GRADIENTS: Record<string, (bg: string) => string> = {
    completed:   bg => `linear-gradient(180deg, ${bg} 50%, #22c55e)`,
    uncompleted: bg => `linear-gradient(180deg, ${bg} 50%, #ef4444)`,
};

function EventContent({ title, color, status }: EventContentProps) {
    const gradient = status && GRADIENTS[status] ? GRADIENTS[status](color) : color;

    return (
        <div style={{
            background: gradient,
            width: "100%",
            height: "100%",
            padding: "2px 4px",
            borderRadius: "3px",
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-start",
        }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#fff" }}>
                {title}
            </span>
        </div>
    );
}