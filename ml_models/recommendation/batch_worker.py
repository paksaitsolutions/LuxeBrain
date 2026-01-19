"""
Batch Inference Worker
Copyright © 2024 Paksa IT Solutions
"""

import time
from ml_models.recommendation.batch_inference import BatchInferenceQueue


def run_worker(interval: int = 5):
    """Run batch processor worker"""
    queue = BatchInferenceQueue()
    print("Batch inference worker started...")
    
    while True:
        try:
            processed = queue.process_batch()
            if processed > 0:
                print(f"Processed {processed} recommendations")
            time.sleep(interval)
        except KeyboardInterrupt:
            print("Worker stopped")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(interval)


if __name__ == "__main__":
    run_worker()
