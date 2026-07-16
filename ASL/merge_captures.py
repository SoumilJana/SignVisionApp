# merge_captures.py
import json, glob, numpy as np

DATA_DIR = 'DATA'

def normalize(coords):
    lm = np.array(coords).reshape(-1, 3)
    lm -= lm[0]           # make wrist-relative (wrist becomes 0,0,0)
    max_val = np.max(np.abs(lm))
    if max_val != 0:
        lm /= max_val     # scale to [-1, 1]
    return lm.flatten()

files = glob.glob(f'{DATA_DIR}/*.json')
if not files:
    print("❌ No files found in DATA/. Check your path.")
    exit()

X, y = [], []
label_counts = {}

for f in files:
    d = json.load(open(f))
    label = d['label'].lower()
    for sample in d['samples']:
        if len(sample) == 63:
            X.append(normalize(sample))   # normalize before saving
            y.append(label)
    label_counts[label] = label_counts.get(label, 0) + len(d['samples'])

print("\nSamples per letter:")
summary_lines = []
for label in sorted(label_counts):
    line = f"  {label.upper()}: {label_counts[label]}"
    print(line)
    summary_lines.append(line)

np.save('your_landmarks.npy', np.array(X, dtype=np.float32))
np.save('your_labels.npy', np.array(y))
print(f"\n✅ Merged {len(X)} total samples across {len(set(y))} classes")
print("Saved: your_landmarks.npy + your_labels.npy")

# Write summary to workflow.txt
with open('workflow.txt', 'a') as f:
    f.write("\n# Last dataset composition:\n")
    f.write("# Samples per letter:\n")
    for line in summary_lines:
        f.write("#" + line + "\n")
    f.write(f"# Total: {len(X)} samples across {len(set(y))} classes\n")