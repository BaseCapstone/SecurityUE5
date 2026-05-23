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
AI_DIR = BASE_DIR / "ai"
if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))

try:
    from predict import predict_anomaly
except ImportError as exc:
    predict_anomaly = None
    PREDICT_IMPORT_ERROR = exc
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


def _extract_raw_frames(payload: dict[str, Any]) -> list[Any]:
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


def normalize_frames(payload: dict[str, Any]) -> list[list[float]]:
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


def build_result(payload: dict[str, Any], prediction: dict[str, Any]) -> dict[str, Any]:
    return {
        "player_id": _first_present(payload, ("player_id", "playerId", "user_id", "userId")),
        "log_id": _first_present(payload, ("log_id", "logId", "id")),
        "session_id": _first_present(payload, ("session_id", "sessionId", "match_id", "matchId")),
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
def receive_game_log(payload: dict[str, Any] = Body(...)) -> dict[str, Any]:
    if predict_anomaly is None:
        raise HTTPException(
            status_code=503,
            detail=f"Prediction module could not be loaded: {PREDICT_IMPORT_ERROR}",
        )

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

    result = build_result(payload, prediction)
    forward_result = send_analysis_result(result)

    return {
        "ok": True,
        "result": result,
        "web_server": forward_result,
    }
