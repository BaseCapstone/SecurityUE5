import os
import sys
from pathlib import Path
from typing import Any

import torch
from fastapi import Body, FastAPI, HTTPException

try:
    from .send_data import send_analysis_result
except ImportError:
    from send_data import send_analysis_result


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR.parent
AI_DIR = BASE_DIR / "ai"
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))
if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))

try:
    from AI_Server.ai.predict import predict_anomaly
except ImportError:
    try:
        from predict import predict_anomaly
    except ImportError as fallback_exc:
        predict_anomaly = None
        PREDICT_IMPORT_ERROR = fallback_exc
    else:
        PREDICT_IMPORT_ERROR = None
else:
    PREDICT_IMPORT_ERROR = None


SEQUENCE_LENGTH = int(os.getenv("SEQUENCE_LENGTH", "30"))
FEATURE_DIM = int(os.getenv("FEATURE_DIM", "15"))

app = FastAPI(title="SecurityUE5 AI Server")


def _first_present(data: dict[str, Any], keys: tuple[str, ...], default: Any = None) -> Any:
    for key in keys:
        if key in data:
            return data[key]
    return default


def _number(value: Any, field_name: str) -> float:
    if isinstance(value, bool):
        return float(value)
    if isinstance(value, (int, float)):
        return float(value)
    raise ValueError(f"{field_name} must be a number.")


def _bool_number(value: Any) -> float:
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, (int, float)):
        return 1.0 if value else 0.0
    return 1.0 if str(value).lower() in {"true", "1", "yes"} else 0.0


def _frame_from_event(event: dict[str, Any]) -> list[float]:
    location = event.get("location") or {}
    rotation = event.get("rotation") or {}
    delta_rotation = event.get("deltaRotation") or event.get("delta_rotation") or {}

    return [
        _number(event.get("timestamp"), "timestamp"),
        _number(location.get("x"), "location.x"),
        _number(location.get("y"), "location.y"),
        _number(location.get("z"), "location.z"),
        _number(event.get("speed"), "speed"),
        _number(rotation.get("pitch"), "rotation.pitch"),
        _number(rotation.get("yaw"), "rotation.yaw"),
        _number(rotation.get("roll"), "rotation.roll"),
        _number(delta_rotation.get("pitch"), "deltaRotation.pitch"),
        _number(delta_rotation.get("yaw"), "deltaRotation.yaw"),
        _number(delta_rotation.get("roll"), "deltaRotation.roll"),
        _number(event.get("currentHP"), "currentHP"),
        _number(event.get("targetDistance"), "targetDistance"),
        _number(event.get("targetAngle"), "targetAngle"),
        _bool_number(event.get("bIsTargetVisible")),
    ]


def _extract_raw_frames(payload: Any) -> list[Any]:
    if isinstance(payload, list):
        return payload

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=422,
            detail="Request body must be a list of frames or an object containing frames.",
        )

    if isinstance(payload.get("frames"), list):
        return payload["frames"]
    if isinstance(payload.get("sequence"), list):
        return payload["sequence"]
    if isinstance(payload.get("event_data"), list):
        return payload["event_data"]

    log = payload.get("log")
    if isinstance(log, dict) and isinstance(log.get("event_data"), list):
        return log["event_data"]

    raise HTTPException(
        status_code=422,
        detail="frames, sequence, event_data, or log.event_data is required.",
    )


def normalize_frames(payload: Any) -> list[list[float]]:
    raw_frames = _extract_raw_frames(payload)

    if len(raw_frames) != SEQUENCE_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"Exactly {SEQUENCE_LENGTH} frames are required.",
        )

    frames: list[list[float]] = []
    for index, raw_frame in enumerate(raw_frames):
        try:
            if isinstance(raw_frame, dict):
                frame = _frame_from_event(raw_frame)
            elif isinstance(raw_frame, list):
                frame = [_number(value, f"frames[{index}]") for value in raw_frame]
            else:
                raise ValueError(f"frames[{index}] must be an object or list.")
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        if len(frame) != FEATURE_DIM:
            raise HTTPException(
                status_code=422,
                detail=f"frames[{index}] must contain {FEATURE_DIM} features.",
            )
        frames.append(frame)

    return frames

def extract_user_id(payload):
    if isinstance(payload, list):
        logs = payload
    elif isinstance(payload, dict):
        logs = (
            payload.get("frames")
            or payload.get("sequence")
            or payload.get("event_data")
            or payload.get("log", {}).get("event_data")
        )
    else:
        return None

    if not isinstance(logs, list) or len(logs) == 0:
        return None

    first_log = logs[0]
    if not isinstance(first_log, dict):
        return None

    return first_log.get("userId") or first_log.get("user_id")

def build_result(payload: Any, prediction: dict[str, Any], log_id: str = None, user_id: str = None) -> dict[str, Any]:
    
    if not isinstance(payload, list):
        return {
            "player_id": user_id,
            "log_id": log_id,
            "prediction": prediction,
        }

    return {
        "player_id": user_id,
        "log_id": log_id,
        "prediction": prediction,
    }


@app.get("/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "sequence_length": SEQUENCE_LENGTH,
        "feature_dim": FEATURE_DIM,
        "predict_loaded": predict_anomaly is not None,
    }


@app.post("/api/analyze")
def receive_game_log(payload: Any = Body(...)) -> dict[str, Any]:
    if predict_anomaly is None:
        raise HTTPException(
            status_code=503,
            detail=f"Prediction module could not be loaded: {PREDICT_IMPORT_ERROR}",
        )
    # payload is {log_id:..., frames: [{}, {}, ...]
    log_id = payload.get("log_id")
    user_id = payload.get("user_id")
    payload = payload.get("frames")
    frames = normalize_frames(payload)
    x = torch.tensor(frames, dtype=torch.float32).unsqueeze(0)
    try:
        prediction = predict_anomaly(x, feature_dim=FEATURE_DIM)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Model file is missing: {exc.filename}",
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Prediction failed: {exc}",
        ) from exc

    result = build_result(payload, prediction, log_id, user_id)
    if result["prediction"]["predicted_label"] != "정상":
        forward_result = send_analysis_result(result)
    else:
        forward_result = {"ok": True, "message": "No anomaly detected, not forwarded to web server."}

    return {
        "ok": True,
        "result": result,
        "web_server": forward_result,
    }
