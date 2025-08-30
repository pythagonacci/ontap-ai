import httpx
import json
import time
import random
from .settings import settings
from .models import Message

SYSTEM_PROMPT = (
    "You are a helpful assistant living inside a command palette. "
    "You can explain passages, rephrase text in a specified tone, or answer questions succinctly. "
    "During regular conversation, ignore any URL context provided unless the user specifically asks about the current page or website. "
    "IMPORTANT: Maintain conversation context and flow naturally. If a user's message seems incomplete or like a continuation of a previous thought, "
    "connect it to the conversation history and respond appropriately. Don't ask for clarification unless absolutely necessary."
)

def build_messages(action: str, user_input: str, url: str | None, tone: str | None, conversation_history: list[Message] | None = None):
    # Start with system message
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    # Add conversation history if provided
    if conversation_history:
        for msg in conversation_history:
            messages.append({"role": msg.role, "content": msg.content})
    
    # Build the current user message
    if action == "explain":
        user = f"Explain this text:\n\n{user_input}"
    elif action == "rephrase":
        t = f" in a '{tone}' tone" if tone else ""
        user = f"Rephrase this text{t}:\n\n{user_input}"
    else:  # answer
        # For conversational flow, don't wrap in prefixes if there's history
        if conversation_history:
            # Natural conversation - just use the user input directly
            user = user_input
        else:
            # First message - can add context if needed
            url_keywords = ["page", "website", "site", "url", "link", "this page", "current page", "webpage"]
            should_include_url = url and any(keyword in user_input.lower() for keyword in url_keywords)
            ctx = f"\n\nContext URL: {url}" if should_include_url else ""
            user = f"Answer this question:{ctx}\n\n{user_input}"
    
    messages.append({"role": "user", "content": user})
    return messages

def run_chat_completion(action: str, user_input: str, url: str | None, tone: str | None, conversation_history: list[Message] | None = None) -> str:
    max_retries = 3
    base_delay = 1.0  # Start with 1 second
    
    for attempt in range(max_retries):
        try:
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": settings.OPENAI_MODEL,
                "messages": build_messages(action, user_input, url, tone, conversation_history),
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
                
                # Handle rate limiting specifically
                if response.status_code == 429:
                    retry_after = response.headers.get('Retry-After')
                    if retry_after:
                        wait_time = int(retry_after)
                    else:
                        # Exponential backoff with jitter
                        wait_time = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    
                    print(f"Rate limited (attempt {attempt + 1}/{max_retries}). Waiting {wait_time:.2f}s...")
                    time.sleep(wait_time)
                    continue
                
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"] or ""
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and attempt < max_retries - 1:
                # Handle 429 errors with exponential backoff
                wait_time = base_delay * (2 ** attempt) + random.uniform(0, 1)
                print(f"Rate limited (attempt {attempt + 1}/{max_retries}). Waiting {wait_time:.2f}s...")
                time.sleep(wait_time)
                continue
            else:
                print(f"HTTP error: {e.response.status_code} - {e.response.text}")
                raise e
        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            if attempt < max_retries - 1:
                # For other errors, wait a bit before retrying
                wait_time = base_delay * (2 ** attempt) + random.uniform(0, 1)
                print(f"Retrying in {wait_time:.2f}s... (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
                continue
            else:
                raise e
    
    # If we get here, all retries failed
    raise Exception("All retry attempts failed")
