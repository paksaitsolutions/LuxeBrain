/**
 * AI Chatbot - Sales Assistant
 * Copyright © 2024 Paksa IT Solutions
 */

class LuxeBrain_Chatbot {
    private $api_url;
    private $api_token;
    
    public function __construct() {
        $this->api_url = get_option('luxebrain_api_url');
        $this->api_token = get_option('luxebrain_api_token');
        
        add_action('wp_footer', [$this, 'render_chatbot']);
        add_action('wp_ajax_luxebrain_chat', [$this, 'handle_chat']);
        add_action('wp_ajax_nopriv_luxebrain_chat', [$this, 'handle_chat']);
    }
    
    public function render_chatbot() {
        ?>
        <div id="luxebrain-chatbot" class="luxebrain-chat-widget">
            <div class="chat-button" onclick="LuxeBrainChat.toggle()">
                <span>Need Style Help?</span>
            </div>
            <div class="chat-window" style="display:none;">
                <div class="chat-header">
                    <h4>Your Style Assistant</h4>
                    <button onclick="LuxeBrainChat.close()">×</button>
                </div>
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" id="chat-input" placeholder="Ask me anything...">
                    <button onclick="LuxeBrainChat.send()">Send</button>
                </div>
            </div>
        </div>
        
        <script>
        const LuxeBrainChat = {
            isOpen: false,
            
            toggle() {
                this.isOpen = !this.isOpen;
                document.querySelector('.chat-window').style.display = this.isOpen ? 'flex' : 'none';
                if (this.isOpen && document.getElementById('chat-messages').children.length === 0) {
                    this.addMessage('bot', 'Hi! I\'m your style assistant. Looking for something special?');
                    this.showQuickOptions();
                }
            },
            
            close() {
                this.isOpen = false;
                document.querySelector('.chat-window').style.display = 'none';
            },
            
            send() {
                const input = document.getElementById('chat-input');
                const message = input.value.trim();
                if (!message) return;
                
                this.addMessage('user', message);
                input.value = '';
                
                fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: 'action=luxebrain_chat&message=' + encodeURIComponent(message)
                })
                .then(r => r.json())
                .then(data => {
                    this.addMessage('bot', data.message);
                    if (data.products) this.showProducts(data.products);
                    if (data.options) this.showQuickOptions(data.options);
                });
            },
            
            addMessage(type, text) {
                const msg = document.createElement('div');
                msg.className = 'chat-message ' + type;
                msg.textContent = text;
                document.getElementById('chat-messages').appendChild(msg);
                msg.scrollIntoView();
            },
            
            showProducts(products) {
                const container = document.createElement('div');
                container.className = 'chat-products';
                products.forEach(p => {
                    container.innerHTML += `
                        <div class="chat-product">
                            <img src="${p.image}" alt="${p.name}">
                            <h5>${p.name}</h5>
                            <span>${p.price}</span>
                            <a href="${p.url}">View</a>
                        </div>
                    `;
                });
                document.getElementById('chat-messages').appendChild(container);
            },
            
            showQuickOptions(options = ['Wedding Outfit', 'Casual Wear', 'Party Dress', 'Eid Collection']) {
                const container = document.createElement('div');
                container.className = 'chat-options';
                options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.textContent = opt;
                    btn.onclick = () => {
                        document.getElementById('chat-input').value = opt;
                        this.send();
                    };
                    container.appendChild(btn);
                });
                document.getElementById('chat-messages').appendChild(container);
            }
        };
        
        document.getElementById('chat-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') LuxeBrainChat.send();
        });
        </script>
        
        <style>
        .luxebrain-chat-widget { position: fixed; bottom: 20px; right: 20px; z-index: 9999; }
        .chat-button { background: #000; color: #fff; padding: 15px 25px; border-radius: 50px; cursor: pointer; }
        .chat-window { display: flex; flex-direction: column; width: 350px; height: 500px; background: #fff; border-radius: 10px; box-shadow: 0 5px 30px rgba(0,0,0,0.3); }
        .chat-header { background: #000; color: #fff; padding: 15px; display: flex; justify-content: space-between; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 15px; }
        .chat-message { margin: 10px 0; padding: 10px; border-radius: 8px; max-width: 80%; }
        .chat-message.user { background: #000; color: #fff; margin-left: auto; }
        .chat-message.bot { background: #f0f0f0; }
        .chat-input { display: flex; padding: 10px; border-top: 1px solid #ddd; }
        .chat-input input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .chat-input button { margin-left: 10px; padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 5px; }
        .chat-options button { margin: 5px; padding: 8px 15px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 20px; cursor: pointer; }
        .chat-products { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
        .chat-product { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .chat-product img { width: 100%; height: 100px; object-fit: cover; }
        </style>
        <?php
    }
    
    public function handle_chat() {
        $message = sanitize_text_field($_POST['message']);
        $customer_id = get_current_user_id();
        
        $response = wp_remote_post($this->api_url . '/api/v1/chatbot/message', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->api_token,
                'Content-Type' => 'application/json'
            ],
            'body' => json_encode([
                'message' => $message,
                'customer_id' => $customer_id ?: null,
                'context' => [
                    'page_url' => $_SERVER['HTTP_REFERER'] ?? '',
                    'cart_total' => WC()->cart ? WC()->cart->get_cart_contents_total() : 0
                ]
            ])
        ]);
        
        if (is_wp_error($response)) {
            wp_send_json(['message' => 'Let me connect you with our team.']);
        }
        
        $data = json_decode(wp_remote_retrieve_body($response), true);
        wp_send_json($data);
    }
}

new LuxeBrain_Chatbot();
