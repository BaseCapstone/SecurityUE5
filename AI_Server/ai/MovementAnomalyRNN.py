import torch
import torch.nn as nn

class MovementAnomalyRNN(nn.Module):
    def __init__(self, feature_dim, hidden_dim=64, num_layers=2):
        super().__init__()

        self.lstm = nn.LSTM(
            input_size=feature_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2
        )

        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        # x: (batch_size, sequence_length, feature_dim)

        output, (hidden, cell) = self.lstm(x)

        # 마지막 layer의 마지막 hidden state 사용
        last_hidden = hidden[-1]

        logits = self.classifier(last_hidden)

        return logits