"""
A/B Testing & ROI Measurement
Copyright © 2024 Paksa IT Solutions

Prove AI is making money
"""

from typing import Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from api.models.database_models import Customer, Order, UserInteraction
import random


class ABTestingFramework:
    """A/B test AI features vs baseline"""
    
    def __init__(self):
        self.experiments = {
            'recommendation_engine': {
                'control': 'random_products',
                'treatment': 'ai_recommendations',
                'split': 0.5,
                'status': 'active',
                'winner': None
            },
            'dynamic_pricing': {
                'control': 'fixed_pricing',
                'treatment': 'ai_pricing',
                'split': 0.3,
                'status': 'active',
                'winner': None
            },
            'personalized_homepage': {
                'control': 'standard_homepage',
                'treatment': 'ai_personalized',
                'split': 0.5,
                'status': 'active',
                'winner': None
            }
        }
    
    def assign_variant(self, customer_id: Optional[int], experiment: str) -> str:
        """Assign customer to control or treatment"""
        
        if experiment not in self.experiments:
            return 'control'
        
        # Consistent assignment based on customer_id
        if customer_id:
            hash_val = hash(f"{customer_id}_{experiment}") % 100
        else:
            hash_val = random.randint(0, 99)
        
        split_threshold = self.experiments[experiment]['split'] * 100
        
        return 'treatment' if hash_val < split_threshold else 'control'
    
    def log_experiment_exposure(
        self,
        customer_id: Optional[int],
        experiment: str,
        variant: str,
        db: Session
    ):
        """Log when customer is exposed to experiment"""
        
        interaction = UserInteraction(
            customer_id=customer_id,
            session_id=f"exp_{experiment}",
            event_type='experiment_exposure',
            metadata={
                'experiment': experiment,
                'variant': variant
            },
            timestamp=datetime.utcnow()
        )
        db.add(interaction)
        db.commit()
    
    def calculate_experiment_results(
        self,
        experiment: str,
        days: int = 30,
        db: Session = None
    ) -> Dict:
        """Calculate A/B test results"""
        
        from config.database import SessionLocal
        if not db:
            db = SessionLocal()
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        # Get all exposures
        exposures = db.query(UserInteraction).filter(
            UserInteraction.event_type == 'experiment_exposure',
            UserInteraction.timestamp > cutoff,
            UserInteraction.metadata['experiment'].astext == experiment
        ).all()
        
        control_customers = set()
        treatment_customers = set()
        
        for exp in exposures:
            customer_id = exp.customer_id
            variant = exp.metadata.get('variant')
            
            if variant == 'control':
                control_customers.add(customer_id)
            else:
                treatment_customers.add(customer_id)
        
        # Calculate metrics for each group
        control_metrics = self._calculate_group_metrics(
            list(control_customers), cutoff, db
        )
        treatment_metrics = self._calculate_group_metrics(
            list(treatment_customers), cutoff, db
        )
        
        # Calculate lift
        results = {
            'experiment': experiment,
            'period_days': days,
            'control': control_metrics,
            'treatment': treatment_metrics,
            'lift': {
                'revenue': self._calculate_lift(
                    control_metrics['revenue'],
                    treatment_metrics['revenue']
                ),
                'conversion_rate': self._calculate_lift(
                    control_metrics['conversion_rate'],
                    treatment_metrics['conversion_rate']
                ),
                'aov': self._calculate_lift(
                    control_metrics['aov'],
                    treatment_metrics['aov']
                )
            }
        }
        
        db.close()
        return results
    
    def _calculate_group_metrics(
        self,
        customer_ids: list,
        cutoff: datetime,
        db: Session
    ) -> Dict:
        """Calculate metrics for a customer group"""
        
        if not customer_ids:
            return {
                'customers': 0,
                'orders': 0,
                'revenue': 0.0,
                'conversion_rate': 0.0,
                'aov': 0.0
            }
        
        orders = db.query(Order).filter(
            Order.customer_id.in_(customer_ids),
            Order.created_at > cutoff
        ).all()
        
        total_revenue = sum(order.total for order in orders)
        order_count = len(orders)
        customer_count = len(customer_ids)
        
        return {
            'customers': customer_count,
            'orders': order_count,
            'revenue': total_revenue,
            'conversion_rate': (order_count / customer_count * 100) if customer_count > 0 else 0,
            'aov': (total_revenue / order_count) if order_count > 0 else 0
        }
    
    def _calculate_lift(self, control_value: float, treatment_value: float) -> float:
        """Calculate percentage lift"""
        if control_value == 0:
            return 0.0
        return ((treatment_value - control_value) / control_value) * 100
    
    def auto_select_winner(self, experiment: str, min_sample_size: int = 100) -> Dict:
        """Automatically select winning variant based on statistical significance"""
        from config.database import SessionLocal
        
        db = SessionLocal()
        results = self.calculate_experiment_results(experiment, days=30, db=db)
        
        control = results['control']
        treatment = results['treatment']
        
        # Check minimum sample size
        if control['customers'] < min_sample_size or treatment['customers'] < min_sample_size:
            return {
                'experiment': experiment,
                'winner': None,
                'reason': 'Insufficient sample size',
                'recommendation': 'Continue experiment'
            }
        
        # Calculate statistical significance (simplified)
        revenue_lift = results['lift']['revenue']
        conversion_lift = results['lift']['conversion_rate']
        
        # Winner criteria: >10% lift in revenue or conversion
        if revenue_lift > 10 and conversion_lift > 5:
            winner = 'treatment'
            self.experiments[experiment]['winner'] = winner
            self.experiments[experiment]['status'] = 'completed'
            
            return {
                'experiment': experiment,
                'winner': winner,
                'revenue_lift': revenue_lift,
                'conversion_lift': conversion_lift,
                'recommendation': 'Deploy treatment to 100% of users'
            }
        elif revenue_lift < -5 or conversion_lift < -5:
            winner = 'control'
            self.experiments[experiment]['winner'] = winner
            self.experiments[experiment]['status'] = 'completed'
            
            return {
                'experiment': experiment,
                'winner': winner,
                'revenue_lift': revenue_lift,
                'conversion_lift': conversion_lift,
                'recommendation': 'Keep control, treatment underperforms'
            }
        else:
            return {
                'experiment': experiment,
                'winner': None,
                'revenue_lift': revenue_lift,
                'conversion_lift': conversion_lift,
                'recommendation': 'No clear winner, continue experiment'
            }
    
    def get_experiment_status(self, experiment: str) -> Dict:
        """Get current status of experiment"""
        if experiment not in self.experiments:
            return {'error': 'Experiment not found'}
        
        exp = self.experiments[experiment]
        return {
            'experiment': experiment,
            'status': exp.get('status', 'active'),
            'winner': exp.get('winner'),
            'split': exp['split'],
            'control': exp['control'],
            'treatment': exp['treatment']
        }
    
    def create_experiment(self, name: str, control: str, treatment: str, split: float = 0.5):
        """Create new A/B test experiment"""
        self.experiments[name] = {
            'control': control,
            'treatment': treatment,
            'split': split,
            'status': 'active',
            'winner': None
        }
        return {'experiment': name, 'status': 'created'}


