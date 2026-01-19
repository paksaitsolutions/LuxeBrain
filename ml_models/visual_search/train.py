"""
Visual Search Model
Copyright © 2024 Paksa IT Solutions

Model: ResNet50-based image embeddings for similarity search
"""

import tensorflow as tf
import numpy as np
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input


class VisualSearchModel:
    """CNN-based visual search using embeddings"""
    
    def __init__(self):
        self.base_model = ResNet50(weights='imagenet', include_top=False, pooling='avg')
        self.model = self._build_model()
    
    def _build_model(self):
        """Build embedding model"""
        
        inputs = tf.keras.Input(shape=(224, 224, 3))
        x = preprocess_input(inputs)
        x = self.base_model(x, training=False)
        x = tf.keras.layers.Dense(512, activation='relu')(x)
        embeddings = tf.keras.layers.Dense(256, activation=None, name='embeddings')(x)
        
        model = tf.keras.Model(inputs, embeddings)
        return model
    
    def extract_embedding(self, image):
        """Extract image embedding"""
        if len(image.shape) == 3:
            image = np.expand_dims(image, axis=0)
        
        embedding = self.model.predict(image, verbose=0)
        return embedding / np.linalg.norm(embedding)  # Normalize
    
    def compute_similarity(self, embedding1, embedding2):
        """Compute cosine similarity"""
        return np.dot(embedding1.flatten(), embedding2.flatten())
    
    def save(self, path: str):
        self.model.save(path)
    
    def load(self, path: str):
        self.model = tf.keras.models.load_model(path)


if __name__ == "__main__":
    print("Visual search model module")
