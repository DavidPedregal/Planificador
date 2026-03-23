import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {useState} from "react";
import AddEventDialog from "./add-event-dialog";
import "./calendar.css";

export default function Calendar() {
    const [open, setOpen] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [events, setEvents] = useState([]);

    const addEvent = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
        setOpen(true);
    };

    const fetchEvents = () => {

    };

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
      />
    </div>
        <AddEventDialog
            open={open}
            start={startDate}
            end={endDate}
            onClose={() => setOpen(false)}
            onSave={() => {
                // Fetch new events
            }}
         />
  </>
);
}
