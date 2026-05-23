# sacBot AI

sacBot AI is a smart AI-powered personal assistant with conversational memory and real-time web search capabilities.

It supports conversational memory, real-time web search, and a clean, responsive chat interface.

---

## Features

- AI-powered chatbot
- Real-time web search using Tavily AI
- Conversation memory with NodeCache
- Tool calling support
- Clean responsive UI
- Loading animation
- Rate limiting for API protection
- Retry mechanism for failed requests
- Secure environment variable handling

---

## Tech Stack

### Frontend
- HTML
- Tailwind CSS
- JavaScript

### Backend
- Node.js
- Express.js
- Groq SDK
- Tavily API
- NodeCache

## Project Structure

```bash
sacBot-AI/
│
├── backend/
│   ├── llm.js
│   ├── server.js
│   ├── systemPrompt.js
│   ├── package.json
│   ├── .env
│
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── asset/
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone 
```

---

### Install Dependencies

```bash
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside backend folder:

```env
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

---

## ▶️ Run Project

### Start Backend

```bash
node server.js
```

### For Development

```bash
nodemon server.js
```

### Start Frontend

Run frontend using Live Server or any local server.

---

## 👨‍💻 Author

Sachin Kumar
