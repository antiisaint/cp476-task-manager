(function () {
  const SESSION_KEY = "tm_session";
  const session = (() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (error) {
      return null;
    }
  })();

  if (!session || !session.email) {
    window.location.href = "auth.html";
    return;
  }

  const TASKS_KEY = `tm_tasks_${session.email}`;
  const statuses = ["pending", "in-progress", "completed"];
  const priorities = ["low", "medium", "high"];
  const DESCRIPTION_MAX_LENGTH = 220;
  const DESCRIPTION_PREVIEW_LIMIT = 120;
  const mockTeam = Array.from(
    new Set([
      String(session.name || "You").trim() || "You",
      "Alex Morgan",
      "Jordan Lee",
      "Samira Patel"
    ])
  );

  const generateId = () =>
    `task_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const els = {
    welcomeText: document.getElementById("welcomeText"),
    logoutBtn: document.getElementById("logoutBtn"),
    taskForm: document.getElementById("taskForm"),
    formTitle: document.getElementById("formTitle"),
    saveTaskBtn: document.getElementById("saveTaskBtn"),
    cancelEditBtn: document.getElementById("cancelEditBtn"),
    taskTitle: document.getElementById("taskTitle"),
    taskDescription: document.getElementById("taskDescription"),
    taskDueDate: document.getElementById("taskDueDate"),
    taskPriority: document.getElementById("taskPriority"),
    taskStatus: document.getElementById("taskStatus"),
    taskAssignee: document.getElementById("taskAssignee"),
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    priorityFilter: document.getElementById("priorityFilter"),
    dueSort: document.getElementById("dueSort"),
    pendingColumn: document.getElementById("pendingColumn"),
    inProgressColumn: document.getElementById("inProgressColumn"),
    completedColumn: document.getElementById("completedColumn"),
    taskMessage: document.getElementById("taskMessage"),
    totalCount: document.getElementById("totalCount"),
    dueSoonCount: document.getElementById("dueSoonCount"),
    completedCount: document.getElementById("completedCount"),
    undoBar: document.getElementById("undoBar"),
    undoText: document.getElementById("undoText"),
    undoDeleteBtn: document.getElementById("undoDeleteBtn")
  };

  let tasks = [];
  let editingTaskId = null;
  let deletedTaskBuffer = null;
  let undoTimeoutId = null;

  const isValidDateInput = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const parseDate = (value) => {
    if (!isValidDateInput(value)) {
      return null;
    }

    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (value) => {
    const date = parseDate(value);
    if (!date) {
      return "No due date";
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const normalizeTask = (task) => {
    const rawAssignee = String(task.assignee || "").trim();
    const assignee = mockTeam.includes(rawAssignee) ? rawAssignee : mockTeam[0];

    return {
      id: String(task.id || generateId()),
      title: String(task.title || "").trim() || "Untitled task",
      description: String(task.description || "").trim(),
      dueDate: String(task.dueDate || ""),
      priority: priorities.includes(task.priority) ? task.priority : "medium",
      status: statuses.includes(task.status) ? task.status : "pending",
      assignee,
      createdAt: task.createdAt || new Date().toISOString()
    };
  };

  const readTasks = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
      const list = Array.isArray(raw) ? raw : [];
      return list.map(normalizeTask);
    } catch (error) {
      return [];
    }
  };

  const writeTasks = () => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  };

  const showMessage = (message, isSuccess) => {
    els.taskMessage.textContent = message;
    els.taskMessage.classList.toggle("success", Boolean(isSuccess));
  };

  const populateAssignees = (selectedName) => {
    els.taskAssignee.innerHTML = "";

    mockTeam.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      els.taskAssignee.appendChild(option);
    });

    els.taskAssignee.value = mockTeam.includes(selectedName) ? selectedName : mockTeam[0];
  };

  const isOverdue = (task) => {
    if (task.status === "completed") {
      return false;
    }

    const due = parseDate(task.dueDate);
    if (!due) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const dueSoonCount = (taskList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const soon = new Date(today);
    soon.setDate(today.getDate() + 3);

    return taskList.filter((task) => {
      if (task.status === "completed") {
        return false;
      }

      const due = parseDate(task.dueDate);
      return due && due >= today && due <= soon;
    }).length;
  };

  const renderStats = () => {
    els.totalCount.textContent = String(tasks.length);
    els.completedCount.textContent = String(
      tasks.filter((task) => task.status === "completed").length
    );
    els.dueSoonCount.textContent = String(dueSoonCount(tasks));
  };

  const truncateDescription = (text) => {
    const safeText = text || "No note added";
    if (safeText.length <= DESCRIPTION_PREVIEW_LIMIT) {
      return safeText;
    }
    return `${safeText.slice(0, DESCRIPTION_PREVIEW_LIMIT)}...`;
  };

  const showUndoBar = (taskTitle) => {
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }

    els.undoText.textContent = `\"${taskTitle}\" deleted.`;
    els.undoBar.classList.remove("hidden");

    undoTimeoutId = setTimeout(() => {
      deletedTaskBuffer = null;
      els.undoBar.classList.add("hidden");
      undoTimeoutId = null;
    }, 5000);
  };

  const clearUndoState = () => {
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      undoTimeoutId = null;
    }

    deletedTaskBuffer = null;
    els.undoBar.classList.add("hidden");
  };

  const createTaskCard = (task) => {
    const card = document.createElement("article");
    card.className = `task-card${isOverdue(task) ? " overdue" : ""}`;

    const title = document.createElement("h3");
    title.textContent = task.title;

    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = truncateDescription(task.description);
    description.title = task.description || "No note added";

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const dueMeta = document.createElement("span");
    dueMeta.textContent = `Due: ${formatDate(task.dueDate)}`;

    const assigneeMeta = document.createElement("span");
    assigneeMeta.textContent = `Assignee: ${task.assignee}`;

    const priority = document.createElement("span");
    priority.className = `priority-pill priority-${task.priority}`;
    priority.textContent = task.priority;

    meta.append(dueMeta, assigneeMeta, priority);

    const statusSelect = document.createElement("select");
    statusSelect.className = "status-select";

    statuses.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent =
        value === "pending"
          ? "Pending"
          : value === "in-progress"
            ? "In Progress"
            : "Completed";
      option.selected = task.status === value;
      statusSelect.appendChild(option);
    });

    statusSelect.addEventListener("change", () => {
      tasks = tasks.map((item) =>
        item.id === task.id ? { ...item, status: statusSelect.value } : item
      );
      writeTasks();
      renderAll();
      showMessage("Task status updated.", true);
    });

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "action-btn action-edit";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEdit(task.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "action-btn action-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    actions.append(editBtn, deleteBtn, statusSelect);
    card.append(title, description, meta, actions);

    return card;
  };

  const resetColumns = () => {
    els.pendingColumn.innerHTML = "";
    els.inProgressColumn.innerHTML = "";
    els.completedColumn.innerHTML = "";
  };

  const renderColumns = (taskList) => {
    resetColumns();

    const columnMap = {
      pending: els.pendingColumn,
      "in-progress": els.inProgressColumn,
      completed: els.completedColumn
    };

    statuses.forEach((status) => {
      const items = taskList.filter((task) => task.status === status);
      const column = columnMap[status];

      if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "task-meta";
        empty.textContent = "No tasks";
        column.appendChild(empty);
        return;
      }

      items.forEach((task) => {
        column.appendChild(createTaskCard(task));
      });
    });
  };

  const sortByDueDate = (taskList) => {
    const mode = els.dueSort.value;

    return [...taskList].sort((a, b) => {
      const dueA = parseDate(a.dueDate);
      const dueB = parseDate(b.dueDate);

      if (!dueA && !dueB) {
        return a.title.localeCompare(b.title);
      }
      if (!dueA) {
        return 1;
      }
      if (!dueB) {
        return -1;
      }

      return mode === "due-desc"
        ? dueB.getTime() - dueA.getTime()
        : dueA.getTime() - dueB.getTime();
    });
  };

  const getFilteredTasks = () => {
    const searchTerm = els.searchInput.value.trim().toLowerCase();
    const selectedStatus = els.statusFilter.value;
    const selectedPriority = els.priorityFilter.value;

    const filtered = tasks.filter((task) => {
      const title = task.title.toLowerCase();
      const description = task.description.toLowerCase();
      const assignee = task.assignee.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
        assignee.includes(searchTerm);

      const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;
      const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    return sortByDueDate(filtered);
  };

  const clearForm = () => {
    els.taskForm.reset();
    els.taskPriority.value = "medium";
    els.taskStatus.value = "pending";
    populateAssignees(mockTeam[0]);
  };

  const resetEditMode = () => {
    editingTaskId = null;
    els.formTitle.textContent = "Add New Task";
    els.saveTaskBtn.textContent = "Save Task";
    els.cancelEditBtn.classList.add("hidden");
    clearForm();
  };

  const startEdit = (taskId) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    editingTaskId = task.id;
    els.formTitle.textContent = "Edit Task";
    els.saveTaskBtn.textContent = "Update Task";
    els.cancelEditBtn.classList.remove("hidden");

    els.taskTitle.value = task.title;
    els.taskDescription.value = task.description;
    els.taskDueDate.value = task.dueDate;
    els.taskPriority.value = task.priority;
    els.taskStatus.value = task.status;
    populateAssignees(task.assignee);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteTask = (taskId) => {
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index < 0) {
      return;
    }

    const [removedTask] = tasks.splice(index, 1);
    deletedTaskBuffer = { task: removedTask, index };
    writeTasks();

    if (editingTaskId === taskId) {
      resetEditMode();
    }

    renderAll();
    showMessage("Task deleted. You can undo for 5 seconds.", true);
    showUndoBar(removedTask.title);
  };

  const undoDelete = () => {
    if (!deletedTaskBuffer) {
      return;
    }

    const { task, index } = deletedTaskBuffer;
    const insertIndex = Math.min(Math.max(index, 0), tasks.length);
    tasks.splice(insertIndex, 0, task);
    writeTasks();
    clearUndoState();
    renderAll();
    showMessage("Task restored.", true);
  };

  const renderAll = () => {
    const visibleTasks = getFilteredTasks();
    renderColumns(visibleTasks);
    renderStats();
  };

  els.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = els.taskTitle.value.trim();
    const description = els.taskDescription.value.trim();
    const dueDate = els.taskDueDate.value;
    const priority = els.taskPriority.value;
    const status = els.taskStatus.value;
    const assignee = els.taskAssignee.value;

    if (!title || !description) {
      showMessage("Task title and note are required.", false);
      return;
    }

    if (description.length > DESCRIPTION_MAX_LENGTH) {
      showMessage(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`, false);
      return;
    }

    if (!isValidDateInput(dueDate)) {
      showMessage("Please enter a valid due date.", false);
      return;
    }

    if (!priorities.includes(priority)) {
      showMessage("Please choose a valid priority.", false);
      return;
    }

    if (!statuses.includes(status)) {
      showMessage("Please choose a valid status.", false);
      return;
    }

    if (!mockTeam.includes(assignee)) {
      showMessage("Please choose a valid assignee.", false);
      return;
    }

    clearUndoState();

    if (editingTaskId) {
      tasks = tasks.map((task) =>
        task.id === editingTaskId
          ? { ...task, title, description, dueDate, priority, status, assignee }
          : task
      );

      writeTasks();
      resetEditMode();
      renderAll();
      showMessage("Task updated.", true);
      return;
    }

    tasks.push({
      id: generateId(),
      title,
      description,
      dueDate,
      priority,
      status,
      assignee,
      createdAt: new Date().toISOString()
    });

    writeTasks();
    clearForm();
    renderAll();
    showMessage("Task added.", true);
  });

  els.cancelEditBtn.addEventListener("click", resetEditMode);
  els.searchInput.addEventListener("input", renderAll);
  els.statusFilter.addEventListener("change", renderAll);
  els.priorityFilter.addEventListener("change", renderAll);
  els.dueSort.addEventListener("change", renderAll);
  els.undoDeleteBtn.addEventListener("click", undoDelete);

  els.logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "auth.html";
  });

  els.welcomeText.textContent = session.name || session.email;

  populateAssignees(mockTeam[0]);
  tasks = readTasks();
  writeTasks();
  renderAll();
})();
