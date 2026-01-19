"""
Recommendation Engine - Training
Copyright © 2024 Paksa IT Solutions

Model: Collaborative Filtering + Content-Based Hybrid
Architecture: Two-tower neural network with TensorFlow
"""

import tensorflow as tf
import numpy as np
from typing import Dict, List
import mlflow


class RecommendationModel:
    """Hybrid recommendation model using TensorFlow"""
    
    def __init__(self, num_users: int, num_products: int, embedding_dim: int = 64):
        self.num_users = num_users
        self.num_products = num_products
        self.embedding_dim = embedding_dim
        self.model = self._build_model()
    
    def _build_model(self):
        """Build two-tower recommendation model"""
        
        # User tower
        user_input = tf.keras.Input(shape=(1,), name='user_id')
        user_embedding = tf.keras.layers.Embedding(
            self.num_users, self.embedding_dim, name='user_embedding'
        )(user_input)
        user_vec = tf.keras.layers.Flatten()(user_embedding)
        user_vec = tf.keras.layers.Dense(128, activation='relu')(user_vec)
        user_vec = tf.keras.layers.Dropout(0.3)(user_vec)
        user_vec = tf.keras.layers.Dense(64, activation='relu')(user_vec)
        
        # Product tower
        product_input = tf.keras.Input(shape=(1,), name='product_id')
        product_embedding = tf.keras.layers.Embedding(
            self.num_products, self.embedding_dim, name='product_embedding'
        )(product_input)
        product_vec = tf.keras.layers.Flatten()(product_embedding)
        product_vec = tf.keras.layers.Dense(128, activation='relu')(product_vec)
        product_vec = tf.keras.layers.Dropout(0.3)(product_vec)
        product_vec = tf.keras.layers.Dense(64, activation='relu')(product_vec)
        
        # Interaction
        concat = tf.keras.layers.Concatenate()([user_vec, product_vec])
        dense = tf.keras.layers.Dense(64, activation='relu')(concat)
        output = tf.keras.layers.Dense(1, activation='sigmoid', name='rating')(dense)
        
        model = tf.keras.Model(
            inputs=[user_input, product_input],
            outputs=output
        )
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(0.001),
            loss='binary_crossentropy',
            metrics=['accuracy', tf.keras.metrics.AUC()]
        )
        
        return model
    
    def train(self, train_data: Dict, validation_data: Dict, epochs: int = 20):
        """Train the model"""
        
        mlflow.tensorflow.autolog()
        
        callbacks = [
            tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
            tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2)
        ]
        
        history = self.model.fit(
            [train_data['user_ids'], train_data['product_ids']],
            train_data['labels'],
            validation_data=(
                [validation_data['user_ids'], validation_data['product_ids']],
                validation_data['labels']
            ),
            epochs=epochs,
            batch_size=256,
            callbacks=callbacks
        )
        
        return history
    
    def save(self, path: str):
        """Save model"""
        self.model.save(path)
    
    def load(self, path: str):
        """Load model"""
        self.model = tf.keras.models.load_model(path)


if __name__ == "__main__":
    # Training pipeline would be implemented here
    print("Recommendation model training module")
