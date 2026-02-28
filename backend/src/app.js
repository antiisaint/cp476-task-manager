const express = require("express");
const apiRoutes = require("./routes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Task Manager API",
    status: "ok"
  });
});

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

module.exports = app;
