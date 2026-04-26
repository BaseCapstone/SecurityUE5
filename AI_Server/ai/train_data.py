import sys
print(sys.executable)
from torch.utils.data import DataLoader
from set_data import MovementJsonlDataset
from train import train_model
from predict import predict_anomaly

data_folder = "C:/src/capstone/SecurityUE5_AI/data/"

dataset = MovementJsonlDataset(
    jsonl_path=data_folder + "output.jsonl",
    sequence_length=30,
    feature_dim=15
)

train_loader = DataLoader(
    dataset,
    batch_size=64,
    shuffle=True
)

print("훈련 시작")
model = train_model(train_loader, epochs=10)

