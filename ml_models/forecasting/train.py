"""
Demand Forecasting Model
Copyright © 2024 Paksa IT Solutions

Model: LSTM-based time series forecasting with seasonal decomposition
"""

import tensorflow as tf
import numpy as np
from typing import Dict, Tuple


class ForecastingModel:
    """LSTM-based demand forecasting model"""
    
    def __init__(self, sequence_length: int = 30, features: int = 10):
        self.sequence_length = sequence_length
        self.features = features
        self.model = self._build_model()
    
    def _build_model(self):
        """Build LSTM forecasting model"""
        
        model = tf.keras.Sequential([
            tf.keras.layers.LSTM(128, return_sequences=True, input_shape=(self.sequence_length, self.features)),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.LSTM(64, return_sequences=False),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1)  # Predict demand
        ])
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(0.001),
            loss='mse',
            metrics=['mae', 'mape']
        )
        
        return model
    
    def train(self, X_train, y_train, X_val, y_val, epochs: int = 50):
        """Train forecasting model"""
        
        callbacks = [
            tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
            tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3)
        ]
        
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=32,
            callbacks=callbacks
        )
        
        return history
    
    def predict(self, X):
        """Generate forecast"""
        return self.model.predict(X)
    
    def save(self, path: str):
        self.model.save(path)
    
    def load(self, path: str):
        self.model = tf.keras.models.load_model(path)


if __name__ == "__main__":
    print("Forecasting model training module")
