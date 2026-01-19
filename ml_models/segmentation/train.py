"""
Customer Segmentation Model
Copyright © 2024 Paksa IT Solutions

Model: Deep clustering with autoencoder + K-means
"""

import tensorflow as tf
import numpy as np
from sklearn.cluster import KMeans


class SegmentationModel:
    """Deep learning-based customer segmentation"""
    
    def __init__(self, input_dim: int = 20, encoding_dim: int = 8, n_clusters: int = 5):
        self.input_dim = input_dim
        self.encoding_dim = encoding_dim
        self.n_clusters = n_clusters
        self.autoencoder = self._build_autoencoder()
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    
    def _build_autoencoder(self):
        """Build autoencoder for feature learning"""
        
        # Encoder
        encoder_input = tf.keras.Input(shape=(self.input_dim,))
        encoded = tf.keras.layers.Dense(64, activation='relu')(encoder_input)
        encoded = tf.keras.layers.Dense(32, activation='relu')(encoded)
        encoded = tf.keras.layers.Dense(self.encoding_dim, activation='relu', name='encoding')(encoded)
        
        # Decoder
        decoded = tf.keras.layers.Dense(32, activation='relu')(encoded)
        decoded = tf.keras.layers.Dense(64, activation='relu')(decoded)
        decoded = tf.keras.layers.Dense(self.input_dim, activation='sigmoid')(decoded)
        
        autoencoder = tf.keras.Model(encoder_input, decoded)
        autoencoder.compile(optimizer='adam', loss='mse')
        
        return autoencoder
    
    def train(self, X_train, epochs: int = 50):
        """Train autoencoder and cluster"""
        
        # Train autoencoder
        self.autoencoder.fit(
            X_train, X_train,
            epochs=epochs,
            batch_size=256,
            shuffle=True,
            validation_split=0.2
        )
        
        # Extract encodings
        encoder = tf.keras.Model(
            self.autoencoder.input,
            self.autoencoder.get_layer('encoding').output
        )
        encodings = encoder.predict(X_train)
        
        # Cluster
        self.kmeans.fit(encodings)
        
        return self.kmeans.labels_
    
    def predict(self, X):
        """Predict customer segment"""
        encoder = tf.keras.Model(
            self.autoencoder.input,
            self.autoencoder.get_layer('encoding').output
        )
        encodings = encoder.predict(X)
        return self.kmeans.predict(encodings)
    
    def save(self, path: str):
        self.autoencoder.save(f"{path}/autoencoder")
        import joblib
        joblib.dump(self.kmeans, f"{path}/kmeans.pkl")


if __name__ == "__main__":
    print("Segmentation model training module")
