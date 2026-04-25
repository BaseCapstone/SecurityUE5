from AnomalyDataRNN import MovementAnomalyRNN
import torch
import torch.nn as nn



def predict_anomaly(x):
  model = MovementAnomalyRNN(input_size=3, hidden_size=64, num_layers=2, output_size=1)
  with torch.no_grad():
      logits = model.forward(x)
      prob = torch.sigmoid(logits)

  return prob