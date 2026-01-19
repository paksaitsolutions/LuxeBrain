"""
Feedback Loop & Continuous Learning
Copyright © 2024 Paksa IT Solutions

Tracks AI performance and triggers retraining
"""

from typing import Dict, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from api.models.database_models import ModelMetrics, Recommendation, Order, OrderItem
import mlflow
from config.settings import settings


class FeedbackLoop:
    """Closed-loop learning system"""
    
    def __init__(self):
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
    
    def log_recommendation_shown(
        self,
        customer_id: int,
        product_ids: List[int],
        recommendation_type: str,
        session_id: str,
        db: Session
    ):
        """Log when recommendations are shown"""
        
        for product_id in product_ids:
            rec = Recommendation(
                customer_id=customer_id,
                product_id=product_id,
                recommendation_type=recommendation_type,
                score=1.0,
                created_at=datetime.utcnow()
            )
            db.add(rec)
        
        db.commit()
        
        # Log to MLflow
        with mlflow.start_run(run_name=f"rec_shown_{session_id}"):
            mlflow.log_param("customer_id", customer_id)
            mlflow.log_param("type", recommendation_type)
            mlflow.log_metric("products_shown", len(product_ids))
    
    def log_recommendation_click(
        self,
        customer_id: int,
        product_id: int,
        recommendation_type: str,
        db: Session
    ):
        """Log when recommendation is clicked"""
        
        # Update click metrics
        metric = ModelMetrics(
            model_name="recommendation_engine",
            model_version="v1",
            metric_name=f"{recommendation_type}_ctr",
            metric_value=1.0,
            timestamp=datetime.utcnow()
        )
        db.add(metric)
        db.commit()
        
        with mlflow.start_run(run_name=f"rec_click_{customer_id}"):
            mlflow.log_metric("click", 1)
            mlflow.log_param("product_id", product_id)
    
    def log_conversion(
        self,
        order_id: int,
        customer_id: int,
        total: float,
        items: List[Dict],
        db: Session
    ):
        """Log purchase conversion"""
        
        # Check if any purchased items were recommended
        recent_recs = db.query(Recommendation).filter(
            Recommendation.customer_id == customer_id,
            Recommendation.created_at > datetime.utcnow() - timedelta(days=7)
        ).all()
        
        rec_product_ids = {r.product_id for r in recent_recs}
        purchased_product_ids = {item['product_id'] for item in items}
        
        ai_influenced = bool(rec_product_ids & purchased_product_ids)
        
        if ai_influenced:
            # Log AI-driven revenue
            metric = ModelMetrics(
                model_name="recommendation_engine",
                model_version="v1",
                metric_name="ai_revenue",
                metric_value=total,
                timestamp=datetime.utcnow()
            )
            db.add(metric)
        
        db.commit()
        
        with mlflow.start_run(run_name=f"conversion_{order_id}"):
            mlflow.log_metric("order_total", total)
            mlflow.log_metric("ai_influenced", 1 if ai_influenced else 0)
            mlflow.log_metric("items_count", len(items))
    
    def calculate_model_performance(self, model_name: str, days: int = 7) -> Dict:
        """Calculate model performance metrics"""
        
        from config.database import SessionLocal
        db = SessionLocal()
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        # Get metrics
        metrics = db.query(ModelMetrics).filter(
            ModelMetrics.model_name == model_name,
            ModelMetrics.timestamp > cutoff
        ).all()
        
        if not metrics:
            return {}
        
        # Calculate aggregates
        performance = {
            'impressions': 0,
            'clicks': 0,
            'conversions': 0,
            'revenue': 0.0,
            'ctr': 0.0,
            'conversion_rate': 0.0
        }
        
        for metric in metrics:
            if 'impression' in metric.metric_name:
                performance['impressions'] += metric.metric_value
            elif 'click' in metric.metric_name:
                performance['clicks'] += metric.metric_value
            elif 'conversion' in metric.metric_name:
                performance['conversions'] += metric.metric_value
            elif 'revenue' in metric.metric_name:
                performance['revenue'] += metric.metric_value
        
        if performance['impressions'] > 0:
            performance['ctr'] = (performance['clicks'] / performance['impressions']) * 100
        
        if performance['clicks'] > 0:
            performance['conversion_rate'] = (performance['conversions'] / performance['clicks']) * 100
        
        db.close()
        
        # Log to MLflow
        with mlflow.start_run(run_name=f"{model_name}_performance"):
            for key, value in performance.items():
                mlflow.log_metric(key, value)
        
        return performance
    
    def check_retraining_needed(self, model_name: str) -> bool:
        """Determine if model needs retraining"""
        
        performance = self.calculate_model_performance(model_name, days=7)
        
        if not performance:
            return False
        
        # Retraining triggers
        triggers = {
            'recommendation_engine': {
                'min_ctr': 3.0,  # Below 3% CTR
                'min_conversion_rate': 5.0  # Below 5% conversion
            },
            'pricing_model': {
                'min_revenue_impact': 1000.0  # Less than $1000 impact
            }
        }
        
        if model_name not in triggers:
            return False
        
        thresholds = triggers[model_name]
        
        # Check thresholds
        if 'min_ctr' in thresholds and performance.get('ctr', 0) < thresholds['min_ctr']:
            return True
        
        if 'min_conversion_rate' in thresholds and performance.get('conversion_rate', 0) < thresholds['min_conversion_rate']:
            return True
        
        if 'min_revenue_impact' in thresholds and performance.get('revenue', 0) < thresholds['min_revenue_impact']:
            return True
        
        return False
    
    def trigger_retraining(self, model_name: str):
        """Trigger model retraining"""
        
        from automation.celery_tasks import celery_app
        
        if model_name == 'recommendation_engine':
            celery_app.send_task('train_recommendation_model')
        elif model_name == 'forecasting_model':
            celery_app.send_task('train_forecasting_model')
        
        # Log retraining event
        with mlflow.start_run(run_name=f"{model_name}_retrain_triggered"):
            mlflow.log_param("trigger_reason", "performance_degradation")
            mlflow.log_param("timestamp", datetime.utcnow().isoformat())


# Scheduled task to check model performance
from automation.celery_tasks import celery_app

@celery_app.task
def check_model_performance():
    """Daily check of model performance"""
    
    feedback = FeedbackLoop()
    
    models = ['recommendation_engine', 'pricing_model', 'forecasting_model']
    
    for model in models:
        if feedback.check_retraining_needed(model):
            feedback.trigger_retraining(model)


# Schedule daily at 2 AM
celery_app.conf.beat_schedule = {
    'check-model-performance': {
        'task': 'check_model_performance',
        'schedule': 86400.0,  # Daily
    },
}
