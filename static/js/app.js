const TASKS_KEY = "todoTasks";
const HISTORY_KEY = "todoProgress";
const THEME_KEY = "todoTheme";
const FILTERS_KEY = "todoFilters";
const SEARCH_KEY = "todoSearchQuery";

const modal = document.getElementById("taskModal");
const themeToggle = document.getElementById("themeToggle");
const openModalButton = document.getElementById("openModal");
const closeModalButton = document.getElementById("closeModal");
const cancelModalButton = document.getElementById("cancelModal");
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const streakValue = document.getElementById("streakValue");
const clearDoneButton = document.getElementById("clearDone");
const categorySelect = document.getElementById("categorySelect");
const categoryPills = document.getElementById("categoryPills");
const categoriesInput = document.getElementById("categoriesInput");
const subtaskList = document.getElementById("subtaskList");
const subtaskInput = document.getElementById("subtaskInput");
const addSubtaskButton = document.getElementById("addSubtask");
const isRecurringCheckbox = document.getElementById("isRecurringCheckbox");
const recurrenceOptions = document.getElementById("recurrenceOptions");
const recurrencePattern = document.getElementById("recurrencePattern");
const recurrencePreview = document.getElementById("recurrencePreview");

const getSubtaskElements = () => ({
  list: document.getElementById("subtaskList"),
  input: document.getElementById("subtaskInput"),
});

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

const CATEGORY_OPTIONS = ["Studying", "Work", "Finances", "Workout", "Other"];

const CATEGORY_STYLES = {
  Studying: { bg: "#c7d2fe", text: "#1c1f33" },
  Work: { bg: "#b7ddff", text: "#16263a" },
  Finances: { bg: "#ffe4a3", text: "#3d2f00" },
  Workout: { bg: "#c9f2c7", text: "#1b3a1b" },
  Other: { bg: "#e9d5ff", text: "#2a163f" },
};

// Filter state management
const getActiveFilters = () => {
  const raw = localStorage.getItem(FILTERS_KEY);
  return raw ? JSON.parse(raw) : { dateRange: { from: '', to: '' }, categories: [], statuses: [], urgencies: [] };
};

const getActiveSearchQuery = () => {
  return localStorage.getItem(SEARCH_KEY) || '';
};

const setSearchQuery = (query) => {
  if (query && query.trim()) {
    localStorage.setItem(SEARCH_KEY, query.trim());
  } else {
    localStorage.removeItem(SEARCH_KEY);
  }
};

// Full-text search across task title, description, and subtasks
const searchTasks = (tasks, query) => {
  if (!query || !query.trim()) {
    return tasks;
  }

  const lowerQuery = query.toLowerCase().trim();
  return tasks.filter(task => {
    // Search in title
    if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in description
    if (task.description && task.description.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in subtasks
    if (task.subtasks && Array.isArray(task.subtasks)) {
      const hasMatchingSubtask = task.subtasks.some(subtask =>
        subtask.text && subtask.text.toLowerCase().includes(lowerQuery)
      );
      if (hasMatchingSubtask) {
        return true;
      }
    }

    return false;
  });
};

const setFilters = (filterObj) => {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filterObj));
  // Update both views if they exist
  if (document.getElementById('taskList')) {
    renderTasks();
  }
  if (document.getElementById('pendingColumn')) {
    renderBoard();
  }
};

const clearFilters = () => {
  localStorage.removeItem(FILTERS_KEY);
  // Clear form inputs
  const dateFromInput = document.getElementById('filterDateFrom');
  const dateToInput = document.getElementById('filterDateTo');
  const categoryCheckboxes = document.querySelectorAll('[name="filterCategory"]');
  const statusCheckboxes = document.querySelectorAll('[name="filterStatus"]');
  const urgencyCheckboxes = document.querySelectorAll('[name="filterUrgency"]');
  
  if (dateFromInput) dateFromInput.value = '';
  if (dateToInput) dateToInput.value = '';
  categoryCheckboxes.forEach(cb => cb.checked = false);
  statusCheckboxes.forEach(cb => cb.checked = false);
  urgencyCheckboxes.forEach(cb => cb.checked = false);
  
  // Re-render both views
  if (document.getElementById('taskList')) {
    renderTasks();
  }
  if (document.getElementById('pendingColumn')) {
    renderBoard();
  }
};

// Calculate urgency level based on due date
const getTaskUrgency = (dueDate) => {
  if (!dueDate) return null;
  
  const today = new Date(getToday());
  const due = new Date(dueDate);
  
  // Normalize dates to compare only date part
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays <= 7) return 'This Week';
  return 'Later';
};

