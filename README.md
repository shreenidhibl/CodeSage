# CodeSage 🧠⚡

**CodeSmarter. Learn Faster.**

CodeSage is an intelligent AI coding practice mentor equipped with persistent memory. Instead of blindly grinding generic problems, CodeSage tracks your specific mistakes, recalls your past context, and dynamically generates bespoke challenges designed specifically to patch your knowledge gaps.

## ✨ Features

- **Hindsight Memory System**: Automatically analyzes your code submissions and categorizes your specific weaknesses (Syntax, Conceptual, Logic, Complexity, Edge Cases). We use advanced vector search to recall your past mistakes.
- **Dynamic Problem Generation**: Uses highly capable LLMs to generate single-function challenges that actively target the specific areas you struggle with most. No two problems are the same.
- **⚡ Trap Mode**: Activates a rigorous generation mode that injects subtle, hidden edge-cases into problems to test your true attention to detail.
- **TraceAI Mentor Sidebar**: A built-in, Socratic AI chatbot that has full context of your active code and problem statement. Instead of just giving you the answer, it guides you conceptually.
- **Micro-Analysis Autopsy**: Validates your code output against a secure Judge0 sandbox and provides a deep, personalized feedback loop on your performance and code smells.

## 🛠 Tech Stack

**Frontend**
- React 18 (Vite)
- Tailwind CSS (Custom Dark Theme UX)
- Monaco Editor (VS Code core)
- Recharts (Data Visualization)
- Context API (Global State & Toast Notifications)

**Backend**
- Python 3.10+ & FastAPI
- SQLAlchemy (Async ORM) & asyncpg
- PostgreSQL (pgvector compatible)
- External APIs: Groq (Llama-3), PISTON (Secure Code Execution)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.10 or higher)
- PostgreSQL database
- API Keys for Groq and PISTON

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure your environment variables
cp .env.example .env
# Open .env and insert your DATABASE_URL, GROQ_API_KEY, and JUDGE0_API_KEY

# Run the FastAPI server
uvicorn main:app --reload --port 8000
```
*The backend will be running at `http://localhost:8000`*

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend will be running at `http://localhost:5173`*

### 3. Demo Access
Open your browser and navigate to the frontend URL. 
Use the following local demo credentials to bypass the dummy authentication gate:
- **Username**: `user`
- **Password**: `1234`

## 🎨 UI & UX Specifications

This application adheres to a strict, modern dark-mode aesthetic:
- **Backgrounds**: Deep, rich darks (`#0a0f1e`, `#1a1a1a`, `#141414`)
- **Accents**: Vibrant, high-contrast indicators (`#ffa116` Orange, `#2cbb5d` Success Green, `#c084fc` AI Purple, `#ff375f` Error Red)
- **Typography**: Clean, readable sans-serif fonts natively relying on Google Inter or system UI fonts.
- **Micro-interactions**: Subtle hover states, animated state-machines for async tasks, and non-blocking toast notifications.

## 📝 License

Built for hackathons and continuous learning.
