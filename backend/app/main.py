from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .settings import settings
from .models import CommandRequest, CommandResponse
from .openai_client import run_chat_completion

app = FastAPI(title="ontap-ai backend", version="0.1.0")

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
        output = run_chat_completion(
            action=body.action,
            user_input=body.input,
            url=str(body.url) if body.url else None,
            tone=body.tone,
        )
        return CommandResponse(ok=True, output=output, model=settings.OPENAI_MODEL)
    except Exception as e:
        raise HTTPException(status_code=500, detail="internal_error") from e
