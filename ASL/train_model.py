# train_model.py
import os
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

X = np.load("your_landmarks.npy")
y = np.load("your_labels.npy")

mask = ~np.isin(y, ["del", "nothing", "space"])
X, y = X[mask], y[mask]

print(f"After filtering: {X.shape[0]} samples, {len(set(y))} classes")

le = LabelEncoder()
y_encoded = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
print(f"✅ Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# Save to ASL/ (local testing)
local_path = "asl_model.pkl"
with open(local_path, "wb") as f:
    pickle.dump({"model": clf, "label_encoder": le}, f)
print(f"✅ Model saved to {local_path}")

# Save to SignVision_ML_backend/ (for deployment)
backend_dir = os.path.join("..", "SignVision_ML_backend")
backend_path = os.path.join(backend_dir, "asl_model.pkl")

try:
    os.makedirs(backend_dir, exist_ok=True)
    with open(backend_path, "wb") as f:
        pickle.dump({"model": clf, "label_encoder": le}, f)
    print(f"✅ Model saved to {backend_path}")
    print("🚀 Ready to push to GitHub and deploy on Render!")
except Exception as e:
    print(f"⚠️  Warning: Could not save to backend folder: {e}")