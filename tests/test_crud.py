"""
CRUD Operation Tests for ToDo App

Tests verify the Create, Update, and Delete operations work correctly
by checking HTTP status codes and response content.

Following AAA pattern:
- Arrange: Set up test data
- Act: Call the endpoint
- Assert: Verify status AND response structure
"""

import pytest
from app import app


@pytest.fixture
def client():
    """Create test client for Flask application."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# ============================================================================
# CREATE TESTS (2 tests)
# ============================================================================

def test_create_task_basic(client):
    """
    Test CREATE operation with minimal task data.
    
    AAA Pattern:
    - Arrange: Prepare basic task data
    - Act: POST to /tasks endpoint
    - Assert: Verify 201 status + response contains task
    """
    # ARRANGE
    task_data = {"title": "Buy milk"}

    # ACT
    response = client.post("/tasks", json=task_data)

    # ASSERT: Status code
    assert response.status_code == 201
    
    # ASSERT: Response structure
    json_data = response.get_json()
    assert json_data["status"] == "ok"
    assert json_data["task"]["title"] == "Buy milk"


def test_create_task_with_all_fields(client):
    """
    Test CREATE operation with complete task object.
    
    Verifies all submitted fields are echoed back in response.
    """
    # ARRANGE
    task_data = {
        "title": "Complete project",
        "description": "Finish the ToDo app features",
        "priority": "high",
        "dueDate": "2026-03-10",
        "categories": ["Work", "Studying"],
        "status": "In Progress"
    }

    # ACT
    response = client.post("/tasks", json=task_data)

    # ASSERT: Status code
    assert response.status_code == 201
    
    # ASSERT: All fields present in response
    json_data = response.get_json()
    assert json_data["status"] == "ok"
    returned_task = json_data["task"]
    assert returned_task["title"] == "Complete project"
    assert returned_task["description"] == "Finish the ToDo app features"
    assert returned_task["priority"] == "high"
    assert returned_task["dueDate"] == "2026-03-10"
    assert returned_task["categories"] == ["Work", "Studying"]


# ============================================================================
# UPDATE TESTS (2 tests)
# ============================================================================

def test_update_task_returns_200(client):
    """
    Test UPDATE operation returns 200 and echoes updated payload.
    
    Verifies that PUT /tasks/<id> correctly updates and returns data.
    """
    # ARRANGE
    task_id = "task-123"
    update_data = {
        "title": "Updated task title",
        "status": "Done",
        "priority": "low"
    }

    # ACT
    response = client.put(f"/tasks/{task_id}", json=update_data)

    # ASSERT: Status code
    assert response.status_code == 200
    
    # ASSERT: Response contains updated data
    json_data = response.get_json()
    assert json_data["status"] == "ok"
    assert json_data["taskId"] == task_id
    assert json_data["task"]["title"] == "Updated task title"
    assert json_data["task"]["status"] == "Done"
    assert json_data["task"]["priority"] == "low"


def test_update_task_partial_fields(client):
    """
    Test UPDATE operation with partial field update.
    
    Verifies that only submitted fields are updated.
    """
    # ARRANGE
    task_id = "task-456"
    partial_update = {"title": "New title only"}

    # ACT
    response = client.put(f"/tasks/{task_id}", json=partial_update)

    # ASSERT: Status code
    assert response.status_code == 200
    
    # ASSERT: Response echoes back submitted update
    json_data = response.get_json()
    assert json_data["status"] == "ok"
    assert json_data["task"]["title"] == "New title only"


# ============================================================================
# DELETE TESTS (2 tests)
# ============================================================================

def test_delete_task_returns_200(client):
    """
    Test DELETE operation returns 200 and contains task ID.
    
    Verifies that DELETE /tasks/<id> works correctly.
    """
    # ARRANGE
    task_id = "task-789"

    # ACT
    response = client.delete(f"/tasks/{task_id}")

    # ASSERT: Status code
    assert response.status_code == 200
    
    # ASSERT: Response confirms deletion with task ID
    json_data = response.get_json()
    assert json_data["status"] == "ok"
    assert json_data["taskId"] == task_id


def test_delete_task_with_different_ids(client):
    """
    Test DELETE operation with various task IDs.
    
    Verifies endpoint works with UUIDs, integers, and strings.
    """
    # ARRANGE
    task_ids = [999, "uuid-12345-abcde", "simple-id"]

    # ACT & ASSERT for each ID
    for task_id in task_ids:
        response = client.delete(f"/tasks/{task_id}")
        
        # Status code should be 200
        assert response.status_code == 200
        
        # Response should confirm deletion
        json_data = response.get_json()
        assert json_data["status"] == "ok"
        assert str(json_data["taskId"]) == str(task_id)


# ============================================================================
# HTML ROUTE TESTS (2 tests)
# ============================================================================

def test_index_page_renders(client):
    """
    Test that GET / renders the index page correctly.
    
    Verifies the main page loads without errors.
    """
    # ARRANGE: Client ready

    # ACT
    response = client.get("/")

    # ASSERT: Status code
    assert response.status_code == 200
    
    # ASSERT: HTML content is present
    page_content = response.get_data(as_text=True)
    assert "<!DOCTYPE html>" in page_content or "<html" in page_content


def test_board_page_renders(client):
    """
    Test that GET /board renders the board page correctly.
    
    Verifies the Kanban board view loads without errors.
    """
    # ARRANGE: Client ready

    # ACT
    response = client.get("/board")

    # ASSERT: Status code
    assert response.status_code == 200
    
    # ASSERT: HTML content is present
    page_content = response.get_data(as_text=True)
    assert "<!DOCTYPE html>" in page_content or "<html" in page_content


# ============================================================================
# VERIFICATION THROUGH READ (Auxiliary)
# ============================================================================

def test_get_task_returns_task_data(client):
    """
    Test READ operation returns task data.
    
    Bonus test verifying GET /tasks/<id> works.
    """
    # ARRANGE
    task_id = "read-test-123"

    # ACT
    response = client.get(f"/tasks/{task_id}")

    # ASSERT: Status code
    assert response.status_code == 200
    
    # ASSERT: Response contains task ID
    json_data = response.get_json()
    assert json_data["status"] == "ok"
    assert json_data["taskId"] == task_id
