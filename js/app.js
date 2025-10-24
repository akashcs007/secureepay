// PaySecure App - Main JavaScript File
// Version: 1.0.1 - Fixed transfer system

const APP_NAME = 'paySecureApp';

// App Data Structure
let appData = {
    users: [],
    orders: [],
    transactions: []
};

// Initialize App
function initializeApp() {
    const savedData = localStorage.getItem(APP_NAME);
    
    if (savedData) {
        appData = JSON.parse(savedData);
    } else {
        // Create default demo users
        appData.users = [
            {
                id: '1',
                name: 'User One',
                email: 'user1@example.com',
                password: '123456',
                coinBalance: 1000,
                cashBalance: 1000,
                escrowBalance: 0
            },
            {
                id: '2',
                name: 'User Two',
                email: 'user2@example.com',
                password: '123456',
                coinBalance: 1000,
                cashBalance: 1000,
                escrowBalance: 0
            }
        ];
        saveData();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(APP_NAME, JSON.stringify(appData));
}

// Get current user from session (always fresh from appData)
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
        const sessionUser = JSON.parse(userStr);
        // Always get fresh data from appData
        const freshUser = appData.users.find(u => u.id === sessionUser.id);
        if (freshUser) {
            // Update session with fresh data
            sessionStorage.setItem('currentUser', JSON.stringify(freshUser));
            return freshUser;
        }
    }
    return null;
}

// Set current user in session
function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

// Update current user session with fresh data
function refreshCurrentUser() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const freshUser = appData.users.find(u => u.id === currentUser.id);
        if (freshUser) {
            setCurrentUser(freshUser);
        }
    }
}

// Clear current user
function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
}

// Show/hide screens
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
}

// Show app
function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    updateUI();
    loadOrders();
}

// Update UI
function updateUI() {
    const user = getCurrentUser();
    if (!user) return;
    
    document.getElementById('walletBalance').textContent = Math.floor(user.coinBalance);
    document.getElementById('cashBalance').textContent = user.cashBalance.toFixed(2);
    document.getElementById('escrowBalance').textContent = Math.floor(user.escrowBalance);
    document.getElementById('totalValue').textContent = (user.coinBalance + user.cashBalance + user.escrowBalance).toFixed(2);
    document.getElementById('currentUserDisplay').textContent = user.email;
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    
    updateOrderBadge();
}

// Update order badge
function updateOrderBadge() {
    const user = getCurrentUser();
    if (!user) return;
    
    const activeOrders = appData.orders.filter(o => 
        (o.buyerEmail === user.email || o.sellerEmail === user.email) &&
        ['initiated', 'accepted', 'shipped'].includes(o.status)
    ).length;
    
    const badge = document.getElementById('ordersBadge');
    if (activeOrders > 0) {
        badge.textContent = activeOrders;
        badge.style.display = 'inline';
    } else {
        badge.style.display = 'none';
    }
}

// Show message
function showMessage(type, text) {
    const div = document.getElementById('authMessage');
    if (div) {
        div.className = type === 'error' ? 'error-message' : 'success-message';
        div.textContent = text;
        div.style.display = 'block';
        setTimeout(() => {
            div.style.display = 'none';
        }, 5000);
    }
}

