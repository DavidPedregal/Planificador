import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function Calendar() {
    const events = [
        {
            title: "Evento 1",
            start: "2026-02-05"
        },
        {
            title: "Reunión",
            start: "2026-02-07T10:00:00",
            backgroundColor: "rgba(206,33,33,0.81)"
        },
        {
            title: "Programación",
            daysOfWeek: [1, 3], // lunes y miércoles
            startTime: "09:00",
            endTime: "11:00",
            startRecur: "2026-02-01",
            endRecur: "2026-06-30"
        }
    ];

    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            events={events}
            eventDidMount={(info) => {
                if (info.event.extendedProps.priority === "high") {
                    info.el.style.backgroundColor = "red";
                }
            }}
            dateClick={(info) => {
                const calendarApi = info.view.calendar;

                calendarApi.addEvent({
                    title: "Nueva reunión",
                    start: info.date,
                    end: new Date(info.date.getTime() + 60 * 60 * 1000) // 1h
                });
            }}

            selectable={true}
            select={(info) => {
                // info.start / info.end ya vienen calculados
                info.view.calendar.addEvent({
                    title: "Evento nuevo",
                    start: info.start,
                    end: info.end
                });
            }}

            editable={true}
            eventResizableFromStart={true}
        />

    );
}