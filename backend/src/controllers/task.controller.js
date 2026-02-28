const getAllTasks = (req, res) => {
  res.status(200).json({
    message: "getAllTasks() stub - return all tasks",
    data: []
  });
};

const getTaskById = (req, res) => {
  res.status(200).json({
    message: `getTaskById() stub - return task ${req.params.id}`,
    data: null
  });
};

const createTask = (req, res) => {
  res.status(201).json({
    message: "createTask() stub - create task",
    received: req.body
  });
};

const updateTask = (req, res) => {
  res.status(200).json({
    message: `updateTask() stub - update task ${req.params.id}`,
    received: req.body
  });
};

const deleteTask = (req, res) => {
  res.status(200).json({
    message: `deleteTask() stub - delete task ${req.params.id}`
  });
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
