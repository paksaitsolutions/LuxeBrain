# Sample Training Datasets - Data Schema

**Copyright © 2024 Paksa IT Solutions**

## Overview

This directory contains sample datasets for training and testing ML models in the LuxeBrain AI system.

## Files

- `products.json` - Sample product catalog
- `customers.json` - Sample customer profiles
- `orders.json` - Sample order history

## Schema Definitions

### products.json

```json
{
  "id": "integer - Internal product ID",
  "woocommerce_id": "integer - WooCommerce product ID",
  "name": "string - Product name",
  "sku": "string - Stock keeping unit",
  "price": "float - Regular price",
  "sale_price": "float|null - Sale price if on sale",
  "category": "string - Product category",
  "stock_quantity": "integer - Available stock",
  "image_url": "string - Product image URL",
  "attributes": "object - Product attributes (size, color, etc.)"
}
```

### customers.json

```json
{
  "id": "integer - Internal customer ID",
  "woocommerce_id": "integer - WooCommerce customer ID",
  "email": "string - Customer email",
  "first_name": "string - First name",
  "last_name": "string - Last name",
  "total_spent": "float - Total amount spent",
  "order_count": "integer - Number of orders",
  "segment": "string - Customer segment (segment_0 to segment_4)",
  "lifetime_value": "float - Calculated lifetime value"
}
```

### orders.json

```json
{
  "id": "integer - Internal order ID",
  "woocommerce_id": "integer - WooCommerce order ID",
  "customer_id": "integer - Customer ID (FK)",
  "total": "float - Order total",
  "status": "string - Order status (completed, pending, etc.)",
  "payment_method": "string - Payment method used",
  "items": [
    {
      "product_id": "integer - Product ID (FK)",
      "quantity": "integer - Quantity ordered",
      "price": "float - Price per unit"
    }
  ]
}
```

## Customer Segments

- **segment_0**: High-Value VIP - Recent, frequent, high spending (>$500, 5+ orders, <30 days)
- **segment_1**: Loyal Regular - Recent, frequent (3+ orders, <60 days)
- **segment_2**: Discount Seeker - Frequent but low spending (3+ orders, <$200)
- **segment_3**: Occasional Buyer - Infrequent (1+ orders, <180 days)
- **segment_4**: New Customer - First purchase or very recent

## Usage

### Loading Sample Data

```python
import json

# Load products
with open('data/samples/products.json', 'r') as f:
    products = json.load(f)

# Load customers
with open('data/samples/customers.json', 'r') as f:
    customers = json.load(f)

# Load orders
with open('data/samples/orders.json', 'r') as f:
    orders = json.load(f)
```

### Importing to Database

```python
from config.database import SessionLocal
from api.models.database_models import Product, Customer, Order, OrderItem
import json

db = SessionLocal()

# Import products
with open('data/samples/products.json', 'r') as f:
    products_data = json.load(f)
    for p in products_data:
        product = Product(**p)
        db.add(product)

# Import customers
with open('data/samples/customers.json', 'r') as f:
    customers_data = json.load(f)
    for c in customers_data:
        customer = Customer(**c)
        db.add(customer)

db.commit()
db.close()
```

## Notes

- All sample data is fictional and for testing purposes only
- Timestamps are not included in JSON files - they will be auto-generated on import
- Product images use placeholder URLs
- Email addresses use example.com domain
