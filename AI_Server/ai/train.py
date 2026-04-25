from AnomalyDataRNN import MovementAnomalyRNN
import torch
import torch.nn as nn


def train_model(train_loader):
  model = MovementAnomalyRNN(feature_dim=12)

  criterion = nn.BCEWithLogitsLoss()
  optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

  for x_batch, y_batch in train_loader:
      logits = model(x_batch)
      loss = criterion(logits.squeeze(1), y_batch.float())

      optimizer.zero_grad()
      loss.backward()
      optimizer.step()