// Show notification
function showNotification(title, message, type = 'success') {
    const notification = document.getElementById('notification');
    const iconDiv = notification.querySelector('.notification-icon');
    
    iconDiv.className = `notification-icon ${type}`;
    iconDiv.textContent = type === 'success' ? '✓' : '✗';
    
    notification.querySelector('.notification-title').textContent = title;
    notification.querySelector('.notification-message').textContent = message;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Load orders
function loadOrders(type = 'buyer') {
    const user = getCurrentUser();
    if (!user) return;
    
    const container = document.getElementById('ordersList');
    
    const orders = appData.orders.filter(o => 
        type === 'buyer' ? o.buyerEmail === user.email : o.sellerEmail === user.email
    );
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px;">📦</div>
                <h3>No orders yet</h3>
                <p>Your orders will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">Order #${order.id.substring(0, 8)}</span>
                <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
            
            <div class="order-amount">
                <div class="coin-badge">C</div>
                ${order.amount}
            </div>
            
            <div class="order-detail">
                <label>Product</label>
                <span>${order.productName}</span>
            </div>
            
            <div class="order-detail">
                <label>${type === 'buyer' ? 'Seller' : 'Buyer'}</label>
                <span>${type === 'buyer' ? order.sellerEmail : order.buyerEmail}</span>
            </div>
            
            ${order.status === 'initiated' && type === 'seller' ? `
                <div class="action-section">
                    <div class="action-buttons">
                        <button class="btn btn-success" onclick="acceptOrder('${order.id}')">Accept</button>
                        <button class="btn btn-danger" onclick="rejectOrder('${order.id}')">Reject</button>
                    </div>
                </div>
            ` : ''}
            
            ${order.status === 'accepted' && type === 'seller' ? `
                <div class="action-section">
                    <button class="btn btn-warning" onclick="shipOrder('${order.id}')">Mark as Shipped</button>
                </div>
            ` : ''}
            
            ${order.status === 'shipped' && type === 'buyer' ? `
                <div class="action-section">
                    <div class="action-buttons">
                        <button class="btn btn-success" onclick="confirmDelivery('${order.id}')">Received</button>
                        <button class="btn btn-danger" onclick="disputeOrder('${order.id}')">Not Received</button>
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Load seller orders
function loadSellerOrders() {
    const user = getCurrentUser();
    if (!user) return;
    
    const container = document.getElementById('sellerOrdersList');
    
    const orders = appData.orders.filter(o => o.sellerEmail === user.email);
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px;">📦</div>
                <h3>No incoming orders</h3>
                <p>Orders from buyers will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">Order #${order.id.substring(0, 8)}</span>
                <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
            
            <div class="order-amount">
                <div class="coin-badge">C</div>
                ${order.amount}
            </div>
            
            <div class="order-detail">
                <label>Product</label>
                <span>${order.productName}</span>
            </div>
            
            <div class="order-detail">
                <label>Buyer</label>
                <span>${order.buyerEmail}</span>
            </div>
            
            ${order.status === 'initiated' ? `
                <div class="action-section">
                    <div class="action-buttons">
                        <button class="btn btn-success" onclick="acceptOrder('${order.id}')">Accept</button>
                        <button class="btn btn-danger" onclick="rejectOrder('${order.id}')">Reject</button>
                    </div>
                </div>
            ` : ''}
            
            ${order.status === 'accepted' ? `
                <div class="action-section">
                    <button class="btn btn-warning" onclick="shipOrder('${order.id}')">Mark as Shipped</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Order action functions
window.acceptOrder = function(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'accepted';
        saveData();
        refreshCurrentUser();
        loadOrders('seller');
        loadSellerOrders();
        showNotification('Order Accepted', 'Please ship the product', 'success');
    }
};

window.rejectOrder = function(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'cancelled';
        
        // Return coins from escrow to buyer
        const buyerIndex = appData.users.findIndex(u => u.email === order.buyerEmail);
        if (buyerIndex !== -1) {
            appData.users[buyerIndex].escrowBalance -= order.amount;
            appData.users[buyerIndex].coinBalance += order.amount;
        }
        
        saveData();
        refreshCurrentUser();
        updateUI();
        loadOrders('seller');
        loadSellerOrders();
        showNotification('Order Rejected', 'Coins returned to buyer', 'success');
    }
};

window.shipOrder = function(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'shipped';
        saveData();
        refreshCurrentUser();
        loadOrders('seller');
        loadSellerOrders();
        showNotification('Marked as Shipped', 'Waiting for buyer confirmation', 'success');
    }
};

