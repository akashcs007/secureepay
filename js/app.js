// PaySecure App - Main JavaScript File
// Version: 1.0.0

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

// Get current user from session
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
        const sessionUser = JSON.parse(userStr);
        return appData.users.find(u => u.id === sessionUser.id);
    }
    return null;
}

// Set current user in session
function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
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
        loadOrders('seller');
        loadSellerOrders();
        showNotification('Order Accepted', 'Please ship the product', 'success');
    }
};

window.rejectOrder = function(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'cancelled';
        const buyer = appData.users.find(u => u.email === order.buyerEmail);
        const buyerIndex = appData.users.findIndex(u => u.id === buyer.id);
        appData.users[buyerIndex].escrowBalance -= order.amount;
        appData.users[buyerIndex].coinBalance += order.amount;
        saveData();
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
        loadOrders('seller');
        loadSellerOrders();
        showNotification('Marked as Shipped', 'Waiting for buyer confirmation', 'success');
    }
};

window.confirmDelivery = function(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'completed';
        const buyer = appData.users.find(u => u.email === order.buyerEmail);
        const seller = appData.users.find(u => u.email === order.sellerEmail);
        const buyerIndex = appData.users.findIndex(u => u.id === buyer.id);
        const sellerIndex = appData.users.findIndex(u => u.id === seller.id);
        
        appData.users[buyerIndex].escrowBalance -= order.amount;
        appData.users[sellerIndex].coinBalance += order.amount;
        
        appData.transactions.push({
            id: Date.now().toString(),
            type: 'escrow',
            from: buyer.email,
            to: seller.email,
            amount: order.amount,
            timestamp: new Date().toISOString()
        });
        
        saveData();
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
    document.getElementById('settingsBackBtn')?.addEventListener('click', () => showScreen('homeScreen'));

    // Business payment
    document.getElementById('buyProductBtn')?.addEventListener('click', () => showScreen('buyProductScreen'));
    document.getElementById('sellProductBtn')?.addEventListener('click', () => {
        showScreen('sellProductsScreen');
        loadSellerOrders();
    });

    // Place order
    document.getElementById('placeOrderBtn')?.addEventListener('click', function() {
        const sellerEmail = document.getElementById('buySellerEmail').value.trim();
        const productName = document.getElementById('productName').value.trim();
        const amount = parseInt(document.getElementById('buyAmount').value);
        const description = document.getElementById('buyDescription').value;
        
        if (!sellerEmail || !productName || !amount || !description) {
            showNotification('Error', 'Please fill in all fields', 'error');
            return;
        }
        
        const buyer = getCurrentUser();
        const seller = appData.users.find(u => u.email === sellerEmail);
        
        if (!seller) {
            showNotification('Error', 'Seller not found', 'error');
            return;
        }
        
        if (seller.id === buyer.id) {
            showNotification('Error', 'Cannot buy from yourself', 'error');
            return;
        }
        
        if (amount > buyer.coinBalance) {
            showNotification('Error', 'Insufficient coins', 'error');
            return;
        }
        
        const buyerIndex = appData.users.findIndex(u => u.id === buyer.id);
        appData.users[buyerIndex].coinBalance -= amount;
        appData.users[buyerIndex].escrowBalance += amount;
        
        const order = {
            id: Date.now().toString(),
            buyerEmail: buyer.email,
            sellerEmail: sellerEmail,
            productName: productName,
            amount: amount,
            description: description,
            status: 'initiated',
            createdAt: new Date().toISOString()
        };
        
        appData.orders.push(order);
        saveData();
        updateUI();
        
        showNotification('Order Placed', `${amount} coins held in escrow`, 'success');
        
        document.getElementById('buySellerEmail').value = '';
        document.getElementById('productName').value = '';
        document.getElementById('buyAmount').value = '';
        document.getElementById('buyDescription').value = '';
        
        showScreen('ordersScreen');
        loadOrders('buyer');
    });

    // Order tabs
    document.getElementById('buyerOrdersTab')?.addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('sellerOrdersTab').classList.remove('active');
        loadOrders('buyer');
    });

    document.getElementById('sellerOrdersTab')?.addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('buyerOrdersTab').classList.remove('active');
        loadOrders('seller');
    });

    // Exchange tabs
    document.getElementById('coinToCashTab')?.addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('cashToCoinTab').classList.remove('active');
        document.getElementById('coinToCashForm').style.display = 'block';
        document.getElementById('cashToCoinForm').style.display = 'none';
    });

    document.getElementById('cashToCoinTab')?.addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('coinToCashTab').classList.remove('active');
        document.getElementById('cashToCoinForm').style.display = 'block';
        document.getElementById('coinToCashForm').style.display = 'none';
    });

    // Exchange preview
    document.getElementById('coinAmount')?.addEventListener('input', function() {
        const amount = parseFloat(this.value) || 0;
        document.getElementById('coinToCashPreview').textContent = `You will receive: $${amount.toFixed(2)}`;
    });

    document.getElementById('cashAmount')?.addEventListener('input', function() {
        const amount = parseFloat(this.value) || 0;
        document.getElementById('cashToCoinPreview').textContent = `You will receive: ${amount.toFixed(0)} Coins`;
    });

    // Convert buttons
    document.getElementById('convertToCashBtn')?.addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('coinAmount').value);
        const user = getCurrentUser();
        
        if (!amount || amount <= 0) {
            showNotification('Error', 'Enter valid amount', 'error');
            return;
        }
        
        if (amount > user.coinBalance) {
            showNotification('Error', 'Insufficient coins', 'error');
            return;
        }
        
        const userIndex = appData.users.findIndex(u => u.id === user.id);
        appData.users[userIndex].coinBalance -= amount;
        appData.users[userIndex].cashBalance += amount;
        
        saveData();
        updateUI();
        
        showNotification('Exchange Complete', `${amount} coins converted to $${amount}`, 'success');
        document.getElementById('coinAmount').value = '';
        document.getElementById('coinToCashPreview').textContent = 'You will receive: $0.00';
    });

    document.getElementById('convertToCoinBtn')?.addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('cashAmount').value);
        const user = getCurrentUser();
        
        if (!amount || amount <= 0) {
            showNotification('Error', 'Enter valid amount', 'error');
            return;
        }
        
        if (amount > user.cashBalance) {
            showNotification('Error', 'Insufficient cash', 'error');
            return;
        }
        
        const userIndex = appData.users.findIndex(u => u.id === user.id);
        appData.users[userIndex].cashBalance -= amount;
        appData.users[userIndex].coinBalance += amount;
        
        saveData();
        updateUI();
        
        showNotification('Exchange Complete', `$${amount} converted to ${amount} coins`, 'success');
        document.getElementById('cashAmount').value = '';
        document.getElementById('cashToCoinPreview').textContent = 'You will receive: 0 Coins';
    });

    // Send payment
    document.getElementById('sendPaymentType')?.addEventListener('change', updateSendBalance);

    document.getElementById('sendPaymentSubmitBtn')?.addEventListener('click', function() {
        const recipientEmail = document.getElementById('sendRecipientEmail').value.trim();
        const paymentType = document.getElementById('sendPaymentType').value;
        const amount = parseFloat(document.getElementById('sendAmount').value);
        
        if (!recipientEmail || !amount || amount <= 0) {
            showNotification('Error', 'Please fill in all fields correctly', 'error');
            return;
        }
        
        const sender = getCurrentUser();
        const recipient = appData.users.find(u => u.email === recipientEmail);
        
        if (!recipient) {
            showNotification('Error', 'Recipient not found', 'error');
            return;
        }
        
        if (recipient.id === sender.id) {
            showNotification('Error', 'Cannot send to yourself', 'error');
            return;
        }
        
        const balance = paymentType === 'coins' ? sender.coinBalance : sender.cashBalance;
        
        if (amount > balance) {
            showNotification('Error', 'Insufficient balance', 'error');
            return;
        }
        
        const senderIndex = appData.users.findIndex(u => u.id === sender.id);
        const recipientIndex = appData.users.findIndex(u => u.id === recipient.id);
        
        if (paymentType === 'coins') {
            appData.users[senderIndex].coinBalance -= amount;
            appData.users[recipientIndex].coinBalance += amount;
        } else {
            appData.users[senderIndex].cashBalance -= amount;
            appData.users[recipientIndex].cashBalance += amount;
        }
        
        appData.transactions.push({
            id: Date.now().toString(),
            type: 'transfer',
            from: sender.email,
            to: recipient.email,
            amount: amount,
            paymentType: paymentType,
            timestamp: new Date().toISOString()
        });
        
        saveData();
        updateUI();
        
        showNotification('Payment Sent', `${amount} ${paymentType} sent to ${recipientEmail}`, 'success');
        
        document.getElementById('sendRecipientEmail').value = '';
        document.getElementById('sendAmount').value = '';
        
        showScreen('homeScreen');
    });

    // Add test funds
    document.getElementById('addTestFundsBtn')?.addEventListener('click', function() {
        const user = getCurrentUser();
        const userIndex = appData.users.findIndex(u => u.id === user.id);
        
        appData.users[userIndex].coinBalance += 500;
        appData.users[userIndex].cashBalance += 500;
        
        saveData();
        updateUI();
        
        showNotification('Funds Added', '500 coins and $500 cash added to your account', 'success');
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        clearCurrentUser();
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
        showNotification('Logged Out', 'You have been signed out', 'success');
    });
});