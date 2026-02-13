import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {DateInput} from "@fullcalendar/core";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {useState} from "react";

export default function Calendar() {
    const [open, setOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState<{
        start: DateInput;
        end: DateInput;
    } | null>(null);
    const [eventTitle, setEventTitle] = useState("");

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
            title: "Test1",
            startTime: "2026-02-08T10:00:00",
            endTime: "2026-02-08T13:00:00"
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


    const addEvent = (start: DateInput, end: DateInput) => {
        setSelectedRange({ start, end });
        setOpen(true);
    };

    const saveEvent = () => {
        setOpen(false);
    };


    return (
        <>
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
            // eventDidMount={(info) => {
            //     if (info.event.extendedProps.priority === "high") {
            //         info.el.style.backgroundColor = "red";
            //     }
            // }}
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
                addEvent(info.start, info.end);
                info.view.calendar.addEvent({
                    title: eventTitle,
                    start: info.start,
                    end: info.end
                });
            }}

            editable={true}
            eventResizableFromStart={true}
        />

        <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogTitle>Crear Evento</DialogTitle>

            <DialogContent>
                <p>
                    {selectedRange?.start.toLocaleString()} -{" "}
                    {selectedRange?.end.toLocaleString()}
                </p>

                <TextField
                    autoFocus
                    margin="dense"
                    label="Título"
                    fullWidth
                    variant="outlined"
                    onChange={(e) => setEventTitle(e.target.value)}
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={() => setOpen(false)}>
                    Cancelar
                </Button>
                <Button variant="contained"
                    onClick={() => saveEvent()}>
                    Guardar
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
}
