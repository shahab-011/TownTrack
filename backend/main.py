import os
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langgraph.types import Command

from backend.agent import agent


app = FastAPI(
    title="TownTrack API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "TownTrack API",
        "status": "running",
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# ============================================================
# REQUEST MODELS
# ============================================================

class ChatRequest(BaseModel):
    message: str
    thread_id: str | None = None


class ApprovalRequest(BaseModel):
    thread_id: str
    decision: str


# ============================================================
# CHAT
# ============================================================

@app.post("/chat")
def chat(request: ChatRequest):

    thread_id = request.thread_id or str(uuid.uuid4())

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": request.message,
                }
            ]
        },
        config=config,
    )

    # --------------------------------------------------------
    # Check whether the agent is waiting for approval
    # --------------------------------------------------------

    if "__interrupt__" in result:

        interrupt = result["__interrupt__"][0]

        value = interrupt.value

        action_requests = value.get(
            "action_requests",
            []
        )

        if action_requests:

            action = action_requests[0]

            return {
                "status": "approval_required",

                "thread_id": thread_id,

                "tool": action.get("name"),

                "arguments": action.get(
                    "args",
                    {}
                ),

                "description": action.get(
                    "description",
                    ""
                ),
            }

    # --------------------------------------------------------
    # Normal LLM response
    # --------------------------------------------------------

    messages = result.get(
        "messages",
        []
    )

    if not messages:

        return {
            "status": "completed",
            "thread_id": thread_id,
            "response": "No response generated.",
        }

    last_message = messages[-1]

    return {
        "status": "completed",
        "thread_id": thread_id,
        "response": last_message.content,
    }


# ============================================================
# APPROVAL
# ============================================================

@app.post("/approve")
def approve(request: ApprovalRequest):

    if request.decision not in [
        "approve",
        "reject",
    ]:

        return {
            "status": "error",
            "message": "Invalid decision.",
        }

    config = {
        "configurable": {
            "thread_id": request.thread_id
        }
    }

    result = agent.invoke(
        Command(
            resume={
                "decisions": [
                    {
                        "type": request.decision
                    }
                ]
            }
        ),
        config=config,
    )

    # --------------------------------------------------------
    # Agent might request another approval
    # --------------------------------------------------------

    if "__interrupt__" in result:

        interrupt = result["__interrupt__"][0]

        value = interrupt.value

        action_requests = value.get(
            "action_requests",
            []
        )

        if action_requests:

            action = action_requests[0]

            return {
                "status": "approval_required",
                "thread_id": request.thread_id,
                "tool": action.get("name"),
                "arguments": action.get(
                    "args",
                    {}
                ),
            }

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    messages = result.get(
        "messages",
        []
    )

    if not messages:

        return {
            "status": "completed",
            "thread_id": request.thread_id,
            "response": "No response generated.",
        }

    last_message = messages[-1]

    return {
        "status": "completed",
        "thread_id": request.thread_id,
        "response": last_message.content,
    }