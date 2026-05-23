from MovementAnomalyRNN import MovementAnomalyRNN
from model_storage import get_latest_model_path
import torch


LABEL_NAMES = ["speedHack", "godMode", "eSP", "aim"]


def predict_anomaly(x, feature_dim, num_labels=4, device="cpu"):
    model = MovementAnomalyRNN(feature_dim=feature_dim, num_labels=num_labels).to(device)
    model.load_state_dict(torch.load(get_latest_model_path(), map_location=device))
    model.eval()
    x = x.to(device)

    with torch.no_grad():
        logits = model(x)
        probs = torch.sigmoid(logits).squeeze(0)
        # 0.2 이하 정상 0.2 초과 0.5 이하 의심 0.5 초과 0.7 이하 위험 0.7 초과 확실
        predictions = ["normal", "normal", "normal", "normal"]
        for index in range(num_labels):
            if probs[index] <= 0.2:
                predictions[index] = "normal"
            elif probs[index] <= 0.5:
                predictions[index] = "suspicious"
            elif probs[index] <= 0.7:
                predictions[index] = "warning"
            else:
                predictions[index] = "certain"

    return {
        name: {
            "probability": float(f"{probs[index].item():.4f}"),
            "predicted": predictions[index],
        }
        for index, name in enumerate(LABEL_NAMES[:num_labels])
    }