// Filter tasks based on active filters and search query
const getFilteredTasks = (tasks, filters, searchQuery) => {
  // Convert searchQuery to empty string if undefined
  const query = searchQuery || getActiveSearchQuery();
  
  // First apply categorical filters
  let filtered = tasks;
  if (filters && (filters.dateRange?.from || filters.dateRange?.to || 
      (filters.categories && filters.categories.length > 0) ||
      (filters.statuses && filters.statuses.length > 0) ||
      (filters.urgencies && filters.urgencies.length > 0))) {
    filtered = tasks.filter(task => {
      // Date range filter
      if (filters.dateRange?.from || filters.dateRange?.to) {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
        if (filters.dateRange.from && taskDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && taskDate > filters.dateRange.to) return false;
      }

      // Category filter (OR logic - task needs at least one selected category)
      if (filters.categories && filters.categories.length > 0) {
        const hasCategory = filters.categories.some(cat => 
          task.categories && task.categories.includes(cat)
        );
        if (!hasCategory) return false;
      }

      // Status filter (OR logic - task needs at least one selected status)
      if (filters.statuses && filters.statuses.length > 0) {
        if (!filters.statuses.includes(task.status)) return false;
      }

      // Urgency filter (OR logic - task needs at least one selected urgency)
      if (filters.urgencies && filters.urgencies.length > 0) {
        const taskUrgency = getTaskUrgency(task.dueDate);
        if (!filters.urgencies.includes(taskUrgency)) return false;
      }

      return true;
    });
  }

  // Then apply text search (AND logic - must match both filters and search)
  return searchTasks(filtered, query);
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

const normalizeCategories = (categories) => {
  if (!Array.isArray(categories)) {
    return [];
  }
  const filtered = categories.filter((entry) => CATEGORY_OPTIONS.includes(entry));
  return [...new Set(filtered)];
};

const normalizeSubtasks = (subtasks) => {
  if (!Array.isArray(subtasks)) {
    return [];
  }
  return subtasks
    .map((item) => ({
      id: item.id || crypto.randomUUID(),
      text: (item.text || "").trim(),
      done: Boolean(item.done),
    }))
    .filter((item) => item.text);
};

// Recurrence helper functions
const calculateNextOccurrence = (currentDate, pattern) => {
  const date = new Date(currentDate);
  switch (pattern) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null;
  }
  return date.toISOString().split("T")[0];
};

const getRecurrenceDisplay = (pattern) => {
  switch (pattern) {
    case "daily":
      return "Repeats daily";
    case "weekly":
      return "Repeats weekly";
    case "monthly":
      return "Repeats monthly";
    default:
      return "No recurring pattern selected";
  }
};

const shouldCreateNextOccurrence = (task, endDate) => {
  if (!endDate) return true;
  const nextOccurrence = calculateNextOccurrence(task.dueDate, task.recurrencePattern);
  return nextOccurrence && nextOccurrence <= endDate;
};

const createRecurringTaskInstance = (parentTask) => {
  const nextDueDate = calculateNextOccurrence(parentTask.dueDate, parentTask.recurrencePattern);
  if (!nextDueDate) return null;

  if (parentTask.recurrenceEndDate && nextDueDate > parentTask.recurrenceEndDate) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    title: parentTask.title,
    description: parentTask.description,
    status: "Pending",
    dueDate: nextDueDate,
    categories: [...parentTask.categories],
    subtasks: parentTask.subtasks.map(st => ({
      id: crypto.randomUUID(),
      text: st.text,
      done: false,
    })),
    isRecurring: true,
    recurrencePattern: parentTask.recurrencePattern,
    recurrenceEndDate: parentTask.recurrenceEndDate,
    parentRecurringId: parentTask.parentRecurringId || parentTask.id,
    isRecurringInstance: true,
  };
};

const renderSubtaskChecklist = (subtasks, taskId) => {
  const list = normalizeSubtasks(subtasks);
  if (list.length === 0) {
    return "";
  }
  const rows = list
    .map(
      (subtask) => `
        <label class="subtask-row">
          <input type="checkbox" class="subtask-toggle" data-task-id="${taskId}" data-subtask-id="${subtask.id}" ${
            subtask.done ? "checked" : ""
          } />
          <span class="subtask-text ${subtask.done ? "is-done" : ""}">${subtask.text}</span>
        </label>
      `
    )
    .join("");
  return `<div class="subtask-list">${rows}</div>`;
};

const renderSubtaskEditor = (subtasks) => {
  const elements = getSubtaskElements();
  if (!elements.list) {
    return;
  }
  const list = normalizeSubtasks(subtasks);
  if (list.length === 0) {
    elements.list.innerHTML = "<div class=\"empty text-sm\">No sub-tasks yet.</div>";
    return;
  }
  elements.list.innerHTML = list
    .map(
      (subtask) => `
        <div class="subtask-item" data-id="${subtask.id}">
          <label class="subtask-editor-label">
            <input type="checkbox" class="subtask-editor-toggle" ${subtask.done ? "checked" : ""} />
            <input type="text" class="subtask-text-input" value="${subtask.text}" />
          </label>
          <button type="button" class="icon-btn subtask-remove" aria-label="Remove sub-task">Remove</button>
        </div>
      `
    )
    .join("");
};

