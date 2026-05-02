# MicroDo

**Set big goals. Get micro-steps.**

### 🌍 **[Live Demo: micro-do.vercel.app](https://micro-do.vercel.app/)**

<img width="1919" height="1079" alt="Page screenshot" src="https://github.com/user-attachments/assets/3ae8db70-507f-453e-86f5-54a7f8206882"/>

<br>
MicroDo is a minimalist, AI-powered web application that helps users stop procrastinating by automatically breaking down large, complex goals into highly actionable micro-steps. 
<br></br>
This full-stack project integrates a React frontend with an Express backend, utilizing AI to dynamically process and generate tasks.

## ✨ Features

- **AI-Powered Breakdown:** Simply enter a large goal, and the AI will evaluate its complexity and instantly generate a customized list of actionable first steps.
- **Full CRUD Functionality:** Create new goals, read existing ones, update (toggle) step completion status, and delete goals.
- **Minimalist UI:** A clean, distraction-free interface inspired by modern developer tools.
- **Cloud Database:** Persistent data storage using MongoDB Atlas.
- **Serverless Deployment:** Fully deployed and hosted on Vercel.

## 🛠️ Tech Stack

**Frontend:**
- React.js (via Vite)
- Tailwind CSS

**Backend:**
- Node.js & Express.js
- Mongoose (MongoDB Object Modeling)

**Deployment:**
- Vercel (Static frontend & Serverless backend functions)
- MongoDB Atlas (Database)

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js installed on your machine
- A MongoDB Atlas connection string
- A Google AI Studio API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/davidalexander24/micro-do
   cd micro-do
   ```

2. Install dependencies for the **backend**:
   ```bash
   cd backend
   npm install
   ```

3. Install dependencies for the **frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the `backend` directory and add your secret keys:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
```

### Running the App Locally

1. Start the backend server (from the `/backend` directory):
   ```bash
   npm start
   ```

2. Start the frontend development server (from the `/frontend` directory):
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`.

---
*Developed by David Alexander - Faculty of Engineering, Universitas Indonesia.*
