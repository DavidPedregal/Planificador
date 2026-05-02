import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from '@fullcalendar/list';
import {useEffect, useState} from "react";
import AddEventDialog from "../Event/add-event-dialog";
import "./calendar.css";
import { config } from "@/app/config/config";
import EditEventDialog from "../Event/edit-event-dialog";
import { Calendar as CalendarInterface, CalendarEvent, FREQUENCY_TYPE, mapToFullCalendarEvent } from "./calendarHelper";

interface CalendarProps {
    refreshTrigger?: number;
}

const EMPTY_EVENT: CalendarEvent = {
    id: "",
    title: "",
    start: new Date(),
    end: new Date(),
    color: "",
    calendarId: "",
    useCalendarColor: true,
    label: "",
};

export default function Calendar({ refreshTrigger = 0 }: CalendarProps) {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [allEvents, setAllEvents] = useState<any[]>([]); // Store all events for recurrence handling
    const [events, setEvents] = useState<any[]>([]);
    const [calendars, setCalendars] = useState<CalendarInterface[]>([]);
    const [customCalendars, setCustomCalendars] = useState<CalendarInterface[]>([]);

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

    const filterEventsByVisibility = (allEventsList: any[], calendarsList: CalendarInterface[]) => {
        return allEventsList.filter(event => {
            const calendar = calendarsList.find(cal => cal.id === event.calendarId);
            return calendar?.visible ?? true; // Show event if calendar is visible (or if calendar not found, default to true)
        });
    };

    const fetchEvents = async (calendarsList: CalendarInterface[]) => {
        try {
            const res = await fetch(config.backendUrl + "/events", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            
            const mappedEvents = data.map((event: any) => {
                const color = setEventColor(event.useCalendarColor, event.color, event.calendarId, calendarsList.concat(customCalendars));
                return mapToFullCalendarEvent(event, color);
            });
            
            setAllEvents(mappedEvents);
            // Filter events based on calendar visibility
            const visibleEvents = filterEventsByVisibility(mappedEvents, calendarsList);
            setEvents(visibleEvents);
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

            const commonRes = await fetch(config.backendUrl + "/calendars/common", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const commonData = await commonRes.json();
            
            const mappedCommonCalendars = commonData.map((cal: any) => ({
                id: cal._id, // Use _id from backend as id
                name: cal.name,
                color: cal.color,
                visible: cal.visible,
            }));
            setCustomCalendars(mappedCommonCalendars);
            return mappedCalendars.concat(mappedCommonCalendars);
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

    // Update visible events when calendar visibility changes
    useEffect(() => {
        const visibleEvents = filterEventsByVisibility(allEvents, calendars);
        setEvents(visibleEvents);
    }, [calendars]);

    return (
    <>
    <div className="calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="timeGridWeek"
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        headerToolbar={{
          left: "prev next today",
          center: "title",
          right: "dayGridMonth timeGridWeek timeGridDay listWeek",
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
            onSave={() => {
                fetchEvents(calendars);
            }}
        />

        <EditEventDialog
            open={editDialogOpen}
            event={selectedEvent || EMPTY_EVENT}
            onClose={() => setEditDialogOpen(false)}
            onSave={() => {
                fetchEvents(calendars);
            }}
            onDelete={() => {
                fetchEvents(calendars);
            }}
        />


  </>
);
}
