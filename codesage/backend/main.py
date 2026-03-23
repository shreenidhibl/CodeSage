from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import httpx
import asyncio
import tempfile
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from groq import AsyncGroq
from datetime import datetime, timedelta

# Internal hindsight service
import hindsight_service

# Load env variables
load_dotenv()

app = FastAPI()

# Add CORS middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = AsyncGroq(api_key=GROQ_API_KEY)

# Language ID mapping for Judge0
LANGUAGE_MAP = {
    "python": ("python", "3.10.0"),
    "python3": ("python", "3.10.0"),
    "javascript": ("javascript", "18.15.0"),
    "js": ("javascript", "18.15.0"),
    "c++": ("c++", "10.2.0"),
    "cpp": ("c++", "10.2.0"),
    "java": ("java", "15.0.2"),
}

async def run_code_local(source_code: str, language: str) -> dict:
    lang = language.lower()
    if lang in ("python", "python3"):
        cmd = ["python3"]
        ext = ".py"
    elif lang in ("javascript", "js"):
        cmd = ["node"]
        ext = ".js"
    else:
        cmd = ["python3"]
        ext = ".py"

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False, mode="w") as f:
        f.write(source_code)
        tmp_path = f.name

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd, tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(proc.communicate(), timeout=5.0)
        except asyncio.TimeoutError:
            proc.kill()
            stdout_bytes, stderr_bytes = await proc.communicate()
            stderr_bytes += b"\nTime Limit Exceeded (5s)."

        stdout = stdout_bytes.decode('utf-8', errors='replace')
        stderr = stderr_bytes.decode('utf-8', errors='replace')
        code = proc.returncode

        full_output = stdout
        if stderr:
            full_output += f"\nSTDERR:\n{stderr}"

        return {
            "stdout": stdout,
            "stderr": stderr,
            "full_output": full_output,
            "status": "Accepted" if code == 0 else "Runtime Error"
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# Transient Session Store
problem_history = [
    {
        "id": 1,
        "problem_title": "Fibonacci Sequence",
        "topic": "Recursion",
        "language": "python",
        "mistake_category": "conceptual",
        "summary": "User understands recursion structure but consistently misses terminal conditions",
        "trap_mode": False,
        "pattern_broken": False,
        "timestamp": (datetime.now() - timedelta(days=5)).isoformat()
    },
    {
        "id": 2,
        "problem_title": "Tower of Hanoi",
        "topic": "Recursion",
        "language": "python",
        "mistake_category": "logic",
        "summary": "recursion depth tracked incorrectly, n-1 used where n was needed",
        "trap_mode": False,
        "pattern_broken": False,
        "timestamp": (datetime.now() - timedelta(days=4, hours=22)).isoformat()
    },
    {
        "id": 3,
        "problem_title": "Rotate Array",
        "topic": "Arrays",
        "language": "python",
        "mistake_category": "logic",
        "summary": "classic off-by-one error, user does not dry-run loop boundaries",
        "trap_mode": False,
        "pattern_broken": False,
        "timestamp": (datetime.now() - timedelta(days=4, hours=15)).isoformat()
    },
    {
        "id": 4,
        "problem_title": "Reverse Words in a String",
        "topic": "Strings",
        "language": "javascript",
        "mistake_category": "conceptual",
        "summary": "user skips input validation entirely, assumes clean input always",
        "trap_mode": False,
        "pattern_broken": False,
        "timestamp": (datetime.now() - timedelta(days=3, hours=10)).isoformat()
    },
    {
        "id": 5,
        "problem_title": "Coin Change",
        "topic": "Dynamic Programming",
        "language": "python",
        "mistake_category": "complexity",
        "summary": "user does not consider optimal substructure, jumps to brute force",
        "trap_mode": False,
        "pattern_broken": False,
        "timestamp": (datetime.now() - timedelta(days=3, hours=5)).isoformat()
    },
    {
        "id": 6,
        "problem_title": "Find Kth Largest Element",
        "topic": "Sorting",
        "language": "python",
        "mistake_category": "complexity",
        "summary": "user unaware of heap-based selection algorithm, defaults to sort",
        "trap_mode": False,
        "pattern_broken": False,
        "timestamp": (datetime.now() - timedelta(days=2, hours=20)).isoformat()
    },
    {
        "id": 7,
        "problem_title": "Longest Substring Without Repeating",
        "topic": "Sliding Window",
        "language": "python",
        "mistake_category": "none",
        "summary": "clean sliding window implementation, good variable naming, considered edge cases",
        "trap_mode": False,
        "pattern_broken": False,
        "timestamp": (datetime.now() - timedelta(days=2, hours=12)).isoformat()
    },
    {
        "id": 8,
        "problem_title": "Search in Rotated Array",
        "topic": "Binary Search",
        "language": "python",
        "mistake_category": "none",
        "summary": "user is strong in binary search pattern recognition, clean O(log n) solution",
        "trap_mode": False,
        "pattern_broken": False,
        "timestamp": (datetime.now() - timedelta(days=1, hours=8)).isoformat()
    },
    {
        "id": 9,
        "problem_title": "Remove Nth Node from End",
        "topic": "Linked Lists",
        "language": "python",
        "mistake_category": "conceptual",
        "summary": "edge case of single-node list consistently missed, input validation habit absent",
        "trap_mode": False,
        "pattern_broken": False,
        "timestamp": (datetime.now() - timedelta(hours=14)).isoformat()
    },
    {
        "id": 10,
        "problem_title": "Maximum Depth of Binary Tree",
        "topic": "Trees",
        "language": "python",
        "mistake_category": "conceptual",
        "summary": "third recursion-related base case miss, user does not think about terminal states first",
        "trap_mode": False,
        "pattern_broken": False,
        "timestamp": (datetime.now() - timedelta(hours=2)).isoformat()
    }
]

# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class GenerateProblemRequest(BaseModel):
    topic: str
    trap_mode: bool

class SubmitRequest(BaseModel):
    code: str
    language: str
    problem_title: str
    problem_description: str
    topic: str
    trap_mode: bool
    hidden_trap: Optional[str] = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    current_problem: str
    current_code: str
    history: List[ChatMessage]

# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/generate-problem")
async def generate_problem(req: GenerateProblemRequest):
    print(f"--- [POST /api/generate-problem] Called for topic: {req.topic}, trap_mode: {req.trap_mode}")
    try:
        # Step 1: Recall memories
        recalled = await hindsight_service.recall_memories("What concepts and patterns has this user struggled with recently?")
        recalled_str = "\n".join(recalled) if recalled else "None recorded."

        # Step 2: Groq API Call
        if not req.trap_mode:
            system_prompt = f"""You are a coding mentor. Generate ONE coding problem for the topic: {req.topic}.
The user has struggled with: {recalled_str}.
Target their weak areas but make it a fair problem.
Respond in JSON only: {{"title": str, "difficulty": str, "description": str, "examples": [{{"input": str, "output": str}}], "constraints": [str], "hint_topic": str}}"""
        else:
            system_prompt = f"""You are a coding mentor in adversarial mode. Generate ONE coding problem for topic: {req.topic}.
The user has these specific blind spots: {recalled_str}.
Create a problem that LOOKS straightforward but contains a hidden trap directly targeting one of their weaknesses.
Do NOT mention the trap in the problem statement. Hide it in an edge case or subtle requirement.
Also return what the trap is so I can evaluate if they fell for it.
Respond in JSON only: {{"title": str, "difficulty": str, "description": str, "examples": [{{"input": str, "output": str}}], "constraints": [str], "hint_topic": str, "hidden_trap": str, "trap_weakness_targeted": str}}"""

        response = await groq_client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}],
            model="qwen3-32b",
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        # Fallback handling just in case qwen isn't immediately available
        # Wait, groq handles exactly the model you pass or throws. 
        # I'll let standard error handle if the model throws, but standard instructions said "or fallback to llama-3.3...".
        # A simple try/except inside could catch 404/400 and retry with llama.
        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        print(f"Groq API primary model failed, attempting fallback. Error: {e}")
        try:
            # Fallback to llama-3.3-70b-versatile
            response = await groq_client.chat.completions.create(
                messages=[{"role": "system", "content": system_prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as fallback_err:
            print(f"Error in /api/generate-problem: {fallback_err}")
            return JSONResponse(status_code=500, content={"error": str(fallback_err)})


@app.post("/api/submit")
async def submit_solution(req: SubmitRequest):
    print(f"--- [POST /api/submit] Called for problem: {req.problem_title}, lang: {req.language}")
    try:
        # Step 1: Execute code locally
        result = await run_code_local(req.code, req.language)
        full_output = result["full_output"]
        status_desc = result["status"]

        # Step 2: Code Autopsy via Groq
        autopsy_prompt = f"""You are a code analysis expert. Analyze the submitted code and return ONLY a JSON object, no markdown, no explanation.
JSON shape: {{
    "behavioral_patterns": [str],
    "mistake_category": "conceptual" | "syntax" | "logic" | "complexity" | "none",
    "complexity_awareness": bool,
    "planning_signals": str,
    "trap_triggered": bool,
    "summary": str
}}
behavioral_patterns: list of strings describing HOW the user codes, e.g. 'avoids recursion', 'ignores edge cases', 'good variable naming'
mistake_category: the primary type of mistake if any
complexity_awareness: did the user consider time/space complexity
planning_signals: evidence of planning or lack thereof from code style
trap_triggered: if hidden_trap was provided, did the user fall for it? Otherwise false.
summary: one sentence about this submission for memory storage

Problem Context:
Title: {req.problem_title}
Description: {req.problem_description}
Hidden Trap: {req.hidden_trap if req.trap_mode else 'None'}

User Code:
{req.code}

Output Status: {status_desc}
"""
        autopsy_resp = await groq_client.chat.completions.create(
            messages=[{"role": "system", "content": autopsy_prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.1
        )
        autopsy_data = json.loads(autopsy_resp.choices[0].message.content)

        # Step 3: Call retain_facts()
        facts_to_retain = [
            f"User attempted a {req.topic} problem: {req.problem_title}",
            f"Mistake category: {autopsy_data.get('mistake_category', 'none')}",
            f"Language used: {req.language}",
            f"Code Autopsy summary: {autopsy_data.get('summary', '')}"
        ]
        
        for pattern in autopsy_data.get('behavioral_patterns', []):
            facts_to_retain.append(f"Behavioral pattern observed: {pattern}")
            
        pattern_broken = False
        pattern_broken_detail = ""
        
        if req.trap_mode:
            trap_triggered = autopsy_data.get('trap_triggered', False)
            trap_weakness = req.hidden_trap or "logic trap"
            if not trap_triggered:
                facts_to_retain.append(f"User successfully identified and avoided the {trap_weakness} trap")
                pattern_broken = True
                pattern_broken_detail = f"You caught the {trap_weakness} trap — your recall() history showed you used to fall for this!"
            else:
                facts_to_retain.append(f"User fell for the {trap_weakness} trap — hidden_trap: {req.hidden_trap}")

        await hindsight_service.retain_facts(facts_to_retain)

        # Step 4: Generate feedback via Groq
        feedback_prompt = f"""You are a coding mentor. The user submitted code for the problem below. Give concise, constructive feedback in 3-5 sentences. Point out what they did well, what went wrong, and what concept to review. Do not give the full solution. Respond in plain text.

Problem: {req.problem_title} - {req.problem_description}

User Code:
{req.code}

Execution Output: {status_desc} - {full_output}

Autopsy Results: {json.dumps(autopsy_data)}
"""
        feedback_resp = await groq_client.chat.completions.create(
            messages=[{"role": "system", "content": feedback_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.7
        )
        feedback_text = feedback_resp.choices[0].message.content

        # Append to History Session memory
        problem_history.append({
            "id": len(problem_history) + 1,
            "problem_title": req.problem_title,
            "topic": req.topic,
            "language": req.language,
            "mistake_category": autopsy_data.get("mistake_category", "none"),
            "summary": autopsy_data.get("summary", ""),
            "trap_mode": req.trap_mode,
            "pattern_broken": pattern_broken,
            "timestamp": datetime.now().isoformat()
        })

        return {
            "judge0_output": full_output,
            "judge0_status": status_desc,
            "autopsy": autopsy_data,
            "feedback": feedback_text,
            "pattern_broken": pattern_broken,
            "pattern_broken_detail": pattern_broken_detail
        }

    except Exception as e:
        print(f"Error in /api/submit: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/recall-context")
async def recall_context(topic: str):
    print(f"--- [GET /api/recall-context] Called for topic: {topic}")
    try:
        memories = await hindsight_service.recall_memories(topic)
        return {"memories": memories}
    except Exception as e:
        print(f"Error in /api/recall-context: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/history")
async def get_history():
    print("--- [GET /api/history] Called")
    return {"history": problem_history[::-1]}

@app.get("/api/daily-challenge")
async def daily_challenge():
    print("--- [GET /api/daily-challenge] Called")
    try:
        reflection = await hindsight_service.reflect_on("What is the single most important concept this user should practice today based on recent mistakes? Respond in JSON format: {\"topic\": \"...\", \"reason\": \"...\"}")
        
        try:
            # Extract JSON from potential markdown block return
            text = reflection.strip()
            if text.startswith("```json"):
                text = text[7:-3].strip()
            elif text.startswith("```"):
                text = text[3:-3].strip()
            
            data = json.loads(text)
            return {
                "topic": data.get("topic", "Arrays"),
                "reason": data.get("reason", "Good foundational practice")
            }
        except:
            return {"topic": "Arrays", "reason": f"Fallback reason based on reflection: {reflection[:100]}"}

    except Exception as e:
        print(f"Error in /api/daily-challenge: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/chat")
async def chat_interaction(req: ChatRequest):
    print(f"--- [POST /api/chat] Called with message: {req.message[:50]}...")
    try:
        # Step 1: Recall
        recalled = await hindsight_service.recall_memories(req.message)
        recalled_str = "\n".join(recalled) if recalled else "None recorded."

        # Step 2: Groq completion
        system_prompt = f"""You are a Socratic coding mentor. You NEVER give the answer directly.
When the user asks for help, look at their memory history and find a past concept they understood well, then guide them to apply it here.
If their memory shows a recurring pattern, point it out gently.
Keep responses under 100 words. Ask one guiding question at the end.
User's relevant past patterns from memory: {recalled_str}
Current problem: {req.current_problem}
Current code: {req.current_code}"""
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in req.history:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": req.message})

        chat_resp = await groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7
        )
        reply = chat_resp.choices[0].message.content

        return {
            "reply": reply,
            "memories_used": recalled
        }

    except Exception as e:
        print(f"Error in /api/chat: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/dashboard")
async def dashboard():
    print("--- [GET /api/dashboard] Called")
    try:
        reflection_coro = hindsight_service.reflect_on("Summarize all patterns, weaknesses, and strengths observed for this user")
        observations_coro = hindsight_service.get_observations()

        reflection, observations = await asyncio.gather(reflection_coro, observations_coro)

        return {
            "reflection": reflection,
            "observations": observations
        }

    except Exception as e:
        print(f"Error in /api/dashboard: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
