"""
WooCommerce Data Sync
Copyright © 2024 Paksa IT Solutions
"""

from woocommerce import API
from config.settings import settings
from sqlalchemy.orm import Session
from api.models.database_models import Customer, Product, Order, OrderItem
from datetime import datetime


class WooCommerceSync:
    """Sync data from WooCommerce to local database"""
    
    def __init__(self):
        self.wcapi = API(
            url=settings.WOOCOMMERCE_URL,
            consumer_key=settings.WOOCOMMERCE_CONSUMER_KEY,
            consumer_secret=settings.WOOCOMMERCE_CONSUMER_SECRET,
            version="wc/v3",
            timeout=30
        )
    
    def sync_customers(self, db: Session, page: int = 1, per_page: int = 100):
        """Sync customers from WooCommerce"""
        
        response = self.wcapi.get("customers", params={"page": page, "per_page": per_page})
        customers = response.json()
        
        for wc_customer in customers:
            customer = db.query(Customer).filter(
                Customer.woocommerce_id == wc_customer['id']
            ).first()
            
            if not customer:
                customer = Customer(woocommerce_id=wc_customer['id'])
            
            customer.email = wc_customer.get('email')
            customer.first_name = wc_customer.get('first_name')
            customer.last_name = wc_customer.get('last_name')
            customer.total_spent = float(wc_customer.get('total_spent', 0))
            customer.order_count = wc_customer.get('orders_count', 0)
            customer.updated_at = datetime.utcnow()
            
            db.add(customer)
        
        db.commit()
        return len(customers)
    
    def sync_products(self, db: Session, page: int = 1, per_page: int = 100):
        """Sync products from WooCommerce"""
        
        response = self.wcapi.get("products", params={"page": page, "per_page": per_page})
        products = response.json()
        
        for wc_product in products:
            product = db.query(Product).filter(
                Product.woocommerce_id == wc_product['id']
            ).first()
            
            if not product:
                product = Product(woocommerce_id=wc_product['id'])
            
            product.name = wc_product.get('name')
            product.sku = wc_product.get('sku')
            product.price = float(wc_product.get('price', 0))
            product.sale_price = float(wc_product.get('sale_price', 0)) if wc_product.get('sale_price') else None
            product.stock_quantity = wc_product.get('stock_quantity', 0)
            product.image_url = wc_product['images'][0]['src'] if wc_product.get('images') else None
            product.attributes = wc_product.get('attributes', [])
            product.updated_at = datetime.utcnow()
            
            # Extract category
            if wc_product.get('categories'):
                product.category = wc_product['categories'][0]['name']
            
            db.add(product)
        
        db.commit()
        return len(products)
    
    def sync_orders(self, db: Session, page: int = 1, per_page: int = 100):
        """Sync orders from WooCommerce"""
        
        response = self.wcapi.get("orders", params={"page": page, "per_page": per_page})
        orders = response.json()
        
        for wc_order in orders:
            order = db.query(Order).filter(
                Order.woocommerce_id == wc_order['id']
            ).first()
            
            if order:
                continue  # Skip existing orders
            
            # Find customer
            customer = db.query(Customer).filter(
                Customer.woocommerce_id == wc_order['customer_id']
            ).first()
            
            if not customer:
                continue
            
            order = Order(
                woocommerce_id=wc_order['id'],
                customer_id=customer.id,
                total=float(wc_order.get('total', 0)),
                status=wc_order.get('status'),
                payment_method=wc_order.get('payment_method'),
                created_at=datetime.fromisoformat(wc_order['date_created'].replace('Z', '+00:00'))
            )
            
            db.add(order)
            db.flush()
            
            # Add order items
            for item in wc_order.get('line_items', []):
                product = db.query(Product).filter(
                    Product.woocommerce_id == item['product_id']
                ).first()
                
                if product:
                    order_item = OrderItem(
                        order_id=order.id,
                        product_id=product.id,
                        quantity=item['quantity'],
                        price=float(item['price'])
                    )
                    db.add(order_item)
        
        db.commit()
        return len(orders)


if __name__ == "__main__":
    print("WooCommerce sync module")
