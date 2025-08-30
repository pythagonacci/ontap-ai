import httpx
import json
from .settings import settings

SYSTEM_PROMPT = (
    "You are a helpful assistant living inside a command palette. "
    "You can explain passages, rephrase text in a specified tone, or answer questions succinctly. "
    "During regular conversation, ignore any URL context provided unless the user specifically asks about the current page or website."
)

def build_messages(action: str, user_input: str, url: str | None, tone: str | None):
    if action == "explain":
        user = f"Explain this text:\n\n{user_input}"
    elif action == "rephrase":
        t = f" in a '{tone}' tone" if tone else ""
        user = f"Rephrase this text{t}:\n\n{user_input}"
    else:  # answer
        # Only include URL context if user specifically asks about the page/website
        url_keywords = ["page", "website", "site", "url", "link", "this page", "current page", "webpage"]
        should_include_url = url and any(keyword in user_input.lower() for keyword in url_keywords)
        ctx = f"\n\nContext URL: {url}" if should_include_url else ""
        user = f"Answer this question:{ctx}\n\n{user_input}"
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user}
    ]

def run_chat_completion(action: str, user_input: str, url: str | None, tone: str | None) -> str:
    try:
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": settings.OPENAI_MODEL,
            "messages": build_messages(action, user_input, url, tone),
            "temperature": 0.3,
            "max_tokens": 800
        }
        
        with httpx.Client() as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"] or ""
            
    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        raise e