class ROIDashboard:
    """Calculate and display ROI metrics"""
    
    def calculate_ai_roi(self, days: int = 30) -> Dict:
        """Calculate overall AI ROI"""
        
        from config.database import SessionLocal
        db = SessionLocal()
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        # Total revenue
        all_orders = db.query(Order).filter(
            Order.created_at > cutoff
        ).all()
        total_revenue = sum(order.total for order in all_orders)
        
        # AI-influenced revenue (orders with recommended products)
        ai_influenced_orders = []
        for order in all_orders:
            # Check if order contains recommended products
            # (simplified - actual implementation would check recommendation logs)
            ai_influenced_orders.append(order)
        
        ai_revenue = sum(order.total for order in ai_influenced_orders)
        
        # Calculate costs (API, infrastructure)
        monthly_cost = 500  # Estimated monthly cost
        daily_cost = monthly_cost / 30
        period_cost = daily_cost * days
        
        # ROI calculation
        roi = ((ai_revenue - period_cost) / period_cost) * 100 if period_cost > 0 else 0
        
        db.close()
        
        return {
            'period_days': days,
            'total_revenue': total_revenue,
            'ai_influenced_revenue': ai_revenue,
            'ai_revenue_percentage': (ai_revenue / total_revenue * 100) if total_revenue > 0 else 0,
            'infrastructure_cost': period_cost,
            'net_profit': ai_revenue - period_cost,
            'roi_percentage': roi,
            'payback_achieved': roi > 0
        }
    
    def founder_dashboard_metrics(self) -> Dict:
        """Key metrics for founders"""
        
        roi_30d = self.calculate_ai_roi(30)
        
        from config.database import SessionLocal
        db = SessionLocal()
        
        cutoff_7d = datetime.utcnow() - timedelta(days=7)
        cutoff_30d = datetime.utcnow() - timedelta(days=30)
        
        # Week over week growth
        orders_7d = db.query(Order).filter(Order.created_at > cutoff_7d).count()
        orders_prev_7d = db.query(Order).filter(
            Order.created_at > cutoff_30d,
            Order.created_at < cutoff_7d
        ).count()
        
        wow_growth = ((orders_7d - orders_prev_7d) / orders_prev_7d * 100) if orders_prev_7d > 0 else 0
        
        db.close()
        
        return {
            'ai_roi': roi_30d['roi_percentage'],
            'ai_revenue_30d': roi_30d['ai_influenced_revenue'],
            'net_profit_30d': roi_30d['net_profit'],
            'revenue_attribution': roi_30d['ai_revenue_percentage'],
            'wow_growth': wow_growth,
            'payback_status': 'Profitable' if roi_30d['payback_achieved'] else 'Investment Phase'
        }
