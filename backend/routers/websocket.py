from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.models.responses import ProgressUpdate
import json

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, job_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[job_id] = websocket

    def disconnect(self, job_id: str):
        if job_id in self.active_connections:
            del self.active_connections[job_id]

    async def send_progress(self, job_id: str, update: ProgressUpdate):
        if job_id in self.active_connections:
            try:
                await self.active_connections[job_id].send_text(update.model_dump_json())
            except Exception:
                # Connection closed, remove it
                self.disconnect(job_id)

    async def send_error(self, job_id: str, error_message: str):
        """Send error message to client"""
        if job_id in self.active_connections:
            try:
                error_data = {
                    "type": "error",
                    "error": error_message,
                    "job_id": job_id
                }
                await self.active_connections[job_id].send_text(json.dumps(error_data))
            except Exception:
                self.disconnect(job_id)


manager = ConnectionManager()


@router.websocket("/{job_id}")
async def websocket_endpoint(job_id: str, websocket: WebSocket):
    """
    WebSocket endpoint for real-time progress updates.

    Client connects to ws://localhost:8000/ws/{job_id}
    Receives ProgressUpdate JSON messages as generation progresses.
    """
    await manager.connect(job_id, websocket)

    try:
        # Keep connection alive and listen for client messages
        while True:
            data = await websocket.receive_text()

            # Handle client commands (e.g., "cancel")
            if data == "cancel":
                from backend.main import app

                job_manager = app.state.job_manager
                await job_manager.cancel_job(job_id)
                await websocket.send_text(json.dumps({"status": "cancelled"}))
                break

    except WebSocketDisconnect:
        manager.disconnect(job_id)
