# ProjectFlow — Project Management System

A full-stack Kanban-style project management tool (simplified Trello) built with React, Node.js, MongoDB, and Firebase Auth.

## Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | React 18 + Vite + Tailwind CSS    |
| Backend    | Node.js + Express                 |
| Database   | MongoDB + Mongoose                |
| Auth       | Firebase Authentication           |
| Drag & Drop| @hello-pangea/dnd                 |

## Features

- **Authentication** — Email/password and Google sign-in via Firebase
- **Projects** — Create, edit, delete projects; invite members with role management (Admin / Member / Viewer)
- **Kanban Board** — Drag-and-drop tasks between columns; add/rename/delete columns
- **Task Details** — Title, description, assignee, due date, priority, labels, comments, activity log
- **Dashboard** — View all projects, overdue / due today / upcoming task summaries
- **Dark Mode** — Toggle between light and dark themes
- **Responsive** — Works on desktop and mobile

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── pages/          # Dashboard, Project, Login, Register
│   │   ├── styles/         # Tailwind CSS entry
│   │   └── utils/          # Firebase config, Axios API client
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                 # Express backend
│   ├── config/             # DB connection, Firebase Admin init
│   ├── controllers/        # Route handlers
│   ├── middleware/          # Auth verification, error handler
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routers
│   └── server.js           # Entry point
```

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally or a MongoDB Atlas connection string
- **Firebase project** with Authentication enabled (Email/Password + Google provider)

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd "Project Management System"
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in method → Enable **Email/Password** and **Google**
4. Go to **Project settings** → **General** → copy the Firebase web config
5. Go to **Project settings** → **Service accounts** → Generate a new private key (JSON)

### 3. Backend Setup

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
- Set `MONGODB_URI` to your MongoDB connection string
- Set `FIREBASE_SERVICE_ACCOUNT_KEY` to the contents of your Firebase service account JSON (all on one line)

Install dependencies and start:

```bash
npm install
npm run dev
```

The server starts at `http://localhost:5000`.

### 4. Frontend Setup

```bash
cd client
cp .env.example .env
```

Edit `client/.env` with your Firebase web config values.

Install dependencies and start:

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint                          | Description              |
| ------ | --------------------------------- | ------------------------ |
| POST   | `/api/auth/register`              | Register / sync user     |
| POST   | `/api/auth/login`                 | Login via Firebase token |
| GET    | `/api/auth/me`                    | Get current user         |
| GET    | `/api/projects`                   | List user's projects     |
| POST   | `/api/projects`                   | Create project           |
| PUT    | `/api/projects/:id`               | Update project           |
| DELETE | `/api/projects/:id`               | Delete project           |
| POST   | `/api/projects/:id/invite`        | Invite member            |
| GET    | `/api/projects/:id/board`         | Get board (columns+tasks)|
| GET    | `/api/projects/:id/activity`      | Get activity log         |
| POST   | `/api/columns`                    | Create column            |
| PUT    | `/api/columns/:id`                | Rename column            |
| DELETE | `/api/columns/:id`                | Delete column            |
| PUT    | `/api/columns/reorder`            | Reorder columns          |
| GET    | `/api/tasks`                      | Get tasks (filterable)   |
| GET    | `/api/tasks/my-tasks`             | Get user's assigned tasks|
| POST   | `/api/tasks`                      | Create task              |
| PUT    | `/api/tasks/:id`                  | Update task              |
| DELETE | `/api/tasks/:id`                  | Delete task              |
| PUT    | `/api/tasks/reorder`              | Reorder/move tasks       |
| POST   | `/api/tasks/:id/comments`         | Add comment              |
| GET    | `/api/tasks/:id/comments`         | Get task comments        |

## Deployment

- **Frontend**: Build with `npm run build` → deploy `dist/` to Firebase Hosting
- **Backend**: Deploy to Railway or Render; set environment variables in the platform dashboard

## License

MIT
