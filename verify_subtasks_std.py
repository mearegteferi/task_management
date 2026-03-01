import urllib.request
import urllib.parse
import json
import uuid

# Constants
BASE_URL = "http://localhost:8000/api/v1"
EMAIL = f"verify_{uuid.uuid4().hex}@example.com"
PASSWORD = "password123"
FULL_NAME = "Verify User"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data:
        if method == "POST" and "application/x-www-form-urlencoded" in headers.get("Content-Type", ""):
            data = urllib.parse.urlencode(data).encode('utf-8')
        else:
             data = json.dumps(data).encode('utf-8')
             if "Content-Type" not in headers:
                 headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=data, method=method)
    for k, v in headers.items():
        req.add_header(k, v)
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return 0, str(e)

def verify():
    # 1. Register
    print(f"Registering {EMAIL}...")
    reg_data = {
        "email": EMAIL,
        "password": PASSWORD,
        "full_name": FULL_NAME
    }
    status, res = make_request(f"{BASE_URL}/users/signup", "POST", reg_data)
    if status != 200:
        print(f"Registration failed: {status} {res}")
        # Try login anyway, maybe it exists?
    else:
        print("Registration successful.")

    # 2. Login
    print(f"Logging in...")
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    status, res = make_request(f"{BASE_URL}/login/access-token", "POST", {"username": EMAIL, "password": PASSWORD}, headers)
    
    if status != 200:
        print(f"Login failed: {status} {res}")
        return

    token = res["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("Login successful.")

    # 3. Get Tasks
    print("Fetching tasks...")
    status, tasks = make_request(f"{BASE_URL}/tasks/", "GET", headers=auth_headers)
    if status != 200:
        print(f"Failed to fetch tasks: {status} {tasks}")
        return

    if not tasks:
        print("Creating task...")
        status, task = make_request(f"{BASE_URL}/tasks/", "POST", {"title": "Test Task", "priority": 1}, auth_headers)
        if status != 200:
             print(f"Failed to create task: {status} {task}")
             return
        task_id = task["id"]
    else:
        task = tasks[-1]
        task_id = task["id"]
        print(f"Using Task ID: {task_id}")

    # 4. Create Subtask
    print("Creating subtask...")
    sub_data = {"title": "Verify Subtask via URLLib"}
    status, sub = make_request(f"{BASE_URL}/tasks/{task_id}/subtasks/", "POST", sub_data, auth_headers)
    if status != 200:
        print(f"Failed create subtask: {status} {sub}")
        return
    else:
        print("Subtask created.")

    # 5. Fetch Subtasks
    print("Fetching subtasks...")
    status, subs = make_request(f"{BASE_URL}/tasks/{task_id}/subtasks/", "GET", headers=auth_headers)
    if status == 200:
        print(f"Subtasks found: {len(subs)}")
        print(json.dumps(subs, indent=2))
    else:
        print(f"Failed get subtasks: {status} {subs}")

if __name__ == "__main__":
    verify()
