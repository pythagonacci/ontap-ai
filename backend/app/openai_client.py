from openai import OpenAI
from .settings import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = (
    "You are a helpful assistant living inside a command palette. "
    "You can explain passages, rephrase text in a specified tone, or answer questions succinctly."
)

def build_messages(action: str, user_input: str, url: str | None, tone: str | None):
    if action == "explain":
        user = f"Explain this text:\n\n{user_input}"
    elif action == "rephrase":
        t = f" in a '{tone}' tone" if tone else ""
        user = f"Rephrase this text{t}:\n\n{user_input}"
    else:  # answer
        ctx = f"\n\nContext URL: {url}" if url else ""
        user = f"Answer this question:{ctx}\n\n{user_input}"
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user}
    ]

def run_chat_completion(action: str, user_input: str, url: str | None, tone: str | None) -> str:
    resp = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=build_messages(action, user_input, url, tone),
        temperature=0.3,
        max_tokens=800,
    )
    return resp.choices[0].message.content or ""
