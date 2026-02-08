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
8. [Development](#development)

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
- ✏️ **Edit Tasks** - Modify task details anytime using an inline modal
- 🗑️ **Delete Tasks** - Remove tasks with a single click
- 📊 **Status Tracking** - Manage task status (Pending → In Progress → Done)
- 📅 **Due Dates** - Optional due date field with human-readable formatting (e.g., "Due Jan 15")

### Productivity Features
- 🔥 **Daily Streak Counter** - Tracks consecutive days of 100% task completion
- 📈 **Completion Graph** - Line chart displaying daily completion percentage over the last 14 days
- 🧹 **Clear Completed** - Bulk-remove finished tasks in one click
- 🔄 **Real-time Updates** - Streak and chart update instantly when tasks change

### User Experience
- 🎨 **Modern Design** - Clean, gradient background with smooth animations and micro-interactions
- 📱 **Responsive Layout** - Adapts beautifully from mobile to desktop screens
- ⌨️ **Accessible** - Semantic HTML, ARIA attributes, and keyboard-friendly interactions
- 🚀 **Offline-First** - All data stored locally; works without internet after first load
- 🌙 **Auto-Sync at Midnight** - Daily history is automatically updated at midnight for accurate streak calculation

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
│   └── task_modal.html       # Task creation/edit modal form
└── static/
    ├── css/
    │   └── styles.css        # All styling (colors, layout, animations)
    └── js/
        ├── app.js            # Main application logic (CRUD, streaks, history)
        └── chart.js          # Chart.js integration loader
```

### File Descriptions

- **app.py** - Flask server with routes for task CRUD operations (currently stubs for future persistence). Serves static files and templates.
- **base.html** - Jinja2 template that sets up the page structure, loads CSS and JS, and defines the layout container.
- **index.html** - Main page extending base.html with hero section, task list, and completion chart.
- **task_modal.html** - Modal dialog for creating and editing tasks with form fields.
- **styles.css** - Global styling including typography (Fraunces serif + Space Grotesk sans-serif), color scheme, component styles, and responsive breakpoints.
- **app.js** - Core application logic: localStorage management, task CRUD operations, streak calculation, history tracking, event listeners, and UI rendering.
- **chart.js** - Bootstrap loader that ensures Chart.js library is loaded before app.js runs.

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

- **`todoTasks`** - Array of task objects with structure:
  ```json
  {
    "id": "uuid",
    "title": "Task name",
    "description": "Optional description",
    "status": "Pending | In Progress | Done",
    "dueDate": "YYYY-MM-DD or empty"
  }
  ```

- **`todoProgress`** - Object tracking daily completion history:
  ```json
  {
    "2024-02-08": {
      "date": "2024-02-08",
      "completed": 3,
      "total": 5
    }
  }
  ```

### Streak Calculation Logic

1. Retrieves all saved daily history entries
2. Walks backward from today checking each day's completion percentage
3. A day "counts" if 100% of tasks were completed (completed === total)
4. Streak breaks if a day has < 100% completion
5. Returns cumulative count of consecutive 100% days

### Chart Visualization

- Displays last 14 days of completion percentages
- X-axis: Dates in YYYY-MM-DD format
- Y-axis: Percentage (0-100%)
- Blue-green line with light fill showing trend
- Tooltips show exact completion percentage on hover

---

## Development

### Project Design Philosophy

1. **No Framework Overhead** - Pure vanilla JavaScript for simplicity and full control
2. **No Backend Database** - localStorage is sufficient for personal task management
3. **Progressive Enhancement** - HTML/CSS work first; JavaScript enhances interactivity
4. **Accessibility First** - Semantic HTML and ARIA attributes built-in
5. **Modern Tooling** - CSS Grid/Flexbox, ES6+ JavaScript, responsive design

### Adding a Feature

1. **Define the data model** in localStorage structure
2. **Create UI elements** in HTML templates
3. **Write event listeners** in `app.js` to capture interactions
4. **Implement data modification** logic (load, mutate, save)
5. **Add re-rendering logic** to update the DOM
6. **Test locally** at `http://127.0.0.1:5000`

### Styling Customization

Edit [static/css/styles.css](static/css/styles.css) CSS variables at the root:

```css
:root {
  --ink: #101219;           /* Text color */
  --muted: #5a5f73;         /* Secondary text */
  --paper: #f7f2ea;         /* Background */
  --card: #ffffff;          /* Card background */
  --accent: #ff6f5b;        /* Primary CTA (orange) */
  --accent-2: #2a9d8f;      /* Secondary (teal/chart) */
  --shadow: rgba(...);      /* Box shadows */
}
```

### Future Enhancements

- **Backend Persistence** - Migrate tasks to a database (PostgreSQL/SQLite) for cross-device sync
- **User Authentication** - Add login system for multi-user support
- **Export/Import** - Download tasks as CSV or JSON
- **Notifications** - Browser push reminders for due dates
- **Tags/Categories** - Organize tasks by labels
- **Dark Mode** - Theme toggle in settings
- **Mobile App** - React Native or Flutter wrapper for iOS/Android

---

## License

This project is open source and available under the MIT License.
