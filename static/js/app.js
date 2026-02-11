const TASKS_KEY = "todoTasks";
const HISTORY_KEY = "todoProgress";
const THEME_KEY = "todoTheme";

const modal = document.getElementById("taskModal");
const themeToggle = document.getElementById("themeToggle");
const openModalButton = document.getElementById("openModal");
const closeModalButton = document.getElementById("closeModal");
const cancelModalButton = document.getElementById("cancelModal");
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const streakValue = document.getElementById("streakValue");
const clearDoneButton = document.getElementById("clearDone");

let chart;

const getCssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const hexToRgba = (hex, alpha) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    const label = themeToggle.querySelector("[data-theme-label]");
    if (label) {
      label.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    }
  }
};

const initTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
  const initial = stored || (systemPrefersDark ? "dark" : "light");
  applyTheme(initial);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      if (document.getElementById("progressChart")) {
        renderChart();
      }
    });
  }
};

initTheme();

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

  const accent = getCssVar("--accent-2") || "#2a9d8f";
  const fill = hexToRgba(accent, 0.2);

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Completion",
          data,
          borderColor: accent,
          backgroundColor: fill,
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

const init = () => {
  const tasks = loadTasks();
  updateHistoryForToday(tasks);
  renderTasks();
  renderStreak();
  renderChart();
  scheduleMidnightCheck();
};

