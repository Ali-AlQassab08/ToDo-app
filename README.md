# Daily Flow (Flask To-Do)

A minimal Flask + vanilla JS to-do app with CRUD, daily streak tracking, and a completion graph.

## Run locally

```bash
python app.py
```

Open `http://127.0.0.1:5000` in your browser.

## Run with Docker

Build the image:

```bash
docker build -t qassab/todo_app:latest .
```

Run the container:

```bash
docker run --rm -p 5000:5000 qassab/todo_app:latest
```

Open `http://127.0.0.1:5000` in your browser.

## Publish to Docker Hub

```bash
docker login
docker push qassab/todo_app:latest
```

## Features

- Create, edit, delete tasks with title, description, status, and optional due date.
- Daily completion streak based on consecutive 100% days.
- Chart.js line graph of daily completion percentage.
- Client-side storage via `localStorage` (no database).

## Project layout

```
app.py
templates/
  base.html
  index.html
static/
  css/
    styles.css
  js/
    app.js
    chart.js
```
