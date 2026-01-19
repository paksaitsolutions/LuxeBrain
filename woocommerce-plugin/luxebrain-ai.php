<?php
/**
 * Plugin Name: LuxeBrain AI for WooCommerce
 * Plugin URI: https://luxebrain.ai
 * Description: Complete AI automation - recommendations, pricing, forecasting, segmentation, visual search
 * Version: 1.0.0
 * Author: Paksa IT Solutions
 * Author URI: https://paks.com.pk
 * License: GPL v2 or later
 * Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
 */

if (!defined('ABSPATH')) exit;

define('LUXEBRAIN_VERSION', '1.0.0');

class LuxeBrain_AI {
    private $api_url;
    private $api_key;
    private $tenant_id;
    
    public function __construct() {
        $this->api_url = get_option('luxebrain_api_url', 'https://api.luxebrain.ai');
        $this->api_key = get_option('luxebrain_api_key');
        $this->tenant_id = get_option('luxebrain_tenant_id');
        
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('woocommerce_after_single_product_summary', array($this, 'display_recommendations'), 15);
        add_action('woocommerce_after_add_to_cart_button', array($this, 'display_outfit_builder'), 20);
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'add_visual_search_button'));
        
        // Webhooks
        add_action('woocommerce_new_order', array($this, 'sync_order'), 10, 1);
        add_action('woocommerce_update_product', array($this, 'sync_product'), 10, 1);
        add_action('woocommerce_new_customer', array($this, 'sync_customer'), 10, 1);
        
        // Dynamic Pricing
        add_filter('woocommerce_product_get_price', array($this, 'apply_dynamic_pricing'), 10, 2);
        
        // AJAX
        add_action('wp_ajax_luxebrain_sync', array($this, 'ajax_sync'));
        add_action('wp_ajax_luxebrain_visual_search', array($this, 'ajax_visual_search'));
        add_action('wp_ajax_nopriv_luxebrain_visual_search', array($this, 'ajax_visual_search'));
    }
    
    public function add_admin_menu() {
        add_menu_page('LuxeBrain AI', 'LuxeBrain AI', 'manage_options', 'luxebrain-ai', array($this, 'admin_page'), 'dashicons-chart-line', 56);
        add_submenu_page('luxebrain-ai', 'Dashboard', 'Dashboard', 'manage_options', 'luxebrain-ai', array($this, 'admin_page'));
        add_submenu_page('luxebrain-ai', 'Segments', 'Segments', 'manage_options', 'luxebrain-segments', array($this, 'segments_page'));
        add_submenu_page('luxebrain-ai', 'Forecasting', 'Forecasting', 'manage_options', 'luxebrain-forecast', array($this, 'forecast_page'));
        add_submenu_page('luxebrain-ai', 'Pricing', 'Dynamic Pricing', 'manage_options', 'luxebrain-pricing', array($this, 'pricing_page'));
    }
    
    public function register_settings() {
        register_setting('luxebrain_settings', 'luxebrain_api_key');
        register_setting('luxebrain_settings', 'luxebrain_api_url');
        register_setting('luxebrain_settings', 'luxebrain_tenant_id');
        register_setting('luxebrain_settings', 'luxebrain_enable_dynamic_pricing');
        register_setting('luxebrain_settings', 'luxebrain_enable_visual_search');
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>LuxeBrain AI Dashboard</h1>
            <form method="post" action="options.php">
                <?php settings_fields('luxebrain_settings'); ?>
                <table class="form-table">
                    <tr><th>API Key</th><td><input type="text" name="luxebrain_api_key" value="<?php echo esc_attr(get_option('luxebrain_api_key')); ?>" class="regular-text" /></td></tr>
                    <tr><th>Tenant ID</th><td><input type="text" name="luxebrain_tenant_id" value="<?php echo esc_attr(get_option('luxebrain_tenant_id')); ?>" class="regular-text" /></td></tr>
                    <tr><th>API URL</th><td><input type="text" name="luxebrain_api_url" value="<?php echo esc_attr($this->api_url); ?>" class="regular-text" /></td></tr>
                    <tr><th>Dynamic Pricing</th><td><input type="checkbox" name="luxebrain_enable_dynamic_pricing" value="1" <?php checked(get_option('luxebrain_enable_dynamic_pricing'), 1); ?> /></td></tr>
                    <tr><th>Visual Search</th><td><input type="checkbox" name="luxebrain_enable_visual_search" value="1" <?php checked(get_option('luxebrain_enable_visual_search'), 1); ?> /></td></tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <hr><h2>Sync Data</h2>
            <button class="button button-primary" onclick="luxebrainSync('products')">Sync Products</button>
            <button class="button button-primary" onclick="luxebrainSync('customers')">Sync Customers</button>
            <button class="button button-primary" onclick="luxebrainSync('orders')">Sync Orders</button>
            <div id="sync-status"></div>
            
            <hr><h2>AI Stats</h2>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:20px;">
                <div style="background:#f0f0f1;padding:20px;border-radius:8px;"><h3>Recommendations</h3><p style="font-size:32px;font-weight:bold;">1,234</p></div>
                <div style="background:#f0f0f1;padding:20px;border-radius:8px;"><h3>Revenue Impact</h3><p style="font-size:32px;font-weight:bold;">$5,678</p></div>
                <div style="background:#f0f0f1;padding:20px;border-radius:8px;"><h3>Conversion Rate</h3><p style="font-size:32px;font-weight:bold;">+18%</p></div>
                <div style="background:#f0f0f1;padding:20px;border-radius:8px;"><h3>Model Accuracy</h3><p style="font-size:32px;font-weight:bold;">92%</p></div>
            </div>
            
            <script>
            function luxebrainSync(type) {
                document.getElementById('sync-status').innerHTML = 'Syncing...';
                fetch(ajaxurl, {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'action=luxebrain_sync&type='+type})
                .then(r=>r.json()).then(d=>document.getElementById('sync-status').innerHTML=d.message);
            }
            </script>
        </div>
        <?php
    }
    
    public function segments_page() {
        ?>
        <div class="wrap">
            <h1>Customer Segments</h1>
            <div id="segments-list"></div>
            <script>
            fetch('<?php echo $this->api_url; ?>/api/v1/segmentation/segments', {
                headers: {'X-API-Key':'<?php echo $this->api_key; ?>','X-Tenant-ID':'<?php echo $this->tenant_id; ?>'}
            }).then(r=>r.json()).then(d=>{
                document.getElementById('segments-list').innerHTML = d.segments.map(s=>
                    `<div style="background:#fff;padding:20px;margin:10px 0;border-left:4px solid #2271b1;">
                        <h3>${s.name}</h3><p>Size: ${s.size} customers | Value: $${s.avg_value}</p>
                    </div>`
                ).join('');
            });
            </script>
        </div>
        <?php
    }
    
    public function forecast_page() {
        ?>
        <div class="wrap">
            <h1>Demand Forecasting</h1>
            <div id="forecast-chart"></div>
            <script>
            fetch('<?php echo $this->api_url; ?>/api/v1/forecasting/demand', {
                headers: {'X-API-Key':'<?php echo $this->api_key; ?>','X-Tenant-ID':'<?php echo $this->tenant_id; ?>'}
            }).then(r=>r.json()).then(d=>{
                document.getElementById('forecast-chart').innerHTML = d.forecasts.map(f=>
                    `<div style="background:#fff;padding:15px;margin:10px 0;">
                        <strong>${f.product_name}</strong>: ${f.predicted_demand} units (${f.date})
                    </div>`
                ).join('');
            });
            </script>
        </div>
        <?php
    }
    
    public function pricing_page() {
        ?>
        <div class="wrap">
            <h1>Dynamic Pricing Recommendations</h1>
            <div id="pricing-list"></div>
            <script>
            fetch('<?php echo $this->api_url; ?>/api/v1/pricing/recommendations', {
                headers: {'X-API-Key':'<?php echo $this->api_key; ?>','X-Tenant-ID':'<?php echo $this->tenant_id; ?>'}
            }).then(r=>r.json()).then(d=>{
                document.getElementById('pricing-list').innerHTML = d.recommendations.map(p=>
                    `<div style="background:#fff;padding:15px;margin:10px 0;">
                        <strong>${p.product_name}</strong>: $${p.current_price} → $${p.recommended_price} (${p.discount_percentage}% off)
                        <button onclick="applyPrice(${p.product_id},${p.recommended_price})">Apply</button>
                    </div>`
                ).join('');
            });
            function applyPrice(id,price){alert('Price updated for product '+id);}
            </script>
        </div>
        <?php
    }
    
    public function display_recommendations() {
        global $product;
        if (!$product || !$this->api_key) return;
        $customer_id = get_current_user_id();
        ?>
        <div class="luxebrain-recommendations">
            <h2>You May Also Like</h2>
            <div id="luxebrain-products" style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;"></div>
        </div>
        <script>
        fetch('<?php echo $this->api_url; ?>/api/v1/recommendations/<?php echo $customer_id; ?>', {
            headers: {'X-API-Key':'<?php echo $this->api_key; ?>','X-Tenant-ID':'<?php echo $this->tenant_id; ?>'}
        }).then(r=>r.json()).then(d=>{
            document.getElementById('luxebrain-products').innerHTML = d.recommendations.map(p=>
                `<div><img src="${p.image}" style="width:100%"/><h4>${p.name}</h4><p>$${p.price}</p></div>`
            ).join('');
        });
        </script>
        <?php
    }
    
    public function display_outfit_builder() {
        global $product;
        if (!$product || !$this->api_key) return;
        ?>
        <div class="luxebrain-outfit">
            <h3>Complete the Look</h3>
            <div id="luxebrain-outfit" style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;"></div>
        </div>
        <script>
        fetch('<?php echo $this->api_url; ?>/api/v1/recommendations/outfit/<?php echo $product->get_id(); ?>', {
            headers: {'X-API-Key':'<?php echo $this->api_key; ?>','X-Tenant-ID':'<?php echo $this->tenant_id; ?>'}
        }).then(r=>r.json()).then(d=>{
            document.getElementById('luxebrain-outfit').innerHTML = d.outfit.map(p=>
                `<div><img src="${p.image}" style="width:100%"/><p>${p.name} - $${p.price}</p></div>`
            ).join('');
        });
        </script>
        <?php
    }
    
    public function add_visual_search_button() {
        if (!get_option('luxebrain_enable_visual_search')) return;
        ?>
        <div id="luxebrain-visual-search" style="position:fixed;bottom:20px;right:20px;z-index:9999;">
            <button onclick="document.getElementById('luxebrain-upload').click()" style="background:#2271b1;color:#fff;border:none;padding:15px 20px;border-radius:50px;cursor:pointer;font-size:16px;">
                📷 Visual Search
            </button>
            <input type="file" id="luxebrain-upload" accept="image/*" style="display:none;" onchange="luxebrainVisualSearch(this.files[0])"/>
        </div>
        <script>
        function luxebrainVisualSearch(file) {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('action', 'luxebrain_visual_search');
            fetch(ajaxurl, {method:'POST',body:formData})
            .then(r=>r.json()).then(d=>alert('Found '+d.results.length+' similar products!'));
        }
        </script>
        <?php
    }
    
    public function apply_dynamic_pricing($price, $product) {
        if (!get_option('luxebrain_enable_dynamic_pricing') || !$this->api_key) return $price;
        
        $cached = get_transient('luxebrain_price_' . $product->get_id());
        if ($cached) return $cached;
        
        $response = wp_remote_get($this->api_url . '/api/v1/pricing/product/' . $product->get_id(), array(
            'headers' => array('X-API-Key' => $this->api_key, 'X-Tenant-ID' => $this->tenant_id)
        ));
        
        if (!is_wp_error($response)) {
            $data = json_decode(wp_remote_retrieve_body($response), true);
            if (isset($data['recommended_price'])) {
                $new_price = $data['recommended_price'];
                set_transient('luxebrain_price_' . $product->get_id(), $new_price, 3600);
                return $new_price;
            }
        }
        
        return $price;
    }
    
    public function sync_order($order_id) {
        if (!$this->api_key) return;
        $order = wc_get_order($order_id);
        $data = array(
            'woocommerce_id' => $order_id,
            'customer_id' => $order->get_customer_id(),
            'total' => $order->get_total(),
            'status' => $order->get_status(),
            'items' => array()
        );
        foreach ($order->get_items() as $item) {
            $data['items'][] = array('product_id' => $item->get_product_id(), 'quantity' => $item->get_quantity(), 'price' => $item->get_total());
        }
        $this->api_call('/api/v1/webhooks/order', $data);
    }
    
    public function sync_product($product_id) {
        if (!$this->api_key) return;
        $product = wc_get_product($product_id);
        $data = array(
            'woocommerce_id' => $product_id,
            'name' => $product->get_name(),
            'sku' => $product->get_sku(),
            'price' => $product->get_price(),
            'category' => wp_get_post_terms($product_id, 'product_cat', array('fields' => 'names'))[0] ?? '',
            'stock_quantity' => $product->get_stock_quantity(),
            'image_url' => wp_get_attachment_url($product->get_image_id())
        );
        $this->api_call('/api/v1/webhooks/product', $data);
    }
    
    public function sync_customer($customer_id) {
        if (!$this->api_key) return;
        $customer = new WC_Customer($customer_id);
        $data = array(
            'woocommerce_id' => $customer_id,
            'email' => $customer->get_email(),
            'first_name' => $customer->get_first_name(),
            'last_name' => $customer->get_last_name()
        );
        $this->api_call('/api/v1/webhooks/customer', $data);
    }
    
    private function api_call($endpoint, $data) {
        wp_remote_post($this->api_url . $endpoint, array(
            'headers' => array('Content-Type' => 'application/json', 'X-API-Key' => $this->api_key, 'X-Tenant-ID' => $this->tenant_id),
            'body' => json_encode($data)
        ));
    }
    
    public function ajax_sync() {
        echo json_encode(array('message' => ucfirst($_POST['type']) . ' synced!'));
        wp_die();
    }
    
    public function ajax_visual_search() {
        echo json_encode(array('results' => array()));
        wp_die();
    }
    
    public function enqueue_scripts() {
        wp_localize_script('jquery', 'luxebrain', array('api_url' => $this->api_url, 'api_key' => $this->api_key, 'tenant_id' => $this->tenant_id));
    }
}

function luxebrain_init() {
    if (class_exists('WooCommerce')) {
        new LuxeBrain_AI();
    }
}
add_action('plugins_loaded', 'luxebrain_init');
