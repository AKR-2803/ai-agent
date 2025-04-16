# AI Agent Web App

An interactive AI-powered chat application built with **Vite + React**, using **Gemini 2.0 API** to power the AI agent, and **PostgreSQL** for conversation storage. The interface is designed to mimic the ChatGPT experience with a sleek and responsive UI.

## Preview

[Preview-01](../ai-agent/frontend/src/assets/ss01.png)
[Preview-02](../ai-agent/frontend/src/assets/ss02.png)

## Features [Till Now]

- Chat interface similar to ChatGPT
- Fast and lightweight frontend powered by Vite
- AI agent powered by Google Gemini 2.0 API
- Persistent conversation history using PostgreSQL
- Secure API integration and user-friendly UX

## 🛠️ Technologies Used

### Frontend
- [Vite](https://vitejs.dev/) – fast dev server and build tool
- [React](https://reactjs.org/) – component-based UI
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) – To communicate with backend

### Backend
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) – REST API server
- [Gemini 2.0 API](https://aistudio.google.com/) – google's multimodal AI
- [PostgreSQL](https://www.postgresql.org/) – db for persistent chat history
- ORM ([pg](https://www.npmjs.com/package/pg)) – db interaction

## 🧑‍💻 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- Gemini 2.0 API key

### 1. Clone the Repository

```bash
git clone https://github.com/AKR-2803/ai-agent.git
cd ai-agent
```

### 2. Install Dependencies

```bash
# frontend
cd frontend
npm install
```

```bash
# backend
cd backend
npm install
```

### 3. Environment Variables

- Create a `.env` file in the `backend/` directory:

```bash
DB_USER=your_db_name
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_history
PORT=3001
```

- Create a `.env` file in the `frontend/` directory:

```bash
VITE_GEMINI_API_KEY = your_gemini_API_KEY
```

- Refer the [docs here to get your api key](https://ai.google.dev/gemini-api/docs/api-key).


### 4. Run the App

```bash
# frontend
cd frontend
npm run dev

# start server
cd backend
node server.js
```

### Features [To be done...]

- Authentication (JWT or OAuth)
- Conversation tagging or grouping
- Export chats as pdf