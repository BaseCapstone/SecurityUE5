from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"
MODEL_PREFIX = "movement_anomaly_rnn"
MODEL_SUFFIX = ".pt"


def _model_number(path: Path) -> int | None:
    stem = path.stem
    prefix = f"{MODEL_PREFIX}_"
    if not stem.startswith(prefix):
        return None

    number = stem.removeprefix(prefix)
    if not number.isdigit():
        return None

    return int(number)


def get_saved_model_paths() -> list[Path]:
    if not MODEL_DIR.exists():
        return []

    return sorted(
        (
            path
            for path in MODEL_DIR.glob(f"{MODEL_PREFIX}_*{MODEL_SUFFIX}")
            if _model_number(path) is not None
        ),
        key=lambda path: _model_number(path) or 0,
    )


def get_next_model_path() -> Path:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    model_numbers = [
        number
        for path in get_saved_model_paths()
        if (number := _model_number(path)) is not None
    ]
    next_number = max(model_numbers, default=0) + 1

    return MODEL_DIR / f"{MODEL_PREFIX}_{next_number}{MODEL_SUFFIX}"


def get_latest_model_path() -> Path:
    model_paths = get_saved_model_paths()
    if not model_paths:
        raise FileNotFoundError(
            f"No model file found in {MODEL_DIR}. Train the model first."
        )

    return model_paths[-1]
