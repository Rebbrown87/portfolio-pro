// admin.js - Admin Dashboard Functionality

// ===== ADMIN AUTH CHECK =====
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadDashboardData();
    loadOrders();
    loadRevenueStats();
    loadTimelineStages();
});

async function checkAdminAuth() {
    // Check if user is logged in and is admin
    if (window.netlifyIdentity) {
        const user = window.netlifyIdentity.currentUser();
        
        if (!user) {
            // Redirect to login
            window.netlifyIdentity.open();
            return;
        }
        
        // Check if admin (in production, check user metadata or role)
        const isAdmin = user.email === 'rebbrownlikalani87@gmail.com';
        
        if (!isAdmin) {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }
        
        document.getElementById('admin-email').textContent = user.email;
    }
}

// ===== DASHBOARD DATA =====
async function loadDashboardData() {
    try {
        // Load orders from Netlify Forms
        const response = await fetch('/.netlify/functions/get-orders');
        const orders = await response.json();
        
        // Calculate stats
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
        const completeOrders = orders.filter(o => o.status === 'complete').length;
        
        // Calculate revenue (from deposits + full payments)
        const revenue = orders.reduce((sum, order) => {
            if (order.paymentStatus === 'full') return sum + (order.totalPrice || 598);
            if (order.paymentStatus === 'partial') return sum + (order.deposit || 299);
            return sum;
        }, 0);
        
        // Update stats
        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('pending-orders').textContent = pendingOrders;
        document.getElementById('in-progress-orders').textContent = inProgressOrders;
        document.getElementById('revenue').textContent = '$' + revenue.toLocaleString();
        
        // Store for later use
        window.allOrders = orders;
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to localStorage
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
    window.allOrders = orders;
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
    
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('pending-orders').textContent = pendingOrders;
    document.getElementById('in-progress-orders').textContent = inProgressOrders;
}

// ===== LOAD ORDERS =====
async function loadOrders() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;
    
    const orders = window.allOrders || [];
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No orders yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><code style="color: var(--accent);">${order.orderId || 'ORD-' + Math.random().toString(36).substr(2, 9)}</code></td>
            <td>${order.clientName || 'N/A'}<br><small style="color: var(--text-secondary);">${order.clientEmail || ''}</small></td>
            <td>${order.service || 'N/A'}</td>
            <td>${new Date(order.orderDate || Date.now()).toLocaleDateString()}</td>
            <td><span class="status-badge status-${order.status || 'pending'}">${formatStatus(order.status)}</span></td>
            <td><span class="status-badge status-${order.paymentStatus === 'full' ? 'complete' : order.paymentStatus === 'partial' ? 'deposit_paid' : 'pending'}">${formatPaymentStatus(order.paymentStatus)}</span></td>
            <td>
                <button class="action-btn action-btn-view" onclick="viewOrder('${order.orderId}')">View</button>
                <button class="action-btn action-btn-edit" onclick="editOrder('${order.orderId}')">Edit</button>
            </td>
        </tr>
    `).join('');
}

function formatStatus(status) {
    const statuses = {
        'pending': 'Pending',
        'deposit_paid': 'Deposit Paid',
        'in_progress': 'In Progress',
        'review': 'Client Review',
        'complete': 'Complete',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status;
}

function formatPaymentStatus(status) {
    const statuses = {
        'pending': 'Unpaid',
        'partial': 'Deposit Paid',
        'full': 'Paid in Full'
    };
    return statuses[status] || status;
}

// ===== FILTER ORDERS =====
function filterOrders() {
    const statusFilter = document.getElementById('filter-status').value;
    const serviceFilter = document.getElementById('filter-service').value;
    const dateFilter = document.getElementById('filter-date').value;
    const searchFilter = document.getElementById('search-orders').value.toLowerCase();
    
    let filtered = window.allOrders || [];
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    if (serviceFilter !== 'all') {
        filtered = filtered.filter(o => o.service === serviceFilter);
    }
    
    if (dateFilter) {
        filtered = filtered.filter(o => {
            const orderDate = new Date(o.orderDate).toISOString().split('T')[0];
            return orderDate === dateFilter;
        });
    }
    
    if (searchFilter) {
        filtered = filtered.filter(o => 
            (o.clientName && o.clientName.toLowerCase().includes(searchFilter)) ||
            (o.clientEmail && o.clientEmail.toLowerCase().includes(searchFilter)) ||
            (o.orderId && o.orderId.toLowerCase().includes(searchFilter))
        );
    }
    
    // Update table with filtered results
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = filtered.map(order => `
        <tr>
            <td><code style="color: var(--accent);">${order.orderId}</code></td>
            <td>${order.clientName}<br><small style="color: var(--text-secondary);">${order.clientEmail}</small></td>
            <td>${order.service}</td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
            <td><span class="status-badge status-${order.status}">${formatStatus(order.status)}</span></td>
            <td><span class="status-badge status-${order.paymentStatus === 'full' ? 'complete' : order.paymentStatus === 'partial' ? 'deposit_paid' : 'pending'}">${formatPaymentStatus(order.paymentStatus)}</span></td>
            <td>
                <button class="action-btn action-btn-view" onclick="viewOrder('${order.orderId}')">View</button>
                <button class="action-btn action-btn-edit" onclick="editOrder('${order.orderId}')">Edit</button>
            </td>
        </tr>
    `).join('');
}

// ===== VIEW ORDER =====
async function viewOrder(orderId) {
    const order = window.allOrders.find(o => o.orderId === orderId);
    if (!order) return;
    
    const modal = document.getElementById('order-detail-modal');
    const content = document.getElementById('order-detail-content');
    
    content.innerHTML = `
        <div style="padding: 1rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <p style="color: var(--text-secondary);">Order ID</p>
                    <p style="font-weight: 600; color: var(--accent);">${order.orderId}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary);">Date</p>
                    <p style="font-weight: 600;">${new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary);">Client</p>
                    <p style="font-weight: 600;">${order.clientName}</p>
                    <p style="color: var(--text-secondary);">${order.clientEmail}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary);">Service</p>
                    <p style="font-weight: 600;">${order.service}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <p style="color: var(--text-secondary);">Project Details</p>
                <p style="background: var(--bg-primary); padding: 1rem; border-radius: 8px;">${order.projectDetails || 'N/A'}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <p style="color: var(--text-secondary);">Timeline</p>
                    <p style="font-weight: 600;">${order.timeline || 'Flexible'}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary);">Budget</p>
                    <p style="font-weight: 600;">${order.budget || 'To discuss'}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <p style="color: var(--text-secondary);">Payment Status</p>
                <p><span class="status-badge status-${order.paymentStatus === 'full' ? 'complete' : 'deposit_paid'}">${formatPaymentStatus(order.paymentStatus)}</span></p>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <p style="color: var(--text-secondary);">Update Status</p>
                <select id="update-status" style="width: 100%; padding: 10px; background: var(--bg-primary); border: 1px solid #333; border-radius: 8px; color: var(--text-primary);">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="deposit_paid" ${order.status === 'deposit_paid' ? 'selected' : ''}>Deposit Paid</option>
                    <option value="in_progress" ${order.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="review" ${order.status === 'review' ? 'selected' : ''}>Client Review</option>
                    <option value="complete" ${order.status === 'complete' ? 'selected' : ''}>Complete</option>
                </select>
            </div>
            
            <button class="btn" onclick="updateOrderStatus('${order.orderId}')" style="width: 100%;">Update Status</button>
            
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                <a href="mailto:${order.clientEmail}" class="btn btn-outline" style="flex: 1; text-align: center;">Email Client</a>
                <button class="btn btn-outline" onclick="sendUpdateEmail('${order.clientEmail}', '${order.orderId}')" style="flex: 1;">Send Update</button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeOrderDetailModal() {
    const modal = document.getElementById('order-detail-modal');
    modal.classList.remove('active');
}

// ===== UPDATE ORDER STATUS =====
async function updateOrderStatus(orderId) {
    const newStatus = document.getElementById('update-status').value;
    
    try {
        const response = await fetch('/.netlify/functions/update-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderId,
                status: newStatus
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Order status updated', 'success');
            closeOrderDetailModal();
            loadOrders();
            loadDashboardData();
            
            // Notify client of status change
            sendStatusUpdateEmail(orderId, newStatus);
        } else {
            throw new Error('Update failed');
        }
    } catch (error) {
        console.error('Update error:', error);
        // Fallback to localStorage
        updateOrderStatusLocal(orderId, newStatus);
    }
}

function updateOrderStatusLocal(orderId, newStatus) {
    let orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
    orders = orders.map(o => {
        if (o.orderId === orderId) {
            return { ...o, status: newStatus };
        }
        return o;
    });
    localStorage.setItem('all_orders', JSON.stringify(orders));
    window.allOrders = orders;
    
    showNotification('✅ Order status updated (local)', 'success');
    closeOrderDetailModal();
    loadOrders();
    loadDashboardData();
}

// ===== SEND UPDATE EMAIL =====
function sendUpdateEmail(clientEmail, orderId) {
    const subject = encodeURIComponent(`Project Update - Order ${orderId}`);
    const body = encodeURIComponent(`Hello,\n\nThis is an update on your order ${orderId}.\n\nPlease reply with any questions.\n\nBest regards,\nLikalani Shadrack`);
    
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
}

function sendStatusUpdateEmail(orderId, newStatus) {
    // In production, this would be handled by Netlify Function
    alert(`Status update notification will be sent to client for order ${orderId}\nNew status: ${formatStatus(newStatus)}`);
}

// ===== EDIT ORDER =====
function editOrder(orderId) {
    // Open order detail modal with edit capabilities
    viewOrder(orderId);
    showNotification('Edit order details in the modal', 'info');
}

// ===== REVENUE STATS =====
function loadRevenueStats() {
    // In production, integrate with Chart.js
    const chartContainer = document.getElementById('revenue-chart');
    if (!chartContainer) return;
    
    // Simple text-based stats for now
    const orders = window.allOrders || [];
    const monthlyRevenue = {};
    
    orders.forEach(order => {
        const month = new Date(order.orderDate).toLocaleString('default', { month: 'short', year: 'numeric' });
        const amount = order.paymentStatus === 'full' ? (order.totalPrice || 598) : (order.deposit || 299);
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + amount;
    });
    
    chartContainer.innerHTML = Object.entries(monthlyRevenue).map(([month, revenue]) => `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #333;">
            <span>${month}</span>
            <span style="color: var(--accent); font-weight: 600;">$${revenue.toLocaleString()}</span>
        </div>
    `).join('') || '<p style="text-align: center; color: var(--text-secondary);">No revenue data yet</p>';
}

// ===== TIMELINE STAGES =====
function loadTimelineStages() {
    const container = document.getElementById('timeline-stages');
    if (!container) return;
    
    const stages = [
        { id: 'order_placed', name: 'Order Placed', icon: '✅' },
        { id: 'discovery', name: 'Discovery Call', icon: '📞' },
        { id: 'concept', name: 'Concept Development', icon: '🎨' },
        { id: 'review', name: 'Client Review', icon: '👁️' },
        { id: 'revisions', name: 'Revisions', icon: '🔄' },
        { id: 'final', name: 'Final Polish', icon: '✨' },
        { id: 'delivery', name: 'Delivery', icon: '📦' },
        { id: 'complete', name: 'Project Complete', icon: '🎉' }
    ];
    
    container.innerHTML = stages.map(stage => `
        <div class="timeline-stage">
            <input type="checkbox" class="stage-checkbox" id="stage-${stage.id}">
            <span style="font-size: 1.5rem;">${stage.icon}</span>
            <div style="flex: 1;">
                <strong>${stage.name}</strong>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">Mark complete when done</p>
            </div>
            <input type="date" style="padding: 6px; background: var(--bg-primary); border: 1px solid #333; border-radius: 6px; color: var(--text-primary);">
        </div>
    `).join('');
}

// ===== EXPORT DATA =====
function exportOrders() {
    const orders = window.allOrders || [];
    const csv = [
        ['Order ID', 'Client', 'Email', 'Service', 'Date', 'Status', 'Payment', 'Budget'],
        ...orders.map(o => [
            o.orderId,
            o.clientName,
            o.clientEmail,
            o.service,
            o.orderDate,
            o.status,
            o.paymentStatus,
            o.budget
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// Add export button to dashboard
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn';
    exportBtn.textContent = '📥 Export Orders';
    exportBtn.style.cssText = 'margin: 1rem 0;';
    exportBtn.onclick = exportOrders;
    
    const mainContent = document.querySelector('.admin-content main');
    if (mainContent) {
        mainContent.insertBefore(exportBtn, mainContent.lastElementChild);
    }
});