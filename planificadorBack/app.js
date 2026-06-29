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
const planRouter = require("./routes/plan");
const settingsRouter = require("./routes/settings");
const statisticsRouter = require("./routes/statistics");
const { errorHandler } = require("./middlewares/errorHandler");

connectDB();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(logger("dev"));
app.use(express.json());

var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.DB_RATE_LIMIT) || 1000,
});

app.use(limiter);

app.use("/users", usersRouter);
app.use("/calendars", calendarRouter);
app.use("/events", eventRouter);
app.use("/tasks", taskRouter);
app.use("/subjects", subjectRouter);
app.use("/plan", planRouter);
app.use("/settings", settingsRouter);
app.use("/statistics", statisticsRouter);

// 404
app.use((req, res, next) => {
  next(createError(404));
});

app.use(errorHandler);

module.exports = app;