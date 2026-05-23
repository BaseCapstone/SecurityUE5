import json
import os
from typing import Any
from urllib import error, request


DEFAULT_TIMEOUT_SECONDS = 10


def get_web_server_url() -> str | None:
    return os.getenv("WEB_SERVER_ANALYSIS_URL") or os.getenv("AWS_WEB_SERVER_ANALYSIS_URL")


def send_analysis_result(
    result: dict[str, Any],
    url: str | None = None,
    timeout: int = DEFAULT_TIMEOUT_SECONDS,
) -> dict[str, Any]:
    target_url = url or get_web_server_url()
    if not target_url:
        return {
            "forwarded": False,
            "reason": "WEB_SERVER_ANALYSIS_URL is not configured.",
        }

    body = json.dumps(result, ensure_ascii=False).encode("utf-8")
    req = request.Request(
        target_url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=timeout) as response:
            response_body = response.read().decode("utf-8")
            parsed_body: Any
            try:
                parsed_body = json.loads(response_body) if response_body else None
            except json.JSONDecodeError:
                parsed_body = response_body

            return {
                "forwarded": 200 <= response.status < 300,
                "status_code": response.status,
                "response": parsed_body,
            }
    except error.HTTPError as exc:
        response_body = exc.read().decode("utf-8", errors="replace")
        return {
            "forwarded": False,
            "status_code": exc.code,
            "error": response_body,
        }
    except error.URLError as exc:
        return {
            "forwarded": False,
            "error": str(exc.reason),
        }
