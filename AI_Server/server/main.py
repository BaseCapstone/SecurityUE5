import os

import uvicorn

try:
    from .retreive_data import app
except ImportError:
    from retreive_data import app


def main() -> None:
    host = os.getenv("AI_SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("AI_SERVER_PORT", "8000"))
    reload = os.getenv("AI_SERVER_RELOAD", "false").lower() == "true"

    target = "server.retreive_data:app" if reload else app
    uvicorn.run(target, host=host, port=port, reload=reload)


if __name__ == "__main__":
    main()
