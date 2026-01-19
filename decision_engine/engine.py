"""
Decision Engine
Copyright © 2024 Paksa IT Solutions

Combines AI model outputs with business rules to make actionable decisions
"""

from typing import Dict, List, Optional
from ml_models.recommendation.inference import RecommendationEngine
from ml_models.segmentation.inference import SegmentationEngine
from ml_models.pricing.inference import PricingEngine
from ml_models.forecasting.inference import ForecastingEngine


class DecisionEngine:
    """Central decision-making engine combining all AI models"""
    
    def __init__(self):
        self.recommendation_engine = RecommendationEngine()
        self.segmentation_engine = SegmentationEngine()
        self.pricing_engine = PricingEngine()
        self.forecasting_engine = ForecastingEngine()
    
    def personalize_homepage(self, customer_id: Optional[int], session_id: str) -> Dict:
        """Decide what to show on homepage"""
        
        decisions = {
            "hero_products": [],
            "recommended_products": [],
            "special_offers": [],
            "personalized_message": ""
        }
        
        if customer_id:
            # Get customer segment
            segment = self.segmentation_engine.predict(customer_id)
            
            # Get personalized recommendations
            recommendations = self.recommendation_engine.predict(
                customer_id=customer_id,
                session_id=session_id,
                limit=12,
                recommendation_type="personalized"
            )
            
            decisions["recommended_products"] = recommendations.get("products", [])
            
            # Segment-based personalization
            if segment["segment"] == "segment_0":  # High-value VIP
                decisions["personalized_message"] = "Welcome back, VIP! Exclusive new arrivals just for you."
            elif segment["segment"] == "segment_2":  # Discount seeker
                decisions["personalized_message"] = "Special deals waiting for you!"
        else:
            # Anonymous user - show trending
            recommendations = self.recommendation_engine.predict(
                customer_id=None,
                session_id=session_id,
                limit=12,
                recommendation_type="trending"
            )
            decisions["recommended_products"] = recommendations.get("products", [])
        
        return decisions
    
    def optimize_product_page(self, product_id: int, customer_id: Optional[int]) -> Dict:
        """Decide what to show on product page"""
        
        decisions = {
            "cross_sell": [],
            "outfit_suggestions": [],
            "discount_offer": None,
            "urgency_message": None
        }
        
        # Cross-sell recommendations
        cross_sell = self.recommendation_engine.cross_sell(product_id, limit=4)
        decisions["cross_sell"] = cross_sell.get("products", [])
        
        # Outfit matching
        outfit = self.recommendation_engine.outfit_match(product_id, limit=3)
        decisions["outfit_suggestions"] = outfit.get("products", [])
        
        # Dynamic pricing
        pricing = self.pricing_engine.predict(product_id)
        if pricing["discount_percentage"] > 0:
            decisions["discount_offer"] = {
                "original_price": pricing["current_price"],
                "discounted_price": pricing["recommended_price"],
                "discount": pricing["discount_percentage"]
            }
        
        # Forecast-based urgency
        forecast = self.forecasting_engine.predict(product_id=product_id, days_ahead=7)
        if forecast and forecast[0]["predicted_demand"] > 10:
            decisions["urgency_message"] = "High demand! Order soon."
        
        return decisions
    
    def abandoned_cart_strategy(self, customer_id: int, cart_items: List[int]) -> Dict:
        """Decide abandoned cart recovery strategy"""
        
        strategy = {
            "send_email": False,
            "send_whatsapp": False,
            "discount_offer": 0,
            "wait_hours": 2,
            "message": ""
        }
        
        # Get customer segment
        segment = self.segmentation_engine.predict(customer_id)
        
        if segment["segment"] == "segment_0":  # High-value VIP
            strategy["send_email"] = True
            strategy["send_whatsapp"] = True
            strategy["discount_offer"] = 5
            strategy["wait_hours"] = 1
            strategy["message"] = "Your exclusive items are waiting!"
        
        elif segment["segment"] == "segment_2":  # Discount seeker
            strategy["send_email"] = True
            strategy["discount_offer"] = 15
            strategy["wait_hours"] = 3
            strategy["message"] = "Special 15% off on your cart items!"
        
        else:
            strategy["send_email"] = True
            strategy["discount_offer"] = 10
            strategy["wait_hours"] = 2
            strategy["message"] = "Complete your purchase and save 10%!"
        
        return strategy
    
    def inventory_restock_decision(self, product_id: int) -> Dict:
        """Decide if and when to restock"""
        
        decision = {
            "should_restock": False,
            "quantity": 0,
            "urgency": "low",
            "reason": ""
        }
        
        # Get demand forecast
        forecast = self.forecasting_engine.predict(product_id=product_id, days_ahead=30)
        
        if not forecast:
            return decision
        
        total_predicted_demand = sum(f["predicted_demand"] for f in forecast)
        
        if total_predicted_demand > 50:
            decision["should_restock"] = True
            decision["quantity"] = int(total_predicted_demand * 1.2)  # 20% buffer
            decision["urgency"] = "high"
            decision["reason"] = f"High predicted demand: {total_predicted_demand:.0f} units"
        
        return decision
    
    def marketing_campaign_targeting(self, campaign_type: str) -> Dict:
        """Decide who to target for marketing campaigns"""
        
        targeting = {
            "segments": [],
            "products": [],
            "discount_level": 0,
            "channels": []
        }
        
        if campaign_type == "new_arrival":
            targeting["segments"] = ["segment_0", "segment_1"]  # VIP and Loyal
            targeting["channels"] = ["email", "whatsapp"]
            targeting["discount_level"] = 0
        
        elif campaign_type == "clearance":
            targeting["segments"] = ["segment_2", "segment_3"]  # Discount seekers
            targeting["channels"] = ["email", "sms"]
            targeting["discount_level"] = 30
        
        elif campaign_type == "seasonal":
            targeting["segments"] = ["segment_0", "segment_1", "segment_2"]
            targeting["channels"] = ["email", "whatsapp", "push"]
            targeting["discount_level"] = 15
        
        return targeting


if __name__ == "__main__":
    print("Decision engine module")
