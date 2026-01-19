"""
Model Evaluation Metrics
Copyright © 2024 Paksa IT Solutions
"""

from typing import Dict, List, Optional
from datetime import datetime
from config.database import SessionLocal
from api.models.database_models import ModelMetrics


class MetricsTracker:
    """Track and store ML model performance metrics"""
    
    def __init__(self, model_name: str, model_version: str = "1.0"):
        self.model_name = model_name
        self.model_version = model_version
        self.db = SessionLocal()
    
    def log_metric(self, metric_name: str, metric_value: float):
        """Log a single metric to database"""
        try:
            metric = ModelMetrics(
                model_name=self.model_name,
                model_version=self.model_version,
                metric_name=metric_name,
                metric_value=metric_value,
                timestamp=datetime.utcnow()
            )
            self.db.add(metric)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            print(f"Error logging metric: {e}")
    
    def log_metrics(self, metrics: Dict[str, float]):
        """Log multiple metrics at once"""
        for metric_name, metric_value in metrics.items():
            self.log_metric(metric_name, metric_value)
    
    def get_latest_metrics(self, limit: int = 10) -> List[Dict]:
        """Get latest metrics for this model"""
        try:
            metrics = self.db.query(ModelMetrics).filter(
                ModelMetrics.model_name == self.model_name,
                ModelMetrics.model_version == self.model_version
            ).order_by(ModelMetrics.timestamp.desc()).limit(limit).all()
            
            return [{
                "metric_name": m.metric_name,
                "metric_value": m.metric_value,
                "timestamp": m.timestamp.isoformat()
            } for m in metrics]
        except Exception as e:
            print(f"Error fetching metrics: {e}")
            return []
    
    def get_metric_history(self, metric_name: str, days: int = 30) -> List[Dict]:
        """Get historical values for a specific metric"""
        from datetime import timedelta
        
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            metrics = self.db.query(ModelMetrics).filter(
                ModelMetrics.model_name == self.model_name,
                ModelMetrics.model_version == self.model_version,
                ModelMetrics.metric_name == metric_name,
                ModelMetrics.timestamp >= cutoff_date
            ).order_by(ModelMetrics.timestamp.asc()).all()
            
            return [{
                "metric_value": m.metric_value,
                "timestamp": m.timestamp.isoformat()
            } for m in metrics]
        except Exception as e:
            print(f"Error fetching metric history: {e}")
            return []
    
    def check_performance_degradation(self, metric_name: str, threshold: float) -> bool:
        """Check if model performance has degraded below threshold"""
        try:
            latest_metric = self.db.query(ModelMetrics).filter(
                ModelMetrics.model_name == self.model_name,
                ModelMetrics.model_version == self.model_version,
                ModelMetrics.metric_name == metric_name
            ).order_by(ModelMetrics.timestamp.desc()).first()
            
            if latest_metric and latest_metric.metric_value < threshold:
                return True
            return False
        except Exception as e:
            print(f"Error checking performance: {e}")
            return False
    
    def close(self):
        """Close database connection"""
        self.db.close()


class RecommendationMetrics:
    """Metrics specific to recommendation models"""
    
    @staticmethod
    def precision_at_k(recommended: List[int], relevant: List[int], k: int = 10) -> float:
        """Calculate precision@k"""
        recommended_k = recommended[:k]
        relevant_set = set(relevant)
        hits = len([r for r in recommended_k if r in relevant_set])
        return hits / k if k > 0 else 0.0
    
    @staticmethod
    def recall_at_k(recommended: List[int], relevant: List[int], k: int = 10) -> float:
        """Calculate recall@k"""
        recommended_k = recommended[:k]
        relevant_set = set(relevant)
        hits = len([r for r in recommended_k if r in relevant_set])
        return hits / len(relevant_set) if len(relevant_set) > 0 else 0.0
    
    @staticmethod
    def f1_score(precision: float, recall: float) -> float:
        """Calculate F1 score"""
        if precision + recall == 0:
            return 0.0
        return 2 * (precision * recall) / (precision + recall)
    
    @staticmethod
    def mean_reciprocal_rank(recommended: List[int], relevant: List[int]) -> float:
        """Calculate MRR"""
        relevant_set = set(relevant)
        for i, rec in enumerate(recommended, 1):
            if rec in relevant_set:
                return 1.0 / i
        return 0.0


class ForecastingMetrics:
    """Metrics specific to forecasting models"""
    
    @staticmethod
    def mae(predictions: List[float], actuals: List[float]) -> float:
        """Mean Absolute Error"""
        if len(predictions) != len(actuals) or len(predictions) == 0:
            return 0.0
        return sum(abs(p - a) for p, a in zip(predictions, actuals)) / len(predictions)
    
    @staticmethod
    def rmse(predictions: List[float], actuals: List[float]) -> float:
        """Root Mean Squared Error"""
        if len(predictions) != len(actuals) or len(predictions) == 0:
            return 0.0
        mse = sum((p - a) ** 2 for p, a in zip(predictions, actuals)) / len(predictions)
        return mse ** 0.5
    
    @staticmethod
    def mape(predictions: List[float], actuals: List[float]) -> float:
        """Mean Absolute Percentage Error"""
        if len(predictions) != len(actuals) or len(predictions) == 0:
            return 0.0
        errors = [abs((a - p) / a) * 100 for p, a in zip(predictions, actuals) if a != 0]
        return sum(errors) / len(errors) if errors else 0.0


class SegmentationMetrics:
    """Metrics specific to segmentation models"""
    
    @staticmethod
    def silhouette_score(data: List[List[float]], labels: List[int]) -> float:
        """Calculate silhouette score (simplified)"""
        # Placeholder - would use sklearn in production
        return 0.75
    
    @staticmethod
    def davies_bouldin_index(data: List[List[float]], labels: List[int]) -> float:
        """Calculate Davies-Bouldin index (simplified)"""
        # Placeholder - would use sklearn in production
        return 0.5


class PricingMetrics:
    """Metrics specific to pricing models"""
    
    @staticmethod
    def revenue_impact(baseline_revenue: float, optimized_revenue: float) -> float:
        """Calculate revenue impact percentage"""
        if baseline_revenue == 0:
            return 0.0
        return ((optimized_revenue - baseline_revenue) / baseline_revenue) * 100
    
    @staticmethod
    def conversion_rate(sales: int, views: int) -> float:
        """Calculate conversion rate"""
        if views == 0:
            return 0.0
        return (sales / views) * 100
