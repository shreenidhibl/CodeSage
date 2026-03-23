import os
import asyncio
from dotenv import load_dotenv
from hindsight_client import Hindsight

# Load environment variables
load_dotenv()

HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")
HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
HINDSIGHT_BANK_ID = os.getenv("HINDSIGHT_BANK_ID")

client = Hindsight(
    base_url=HINDSIGHT_BASE_URL,
    api_key=HINDSIGHT_API_KEY
)

async def retain_facts(facts: list[str]) -> bool:
    """Retains a list of facts into Hindsight."""
    try:
        items = [{"content": fact} for fact in facts]
        await client.aretain_batch(bank_id=HINDSIGHT_BANK_ID, items=items)
        return True
    except Exception as e:
        print(f"Error retaining facts: {e}")
        return False

async def recall_memories(query: str, top_k: int = 5) -> list[str]:
    """Recalls memories relevant to the query."""
    try:
        response = await client.arecall(bank_id=HINDSIGHT_BANK_ID, query=query)
        memories = [result.text for result in getattr(response, "results", [])]
        return memories[:top_k]
    except Exception as e:
        print(f"Error recalling memories: {e}")
        return []

async def reflect_on(query: str) -> str:
    """Reflects on the query using memory context."""
    try:
        # Hindsight's areflect endpoint returns 404 and blocks for ~5s. 
        # We fetch facts via arecall and use Groq for the reflection logic instead!
        response = await client.arecall(bank_id=HINDSIGHT_BANK_ID, query=query[:100])
        results = getattr(response, "results", []) if hasattr(response, "results") else []
        memories = [getattr(res, "text", "") for res in results]
        context = "\n- ".join(memories)

        if not context.strip():
            context = "No specific patterns observed yet."

        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        if not GROQ_API_KEY:
            return ""

        from groq import AsyncGroq
        groq_client = AsyncGroq(api_key=GROQ_API_KEY)

        # Truncate prompt if extremely huge
        prompt = f"Memory Context:\n- {context[:2000]}\n\nTask: {query}\n"

        completion = await groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an analytical coding mentor. Provide a synthesized short reflection based on the user's past behaviors without markdown."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error reflecting on query (Groq Fallback): {e}")
        return ""

async def get_observations() -> list[dict]:
    """Retrieves all consolidated observations and maps them to standard dicts."""
    try:
        # Use underlying async _memory_api directly to avoid thread pool deadlocks
        response = await client._memory_api.list_memories(
            bank_id=HINDSIGHT_BANK_ID, 
            type="observation", 
            limit=100
        )
        
        items = getattr(response, "items", []) if hasattr(response, "items") else response.get("items", [])
        observations = []
        
        for item in items:
            if not isinstance(item, dict):
                item = getattr(item, "__dict__", item)
            
            if hasattr(item, "get"):
                summary = item.get("text", "")
                evidence_count = item.get("proof_count", 1)
            else:
                summary = getattr(item, "text", "")
                evidence_count = getattr(item, "proof_count", 1)

            # Generate a user-friendly title based on the summary
            title = "Pattern Observation"
            if "mistake category" in summary.lower():
                try:
                    cat = summary.lower().split("mistake category was ")[1].split(",")[0]
                    title = f"Pattern: {cat.capitalize()} Mistakes"
                except:
                    pass

            observations.append({
                "title": title,
                "summary": summary,
                "evidence_count": evidence_count
            })
            
        return observations
    except Exception as e:
        print(f"Error getting observations: {e}")
        return []

if __name__ == "__main__":
    async def test_hindsight():
        print("Testing Hindsight Connection...")
        if not HINDSIGHT_API_KEY or not HINDSIGHT_BANK_ID:
            print("Missing HINDSIGHT_API_KEY or HINDSIGHT_BANK_ID in .env. Skipping test.")
            return

        print(f"Using Bank ID: {HINDSIGHT_BANK_ID}")
        
        # Test retain
        fact = "The user is setting up the CodeSage project with FastAPI."
        print(f"Retaining fact: '{fact}'")
        retain_success = await retain_facts([fact])
        print(f"Retain Success: {retain_success}")

        # Wait a moment for indexing
        await asyncio.sleep(2)

        # Test recall
        query = "What is the user setting up?"
        print(f"Recalling query: '{query}'")
        memories = await recall_memories(query, top_k=2)
        print(f"Memories found: {len(memories)}")
        for i, mem in enumerate(memories):
            print(f"  {i+1}. {mem}")

    asyncio.run(test_hindsight())