window.confirmDelivery = function(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'completed';
        
        // Move coins from buyer's escrow to seller's wallet
        const buyerIndex = appData.users.findIndex(u => u.email === order.buyerEmail);
        const sellerIndex = appData.users.findIndex(u => u.email === order.sellerEmail);
        
        if (buyerIndex !== -1) {
            appData.users[buyerIndex].escrowBalance -= order.amount;
        }
        
        if (sellerIndex !== -1) {
            appData.users[sellerIndex].coinBalance += order.amount;
        }
        
        // Add to transaction history
        appData.transactions.push({
            id: Date.now().toString(),
            type: 'escrow',
            from: order.buyerEmail,
            to: order.sellerEmail,
            amount: order.amount,
            paymentType: 'coins',
            description: order.productName,
            timestamp: new Date().toISOString()
        });
        
        saveData();
        refreshCurrentUser();
        updateUI();
        loadOrders('buyer');
        showNotification('Order Complete', 'Coins transferred to seller', 'success');
    }
};

window.disputeOrder = function(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'disputed';
        saveData();
        refreshCurrentUser();
        loadOrders('buyer');
        showNotification('Order Disputed', 'Support will review your case', 'error');
    }
};

// Update send balance info
function updateSendBalance() {
    const type = document.getElementById('sendPaymentType').value;
    const user = getCurrentUser();
    if (!user) return;
    
    const balance = type === 'coins' ? user.coinBalance : user.cashBalance;
    const symbol = type === 'coins' ? 'Coins' : '$';
    document.getElementById('sendBalanceInfo').textContent = `Available: ${symbol}${balance.toFixed(2)}`;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // Check if user is logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
        showApp();
    }
    
    // Tab switching - Login/Register
    document.getElementById('loginTab').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('registerTab').classList.remove('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    });

    document.getElementById('registerTab').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('loginTab').classList.remove('active');
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('loginForm').style.display = 'none';
    });

    // Login
    document.getElementById('loginBtn').addEventListener('click', function() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showMessage('error', 'Please enter email and password');
            return;
        }
        
        const user = appData.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            setCurrentUser(user);
            showApp();
            showNotification('Welcome Back!', `Logged in as ${user.name}`, 'success');
        } else {
            showMessage('error', 'Invalid email or password');
        }
    });

    // Register
    document.getElementById('registerBtn').addEventListener('click', function() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        
        if (!name || !email || !password) {
            showMessage('error', 'Please fill in all fields');
            return;
        }
        
        if (appData.users.find(u => u.email === email)) {
            showMessage('error', 'Email already exists');
            return;
        }
        
        const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: password,
            coinBalance: 1000,
            cashBalance: 1000,
            escrowBalance: 0
        };
        
        appData.users.push(newUser);
        saveData();
        
        showMessage('success', 'Account created! You received 1000 coins and $1000 cash. Please login.');
        document.getElementById('loginTab').click();
        document.getElementById('loginEmail').value = email;
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
    });

    // Navigation buttons
    document.getElementById('sendPaymentBtn')?.addEventListener('click', () => {
        showScreen('sendPaymentScreen');
        updateSendBalance();
    });

    document.getElementById('exchangeBtn')?.addEventListener('click', () => showScreen('exchangeScreen'));
    document.getElementById('businessBtn')?.addEventListener('click', () => showScreen('businessPaymentScreen'));
    document.getElementById('ordersBtn')?.addEventListener('click', () => {
        showScreen('ordersScreen');
        loadOrders('buyer');
    });
    document.getElementById('settingsBtn')?.addEventListener('click', () => showScreen('settingsScreen'));

    // Back buttons
    document.getElementById('sendBackBtn')?.addEventListener('click', () => showScreen('homeScreen'));
    document.getElementById('exchangeBackBtn')?.addEventListener('click', () => showScreen('homeScreen'));
    document.getElementById('businessBackBtn')?.addEventListener('click', () => showScreen('homeScreen'));
    document.getElementById('buyBackBtn')?.addEventListener('click', () => showScreen('businessPaymentScreen'));
    document.getElementById('sellBackBtn')?.addEventListener('click', () => showScreen('businessPaymentScreen'));
    document.getElementById('ordersBackBtn')?.addEventListener('click', () => showScreen('homeScreen'));
    document.getElementById('settingsBackBtn')?.addEventListener('click', () => showScreen('home