const getSubtasksFromEditor = () => {
  const elements = getSubtaskElements();
  if (!elements.list) {
    return [];
  }
  const items = Array.from(elements.list.querySelectorAll(".subtask-item"));
  return items
    .map((item) => {
      const textInput = item.querySelector(".subtask-text-input");
      const toggle = item.querySelector(".subtask-editor-toggle");
      return {
        id: item.dataset.id || crypto.randomUUID(),
        text: textInput ? textInput.value.trim() : "",
        done: toggle ? toggle.checked : false,
      };
    })
    .filter((item) => item.text);
};

const renderCategoryTags = (categories) => {
  const list = normalizeCategories(categories);
  if (list.length === 0) {
    return "";
  }
  const tags = list
    .map((category) => {
      const style = CATEGORY_STYLES[category] || { bg: "#e5e7eb", text: "#111827" };
      return `<span class="tag-pill" style="--tag-bg: ${style.bg}; --tag-color: ${style.text};">${category}</span>`;
    })
    .join("");
  return `<div class="task-tags">${tags}</div>`;
};

const renderCategoryPills = (categories) => {
  if (!categoryPills) {
    return;
  }
  const list = normalizeCategories(categories);
  if (categoriesInput) {
    categoriesInput.value = JSON.stringify(list);
  }
  categoryPills.innerHTML = list
    .map((category) => {
      const style = CATEGORY_STYLES[category] || { bg: "#e5e7eb", text: "#111827" };
      return `
        <button type="button" class="tag-pill tag-pill--remove" data-value="${category}" style="--tag-bg: ${style.bg}; --tag-color: ${style.text};" aria-label="Remove ${category} category">
          <span>${category}</span>
          <span class="tag-pill__remove" aria-hidden="true">×</span>
        </button>
      `;
    })
    .join("");
};

const getSelectedCategories = () => {
  if (!categoriesInput || !categoriesInput.value) {
    return [];
  }
  try {
    return normalizeCategories(JSON.parse(categoriesInput.value));
  } catch (error) {
    return [];
  }
};

