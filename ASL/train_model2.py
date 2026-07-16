# train_model2.py - WITH ANTI-OVERFITTING FIXES
# Use this after collecting 200+ samples per letter
# Includes: regularised RandomForest + cross-validation

import os
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
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

# Regularised RandomForest to prevent overfitting
clf = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
)

# Cross-validation: honest accuracy estimate
cv_scores = cross_val_score(clf, X, y_encoded, cv=5, scoring='accuracy')
print(f"\nCross-validation accuracy: {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")
print(f"CV scores per fold: {[f'{s*100:.2f}%' for s in cv_scores]}")

# Train final model on full training set
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
print(f"\n✅ Test Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
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
