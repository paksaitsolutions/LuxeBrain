"""
Dynamic Pricing Model
Copyright © 2024 Paksa IT Solutions

Model: Reinforcement learning-based pricing optimization
"""

import tensorflow as tf
import numpy as np


class PricingModel:
    """RL-based dynamic pricing model"""
    
    def __init__(self, state_dim: int = 15, action_dim: int = 10):
        self.state_dim = state_dim
        self.action_dim = action_dim  # Discrete discount levels
        self.model = self._build_model()
    
    def _build_model(self):
        """Build DQN for pricing decisions"""
        
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(self.state_dim,)),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(self.action_dim, activation='linear')  # Q-values
        ])
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(0.001),
            loss='mse'
        )
        
        return model
    
    def predict_action(self, state):
        """Predict optimal pricing action"""
        q_values = self.model.predict(state, verbose=0)
        return np.argmax(q_values[0])
    
    def train(self, states, actions, rewards, next_states, gamma=0.95):
        """Train using experience replay"""
        
        target_q_values = rewards + gamma * np.max(self.model.predict(next_states, verbose=0), axis=1)
        
        with tf.GradientTape() as tape:
            q_values = self.model(states)
            q_action = tf.reduce_sum(q_values * tf.one_hot(actions, self.action_dim), axis=1)
            loss = tf.reduce_mean(tf.square(target_q_values - q_action))
        
        gradients = tape.gradient(loss, self.model.trainable_variables)
        self.model.optimizer.apply_gradients(zip(gradients, self.model.trainable_variables))
        
        return loss.numpy()
    
    def save(self, path: str):
        self.model.save(path)
    
    def load(self, path: str):
        self.model = tf.keras.models.load_model(path)


if __name__ == "__main__":
    print("Pricing model training module")
