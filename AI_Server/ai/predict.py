from MovementAnomalyRNN import MovementAnomalyRNN
from model_storage import get_latest_model_path
import torch


LABEL_NAMES = ["스피드핵", "갓모드", "ESP", "에임핵"]


def predict_anomaly(x, feature_dim, num_labels=4, device="cpu"):
    model = MovementAnomalyRNN(feature_dim=feature_dim, num_labels=num_labels).to(device)
    model.load_state_dict(torch.load(get_latest_model_path(), map_location=device))
    model.eval()
    x = x.to(device)

    with torch.no_grad():
        logits = model(x)
        probs = torch.sigmoid(logits).squeeze(0)
        # 0.2 이하 정상 0.2 초과 0.5 이하 의심 0.5 초과 0.7 이하 위험 0.7 초과 확실
        weights = [16 / 18, 18 / 18, 12 / 18, 16 / 18]
        weighted_score = [probs[index].item() * weights[index] for index in range(num_labels)]
        predictions = "정상"
        for index in range(num_labels):
            if weighted_score[index] > 0.7:
                predictions = "확신"
            elif weighted_score[index] > 0.5 and predictions != "확신":
                predictions = "위험"
            elif weighted_score[index] > 0.2 and predictions not in ["확신", "위험"]:
                predictions = "의심"
            elif predictions not in ["확신", "위험", "의심"]:
                predictions = "정상"

        max_index = torch.argmax(probs).item()
        predicted_label = LABEL_NAMES[max_index]

    return {
        "probability": float(f"{weighted_score[max_index]:.4f}"),
        "predicted_label": predicted_label,
        "predictions": predictions,
    }