const renderTasks = () => {
  const allTasks = loadTasks();
  const filters = getActiveFilters();
  const searchQuery = getActiveSearchQuery();
  const tasks = getFilteredTasks(allTasks, filters, searchQuery);
  
  if (allTasks.length === 0) {
    taskList.innerHTML = "<div class=\"empty\">No tasks yet. Add your first one.</div>";
    return;
  }
  
  if (tasks.length === 0) {
    taskList.innerHTML = "<div class=\"empty\">No tasks match your filters.</div>";
    return;
  }

  taskList.innerHTML = tasks
    .map((task) => {
      const categoryMarkup = renderCategoryTags(task.categories);
      const subtaskMarkup = renderSubtaskChecklist(task.subtasks, task.id);
      const recurrenceMarkup = task.isRecurring && task.recurrencePattern ? 
        `<span class="tag-pill" style="--tag-bg: #c7d2fe; --tag-color: #4c1d95; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; margin-bottom: 0.5rem;">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
             <path d="M23 4v6h-6"></path>
             <path d="M1 20v-6h6"></path>
             <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
           </svg>
           ${getRecurrenceDisplay(task.recurrencePattern)}
         </span>` 
        : "";
      return `
      <div class="task" data-id="${task.id}" ${task.isRecurring ? 'data-recurring="true"' : ''}>
        <div class="task-title">
          <div>
            <h3>${task.title}</h3>
            <p>${task.description || ""}</p>
            ${recurrenceMarkup}
            ${categoryMarkup}
            ${subtaskMarkup}
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

const updateRecurrencePreview = () => {
  if (!recurrencePreview || !recurrencePattern) return;
  const pattern = recurrencePattern.value;
  recurrencePreview.textContent = `Preview: ${getRecurrenceDisplay(pattern)}`;
};

const handleRecurrenceToggle = () => {
  if (!isRecurringCheckbox || !recurrenceOptions) return;
  if (isRecurringCheckbox.checked) {
    recurrenceOptions.classList.remove("hidden");
  } else {
    recurrenceOptions.classList.add("hidden");
    if (recurrencePattern) {
      recurrencePattern.value = "";
    }
    updateRecurrencePreview();
  }
};

const handleRecurrencePatternChange = () => {
  updateRecurrencePreview();
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
  if (categorySelect) {
    categorySelect.value = "";
  }
  
  // Handle recurrence fields
  if (isRecurringCheckbox) {
    isRecurringCheckbox.checked = task && task.isRecurring ? true : false;
  }
  if (recurrencePattern) {
    recurrencePattern.value = task && task.recurrencePattern ? task.recurrencePattern : "";
  }
  const recurrenceEndDateInput = document.querySelector('input[name="recurrenceEndDate"]');
  if (recurrenceEndDateInput) {
    recurrenceEndDateInput.value = task && task.recurrenceEndDate ? task.recurrenceEndDate : "";
  }
  // Properly show/hide recurrence options and update preview
  handleRecurrenceToggle();
  updateRecurrencePreview();
  
  renderCategoryPills(task ? task.categories : []);
  renderSubtaskEditor(task ? task.subtasks : []);
  const elements = getSubtaskElements();
  if (elements.input) {
    elements.input.value = "";
  }
  document.getElementById("modalTitle").textContent = task
    ? "Edit task"
    : "New task";
};

const closeModal = () => {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
};

const handleSubtaskAdd = () => {
  const elements = getSubtaskElements();
  if (!elements.input || !elements.list) {
    return;
  }
  const text = elements.input.value.trim();
  if (!text) {
    return;
  }
  const updated = [...getSubtasksFromEditor(), { id: crypto.randomUUID(), text, done: false }];
  renderSubtaskEditor(updated);
  elements.input.value = "";
  elements.input.focus();
};

const handleSubtaskRemove = (event) => {
  const button = event.target.closest(".subtask-remove");
  if (!button) {
    return;
  }
  const row = button.closest(".subtask-item");
  if (!row) {
    return;
  }
  const updated = getSubtasksFromEditor().filter((item) => item.id !== row.dataset.id);
  renderSubtaskEditor(updated);
};

const handleSubtaskToggle = (event) => {
  const checkbox = event.target.closest(".subtask-toggle");
  if (!checkbox) {
    return;
  }
  const taskId = checkbox.dataset.taskId;
  const subtaskId = checkbox.dataset.subtaskId;
  if (!taskId || !subtaskId) {
    return;
  }
  const tasks = loadTasks();
  const updated = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }
    const subtasks = normalizeSubtasks(task.subtasks).map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, done: checkbox.checked } : subtask
    );
    const allDone = subtasks.length > 0 && subtasks.every((subtask) => subtask.done);
    const status = allDone ? "Done" : task.status === "Done" ? "In Progress" : task.status;
    return { ...task, subtasks, status };
  });
  saveTasks(updated);

  if (document.getElementById("taskList")) {
    renderTasks();
    renderStreak();
    renderChart();
  } else if (document.getElementById("pendingColumn")) {
    renderBoard();
  }
};

const handleFormSubmit = (event) => {
  event.preventDefault();
  const tasks = loadTasks();
  const taskId = taskForm.taskId.value;
  const existingTask = taskId ? tasks.find(t => t.id === taskId) : null;
  
  const isRecurring = isRecurringCheckbox ? isRecurringCheckbox.checked : false;
  const recurrencePatternValue = recurrencePattern ? recurrencePattern.value : "";
  const recurrenceEndDateInput = document.querySelector('input[name="recurrenceEndDate"]');
  const recurrenceEndDate = recurrenceEndDateInput ? recurrenceEndDateInput.value : "";
  
  const payload = {
    id: taskId || crypto.randomUUID(),
    title: taskForm.title.value.trim(),
    description: taskForm.description.value.trim(),
    status: taskForm.status.value,
    dueDate: taskForm.dueDate.value,
    categories: getSelectedCategories(),
    subtasks: getSubtasksFromEditor(),
    isRecurring: isRecurring && recurrencePatternValue ? true : false,
    recurrencePattern: isRecurring && recurrencePatternValue ? recurrencePatternValue : null,
    recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : null,
    parentRecurringId: existingTask ? existingTask.parentRecurringId : null,
    isRecurringInstance: existingTask ? existingTask.isRecurringInstance : false,
  };

  if (!payload.title) {
    return;
  }

  let updated = taskId
    ? tasks.map((task) => (task.id === taskId ? payload : task))
    : [...tasks, payload];

  // If this is a new recurring task and it's marked as recurring, create the first instance
  if (!taskId && payload.isRecurring && payload.recurrencePattern && payload.dueDate) {
    const nextInstance = createRecurringTaskInstance(payload);
    if (nextInstance) {
      updated = [...updated, nextInstance];
    }
  }

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
    let updated = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: task.status === "Done" ? "In Progress" : "Done",
          }
        : task
    );
    
    // If a recurring task is marked as Done, create the next occurrence
    const updatedTask = updated.find(t => t.id === taskId);
    if (updatedTask && updatedTask.status === "Done" && updatedTask.isRecurring && updatedTask.recurrencePattern) {
      const nextInstance = createRecurringTaskInstance(updatedTask);
      if (nextInstance) {
        updated = [...updated, nextInstance];
      }
    }
    
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

const ensureRecurringTasksForToday = () => {
  const tasks = loadTasks();
  const today = getToday();
  let updated = [...tasks];
  let hasChanges = false;

  tasks.forEach((task) => {
    // Only process parent recurring tasks (not instances)
    if (!task.isRecurring || !task.recurrencePattern || task.isRecurringInstance) {
      return;
    }

    // Check if this task is due today or has already been marked done
    // If it's due today and there's no instance for today yet, create one
    if (task.dueDate === today && task.status !== 'Done') {
      // This is the main recurring task due today, keep it as is
      return;
    }

    // If the main task is marked Done and due today, we need to create the next occurrence
    if (task.dueDate === today && task.status === 'Done') {
      const nextInstance = createRecurringTaskInstance(task);
      if (nextInstance) {
        updated.push(nextInstance);
        hasChanges = true;
      }
    }
  });

  if (hasChanges) {
    saveTasks(updated);
  }

  return updated;
};

const scheduleMidnightCheck = () => {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  const delay = nextMidnight.getTime() - now.getTime();

  setTimeout(() => {
    ensureRecurringTasksForToday();
    const tasks = loadTasks();
    updateHistoryForToday(tasks);
    renderStreak();
    renderChart();
    if (document.getElementById('taskList')) {
      renderTasks();
    } else if (document.getElementById('pendingColumn')) {
      renderBoard();
    }
    scheduleMidnightCheck();
  }, delay);
};

const init = () => {
  ensureRecurringTasksForToday();
  const tasks = loadTasks();
  updateHistoryForToday(tasks);
  renderTasks();
  renderStreak();
  renderChart();
  scheduleMidnightCheck();
};

// Board View Functions
const renderBoardTask = (task) => {
  const categoryMarkup = renderCategoryTags(task.categories);
  const subtaskMarkup = renderSubtaskChecklist(task.subtasks, task.id);
  const recurrenceMarkup = task.isRecurring && task.recurrencePattern ? 
    `<span class="tag-pill" style="--tag-bg: #c7d2fe; --tag-color: #4c1d95; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; margin-bottom: 0.5rem;">
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
         <path d="M23 4v6h-6"></path>
         <path d="M1 20v-6h6"></path>
         <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
       </svg>
       ${getRecurrenceDisplay(task.recurrencePattern)}
     </span>` 
    : "";
  return `
    <div class="task board-task" data-id="${task.id}" draggable="true" ${task.isRecurring ? 'data-recurring="true"' : ''}>
      <div class="task-title">
        <div>
          <h3>${task.title}</h3>
          ${task.description ? `<p class="text-sm text-[var(--muted)] mt-1">${task.description}</p>` : ''}
          <div style="margin-bottom: 0.5rem;">${recurrenceMarkup}</div>
          ${categoryMarkup}
          ${subtaskMarkup}
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
  const allTasks = loadTasks();
  const filters = getActiveFilters();
  const searchQuery = getActiveSearchQuery();
  const tasks = getFilteredTasks(allTasks, filters, searchQuery);
  
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

  let updated = tasks.map(task => 
    task.id === taskId ? { ...task, status: newStatus } : task
  );

  // If a recurring task is marked as Done, create the next occurrence
  const updatedTask = updated.find(t => t.id === taskId);
  if (updatedTask && newStatus === "Done" && updatedTask.isRecurring && updatedTask.recurrencePattern) {
    const nextInstance = createRecurringTaskInstance(updatedTask);
    if (nextInstance) {
      updated = [...updated, nextInstance];
    }
  }

  saveTasks(updated);
  updateHistoryForToday(updated);
  renderBoard();
  
  // Update chart and streak in case user navigates back to daily view
  if (document.getElementById('progressChart')) {
    renderChart();
    renderStreak();
  }
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
    
    // Update chart and streak
    if (document.getElementById('progressChart')) {
      renderChart();
      renderStreak();
    }
  }
};

const clearDoneBoard = () => {
  const tasks = loadTasks();
  const filtered = tasks.filter(task => task.status !== 'Done');
  saveTasks(filtered);
  updateHistoryForToday(filtered);
  renderBoard();
  
  // Update chart and streak in case user navigates back to daily view
  if (document.getElementById('progressChart')) {
    renderChart();
    renderStreak();
  }
};

// Drag and Drop Functions
let draggedTaskId = null;

const handleDragStart = (event) => {
  const card = event.target.closest('.board-task');
  if (!card) return;
  
  draggedTaskId = card.dataset.id;
  card.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/html', card.innerHTML);
};

const handleDragEnd = (event) => {
  const card = event.target.closest('.board-task');
  if (card) {
    card.classList.remove('dragging');
  }
  draggedTaskId = null;
};

const handleDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const column = event.target.closest('[data-column]');
  if (column) {
    column.classList.add('drag-over');
  }
};

