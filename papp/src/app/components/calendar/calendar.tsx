import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {DateInput} from "@fullcalendar/core";
import {useState} from "react";
import AddEventDialog, {RecurrenceRule, UserCalendar} from "./add-event-dialog";
import "./calendar.css";

export default function Calendar() {
    const [open, setOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState<{
        start: Date;
        end: Date;
    } | null>(null);

    const myCalendars: UserCalendar[] = [
        { id: "1", name: "Personal" },
        { id: "2", name: "Trabajo" },
        { id: "3", name: "Familia" },
    ];

    const addEvent = (start: Date, end: Date) => {
        setSelectedRange({ start, end });
        setOpen(true);
    };

    function saveEvent(eventTitle: string, calendarId: string, color: string, start: Date, end: Date, recurrence: RecurrenceRule) {

    }

    return (
    <>
    <div className="calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        // events={events}
        dateClick={(info) => {
            addEvent(info.date, new Date(info.date.getTime() + 60 * 60 * 1000));
        }}
        selectable={true}
        select={(info) => {
          addEvent(info.start, info.end);
        }}
        editable={true}
        eventResizableFromStart={true}
      />
    </div>
        <AddEventDialog
            open={open}
            start={selectedRange?.start ?? null}
            end={selectedRange?.end ?? null}
            calendars={myCalendars}
            onClose={() => setOpen(false)}
            onSave={(data) => {
                saveEvent( data.eventTitle, data.calendarId, data.color, data.start, data.end, data.recurrence)
            }}
         />
  </>
);
}
