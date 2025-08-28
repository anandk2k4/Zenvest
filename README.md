# 🌱 ZenVest – AI-Powered Personal Finance Advisor

ZenVest is an **AI-powered financial planning app** that helps users **set savings goals, track expenses, and receive personalized investment insights**.  
It combines **FastAPI** and **Express.js APIs** with a **React + ts + tailwind as frontend** to deliver a smooth experience.  

---

## 🚀 Features
- 💡 **AI Advisor** – Personalized investment insights.  
- 🎯 **Goal Tracking** – Define and track financial goals and get ai suggestions.  
- 📊 **Budget Planner** – Income, expense, and savings visualizations.
- 📰 **Finance News** – Gives the real-time Finance News.  
- 🔐 **Authentication** – Secure login with Clerk.  
- ⚡ **Hybrid Backend** – FastAPI + Express.js (core APIs).  
- 🎨 **React Frontend** – Clean, responsive, and user-friendly.  

---

## 🛠️ Tech Stack
- **Frontend:** React, Typescript, TailwindCSS, Clerk Auth  
- **Backend 1 :** FastAPI (Python), Cohere, MongoDB  
- **Backend 2 (Core APIs):** Express.js (Node.js)  
- **Database:** MongoDB  

---

## 📂 Project Structure
```
zenvest/
│── backend/
│   ├── app/              # FastAPI app (AI insights, goal service & Budget services)
│   ├── express-api/      # Express.js backend (Work as Caching layer for News API and general API services)
│   ├── requirements.txt
│── frontend/             # React + vite frontend
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/zenvest.git
cd zenvest
```

---

### 2. Backend – FastAPI 
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Runs at: `http://localhost:8000`

---

### 3. Backend – Express.js 
```bash
cd backend/express-api
npm install
npm start
```
Runs at: `http://localhost:3001`

---

### 4. Frontend – React + vite + TypeScript
```bash
cd frontend
npm install
npm run dev
```
Runs at: `http://localhost:5173`

---

## 🔑 Environment Variables

### FastAPI (`backend/.env`)
```env
MONGODB_URL=your_mongodb_url
DB_NAME=your_mongodb_database_name
COHERE_API_KEY=your_cohere_api_key
GNEWS_API_KEY=your_gnews_api_key
CRYPTOCOMPARE_API_KEY=your_cryptocompare_api_key
GEMINI_API_KEY=your_gemini_api_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### Frontend (`frontend/.env`)
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:3001
```

---

## 🤝 Contributing
Contributions are welcome!  
1. Fork the repo  
2. Create a branch (`git checkout -b feature-xyz`)  
3. Commit changes (`git commit -m "Added xyz"`)  
4. Push (`git push origin feature-xyz`)  
5. Open PR  

---

## 📜 License
Licensed under the **MIT License**.  