const handleDragLeave = (event) => {
  const column = event.target.closest('[data-column]');
  if (column && !column.contains(event.relatedTarget)) {
    column.classList.remove('drag-over');
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();
  
  const column = event.target.closest('[data-column]');
  if (!column || !draggedTaskId) return;
  
  column.classList.remove('drag-over');
  
  const newStatus = column.dataset.column;
  const tasks = loadTasks();
  
  const updated = tasks.map(task =>
    task.id === draggedTaskId ? { ...task, status: newStatus } : task
  );
  
  saveTasks(updated);
  updateHistoryForToday(updated);
  renderBoard();
  
  // Update chart and streak in case user navigates back to daily view
  if (document.getElementById('progressChart')) {
    renderChart();
    renderStreak();
  }
};

const initBoard = () => {
  ensureRecurringTasksForToday();
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

  // Setup drag and drop for all columns
  const columns = [pendingCol, inProgressCol, doneCol];
  columns.forEach(col => {
    if (col) {
      // Drag and drop events
      col.addEventListener('dragstart', handleDragStart, true);
      col.addEventListener('dragend', handleDragEnd, true);
      
      const colContainer = col.parentElement;
      if (colContainer) {
        colContainer.addEventListener('dragover', handleDragOver);
        colContainer.addEventListener('dragleave', handleDragLeave);
        colContainer.addEventListener('drop', handleDrop);
      }
      
      // Other event listeners
      col.addEventListener('change', handleStatusChange);
      col.addEventListener('change', handleSubtaskToggle);
      col.addEventListener('click', handleBoardTaskClick);
    }
  });
};

// Universal form submit handler that works for both views
const handleUniversalFormSubmit = (event) => {
  event.preventDefault();
  const tasks = loadTasks();
  const taskId = taskForm.taskId.value;
  const existingTask = taskId ? tasks.find(t => t.id === taskId) : null;
  
  const isRecurring = isRecurringCheckbox ? isRecurringCheckbox.checked : false;
  const recurrencePatternValue = recurrencePattern ? recurrencePattern.value : "";
  const recurrenceEndDateInput = document.querySelector('input[name="recurrenceEndDate"]');
  const recurrenceEndDate = recurrenceEndDateInput ? recurrenceEndDateInput.value : "";
  
  const payload = {
    id: taskId || crypto.randomUUID(),
    title: taskForm.title.value.trim(),
    description: taskForm.description.value.trim(),
    status: taskForm.status.value,
    dueDate: taskForm.dueDate.value,
    categories: getSelectedCategories(),
    subtasks: getSubtasksFromEditor(),
    isRecurring: isRecurring && recurrencePatternValue ? true : false,
    recurrencePattern: isRecurring && recurrencePatternValue ? recurrencePatternValue : null,
    recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : null,
    parentRecurringId: existingTask ? existingTask.parentRecurringId : null,
    isRecurringInstance: existingTask ? existingTask.isRecurringInstance : false,
  };

  if (!payload.title) return;

  let updated = taskId
    ? tasks.map((task) => (task.id === taskId ? payload : task))
    : [...tasks, payload];

  // If this is a new recurring task and it's marked as recurring, create the first instance
  if (!taskId && payload.isRecurring && payload.recurrencePattern && payload.dueDate) {
    const nextInstance = createRecurringTaskInstance(payload);
    if (nextInstance) {
      updated = [...updated, nextInstance];
    }
  }

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
    if (taskList) taskList.addEventListener("change", handleSubtaskToggle);
    if (subtaskList) subtaskList.addEventListener("click", handleSubtaskRemove);
    if (addSubtaskButton) addSubtaskButton.addEventListener("click", handleSubtaskAdd);
    if (taskForm) {
      taskForm.addEventListener("click", (event) => {
        if (event.target.closest("#addSubtask")) {
          handleSubtaskAdd();
        }
      });
      taskForm.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && event.target.closest("#subtaskInput")) {
          event.preventDefault();
          handleSubtaskAdd();
        }
      });
    }
    if (categorySelect) {
      categorySelect.innerHTML = [
        '<option value="">Choose a category</option>',
        ...CATEGORY_OPTIONS.map((category) => `<option value="${category}">${category}</option>`),
      ].join("");
      categorySelect.addEventListener("change", () => {
        const value = categorySelect.value;
        if (!value) return;
        const updated = [...getSelectedCategories(), value];
        renderCategoryPills(updated);
        categorySelect.value = "";
      });
    }
    if (categoryPills) {
      categoryPills.addEventListener("click", (event) => {
        const pill = event.target.closest(".tag-pill--remove");
        if (!pill) return;
        const value = pill.dataset.value;
        const updated = getSelectedCategories().filter((item) => item !== value);
        renderCategoryPills(updated);
      });
    }
    if (isRecurringCheckbox) {
      isRecurringCheckbox.addEventListener("change", handleRecurrenceToggle);
    }
    if (recurrencePattern) {
      recurrencePattern.addEventListener("change", handleRecurrencePatternChange);
    }
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
    if (subtaskList) subtaskList.addEventListener("click", handleSubtaskRemove);
    if (addSubtaskButton) addSubtaskButton.addEventListener("click", handleSubtaskAdd);
    if (taskForm) {
      taskForm.addEventListener("click", (event) => {
        if (event.target.closest("#addSubtask")) {
          handleSubtaskAdd();
        }
      });
      taskForm.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && event.target.closest("#subtaskInput")) {
          event.preventDefault();
          handleSubtaskAdd();
        }
      });
    }
    if (categorySelect) {
      categorySelect.innerHTML = [
        '<option value="">Choose a category</option>',
        ...CATEGORY_OPTIONS.map((category) => `<option value="${category}">${category}</option>`),
      ].join("");
      categorySelect.addEventListener("change", () => {
        const value = categorySelect.value;
        if (!value) return;
        const updated = [...getSelectedCategories(), value];
        renderCategoryPills(updated);
        categorySelect.value = "";
      });
    }
    if (categoryPills) {
      categoryPills.addEventListener("click", (event) => {
        const pill = event.target.closest(".tag-pill--remove");
        if (!pill) return;
        const value = pill.dataset.value;
        const updated = getSelectedCategories().filter((item) => item !== value);
        renderCategoryPills(updated);
      });
    }
    if (isRecurringCheckbox) {
      isRecurringCheckbox.addEventListener("change", handleRecurrenceToggle);
    }
    if (recurrencePattern) {
      recurrencePattern.addEventListener("change", handleRecurrencePatternChange);
    }
  });
}

