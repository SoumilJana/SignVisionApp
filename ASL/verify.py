import numpy as np
X = np.load('your_landmarks.npy')
y = np.load('your_labels.npy')
print(X.shape)   # should be (N, 63)
print(set(y))    # should list all your classes
print(X[0])      # should be 63 floats, mostly small values near 0