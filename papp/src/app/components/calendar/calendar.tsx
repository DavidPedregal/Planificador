import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from '@fullcalendar/rrule';
import {useEffect, useState} from "react";
import AddEventDialog from "./add-event-dialog";
import "./calendar.css";
import { config } from "@/app/config/config";
import EditEventDialog from "./edit-event-dialog";
import { Calendar as CalendarInterface, CalendarEvent, FREQUENCY_TYPE, mapToFullCalendarEvent } from "./calendarHelper";

interface CalendarProps {
    refreshTrigger?: number;
}


export default function Calendar({ refreshTrigger = 0 }: CalendarProps) {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [calendars, setCalendars] = useState<CalendarInterface[]>([]);

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
            label: info.event.extendedProps.label || "",
            recurrenceRule: {
                frequencyType: info.event.extendedProps.recurrenceRule?.frequencyType || FREQUENCY_TYPE.NONE,
                frequencyInterval: info.event.extendedProps.recurrenceRule?.frequencyInterval || 1,
                frequencyDaysOfWeek: info.event.extendedProps.recurrenceRule?.frequencyDaysOfWeek || [],
                frequencyEndType: info.event.extendedProps.recurrenceRule?.frequencyEndType || "never",
                frequencyEndDate: info.event.extendedProps.recurrenceRule?.frequencyEndDate || "",
                frequencyOccurrencesLeft: info.event.extendedProps.recurrenceRule?.frequencyOccurrencesLeft || 1,
            }
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

    const fetchEvents = async (calendarsList: CalendarInterface[]) => {
        try {
            const res = await fetch(config.backendUrl + "/events", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            
            setEvents(data.map((event: any) => {
                const color = setEventColor(event.useCalendarColor, event.color, event.calendarId, calendarsList);
                return mapToFullCalendarEvent(event, color);
            }));
        } catch (error) {
            console.error("Error fetching events:", error);
        }   
    };

    const setEventColor = (useCalendarColor: boolean, eventColor: string, calendarId: string, calendarsList?: CalendarInterface[]) => {
        const calendarsToUse = calendarsList || calendars;
        if (useCalendarColor) {
            return calendarsToUse.find(cal => cal.id === calendarId)?.color || "#7c6ff7"; // Default to indigo if calendar not found
        } else {
            return eventColor || "#7c6ff7"; // Default to indigo if event color not set
        }
    }

    const fetchCalendars = async () => {
        try {
            const res = await fetch(config.backendUrl + "/calendars", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            
            const mappedCalendars = data.map((cal: any) => ({
                id: cal._id, // Use _id from backend as id
                name: cal.name,
                color: cal.color,
                visible: cal.visible,
            }));
            setCalendars(mappedCalendars);
            return mappedCalendars;
        } catch (error) {
            console.error("Error fetching calendars:", error);
            return [];
        }   
    };

    useEffect(() => {
        const loadData = async () => {
            const calendarsList = await fetchCalendars();
            await fetchEvents(calendarsList);
        };
        loadData();
    }, [refreshTrigger]);

    return (
    <>
    <div className="calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
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
                setEvents([...events, mapToFullCalendarEvent(newEvent, setEventColor(newEvent.useCalendarColor, newEvent.color, newEvent.calendarId))]);
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
                    recurrenceRule: {
                        frequencyType: "none",
                        frequencyInterval: 1,
                        frequencyDaysOfWeek: [],
                        frequencyEndType: "never",
                        frequencyEndDate: "",
                        frequencyOccurrencesLeft: 1,
                    },
                }}
                onClose={() => setEditDialogOpen(false)}
                onSave={(updatedEvent) => {
                    const updatedFullCalendarEvent = mapToFullCalendarEvent(updatedEvent, setEventColor(updatedEvent.useCalendarColor, updatedEvent.color, updatedEvent.calendarId));
                    setEvents(events.map(ev => ev.id === updatedEvent._id ? updatedFullCalendarEvent : ev));
                }}
                onDelete={(deletedEventId) => {
                    setEvents(events.filter(ev => ev.id !== deletedEventId));
                }}
            />


  </>
);
}