// Filter functionality - applies to both views
const setupFilterListeners = () => {
  const toggleFilter = document.getElementById('toggleFilter');
  const filterPanel = document.getElementById('filterPanel');
  const applyFiltersBtn = document.getElementById('applyFilters');
  const clearAllFiltersBtn = document.getElementById('clearAllFilters');
  const closeFilterBtn = document.getElementById('closeFilter');
  
  // Populate filter panel with saved filters on load
  populateFilterPanel();
  
  // Toggle filter panel visibility
  if (toggleFilter) {
    toggleFilter.addEventListener('click', () => {
      if (filterPanel) {
        filterPanel.classList.toggle('hidden');
      }
    });
  }
  
  // Apply filters
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      const dateFrom = document.getElementById('filterDateFrom')?.value || '';
      const dateTo = document.getElementById('filterDateTo')?.value || '';
      const categories = Array.from(document.querySelectorAll('[name="filterCategory"]:checked'))
        .map(cb => cb.value);
      const statuses = Array.from(document.querySelectorAll('[name="filterStatus"]:checked'))
        .map(cb => cb.value);
      const urgencies = Array.from(document.querySelectorAll('[name="filterUrgency"]:checked'))
        .map(cb => cb.value);
      
      const filters = {
        dateRange: { from: dateFrom, to: dateTo },
        categories,
        statuses,
        urgencies,
      };
      
      setFilters(filters);
      
      // Optionally close the panel after applying
      if (filterPanel) {
        filterPanel.classList.add('hidden');
      }
    });
  }
  
  // Clear all filters
  if (clearAllFiltersBtn) {
    clearAllFiltersBtn.addEventListener('click', () => {
      clearFilters();
    });
  }
  
  // Close filter panel
  if (closeFilterBtn) {
    closeFilterBtn.addEventListener('click', () => {
      if (filterPanel) {
        filterPanel.classList.add('hidden');
      }
    });
  }
};

