# 🌱 ZenVest – AI-Powered Personal Finance Advisor

ZenVest is an **AI-powered financial planning app** that helps users **set savings goals, track expenses, and receive personalized investment insights**.  
It combines **FastAPI** and **Express.js APIs** with a **Next.js frontend** to deliver a smooth experience.  

---

## 🚀 Features
- 💡 **AI Advisor** – Personalized savings & investment insights (powered by LLM).  
- 🎯 **Goal Tracking** – Define and track financial goals.  
- 📊 **Dashboard** – Income, expense, and savings visualizations.  
- 🔐 **Authentication** – Secure login with Clerk.  
- ⚡ **Hybrid Backend** – FastAPI (AI services) + Express.js (core APIs).  
- 🎨 **Next.js Frontend** – Clean, responsive, and user-friendly.  

---

## 🛠️ Tech Stack
- **Frontend:** Next.js, TailwindCSS, Clerk Auth  
- **Backend 1 (AI):** FastAPI (Python), Cohere, MongoDB  
- **Backend 2 (Core APIs):** Express.js (Node.js)  
- **Database:** MongoDB  

---

## 📂 Project Structure
```
zenvest/
│── backend/
│   ├── app/              # FastAPI app (AI insights & goal service)
│   │   ├── main.py
│   │   ├── services/
│   │   ├── models/
│   │   └── requirements.txt
│   ├── express-api/      # Express.js backend (general API services)
│   │   ├── index.js
│   │   ├── routes/
│   │   └── package.json
│── frontend/             # Next.js frontend
│   ├── pages/
│   ├── components/
│   └── package.json
│── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/zenvest.git
cd zenvest
```

---

### 2. Backend – FastAPI (AI Service)
```bash
cd backend/app
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Runs at: `http://localhost:8000`

---

### 3. Backend – Express.js (Core API Service)
```bash
cd backend/express-api
npm install
npm start
```
Runs at: `http://localhost:5000`

---

### 4. Frontend – Next.js
```bash
cd frontend
npm install
npm run dev
```
Runs at: `http://localhost:3000`

---

## 🔑 Environment Variables

### FastAPI (`backend/app/.env`)
```env
MONGO_URI=your_mongodb_uri
COHERE_API_KEY=your_cohere_api_key
SECRET_KEY=your_secret_key
```

### Express.js (`backend/express-api/.env`)
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
NEXT_PUBLIC_EXPRESS_API_URL=http://localhost:5000
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
