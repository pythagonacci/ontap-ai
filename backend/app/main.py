import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import CommandRequest, CommandResponse
from .openai_client import run_chat_completion
from .settings import settings

app = FastAPI(title="ontap-ai backend", version="0.1.0")

# Rate limiting
request_times = []
MAX_REQUESTS_PER_MINUTE = 3  # Match free tier

def check_rate_limit():
    """Simple rate limiter using sliding window"""
    global request_times
    current_time = time.time()
    
    # Remove requests older than 1 minute
    request_times = [t for t in request_times if current_time - t < 60]
    
    # Check if we're over the limit
    if len(request_times) >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(
            status_code=429, 
            detail=f"Rate limit exceeded. Maximum {MAX_REQUESTS_PER_MINUTE} requests per minute."
        )
    
    # Add current request
    request_times.append(current_time)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/api/commands", response_model=CommandResponse)
def handle_command(body: CommandRequest):
    try:
        # Check if API key is set
        if not settings.OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
        
        # Check rate limit
        check_rate_limit()

        output = run_chat_completion(
            action=body.action,
            user_input=body.input,
            url=str(body.url) if body.url else None,
            tone=body.tone,
            conversation_history=body.messages
        )
        return CommandResponse(ok=True, output=output, model=settings.OPENAI_MODEL)
    except Exception as e:
        print(f"Error in handle_command: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"internal_error: {str(e)}") from e


