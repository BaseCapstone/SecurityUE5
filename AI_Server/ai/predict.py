from AnomalyDataRNN import MovementAnomalyRNN
import torch
import torch.nn as nn

def predict_anomaly(x):
  with torch.no_grad():
      logits = MovementAnomalyRNN(x)
      prob = torch.sigmoid(logits)

  return prob