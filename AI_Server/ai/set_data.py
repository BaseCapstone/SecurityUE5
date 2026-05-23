import json
import torch
from torch.utils.data import Dataset


class MovementJsonlDataset(Dataset):
    def __init__(self, jsonl_path, sequence_length=30, feature_dim=15, num_labels=4):
        self.samples = []

        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                data = json.loads(line)

                frames = data["frames"]
                label = data["label"]

                # 길이 검증
                if len(frames) != sequence_length:
                    continue

                # feature 개수 검증
                if len(frames[0]) != feature_dim:
                    continue

                if not isinstance(label, list) or len(label) != num_labels:
                    continue

                self.samples.append((frames, label))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        frames, label = self.samples[idx]

        x = torch.tensor(frames, dtype=torch.float32)
        y = torch.tensor(label, dtype=torch.float32)

        return x, y
