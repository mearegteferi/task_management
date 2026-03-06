# How the Sofi Task Frontend Works (A Simple Guide)

This document explains the "life cycle" of our frontend application, from the moment you open it to how it handles your tasks.

## 1. The Core Technologies
- **Next.js 15**: The "brain" of our app. It handles where you go (routing), how fast things load, and how the page is put together.
- **Tailwind CSS 4**: The "skin" of our app. It makes everything look premium, handles dark mode, and ensures buttons and cards look consistent.
- **Zustand**: The "memory" of our app. It remembers who you are (logged in) and keeps your security tokens safe even if you refresh the page.
- **Axios**: The "messenger". It carries requests from your browser to the backend server and brings back your data.

## 2. The Journey: Start to End

### Step A: Opening the App (The Receptionist)
When you first land on `http://localhost:3000`, the **Root Page** acts like a receptionist.
- It checks the **Memory** (Zustand) for an "Access Token".
- If you have one, it quickly whisks you to the `/dashboard`.
- If not, it redirects you to the `/login` page.

### Step B: Logging In (The Gatekeeper)
On the **Login Page**:
1. You enter your email and password.
2. The **Auth Service** sends this to the Backend.
3. If correct, the Backend gives us two keys: an **Access Token** (short-term) and a **Refresh Token** (long-term).
4. Our **Memory** (Zustand) saves these keys so you don't have to log in again every 5 minutes.

### Step C: The Dashboard (The Control Room)
Once inside, you see the **Sidebar** and **Navbar**. 
- These are constant. No matter if you are looking at "Projects" or "Tasks", the sidebar stays so you can navigate easily.
- The **Dashboard** immediately asks the **Analytics Service** for data. It shows you how many projects you have and how many are "Done" using a visual chart.

### Step D: Managing Projects (The Filing Cabinet)
When you click on **Projects**:
1. The **Project Service** fetches a list of everything you're working on.
2. Each project is shown as a **Card** with its priority (Low, Medium, High).
3. Clicking a project takes you "inside" it via a **Dynamic Route** (`/projects/[id]`).

### Step E: Working on Tasks (The To-Do List)
Inside a Project:
- You see a list of **Tasks**. 
- Each task has a **Checkbox**. When you click it, the **Task Service** tells the backend to mark it as "Complete".
- You can add new tasks by typing in the box and hitting "Enter". This updates the list instantly without reloading the whole page.

### Step F: Staying Logged In (The Automatic Refresher)
Our "Messenger" (Axios) has a special feature called an **Interceptor**. 
- If your "Access Token" expires while you are using the app, the messenger notices a "401 Error".
- Before you even see an error, it silently uses your **Refresh Token** to get a brand new key and retries your request. 
- To you, the app just keeps working smoothly!

---

## 3. Folder Structure Simplified
- `/app`: Contains all the pages (Routes).
- `/components`: The building blocks (Buttons, Inputs, Sidebar).
- `/services`: The logic for talking to the Backend (Auth, Projects, Tasks).
- `/store`: Where we keep the "Memory" (Auth tokens).
- `/lib`: Utility tools (like the API messenger).

---

## 4. Understanding the Map (Routing)

Next.js uses a **File-Based Routing** system. This means the structure of your folders in the `frontend/app` directory *is* the URL map of your website.

### How a URL turns into a Page:
1. **The URL Path**: When you visit `http://localhost:3000/projects/5`, Next.js looks inside the `app/` folder.
2. **The Folder Search**: It looks for a folder named `projects`, then a folder named `[id]` (this is a placeholder for `5`).
3. **The `page.tsx` File**: Inside that final folder, it looks for a file specifically named `page.tsx`. This is the only file that gets turned into a webpage.

### Special Folder Types we use:
- **Route Groups `(name)`**: Folders with parentheses, like `(dashboard)`, are **invisible** in the URL. We use them just to group pages that share the same sidebar and header. 
  - *Example*: `app/(dashboard)/analytics/page.tsx` becomes `http://localhost:3000/analytics`.
- **Dynamic Routes `[id]`**: Folders with square brackets are like variables. They can "catch" any number or ID.
  - *Example*: `app/(dashboard)/projects/[id]/page.tsx` catches `/projects/1`, `/projects/2`, etc.

### Layers (Layouts):
Each folder can also have a `layout.tsx`. This is like a "frame" that wraps around every page inside that folder. Our `(dashboard)/layout.tsx` is what keeps the Sidebar and Navbar visible while the middle of the screen changes from "Dashboard" to "Settings".
