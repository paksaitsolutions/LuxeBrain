# WooCommerce Integration Guide

**Copyright © 2024 Paksa IT Solutions**

---

## 1. SETUP WOOCOMMERCE API

### Generate API Keys

1. Login to WordPress admin
2. Navigate to: WooCommerce → Settings → Advanced → REST API
3. Click "Add Key"
4. Set permissions: Read/Write
5. Copy Consumer Key and Consumer Secret

### Configure LuxeBrain

Add to `.env`:
```bash
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxx
```

---

## 2. SETUP WEBHOOKS

### Create Webhooks in WooCommerce

Navigate to: WooCommerce → Settings → Advanced → Webhooks

**Order Created**:
- Topic: Order created
- Delivery URL: https://your-api.com/api/v1/webhooks/order-created
- Secret: (generate strong secret)
- API Version: WP REST API Integration v3

**Customer Updated**:
- Topic: Customer updated
- Delivery URL: https://your-api.com/api/v1/webhooks/customer-updated

**Product Updated**:
- Topic: Product updated
- Delivery URL: https://your-api.com/api/v1/webhooks/product-updated

---

## 3. WORDPRESS PLUGIN INTEGRATION

### Install Custom Plugin

Create: `wp-content/plugins/luxebrain-ai/luxebrain-ai.php`

```php
<?php
/**
 * Plugin Name: LuxeBrain AI Integration
 * Description: AI-powered recommendations and personalization
 * Version: 1.0.0
 * Author: Paksa IT Solutions
 */

defined('ABSPATH') || exit;

class LuxeBrain_AI {
    private $api_url = 'https://your-api.com/api/v1';
    private $api_token = 'your-jwt-token';
    
    public function __construct() {
        add_action('woocommerce_after_single_product_summary', [$this, 'show_recommendations'], 15);
        add_action('wp_footer', [$this, 'track_behavior']);
    }
    
    public function show_recommendations() {
        global $product;
        $product_id = $product->get_id();
        
        $recommendations = $this->get_recommendations($product_id);
        
        if (!empty($recommendations)) {
            echo '<div class="luxebrain-recommendations">';
            echo '<h3>You May Also Like</h3>';
            // Display products
            echo '</div>';
        }
    }
    
    private function get_recommendations($product_id) {
        $response = wp_remote_get($this->api_url . '/recommendations/cross-sell/' . $product_id, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->api_token
            ]
        ]);
        
        if (is_wp_error($response)) {
            return [];
        }
        
        return json_decode(wp_remote_retrieve_body($response), true);
    }
    
    public function track_behavior() {
        ?>
        <script>
        (function() {
            const API_URL = '<?php echo $this->api_url; ?>';
            
            // Track page views
            document.addEventListener('DOMContentLoaded', function() {
                fetch(API_URL + '/events/track', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        event: 'page_view',
                        url: window.location.href,
                        timestamp: Date.now()
                    })
                });
            });
        })();
        </script>
        <?php
    }
}

new LuxeBrain_AI();
```

---

## 4. DISPLAY PERSONALIZED CONTENT

### Homepage Personalization

```php
// In your theme's functions.php or custom plugin

add_action('woocommerce_before_shop_loop', 'luxebrain_personalized_banner');

function luxebrain_personalized_banner() {
    $customer_id = get_current_user_id();
    
    $response = wp_remote_get('https://your-api.com/api/v1/personalization/homepage', [
        'headers' => ['Authorization' => 'Bearer ' . LUXEBRAIN_TOKEN],
        'body' => ['customer_id' => $customer_id]
    ]);
    
    $data = json_decode(wp_remote_retrieve_body($response), true);
    
    if (!empty($data['personalized_message'])) {
        echo '<div class="personalized-banner">' . esc_html($data['personalized_message']) . '</div>';
    }
}
```

### Dynamic Pricing Display

```php
add_filter('woocommerce_get_price_html', 'luxebrain_dynamic_pricing', 10, 2);

function luxebrain_dynamic_pricing($price, $product) {
    $product_id = $product->get_id();
    
    $response = wp_remote_get('https://your-api.com/api/v1/pricing/optimize', [
        'headers' => ['Authorization' => 'Bearer ' . LUXEBRAIN_TOKEN],
        'body' => ['product_id' => $product_id]
    ]);
    
    $pricing = json_decode(wp_remote_retrieve_body($response), true);
    
    if (!empty($pricing['discount_percentage']) && $pricing['discount_percentage'] > 0) {
        $original = $pricing['current_price'];
        $discounted = $pricing['recommended_price'];
        
        return '<del>' . wc_price($original) . '</del> <ins>' . wc_price($discounted) . '</ins>';
    }
    
    return $price;
}
```

---

## 5. ABANDONED CART AUTOMATION

### Track Cart Abandonment

```php
add_action('woocommerce_cart_updated', 'luxebrain_track_cart');

function luxebrain_track_cart() {
    $cart_items = WC()->cart->get_cart();
    $customer_id = get_current_user_id();
    
    if (empty($cart_items)) return;
    
    $product_ids = array_map(function($item) {
        return $item['product_id'];
    }, $cart_items);
    
    wp_remote_post('https://your-api.com/api/v1/events/cart-update', [
        'headers' => ['Authorization' => 'Bearer ' . LUXEBRAIN_TOKEN],
        'body' => json_encode([
            'customer_id' => $customer_id,
            'product_ids' => $product_ids,
            'timestamp' => time()
        ])
    ]);
}
```

---

## 6. VISUAL SEARCH WIDGET

### Add Upload Button

```php
add_action('woocommerce_before_shop_loop', 'luxebrain_visual_search_button');

function luxebrain_visual_search_button() {
    ?>
    <div class="luxebrain-visual-search">
        <button id="visual-search-btn">Search by Image</button>
        <input type="file" id="image-upload" accept="image/*" style="display:none;">
    </div>
    
    <script>
    document.getElementById('visual-search-btn').addEventListener('click', function() {
        document.getElementById('image-upload').click();
    });
    
    document.getElementById('image-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);
        
        fetch('https://your-api.com/api/v1/visual-search/search', {
            method: 'POST',
            headers: {'Authorization': 'Bearer <?php echo LUXEBRAIN_TOKEN; ?>'},
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            // Display results
            console.log(data);
        });
    });
    </script>
    <?php
}
```

---

## 7. TESTING INTEGRATION

### Test API Connection

```bash
curl -X GET "https://your-api.com/health" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Webhooks

```bash
curl -X POST "https://your-api.com/api/v1/webhooks/order-created" \
  -H "Content-Type: application/json" \
  -d '{"event": "order.created", "data": {...}}'
```

---

## 8. TROUBLESHOOTING

**Issue**: Webhooks not firing
- Check WooCommerce webhook logs
- Verify delivery URL is accessible
- Check firewall settings

**Issue**: API authentication fails
- Verify JWT token is valid
- Check token expiration
- Ensure Authorization header is set

**Issue**: Slow response times
- Enable Redis caching
- Check database indexes
- Monitor API server load

---

**For more details, see [API Reference](api_reference.md)**
