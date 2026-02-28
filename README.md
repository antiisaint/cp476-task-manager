# Task/To-Do Management System
CP476A - Internet Computing (Winter 2026)

## Description
A web based task manager for organizing and tracking work in personal or team settings. Users can create tasks, set priorities and due dates, and track progress.

## Features
- User authentication (register/login/logout)
- Task CRUD operations (create, view, edit, delete)
- Priority levels (Low, Medium, High)
- Due date assignment
- Task status tracking (Pending, In Progress, Completed)
- Filter and sort tasks
- Team task assignment

## Run Locally (Frontend + Backend)
1. Install dependencies:
   - `npm install`
2. Start backend:
   - Development mode: `npm run dev`
   - Normal mode: `npm start`
3. Open the frontend directly:
   - Open `index.html` in your browser (double-click or right-click -> Open With browser)

Backend default URL: `http://localhost:3000`
Frontend file: `index.html`

## Initial Backend Routes (Skeleton)
- `GET /` - API welcome route
- `POST /api/auth/register` - register stub
- `POST /api/auth/login` - login stub
- `POST /api/auth/logout` - logout stub
- `GET /api/tasks` - list tasks stub
- `GET /api/tasks/:id` - get one task stub
- `POST /api/tasks` - create task stub
- `PUT /api/tasks/:id` - update task stub
- `DELETE /api/tasks/:id` - delete task stub

## Database Design
- SQL schema (`CREATE TABLE` statements): `database/schema.sql`

## Folder Structure
- `backend/server.js` - backend entry point
- `backend/src/app.js` - Express app setup
- `backend/src/routes/` - API route definitions
- `backend/src/controllers/` - route handler stubs
- `database/schema.sql` - SQL `CREATE TABLE` statements

## Technologies
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js
- **Database:** MySQL
- **Version Control:** GitHub
