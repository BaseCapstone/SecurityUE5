import argparse
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from model_storage import get_latest_model_path, get_next_model_path
from MovementAnomalyRNN import MovementAnomalyRNN
from set_data import MovementJsonlDataset


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DATA_PATH = BASE_DIR / "data" / "output2.jsonl"


def continue_train_model(
    train_loader,
    epochs=10,
    device="cpu",
    feature_dim=15,
    num_labels=4,
    learning_rate=1e-3,
):
    load_path = get_latest_model_path()

    model = MovementAnomalyRNN(feature_dim=feature_dim, num_labels=num_labels).to(device)
    model.load_state_dict(torch.load(load_path, map_location=device))

    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

    print(f"Loaded model: {load_path}")

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

    save_path = get_next_model_path()
    torch.save(model.state_dict(), save_path)
    print(f"Model saved: {save_path}")

    return model


def main():
    parser = argparse.ArgumentParser(description="Continue training the latest LSTM model.")
    parser.add_argument("--data", default=str(DEFAULT_DATA_PATH))
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--feature-dim", type=int, default=15)
    parser.add_argument("--num-labels", type=int, default=4)
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    args = parser.parse_args()

    dataset = MovementJsonlDataset(
        jsonl_path=args.data,
        sequence_length=30,
        feature_dim=args.feature_dim,
        num_labels=args.num_labels,
    )

    train_loader = DataLoader(
        dataset,
        batch_size=args.batch_size,
        shuffle=True,
    )

    continue_train_model(
        train_loader,
        epochs=args.epochs,
        device=args.device,
        feature_dim=args.feature_dim,
        num_labels=args.num_labels,
        learning_rate=args.learning_rate,
    )


if __name__ == "__main__":
    main()