// Board View Functions
const renderBoardTask = (task) => {
  return `
    <div class="task board-task" data-id="${task.id}">
      <div class="task-title">
        <div>
          <h3>${task.title}</h3>
          ${task.description ? `<p class="text-sm text-[var(--muted)] mt-1">${task.description}</p>` : ''}
        </div>
      </div>
      <div class="task-meta">
        <span class="text-xs">Due ${formatDueDate(task.dueDate)}</span>
      </div>
      <div class="flex gap-2 mt-3">
        <select class="status-select flex-1 border border-[#ece3d8] rounded-lg px-2 py-1 text-sm font-inherit cursor-pointer" data-task-id="${task.id}">
          <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Done" ${task.status === 'Done' ? 'selected' : ''}>Done</option>
        </select>
        <button class="icon-btn" data-action="edit" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="icon-btn" data-action="delete" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
};

const renderBoard = () => {
  const tasks = loadTasks();
  const pending = tasks.filter(t => t.status === 'Pending');
  const inProgress = tasks.filter(t => t.status === 'In Progress');
  const done = tasks.filter(t => t.status === 'Done');

  const pendingColumn = document.getElementById('pendingColumn');
  const inProgressColumn = document.getElementById('inProgressColumn');
  const doneColumn = document.getElementById('doneColumn');

  if (!pendingColumn || !inProgressColumn || !doneColumn) {
    console.error('Board columns not found');
    return;
  }

  // Update counts
  const pendingCount = document.getElementById('pendingCount');
  const inProgressCount = document.getElementById('inProgressCount');
  const doneCount = document.getElementById('doneCount');
  
  if (pendingCount) pendingCount.textContent = pending.length;
  if (inProgressCount) inProgressCount.textContent = inProgress.length;
  if (doneCount) doneCount.textContent = done.length;

  // Render pending tasks
  if (pending.length === 0) {
    pendingColumn.innerHTML = '<div class="empty text-sm">No pending tasks</div>';
  } else {
    pendingColumn.innerHTML = pending.map(renderBoardTask).join('');
  }

  // Render in progress tasks
  if (inProgress.length === 0) {
    inProgressColumn.innerHTML = '<div class="empty text-sm">No tasks in progress</div>';
  } else {
    inProgressColumn.innerHTML = inProgress.map(renderBoardTask).join('');
  }

  // Render done tasks
  if (done.length === 0) {
    doneColumn.innerHTML = '<div class="empty text-sm">No completed tasks</div>';
  } else {
    doneColumn.innerHTML = done.map(renderBoardTask).join('');
  }
};

const handleStatusChange = (event) => {
  const select = event.target.closest('.status-select');
  if (!select) return;

  const taskId = select.dataset.taskId;
  const newStatus = select.value;
  const tasks = loadTasks();

  const updated = tasks.map(task => 
    task.id === taskId ? { ...task, status: newStatus } : task
  );

  saveTasks(updated);
  updateHistoryForToday(updated);
  renderBoard();
};

const handleBoardTaskClick = (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  const card = button.closest('.board-task');
  if (!card) return;

  const taskId = card.dataset.id;
  const tasks = loadTasks();
  const current = tasks.find(task => task.id === taskId);
  if (!current) return;

  if (action === 'edit') {
    openModal(current);
    return;
  }

  if (action === 'delete') {
    const filtered = tasks.filter(task => task.id !== taskId);
    saveTasks(filtered);
    updateHistoryForToday(filtered);
    renderBoard();
  }
};

const clearDoneBoard = () => {
  const tasks = loadTasks();
  const filtered = tasks.filter(task => task.status !== 'Done');
  saveTasks(filtered);
  updateHistoryForToday(filtered);
  renderBoard();
};

const initBoard = () => {
  const tasks = loadTasks();
  updateHistoryForToday(tasks);
  renderBoard();
  scheduleMidnightCheck();

  // Event listeners for board
  const clearDoneBoardBtn = document.getElementById('clearDoneBoard');
  if (clearDoneBoardBtn) {
    clearDoneBoardBtn.addEventListener('click', clearDoneBoard);
  }

  const pendingCol = document.getElementById('pendingColumn');
  const inProgressCol = document.getElementById('inProgressColumn');
  const doneCol = document.getElementById('doneColumn');

  if (pendingCol) {
    pendingCol.addEventListener('change', handleStatusChange);
    pendingCol.addEventListener('click', handleBoardTaskClick);
  }
  
  if (inProgressCol) {
    inProgressCol.addEventListener('change', handleStatusChange);
    inProgressCol.addEventListener('click', handleBoardTaskClick);
  }
  
  if (doneCol) {
    doneCol.addEventListener('change', handleStatusChange);
    doneCol.addEventListener('click', handleBoardTaskClick);
  }
};

// Universal form submit handler that works for both views
const handleUniversalFormSubmit = (event) => {
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

  if (!payload.title) return;

  const updated = taskId
    ? tasks.map((task) => (task.id === taskId ? payload : task))
    : [...tasks, payload];

  saveTasks(updated);
  updateHistoryForToday(updated);
  
  // Refresh the appropriate view
  if (document.getElementById('taskList')) {
    renderTasks();
    renderStreak();
    renderChart();
  } else if (document.getElementById('pendingColumn')) {
    renderBoard();
  }
  
  closeModal();
};

// Check if we're on the daily view or board view
if (document.getElementById('taskList')) {
  // Daily view initialization
  window.addEventListener("load", () => {
    init();
    
    // Set up daily view specific event listeners
    if (openModalButton) openModalButton.addEventListener("click", () => openModal());
    if (closeModalButton) closeModalButton.addEventListener("click", closeModal);
    if (cancelModalButton) cancelModalButton.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
      });
    }
    if (clearDoneButton) clearDoneButton.addEventListener("click", clearDone);
    if (taskForm) taskForm.addEventListener("submit", handleUniversalFormSubmit);
    if (taskList) taskList.addEventListener("click", handleTaskClick);
  });
} else if (document.getElementById('pendingColumn')) {
  // Board view initialization
  window.addEventListener("load", () => {
    initBoard();
    
    // Set up board view event listeners
    if (openModalButton) openModalButton.addEventListener("click", () => openModal());
    if (closeModalButton) closeModalButton.addEventListener("click", closeModal);
    if (cancelModalButton) cancelModalButton.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
      });
    }
    if (taskForm) taskForm.addEventListener("submit", handleUniversalFormSubmit);
  });
}
