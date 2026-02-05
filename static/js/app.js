const TASKS_KEY = "todoTasks";
const HISTORY_KEY = "todoProgress";

const modal = document.getElementById("taskModal");
const openModalButton = document.getElementById("openModal");
const closeModalButton = document.getElementById("closeModal");
const cancelModalButton = document.getElementById("cancelModal");
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const streakValue = document.getElementById("streakValue");
const clearDoneButton = document.getElementById("clearDone");

let chart;

const statusLabels = {
  Pending: "Pending",
  "In Progress": "In Progress",
  Done: "Done",
};

const getToday = () => new Date().toISOString().split("T")[0];

const loadTasks = () => {
  const raw = localStorage.getItem(TASKS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveTasks = (tasks) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

const loadHistory = () => {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : {};
};

const saveHistory = (history) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

const updateHistoryForToday = (tasks) => {
  const history = loadHistory();
  const today = getToday();
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "Done").length;
  history[today] = {
    date: today,
    completed,
    total,
  };
  saveHistory(history);
};

const calculateStreak = () => {
  const history = loadHistory();
  const dates = Object.keys(history).sort();
  if (dates.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = getToday();
  let current = today;

  while (history[current]) {
    const entry = history[current];
    const percent = entry.total === 0 ? 0 : entry.completed / entry.total;
    if (percent < 1) {
      break;
    }
    streak += 1;
    const prev = new Date(current);
    prev.setDate(prev.getDate() - 1);
    current = prev.toISOString().split("T")[0];
  }

  return streak;
};

const formatDueDate = (value) => {
  if (!value) {
    return "No due date";
  }
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const renderTasks = () => {
  const tasks = loadTasks();
  if (tasks.length === 0) {
    taskList.innerHTML = "<div class=\"empty\">No tasks yet. Add your first one.</div>";
    return;
  }

  taskList.innerHTML = tasks
    .map((task) => {
      return `
      <div class="task" data-id="${task.id}">
        <div class="task-title">
          <div>
            <h3>${task.title}</h3>
            <p>${task.description || ""}</p>
          </div>
          <span class="badge">${statusLabels[task.status]}</span>
        </div>
        <div class="task-meta">
          <span>Due ${formatDueDate(task.dueDate)}</span>
          <div class="task-actions">
            <button class="icon-btn" data-action="toggle">${
              task.status === "Done" ? "Undo" : "Done"
            }</button>
            <button class="icon-btn" data-action="edit">Edit</button>
            <button class="icon-btn" data-action="delete">Delete</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
};

const renderStreak = () => {
  const count = calculateStreak();
  streakValue.textContent = `${count} day${count === 1 ? "" : "s"}`;
};

const renderChart = () => {
  const history = loadHistory();
  const dates = Object.keys(history).sort().slice(-14);
  const data = dates.map((date) => {
    const entry = history[date];
    if (!entry || entry.total === 0) {
      return 0;
    }
    return Math.round((entry.completed / entry.total) * 100);
  });

  const ctx = document.getElementById("progressChart").getContext("2d");
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Completion",
          data,
          borderColor: "#2a9d8f",
          backgroundColor: "rgba(42, 157, 143, 0.2)",
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y}% complete`,
          },
        },
        legend: {
          display: false,
        },
      },
    },
  });
};

const openModal = (task) => {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  taskForm.reset();
  taskForm.taskId.value = task ? task.id : "";
  taskForm.title.value = task ? task.title : "";
  taskForm.description.value = task ? task.description : "";
  taskForm.status.value = task ? task.status : "Pending";
  taskForm.dueDate.value = task && task.dueDate ? task.dueDate : "";
  document.getElementById("modalTitle").textContent = task
    ? "Edit task"
    : "New task";
};

const closeModal = () => {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
};

const handleFormSubmit = (event) => {
  event.preventDefault();
  const tasks = loadTasks();
  const taskId = taskForm.taskId.value;
  const payload = {
    id: taskId || crypto.randomUUID(),
    title: taskForm.title.value.trim(),
    description: taskForm.description.value.trim(),
    status: taskForm.status.value,
    dueDate: taskForm.dueDate.value,
  };

  if (!payload.title) {
    return;
  }

  const updated = taskId
    ? tasks.map((task) => (task.id === taskId ? payload : task))
    : [...tasks, payload];

  saveTasks(updated);
  updateHistoryForToday(updated);
  renderTasks();
  renderStreak();
  renderChart();
  closeModal();
};

const handleTaskClick = (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const card = button.closest(".task");
  if (!card) {
    return;
  }

  const taskId = card.dataset.id;
  const tasks = loadTasks();
  const current = tasks.find((task) => task.id === taskId);
  if (!current) {
    return;
  }

  if (action === "edit") {
    openModal(current);
    return;
  }

  if (action === "delete") {
    const filtered = tasks.filter((task) => task.id !== taskId);
    saveTasks(filtered);
    updateHistoryForToday(filtered);
    renderTasks();
    renderStreak();
    renderChart();
    return;
  }

  if (action === "toggle") {
    const updated = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: task.status === "Done" ? "In Progress" : "Done",
          }
        : task
    );
    saveTasks(updated);
    updateHistoryForToday(updated);
    renderTasks();
    renderStreak();
    renderChart();
  }
};

const clearDone = () => {
  const tasks = loadTasks();
  const filtered = tasks.filter((task) => task.status !== "Done");
  saveTasks(filtered);
  updateHistoryForToday(filtered);
  renderTasks();
  renderStreak();
  renderChart();
};

const scheduleMidnightCheck = () => {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  const delay = nextMidnight.getTime() - now.getTime();

  setTimeout(() => {
    const tasks = loadTasks();
    updateHistoryForToday(tasks);
    renderStreak();
    renderChart();
    scheduleMidnightCheck();
  }, delay);
};

openModalButton.addEventListener("click", () => openModal());
closeModalButton.addEventListener("click", closeModal);
cancelModalButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

clearDoneButton.addEventListener("click", clearDone);
taskForm.addEventListener("submit", handleFormSubmit);
taskList.addEventListener("click", handleTaskClick);

const init = () => {
  const tasks = loadTasks();
  updateHistoryForToday(tasks);
  renderTasks();
  renderStreak();
  renderChart();
  scheduleMidnightCheck();
};

window.addEventListener("load", init);
