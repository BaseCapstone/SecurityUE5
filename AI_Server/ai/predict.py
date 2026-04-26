from MovementAnomalyRNN import MovementAnomalyRNN
import torch


def predict_anomaly(x, feature_dim):
    model = MovementAnomalyRNN(feature_dim)
    model.load_state_dict(torch.load("movement_anomaly_rnn.pt"))
    model.eval()

    with torch.no_grad():
        logits = model(x)
        prob = torch.sigmoid(logits).item()

    return prob