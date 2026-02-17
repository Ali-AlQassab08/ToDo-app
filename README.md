# Daily Flow - Task Management Application

A modern, lightweight to-do application that helps you track daily tasks and build consistent productivity habits. With built-in streak tracking and visual progress charts, Daily Flow provides motivation through visible momentum.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Installation & Setup](#installation--setup)
6. [Running the Application](#running-the-application)
7. [How It Works](#how-it-works)
8. [Usage Guide](#usage-guide)
9. [Development](#development)
10. [Troubleshooting](#troubleshooting)
11. [License & Contributing](#license)

---

## Overview

**Daily Flow** is a full-stack task management application designed for personal productivity. It tracks your daily tasks, calculates your consecutive completion streak, and visualizes your progress over the last 14 days. The app uses client-side storage (localStorage) for immediate responsiveness and offline capability, making it perfect for personal use without the overhead of a backend database.

**Key Concept**: The app is built around the idea of daily focus—complete 100% of your tasks each day to maintain your streak and visualize your consistency.

---

## 🛠 Tech Stack

### Backend
- **Flask** (Python 3.12) - Lightweight web framework for handling HTTP routes and serving templates
- **Python 3.12** - Core runtime environment

### Frontend
- **HTML5** - Semantic page structure with template inheritance via Jinja2
- **CSS3** - Modern styling with CSS Grid, Flexbox, responsive design, and custom properties
- **Vanilla JavaScript (ES6+)** - No framework dependencies; all interactivity is custom-built
- **Chart.js 4.4.1** - Lightweight charting library for displaying completion trends

### Storage
- **localStorage** - Client-side browser storage for persistent task and history data (no database required)

### Deployment
- **Docker** - Multi-stage containerized deployment with Python 3.12-slim base image
- **Docker Hub** - Optional cloud registry for image distribution

---

## ✨ Features

### Core Task Management
- ✅ **Create Tasks** - Add tasks with title, description, optional due date, and initial status
- ✏️ **Edit Tasks** - Modify task details anytime using a modal dialog
- 🗑️ **Delete Tasks** - Remove tasks with a single click
- 📊 **Status Tracking** - Manage task status across three stages: Pending → In Progress → Done
- 📅 **Due Dates** - Optional due date field with human-readable formatting (e.g., "Due Jan 15")
- 🏷️ **Categories & Tags** - Organize tasks with predefined categories:
  - Studying (Indigo)
  - Work (Blue)
  - Finances (Gold)
  - Workout (Green)
  - Other (Purple)
- ✓ **Subtasks** - Create nested sub-tasks within tasks with completion tracking

### Views & Boards
- 📋 **Daily View** - Main dashboard showing today's tasks with streak counter and completion graph
- 🎯 **Kanban Board** - Three-column task board (Pending | In Progress | Done) for visual workflow management
  - 🖱️ **Drag & Drop** - Drag tasks between columns to instantly change their status
- 📊 **Progress Chart** - Interactive line chart displaying daily completion percentage over the last 14 days

### Productivity Features
- 🔥 **Daily Streak Counter** - Tracks consecutive days of 100% task completion
- 🧹 **Clear Completed** - Bulk-remove finished tasks in one click
- 🔄 **Real-time Updates** - Streak, chart, and board views update instantly when tasks change
- 💾 **Export Tasks** - Download your tasks in multiple formats:
  - CSV format for spreadsheet applications
  - JSON format for structured data backup

### User Experience
- 🎨 **Modern Design** - Clean, gradient background with smooth animations and micro-interactions
- 📱 **Responsive Layout** - Adapts beautifully from mobile (single column) to desktop (multi-column) screens
- ⌨️ **Accessible** - Semantic HTML5, ARIA attributes, and keyboard-friendly interactions
- 🚀 **Offline-First** - All data stored in browser localStorage; works seamlessly without internet
- 💾 **Persistent Storage** - All tasks, history, and preferences are automatically saved locally
- 🌙 **Dark Mode Toggle** - Switch between light and dark themes instantly; preference saved in localStorage
- ⏰ **Auto-Sync at Midnight** - Daily history automatically updates at midnight for accurate streak calculation

---

## 📁 Project Structure

```
ToDo-app/
├── app.py                    # Flask backend server
├── requirements.txt          # Python dependencies
├── Dockerfile                # Docker configuration
├── README.md                 # This file
├── templates/
│   ├── base.html             # Base HTML template with layout structure
│   ├── index.html            # Main page with task list and chart
│   ├── board.html            # Kanban-style board view for tasks (3-column layout)
│   ├── export_modal.html     # Export options dialog (CSV/JSON)
│   └── task_modal.html       # Task creation/edit modal form with categories & subtasks
└── static/
    ├── css/
    │   └── styles.css        # All styling (colors, layout, animations)
    └── js/
        ├── app.js            # Main application logic (CRUD, streaks, history)
        └── chart.js          # Chart.js integration loader
```

### File Descriptions

- **app.py** - Flask server with routes for task CRUD operations. Serves static files and templates via Jinja2.
- **base.html** - Jinja2 base template that sets up the page structure, loads CSS/JS, and provides the main layout container.
- **index.html** - Main dashboard page extending base.html with hero section, task list, and 14-day completion chart.
- **board.html** - Kanban board view with three columns (Pending | In Progress | Done) for task workflow visualization.
- **task_modal.html** - Modal dialog for creating and editing tasks with fields for title, description, due date, categories, and subtasks.
- **export_modal.html** - Modal dialog with options to export tasks as CSV or JSON files with timestamp.
- **styles.css** - Global styling including typography (Fraunces serif + Space Grotesk sans-serif), color schemes, animations, responsive design, and component styles. Includes CSS variables for light/dark mode theming.
- **app.js** - Core application logic including:
  - localStorage management (tasks, history, theme preferences)
  - Task CRUD operations (Create, Read, Update, Delete)
  - Streak calculation algorithm
  - Daily history tracking and midnight auto-sync
  - Event listeners for all interactive elements
  - DOM rendering and real-time UI updates
  - Category and subtask management
  - Export functionality (CSV and JSON formats)
  - Dark/light mode toggle
- **chart.js** - Bootstrap loader that ensures Chart.js library is available before app.js initialization.

---

## Installation & Setup

### Prerequisites
- **Python 3.12+** installed locally
- **Docker** (optional, for containerized deployment)
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Clone the Repository

```bash
git clone https://github.com/Ali-AlQassab08/ToDo-app.git
cd ToDo-app
```

### Install Dependencies (Local)

```bash
pip install -r requirements.txt
```

This installs Flask, the only external dependency.

---

## Running the Application

### Option 1: Local Python Development

```bash
python app.py
```

The application will start at `http://127.0.0.1:5000` with Flask's development server (debugger enabled).

**Console output:**
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

Open your browser and navigate to http://127.0.0.1:5000.

### Option 2: Docker (Recommended for Production)

Image version: `0.2.1`

#### Build the Image

```bash
docker build -t qassab/todo_app:0.2.1 .
```

#### Run the Container

```bash
docker run --rm -p 5000:5000 qassab/todo_app:0.2.1
```

The app will be available at `http://127.0.0.1:5000`.

#### Publish to Docker Hub (if authenticated)

```bash
docker login
docker push qassab/todo_app:0.2.1
```

---

## How It Works

### Data Flow Architecture

```
User Interaction (Button Click)
         ↓
  Event Listener (JavaScript)
         ↓
  Load Data from localStorage
         ↓
  Modify Data (add/edit/delete)
         ↓
  Save Back to localStorage
         ↓
  Re-render UI (tasks, streak, chart)
```

### LocalStorage Keys

- **`todoTasks`** - Array of task objects with complete structure:
  ```json
  {
    "id": "uuid-generated-id",
    "title": "Task name",
    "description": "Optional detailed description",
    "status": "Pending | In Progress | Done",
    "dueDate": "YYYY-MM-DD format or empty string",
    "categories": ["Studying", "Work", "Finances", "Workout", "Other"],
    "subtasks": [
      {
        "id": "uuid",
        "text": "Subtask description",
        "done": true
      }
    ]
  }
  ```

- **`todoProgress`** - Object tracking daily completion history:
  ```json
  {
    "2025-02-15": {
      "date": "2025-02-15",
      "completed": 5,        // Number of tasks marked as "Done"
      "total": 7            // Total tasks for that day
    },
    "2025-02-16": {
      "date": "2025-02-16",
      "completed": 7,
      "total": 7
    }
  }
  ```

- **`todoTheme`** - Stores the user's theme preference (`light` or `dark`).

### Streak Calculation Logic

1. Retrieves all saved daily history entries from `todoProgress`
2. Walks backward from today's date checking each day's completion percentage
3. A day "counts" only if 100% of tasks were completed (completed === total)
4. Streak immediately breaks if any day has less than 100% completion
5. Returns cumulative count of consecutive 100% completion days
6. Streak is automatically recalculated when tasks are added, updated, or deleted

### Chart Visualization

- **Time Range**: Displays completion percentage for the last 14 days
- **X-axis**: Dates in YYYY-MM-DD format
- **Y-axis**: Percentage (0-100%) with gridlines
- **Style**: Blue-green line (teal) with semi-transparent fill showing trend
- **Interactivity**: Hover tooltips display exact completion percentage for each day
- **Theme Support**: Chart colors dynamically update based on light/dark mode selection

### Category System

- **Five predefined categories** for task organization:
  - 🔵 Studying (Indigo: #c7d2fe)
  - 💼 Work (Blue: #b7ddff)
  - 💰 Finances (Gold: #ffe4a3)
  - 💪 Workout (Green: #c9f2c7)
  - 🏷️ Other (Purple: #e9d5ff)
- **Multiple categories per task** - A single task can have any combination of categories
- **Visual tags** - Categories display as colored pills with custom background and text colors
- **Filtering-ready** - Category data is stored for potential future filtering functionality

### Subtask Management

- **Nested task tracking** - Create multiple subtasks within each main task
- **Completion tracking** - Each subtask can be marked as complete independently
- **Edit anytime** - Modify, add, or remove subtasks while editing the main task
- **Display format** - Subtasks shown in a checklist format with completion status
- **Export support** - Subtasks are included in CSV (with "[x]" or "[ ]" format) and JSON exports

### Export Functionality

- **CSV Export** - Download tasks in spreadsheet-compatible format with columns:
  - Name, Description, Due Date, Tags, Sub-tasks, Status
  - Includes formatted subtasks using "[x]" for done and "[ ]" for pending
  - Timestamp included in filename for easy organization
  
- **JSON Export** - Download tasks as structured JSON with full data preservation:
  - Includes all task properties and nested objects
  - Pretty-printed for human readability
  - Useful for backup or data portability
  - Timestamp included in filename

### Data Synchronization

- **Real-time updates** - All changes instantly reflect across views and calculations
- **Midnight auto-sync** - New day detection triggers automatic history recording
- **Single source of truth** - All data stored in browser's localStorage
- **No server persistence** - Current implementation is client-side only (future versions could add backend sync)

---

## Usage Guide

### Daily View (Main Dashboard)

1. **Adding a Task**
   - Click the "Add task" button at the top right
   - Enter task title (required)
   - Add optional description for more details
   - Set a due date to stay on schedule
   - Select relevant categories to organize by type
   - Add subtasks for complex tasks
   - Click "Create" to save

2. **Managing Tasks**
   - **Edit**: Click the pencil icon on any task to modify details
   - **Change Status**: Click the status dropdown to move between Pending → In Progress → Done
   - **Delete**: Click the trash icon to remove a task
   - **Mark Subtasks**: Check subtasks as you complete them within a task

3. **Tracking Progress**
   - **Streak Counter**: Located in top-right displays consecutive 100% completion days
   - **Completion Chart**: Shows your 14-day completion percentage trend
   - **Real-time Updates**: Streak and chart update automatically when task status changes

4. **Clearing Completed Tasks**
   - Click "Clear completed" button to bulk-remove all done tasks
   - Useful for starting fresh each day

### Board View (Kanban)

1. **Switching Views**
   - Click "Board view" button from the main page to see Kanban layout
   - Click "Daily view" to return to dashboard

2. **Three-Column Workflow**
   - **Pending**: Tasks not yet started (shows count)
   - **In Progress**: Tasks currently being worked on (shows count)
   - **Done**: Completed tasks with option to clear them (shows count)

3. **Moving Tasks Between Columns**
   - **Drag & Drop**: Click and drag any task card to move it between columns
     - Dragging provides visual feedback (semi-transparent with rotation)
     - Target column highlights with dashed border when hovering
     - Drop to instantly update the task status
   - **Status Dropdown**: Use the status dropdown on each card for quick changes
   - Status counts and streak/chart update in real-time

4. **Task Cards**
   - Each card shows title, description, category tags, and subtasks
   - Click the edit button (pencil icon) to modify details
   - Click the delete button (trash icon) to remove the task
   - Status counts auto-update when tasks are modified

### Dark Mode

- Click the theme toggle button (usually in top area) to switch between light and dark modes
- Your preference is automatically saved
- All charts and UI elements adapt to the selected theme

### Exporting Your Data

1. Click the export button (usually marked with an icon or label)
2. A modal appears with export options
3. **Choose CSV** for spreadsheet applications (Excel, Google Sheets)
4. **Choose JSON** for data backup or portability
5. File automatically downloads with timestamp in filename (e.g., `tasks_2025-02-16.csv`)

### Tips for Maximum Productivity

- **Daily Ritual**: Review morning tasks and update status as you complete them
- **Kanban Flow**: Use the Kanban board view to visualize your workflow - drag tasks naturally between columns as you work
- **Categories**: Use categories consistently to make reviewing and filtering easier
- **Subtasks**: Break complex tasks into smaller steps for better progress tracking
- **Drag & Drop**: Quickly move tasks between status columns without opening the task detail modal
- **Streak Motivation**: Aim for 100% completion daily to grow your streak
- **Regular Export**: Export your data weekly as backup security
- **Clear Completed**: Start each day fresh by clearing yesterday's completed tasks

---

## Development

### Project Design Philosophy

1. **No Framework Overhead** - Pure vanilla JavaScript (ES6+) for simplicity, performance, and full control
2. **No Backend Database** - Browser localStorage is sufficient for personal task management
3. **Progressive Enhancement** - HTML/CSS work independently; JavaScript enhances interactivity
4. **Accessibility First** - Semantic HTML5 and ARIA attributes built-in from the start
5. **Modern Tooling** - CSS Grid/Flexbox, ES6+ JavaScript, responsive design patterns
6. **Single-Page Architecture** - Fast, smooth interactions without page reloads
7. **Lightweight** - Minimal dependencies (only Flask and Chart.js)

### Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Flask 3.0+ | HTTP routing, template rendering, static file serving |
| **Frontend** | HTML5, CSS3, Vanilla JS (ES6+) | UI structure, styling, interactivity |
| **Charting** | Chart.js 4.4.1 | 14-day completion visualization |
| **Storage** | localStorage API | Persistent client-side data storage |
| **Fonts** | Google Fonts (Fraunces, Space Grotesk) | Typography |
| **Deployment** | Docker (Python 3.12-slim) | Containerized production deployment |

### Adding a Feature

1. **Design the data model** - Define how data will be stored in localStorage
2. **Create UI elements** - Add HTML structure in appropriate template(s)
3. **Write event listeners** - Capture user interactions in `app.js`
4. **Implement logic** - Load data, modify it, save back to localStorage
5. **Add re-rendering** - Update DOM to reflect changes
6. **Test locally** - Verify at `http://127.0.0.1:5000`
7. **Update README** - Document new features and usage

### Example: Adding a Priority System

```javascript
// 1. Extend task object in app.js
const newTask = {
  id: crypto.randomUUID(),
  title: "...",
  priority: "high",  // Add new field
  // ...other fields
};

// 2. Add HTML input in task_modal.html
<select id="prioritySelect">
  <option value="low">Low</option>
  <option value="medium">Medium</option>
  <option value="high">High</option>
</select>

// 3. Add event listener and save logic
prioritySelect.addEventListener("change", () => {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === currentTaskId);
  if (task) {
    task.priority = prioritySelect.value;
    saveTasks(tasks);
    renderTasks();
  }
});

// 4. Update rendering to display priority indicator
```

### Styling Customization

Edit [static/css/styles.css](static/css/styles.css) CSS variables at the `:root` and `[data-theme="dark"]` selectors:

**Light Mode (Default)**:
```css
:root {
  --ink: #101219;           /* Primary text color */
  --muted: #5a5f73;         /* Secondary/muted text */
  --paper: #f7f2ea;         /* Main background */
  --card: #ffffff;          /* Card/panel background */
  --surface: #fffdf9;       /* Elevated surface background */
  --border: #f0e5dc;        /* Border color */
  --border-strong: #ecdccc; /* Stronger borders */
  --accent: #ff6f5b;        /* Primary CTA color (orange) */
  --accent-2: #2a9d8f;      /* Secondary accent (teal/chart) */
  --shadow: rgba(17, 18, 25, 0.12);  /* Shadow color */
  --bg-gradient: radial-gradient(...); /* Page background */
}
```

**Dark Mode**:
```css
[data-theme="dark"] {
  --ink: #f4f1ea;           /* Light text on dark */
  --muted: #b2b6c6;         /* Lighter muted */
  --paper: #0f121a;         /* Dark background */
  --card: #181c27;          /* Darker card background */
  --surface: #1e2231;       /* Elevated dark surface */
  --border: #2a3041;        /* Dark borders */
  --border-strong: #3a4257; /* Stronger dark borders */
  --accent: #ff8f7b;        /* Lighter orange for dark */
  --accent-2: #55c4b8;      /* Lighter teal for dark */
  --shadow: rgba(5, 6, 10, 0.45);    /* Dark shadow */
  --bg-gradient: radial-gradient(...); /* Dark page gradient */
}
```

To customize colors, simply modify these CSS variables and the entire app theme updates instantly.

### Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ All modern mobile browsers

Features used: `localStorage`, `crypto.randomUUID()`, `Intl.DateTimeFormat`, Fetch API, ES6+ JavaScript

### Performance Considerations

- **No network requests** for core functionality (offline-first)
- **localStorage capacity**: ~5-10MB in most browsers; sufficient for 1000s of tasks
- **Rendering optimization**: Only re-renders affected DOM sections
- **Chart updates**: Throttled to prevent excessive recalculations

### Future Enhancement Ideas

- 📦 Backend persistence with database (MongoDB, PostgreSQL)
- ☁️ Cloud sync across devices
- 🔔 Push notifications for due dates and streaks
- 📊 Advanced analytics (weekly/monthly completion stats)
- 🤖 AI-powered task suggestions
- 👥 Collaboration and sharing features
- 📱 Native mobile app using React Native or Flutter
- 🔐 User authentication and private/shared tasks

---

## Troubleshooting

### Tasks Not Saving?
- Check browser's localStorage is enabled (Privacy settings)
- Try clearing browser cache and reloading
- Open DevTools (F12) and check Console for errors

### Streak Not Updating?
- Ensure at least one task is marked as "Done" for 100% completion
- Check that task status changes are reflected in real-time
- Reload page to recalculate (typically automatic at midnight)

### Chart Not Displaying?
- Ensure Chart.js library loaded (check Network tab in DevTools)
- Refresh page to reload Chart.js
- Check browser console for JavaScript errors

### Dark Mode Not Saving?
- Clear localStorage and re-select theme (resets preferences)
- Try a different browser to isolate the issue

---

## License

This project is open source. Feel free to fork, modify, and use for personal or commercial purposes.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support & Feedback

For bugs, feature requests, or feedback:
- Open an issue on GitHub
- Check existing issues first to avoid duplicates
- Provide clear description and steps to reproduce

---

**Last Updated**: February 2025  
**Current Version**: 0.2.1  
**Status**: Active Development

