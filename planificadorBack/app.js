require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");

const cors = require("cors");

const connectDB = require("./config/db");
const usersRouter = require("./routes/users");
const calendarRouter = require("./routes/calendar");
const eventRouter = require("./routes/events");

connectDB().then();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(logger("dev"));
app.use(express.json());

app.use("/users", usersRouter);
app.use("/calendars", calendarRouter);
app.use("/events", eventRouter);

// 404
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;