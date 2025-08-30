import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import CommandRequest, CommandResponse
from .openai_client import run_chat_completion
from .settings import settings

app = FastAPI(title="ontap-ai backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Ontap AI API", "status": "running", "endpoints": ["/health", "/api/commands"]}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/api/commands", response_model=CommandResponse)
def handle_command(body: CommandRequest):
    try:
        # Check if API key is set
        if not settings.OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
        
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


