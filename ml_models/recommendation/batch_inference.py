"""
Batch Inference for Recommendations
Copyright © 2024 Paksa IT Solutions
"""

import redis
import json
import uuid
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from ml_models.recommendation.inference import RecommendationEngine


class BatchInferenceQueue:
    """Queue and process recommendation requests in batches"""
    
    def __init__(self):
        self.redis_client = redis.from_url("redis://localhost:6379/0")
        self.engine = RecommendationEngine()
        self.batch_size = 10
        self.timeout = 300  # 5 minutes
    
    def enqueue(
        self,
        customer_id: Optional[int],
        session_id: Optional[str],
        limit: int = 10,
        recommendation_type: str = "personalized",
        tenant_id: Optional[str] = None
    ) -> str:
        """Add request to queue, return job_id"""
        job_id = str(uuid.uuid4())
        request = {
            "job_id": job_id,
            "customer_id": customer_id,
            "session_id": session_id,
            "limit": limit,
            "recommendation_type": recommendation_type,
            "tenant_id": tenant_id,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Add to queue
        self.redis_client.lpush("batch_queue:recommendations", json.dumps(request))
        
        # Set status
        self.redis_client.setex(f"job:{job_id}:status", self.timeout, "pending")
        
        return job_id
    
    def get_result(self, job_id: str) -> Optional[Dict]:
        """Get result for job_id"""
        status = self.redis_client.get(f"job:{job_id}:status")
        if not status:
            return {"status": "expired"}
        
        status = status.decode()
        if status == "pending":
            return {"status": "pending"}
        elif status == "processing":
            return {"status": "processing"}
        elif status == "completed":
            result = self.redis_client.get(f"job:{job_id}:result")
            return json.loads(result) if result else {"status": "error"}
        
        return {"status": "unknown"}
    
    def process_batch(self):
        """Process batch of requests"""
        batch = []
        
        # Pop batch_size items from queue
        for _ in range(self.batch_size):
            item = self.redis_client.rpop("batch_queue:recommendations")
            if not item:
                break
            batch.append(json.loads(item))
        
        if not batch:
            return 0
        
        # Process each request
        for request in batch:
            job_id = request["job_id"]
            
            try:
                # Update status
                self.redis_client.setex(f"job:{job_id}:status", self.timeout, "processing")
                
                # Generate recommendations
                result = self.engine.predict(
                    customer_id=request["customer_id"],
                    session_id=request["session_id"],
                    limit=request["limit"],
                    recommendation_type=request["recommendation_type"],
                    tenant_id=request["tenant_id"]
                )
                
                # Store result
                result["status"] = "completed"
                result["job_id"] = job_id
                self.redis_client.setex(f"job:{job_id}:result", self.timeout, json.dumps(result))
                self.redis_client.setex(f"job:{job_id}:status", self.timeout, "completed")
                
            except Exception as e:
                # Store error
                error_result = {"status": "error", "error": str(e), "job_id": job_id}
                self.redis_client.setex(f"job:{job_id}:result", self.timeout, json.dumps(error_result))
                self.redis_client.setex(f"job:{job_id}:status", self.timeout, "completed")
        
        return len(batch)
