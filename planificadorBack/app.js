require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");

const cors = require("cors");

const connectDB = require("./config/db");
const usersRouter = require("./routes/users");
const calendarRouter = require("./routes/calendars");
const eventRouter = require("./routes/events");
const taskRouter = require("./routes/tasks");
const subjectRouter = require("./routes/subjects");

connectDB().then();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(logger("dev"));
app.use(express.json());

var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, 
});

app.use(limiter);

app.use("/users", usersRouter);
app.use("/calendars", calendarRouter);
app.use("/events", eventRouter);
app.use("/tasks", taskRouter);
app.use("/subjects", subjectRouter);

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