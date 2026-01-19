"""
AI Chatbot Backend - Sales Assistant
Copyright © 2024 Paksa IT Solutions

Fashion stylist that drives conversion
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from ml_models.recommendation.inference import RecommendationEngine
from decision_engine.engine import DecisionEngine

router = APIRouter()

recommendation_engine = RecommendationEngine()
decision_engine = DecisionEngine()


class ChatMessage(BaseModel):
    message: str
    customer_id: Optional[int] = None
    session_id: str
    context: Dict = {}


class ChatResponse(BaseModel):
    message: str
    products: Optional[List[Dict]] = None
    options: Optional[List[str]] = None
    action: Optional[str] = None


class ChatbotEngine:
    """Sales-focused chatbot"""
    
    INTENT_PATTERNS = {
        'wedding': ['wedding', 'bride', 'bridal', 'shaadi', 'walima'],
        'party': ['party', 'event', 'function', 'gathering'],
        'casual': ['casual', 'daily', 'everyday', 'comfortable'],
        'eid': ['eid', 'festival', 'celebration'],
        'formal': ['formal', 'office', 'professional', 'work'],
        'price': ['price', 'cost', 'budget', 'cheap', 'expensive', 'affordable'],
        'size': ['size', 'fit', 'fitting', 'measurement'],
        'color': ['color', 'colour', 'shade']
    }
    
    def detect_intent(self, message: str) -> str:
        """Detect user intent"""
        message_lower = message.lower()
        
        for intent, patterns in self.INTENT_PATTERNS.items():
            if any(pattern in message_lower for pattern in patterns):
                return intent
        
        return 'general'
    
    def generate_response(
        self,
        message: str,
        customer_id: Optional[int],
        session_id: str,
        context: Dict
    ) -> ChatResponse:
        """Generate contextual response"""
        
        intent = self.detect_intent(message)
        
        # Wedding outfit request
        if intent == 'wedding':
            products = self._get_category_products('wedding', customer_id, session_id)
            return ChatResponse(
                message="Beautiful! I have stunning wedding outfits for you. What's your budget range?",
                products=products[:4],
                options=['Under $200', '$200-$500', '$500+', 'Show All']
            )
        
        # Party wear
        elif intent == 'party':
            products = self._get_category_products('party', customer_id, session_id)
            return ChatResponse(
                message="Perfect for parties! These are trending right now. What style do you prefer?",
                products=products[:4],
                options=['Elegant', 'Bold', 'Classic', 'Modern']
            )
        
        # Eid collection
        elif intent == 'eid':
            products = self._get_category_products('eid', customer_id, session_id)
            return ChatResponse(
                message="Our Eid collection is here! These are customer favorites. Want to see more?",
                products=products[:4],
                options=['Yes, show more', 'Filter by price', 'Filter by color']
            )
        
        # Price inquiry
        elif intent == 'price':
            return ChatResponse(
                message="I can help you find something within your budget. What's your price range?",
                options=['Under $100', '$100-$200', '$200-$500', '$500+']
            )
        
        # Size inquiry
        elif intent == 'size':
            return ChatResponse(
                message="I can help with sizing! What size do you usually wear?",
                options=['Small', 'Medium', 'Large', 'Extra Large', 'Size Guide']
            )
        
        # General inquiry
        else:
            # Show personalized recommendations
            if customer_id:
                recommendations = recommendation_engine.predict(
                    customer_id=customer_id,
                    session_id=session_id,
                    limit=4,
                    recommendation_type='personalized'
                )
                products = recommendations.get('products', [])
            else:
                products = self._get_trending_products()
            
            return ChatResponse(
                message="I'm here to help you find the perfect outfit! What are you looking for today?",
                products=products[:4],
                options=['Wedding Outfit', 'Party Wear', 'Casual Wear', 'Eid Collection']
            )
    
    def _get_category_products(
        self,
        category: str,
        customer_id: Optional[int],
        session_id: str
    ) -> List[Dict]:
        """Get products for category"""
        # Simplified - actual implementation would query database
        return []
    
    def _get_trending_products(self) -> List[Dict]:
        """Get trending products"""
        return []
    
    def handle_objection(self, objection_type: str) -> str:
        """Handle common objections"""
        
        objections = {
            'price_high': "I understand! We have a special offer right now - use code SAVE15 for 15% off. Plus free shipping!",
            'size_concern': "No worries! We offer free exchanges and our size guide is very accurate. Plus, free returns within 14 days.",
            'quality_doubt': "Great question! All our products are premium quality with 100+ 5-star reviews. Check customer photos!",
            'delivery_time': "We deliver in 2-3 business days with real-time tracking. Need it urgently? We have express delivery!",
            'not_sure': "Take your time! I can save these items for you and send you a special discount code via WhatsApp?"
        }
        
        return objections.get(objection_type, "Let me help you with that!")


chatbot_engine = ChatbotEngine()


@router.post("/chatbot/message", response_model=ChatResponse)
async def chat_message(chat: ChatMessage):
    """Handle chat message"""
    try:
        response = chatbot_engine.generate_response(
            message=chat.message,
            customer_id=chat.customer_id,
            session_id=chat.session_id,
            context=chat.context
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chatbot/objection")
async def handle_objection(objection_type: str):
    """Handle sales objection"""
    response = chatbot_engine.handle_objection(objection_type)
    return {"message": response}
