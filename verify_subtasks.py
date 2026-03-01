import asyncio
import httpx
import sys

# Constants
BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "test@example.com"
PASSWORD = "password"

async def verify_subtasks():
    async with httpx.AsyncClient() as client:
        # 1. Login
        print(f"Logging in as {EMAIL}...")
        login_data = {
            "username": EMAIL,
            "password": PASSWORD
        }
        login_res = await client.post(f"{BASE_URL}/login/access-token", data=login_data)
        
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.status_code} {login_res.text}")
            return
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")

        # 2. Get a Task (or create one)
        print("Fetching tasks...")
        tasks_res = await client.get(f"{BASE_URL}/tasks/", headers=headers)
        if tasks_res.status_code != 200:
             print(f"Failed to fetch tasks: {tasks_res.text}")
             return
        
        tasks = tasks_res.json()
        if not tasks:
            print("No tasks found. Creating one...")
            task_res = await client.post(f"{BASE_URL}/tasks/", json={"title": "Test Task", "priority": 1}, headers=headers)
            task_id = task_res.json()["id"]
        else:
            task_id = tasks[0]["id"]
            print(f"Using Task ID: {task_id}")

        # 3. Create a Subtask
        print(f"Creating subtask for Task {task_id}...")
        subtask_data = {"title": "Verification Subtask"}
        create_res = await client.post(f"{BASE_URL}/tasks/{task_id}/subtasks/", json=subtask_data, headers=headers)
        
        if create_res.status_code != 200:
            print(f"Failed to create subtask: {create_res.status_code} {create_res.text}")
        else:
            print("Subtask created successfully.")

        # 4. Fetch Subtasks
        print(f"Fetching subtasks for Task {task_id}...")
        get_res = await client.get(f"{BASE_URL}/tasks/{task_id}/subtasks/", headers=headers)
        
        if get_res.status_code == 200:
            subtasks = get_res.json()
            print(f"Subtasks fetched: {len(subtasks)}")
            print(subtasks)
        else:
            print(f"Failed to fetch subtasks: {get_res.status_code} {get_res.text}")

if __name__ == "__main__":
    asyncio.run(verify_subtasks())
