from pydantic import BaseModel, HttpUrl, Field
from typing import Literal, Optional

Action = Literal["explain", "rephrase", "answer"]

class CommandRequest(BaseModel):
    input: str = Field(..., min_length=1, max_length=10_000)
    action: Action
    url: Optional[HttpUrl] = None
    tone: Optional[str] = None

class CommandResponse(BaseModel):
    ok: bool = True
    output: str
    model: str
