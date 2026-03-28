import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {useEffect, useState} from "react";
import AddEventDialog from "./add-event-dialog";
import "./calendar.css";
import { config } from "@/app/config/config";
import EditEventDialog from "./edit-event-dialog";
import { CalendarEvent } from "./calendarHelper";

interface CalendarProps {
    refreshTrigger?: number;
}

export default function Calendar({ refreshTrigger = 0 }: CalendarProps) {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    const addEvent = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
        setAddDialogOpen(true);
    };

    const handleEventClick = (info: any) => {
        setSelectedEvent({
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            color: info.event.backgroundColor,
            calendarId: info.event.extendedProps.calendarId,
            useCalendarColor: info.event.extendedProps.useCalendarColor,
        });
        setEditDialogOpen(true);
    };

    const handleEventDrop = (info: any) => {
        const updateEvent = {
            start: info.event.start,
            end: info.event.end,
        };
        
        fetch(config.backendUrl + `/events/${info.event.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(updateEvent),
        }).catch(error => console.error("Error updating event:", error));
    };

    const handleEventResize = (info: any) => {
        const updateEvent = {
            start: info.event.start,
            end: info.event.end,
        };
        
        fetch(config.backendUrl + `/events/${info.event.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(updateEvent),
        }).catch(error => console.error("Error updating event:", error));
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch(config.backendUrl + "/events", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            
            setEvents(data.map((event: any) => ({
                id: event._id, // Use _id from backend as id
                title: event.title,
                start: event.start,
                end: event.end,
                color: event.color,
                calendarId: event.calendarId,
                useCalendarColor: event.useCalendarColor,
            })));

        } catch (error) {
            console.error("Error fetching events:", error);
        }   
    };

    useEffect(() => {
        fetchEvents();
    }, [refreshTrigger]);

    return (
    <>
    <div className="calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        headerToolbar={{
          left: "prev next today",
          center: "title",
          right: "dayGridMonth timeGridWeek timeGridDay",
        }}
        events={events}
        dateClick={(info) => {
            addEvent(info.date, new Date(info.date.getTime() + 60 * 60 * 1000));
        }}
        selectable={true}
        select={(info) => {
          addEvent(info.start, info.end);
        }}
        editable={true}
        eventResizableFromStart={true}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
      />
    </div>
        <AddEventDialog
            open={addDialogOpen}
            start={startDate}
            end={endDate}
            onClose={() => setAddDialogOpen(false)}
            onSave={(newEvent) => {
                setEvents([...events, {
                    id: newEvent._id,
                    title: newEvent.title,
                    start: newEvent.start,
                    end: newEvent.end,
                    color: newEvent.color,
                    calendarId: newEvent.calendarId,
                    useCalendarColor: newEvent.useCalendarColor,
                }]);
            }}
         />

            <EditEventDialog
                open={editDialogOpen}
                event={selectedEvent ? selectedEvent : {
                    id: "",
                    title: "",
                    start: new Date(),
                    end: new Date(),
                    color: "",
                    calendarId: "",
                    useCalendarColor: true,
                }}
                onClose={() => setEditDialogOpen(false)}
                onSave={(updatedEvent) => {
                    setEvents(events.map(ev => ev.id === updatedEvent._id ? {
                        id: updatedEvent._id,
                        title: updatedEvent.title,
                        start: updatedEvent.start,
                        end: updatedEvent.end,
                        color: updatedEvent.color,
                        calendarId: updatedEvent.calendarId,
                        useCalendarColor: updatedEvent.useCalendarColor,
                    } : ev));
                }}
                onDelete={(deletedEventId) => {
                    setEvents(events.filter(ev => ev.id !== deletedEventId));
                }}
            />


  </>
);
}
