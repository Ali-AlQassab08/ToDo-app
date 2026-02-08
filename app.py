import os

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/board")
def board():
    return render_template("board.html")


@app.route("/tasks", methods=["POST"])
def create_task():
    # Client-side storage handles tasks; this is a stub for future persistence.
    payload = request.get_json(silent=True) or {}
    return jsonify({"status": "ok", "task": payload}), 201


@app.route("/tasks/<task_id>", methods=["GET"])
def get_task(task_id):
    return jsonify({"status": "ok", "taskId": task_id})


@app.route("/tasks/<task_id>", methods=["PUT"])
def update_task(task_id):
    payload = request.get_json(silent=True) or {}
    return jsonify({"status": "ok", "taskId": task_id, "task": payload})


@app.route("/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    return jsonify({"status": "ok", "taskId": task_id})


@app.route("/progress", methods=["GET"])
def progress():
    return jsonify({"status": "ok", "progress": []})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
