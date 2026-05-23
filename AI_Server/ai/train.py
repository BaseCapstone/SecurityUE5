import torch
import torch.nn as nn
from MovementAnomalyRNN import MovementAnomalyRNN
from model_storage import get_next_model_path

def train_model(train_loader, epochs=10, device="cpu", feature_dim=15, num_labels=4):
    model = MovementAnomalyRNN(feature_dim=feature_dim, num_labels=num_labels).to(device)

    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    for epoch in range(epochs):
        model.train()
        total_loss = 0.0

        for x_batch, y_batch in train_loader:
            x_batch = x_batch.to(device)
            y_batch = y_batch.to(device)

            logits = model(x_batch)

            loss = criterion(logits, y_batch)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        avg_loss = total_loss / len(train_loader)
        print(f"Epoch [{epoch + 1}/{epochs}], Loss: {avg_loss:.4f}")

    model_path = get_next_model_path()
    torch.save(model.state_dict(), model_path)
    print(f"Model saved: {model_path}")

    return model