// Populate filter panel UI with saved filters
const populateFilterPanel = () => {
  const filters = getActiveFilters();
  
  // Set date inputs
  const dateFromInput = document.getElementById('filterDateFrom');
  const dateToInput = document.getElementById('filterDateTo');
  if (dateFromInput && filters.dateRange?.from) {
    dateFromInput.value = filters.dateRange.from;
  }
  if (dateToInput && filters.dateRange?.to) {
    dateToInput.value = filters.dateRange.to;
  }
  
  // Set category checkboxes
  if (filters.categories && filters.categories.length > 0) {
    filters.categories.forEach(cat => {
      const checkbox = document.querySelector(`[name="filterCategory"][value="${cat}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }
  
  // Set status checkboxes
  if (filters.statuses && filters.statuses.length > 0) {
    filters.statuses.forEach(status => {
      const checkbox = document.querySelector(`[name="filterStatus"][value="${status}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }
  
  // Set urgency checkboxes
  if (filters.urgencies && filters.urgencies.length > 0) {
    filters.urgencies.forEach(urgency => {
      const checkbox = document.querySelector(`[name="filterUrgency"][value="${urgency}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }
};

// Setup search listeners
const setupSearchListeners = () => {
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const filterSearchInput = document.getElementById('filterSearchInput');
  
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    // Update both search inputs to stay in sync
    if (searchInput && filterSearchInput) {
      searchInput.value = query;
      filterSearchInput.value = query;
    }
    
    // Show/hide clear button
    if (searchClearBtn) {
      searchClearBtn.style.display = query ? 'block' : 'none';
    }
    
    // Re-render tasks
    if (document.getElementById('taskList')) {
      renderTasks();
    }
    if (document.getElementById('pendingColumn')) {
      renderBoard();
    }
  };
  
  // Header search input
  if (searchInput) {
    // Restore saved search query on load
    const savedQuery = getActiveSearchQuery();
    if (savedQuery) {
      searchInput.value = savedQuery;
      if (searchClearBtn) {
        searchClearBtn.style.display = 'block';
      }
      if (filterSearchInput) {
        filterSearchInput.value = savedQuery;
      }
    }
    
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }
  
  // Filter panel search input
  if (filterSearchInput) {
    // Restore saved search query on load
    const savedQuery = getActiveSearchQuery();
    if (savedQuery) {
      filterSearchInput.value = savedQuery;
    }
    
    filterSearchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }
  
  // Clear search button
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      handleSearch('');
      if (searchInput) {
        searchInput.focus();
      }
    });
  }
};

// Initialize filter listeners on page load
window.addEventListener('load', () => {
  setupFilterListeners();
  setupSearchListeners();
});

const exportModal = document.getElementById("exportModal");
const exportToggle = document.getElementById("exportToggle");
const closeExportModal = document.getElementById("closeExportModal");
const exportCSVButton = document.getElementById("exportCSV");
const exportJSONButton = document.getElementById("exportJSON");

if (exportToggle) {
  exportToggle.addEventListener("click", () => {
    if (exportModal) {
      exportModal.classList.add("active");
    }
  });
}

if (closeExportModal) {
  closeExportModal.addEventListener("click", () => {
    if (exportModal) {
      exportModal.classList.remove("active");
    }
  });
}

if (exportModal) {
  exportModal.addEventListener("click", (event) => {
    if (event.target === exportModal) {
      exportModal.classList.remove("active");
    }
  });
}

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportAsCSV = () => {
  const tasks = loadTasks();
  if (tasks.length === 0) {
    alert("No tasks to export");
    return;
  }

  // CSV Header
  const headers = ["Name", "Description", "Due Date", "Tags", "Sub-tasks", "Status"];
  const csvRows = [headers.join(",")];

  // CSV Data
  tasks.forEach((task) => {
    const name = `"${(task.title || "").replace(/"/g, '""')}"`;
    const description = `"${(task.description || "").replace(/"/g, '""')}"`;
    const dueDate = task.dueDate || "";
    const tags = `"${normalizeCategories(task.categories).join(", ")}"`;
    const status = task.status || "";
    const subtaskList = normalizeSubtasks(task.subtasks)
      .map((subtask) => `${subtask.done ? "[x]" : "[ ]"} ${subtask.text}`)
      .join("; ");
    const subtasks = `"${subtaskList.replace(/"/g, '""')}"`;

    csvRows.push([name, description, dueDate, tags, subtasks, status].join(","));
  });

  const csvContent = csvRows.join("\n");
  const timestamp = new Date().toISOString().split("T")[0];
  downloadFile(csvContent, `tasks_${timestamp}.csv`, "text/csv");
  
  if (exportModal) {
    exportModal.classList.remove("active");
  }
};

const exportAsJSON = () => {
  const tasks = loadTasks();
  if (tasks.length === 0) {
    alert("No tasks to export");
    return;
  }

  const exportData = tasks.map((task) => ({
    name: task.title || "",
    description: task.description || "",
    dueDate: task.dueDate || "",
    tags: normalizeCategories(task.categories),
    subtasks: normalizeSubtasks(task.subtasks).map((subtask) => ({
      text: subtask.text,
      done: subtask.done,
    })),
    status: task.status || "",
  }));

  const jsonContent = JSON.stringify(exportData, null, 2);
  const timestamp = new Date().toISOString().split("T")[0];
  downloadFile(jsonContent, `tasks_${timestamp}.json`, "application/json");
  
  if (exportModal) {
    exportModal.classList.remove("active");
  }
};

if (exportCSVButton) {
  exportCSVButton.addEventListener("click", exportAsCSV);
}

if (exportJSONButton) {
  exportJSONButton.addEventListener("click", exportAsJSON);
}
