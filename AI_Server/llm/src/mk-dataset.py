import os, json

base_dir = "../TOPCIT_ESSENCE_data/TOPCIT_ESSENCE_data/"
out_path = "sft_dataset.jsonl"
samples = []

for gwa in sorted(os.listdir(base_dir), key=lambda x:int(x[0])):
    gwa_path = os.path.join(base_dir, gwa)
    if not os.path.isdir(gwa_path): continue

    gwa_lines = []
    small_names = []
    for small in sorted(os.listdir(gwa_path), key=lambda x:x):
        small_path = os.path.join(gwa_path, small)

        if not os.path.isdir(small_path): continue

        small_names.append(small)

        for fn in sorted([f for f in os.listdir(small_path) if f.endswith(".txt")]):
            
            if fn[0]=='p': continue

            with open(os.path.join(small_path, fn), encoding="utf-8") as f:
                lines = [l.strip() for l in f if l.strip() and 'TOPCIT ESSENCE' not in l]

            gwa_lines.extend(lines)

    gwa_text = "\n".join(gwa_lines)

    gwa_summary = f"Please put {gwa} summary of the entire subject here."

    samples.append({
        "instruction": f"Summarize the following subject.\n\n===\n{gwa}\n===\n\nSummarize this text in bullet points. Answer in Korean language.",
        "input": gwa_text,
        "output": gwa_summary
    })

    for small in sorted(os.listdir(gwa_path), key=lambda x:x):

        small_path = os.path.join(gwa_path, small)

        if not os.path.isdir(small_path): continue

        small_lines=[]

        for fn in sorted([f for f in os.listdir(small_path) if f.endswith(".txt")]):
            
            if fn[0]=='p': continue

            with open(os.path.join(small_path, fn), encoding="utf-8") as f:
                lines = [l.strip() for l in f if l.strip() and 'TOPCIT ESSENCE' not in l]

            small_lines.extend(lines)

        small_text = "\n".join(small_lines)
        small_summary = "Please put {gwa} summary of the entire small subject here."
        samples.append({
            "instruction":  f"Summarize the following small subject.\n\n===\n{small} for {gwa}\n===\n\nSummarize this text in bullet points. Answer in Korean language.",
            "input": small_text,
            "output": small_summary
        })

# JSONL 쓰기
with open(out_path, "w", encoding="utf-8") as f:
    for s in samples:
        f.write(json.dumps(s, ensure_ascii=False) + "\n")
