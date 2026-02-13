// API Configuration
const API_BASE_URL = window.location.origin + '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let allInventory = [];
let allRequests = [];
let allUsers = [];
let allAuditLogs = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        verifyToken();
    } else {
        showScreen('login');
    }
    
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    
    // Inventory form
    document.getElementById('inventory-form')?.addEventListener('submit', handleInventorySave);
    document.getElementById('inventory-search')?.addEventListener('input', filterInventory);
    document.getElementById('inventory-department-filter')?.addEventListener('change', filterInventory);
    
    // Request form
    document.getElementById('request-form')?.addEventListener('submit', handleRequestSubmit);
    document.getElementById('review-form')?.addEventListener('submit', handleReviewSubmit);
    document.getElementById('request-status-filter')?.addEventListener('change', filterRequests);
    document.getElementById('review-status')?.addEventListener('change', toggleReviewFields);
    
    // User form
    document.getElementById('user-form')?.addEventListener('submit', handleUserSave);
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        
        showToast('Login successful!', 'success');
        initializeDashboard();
    } catch (error) {
        console.error('Login error:', error);
    }
}

async function verifyToken() {
    try {
        const data = await apiRequest('/auth/me');
        currentUser = data.user;
        initializeDashboard();
    } catch (error) {
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showScreen('login');
    showToast('Logged out successfully', 'success');
}

// Dashboard Initialization
function initializeDashboard() {
    showScreen('dashboard');
    
    // Update user info
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-role').textContent = currentUser.role.toUpperCase();
    
    // Show/hide admin elements
    if (currentUser.role === 'admin') {
        document.body.classList.add('admin');
    }
    
    // Load initial data
    loadDashboardData();
}

async function loadDashboardData() {
    try {
        await Promise.all([
            loadInventory(),
            loadRequests(),
            currentUser.role === 'admin' && loadUsers(),
            currentUser.role === 'admin' && loadAuditLogs()
        ]);
        
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Screen Management
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    document.getElementById(`${screenName}-screen`).classList.add('active');
}

function showSection(sectionName) {
    // Update menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`section-${sectionName}`).classList.add('active');
    
    // Load section-specific data
    if (sectionName === 'overview') {
        updateDashboardStats();
    } else if (sectionName === 'audit') {
        loadAuditLogs();
    }
}

// Dashboard Stats
async function updateDashboardStats() {
    try {
        // Inventory stats
        const inventoryStats = await apiRequest('/inventory/stats/dashboard');
        document.getElementById('stat-total-items').textContent = inventoryStats.stats.totalItems;
        document.getElementById('stat-low-stock').textContent = inventoryStats.stats.lowStockItems;
        document.getElementById('stat-out-of-stock').textContent = inventoryStats.stats.outOfStock;
        
        // Request stats
        const requestStats = await apiRequest('/requests/stats/dashboard');
        document.getElementById('stat-pending-requests').textContent = requestStats.stats.pending;
        
        // Load low stock items
        const lowStockData = await apiRequest('/inventory?lowStock=true');
        displayLowStockItems(lowStockData.inventory);
        
        // Load recent requests
        displayRecentRequests(allRequests.slice(0, 5));
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

function displayLowStockItems(items) {
    const container = document.getElementById('low-stock-list');
    
    if (items.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">✅ All items are well-stocked!</p>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="list-item warning">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${item.name}</strong>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px;">
                        ${item.department} - ${item.quantity} ${item.unit} remaining
                    </div>
                </div>
                <span class="status-badge status-low-stock">Low Stock</span>
            </div>
        </div>
    `).join('');
}

function displayRecentRequests(requests) {
    const container = document.getElementById('recent-requests-list');
    
    if (requests.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No recent requests</p>';
        return;
    }
    
    container.innerHTML = requests.map(req => `
        <div class="list-item">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${req.requestNumber}</strong>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px;">
                        ${req.requestedBy?.name || 'Unknown'} - ${req.items.length} item(s)
                    </div>
                </div>
                <span class="status-badge status-${req.status}">${req.status}</span>
            </div>
        </div>
    `).join('');
}

// Inventory Management
async function loadInventory() {
    try {
        const data = await apiRequest('/inventory');
        allInventory = data.inventory;
        displayInventory(allInventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function displayInventory(items) {
    const tbody = document.getElementById('inventory-table-body');
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">No inventory items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => {
        const status = item.quantity === 0 ? 'out-of-stock' : 
                      item.quantity <= item.minStockLevel ? 'low-stock' : 'ok';
        const statusText = item.quantity === 0 ? 'Out of Stock' : 
                          item.quantity <= item.minStockLevel ? 'Low Stock' : 'In Stock';
        
        return `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.category}</td>
                <td>${item.department}</td>
                <td>${item.quantity} ${item.unit}</td>
                <td><span class="status-badge status-${status}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="viewInventoryDetails('${item._id}')" title="View">👁️</button>
                        ${currentUser.role === 'admin' ? `
                            <button class="btn-icon btn-edit" onclick="editInventory('${item._id}')" title="Edit">✏️</button>
                            <button class="btn-icon btn-delete" onclick="deleteInventory('${item._id}')" title="Delete">🗑️</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterInventory() {
    const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
    const departmentFilter = document.getElementById('inventory-department-filter')?.value || '';
    
    const filtered = allInventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                            item.category.toLowerCase().includes(searchTerm);
        const matchesDepartment = !departmentFilter || item.department === departmentFilter;
        return matchesSearch && matchesDepartment;
    });
    
    displayInventory(filtered);
}

function showAddInventoryModal() {
    document.getElementById('inventory-modal-title').textContent = 'Add Inventory Item';
    document.getElementById('inventory-form').reset();
    document.getElementById('inventory-id').value = '';
    openModal('inventory-modal');
}

async function editInventory(id) {
    try {
        const data = await apiRequest(`/inventory/${id}`);
        const item = data.inventory;
        
        document.getElementById('inventory-modal-title').textContent = 'Edit Inventory Item';
        document.getElementById('inventory-id').value = item._id;
        document.getElementById('inv-name').value = item.name;
        document.getElementById('inv-category').value = item.category;
        document.getElementById('inv-department').value = item.department;
        document.getElementById('inv-quantity').value = item.quantity;
        document.getElementById('inv-unit').value = item.unit;
        document.getElementById('inv-min-stock').value = item.minStockLevel;
        document.getElementById('inv-location').value = item.location || '';
        document.getElementById('inv-supplier').value = item.supplier || '';
        document.getElementById('inv-cost').value = item.costPerUnit || '';
        document.getElementById('inv-batch').value = item.batchNumber || '';
        document.getElementById('inv-description').value = item.description || '';
        
        openModal('inventory-modal');
    } catch (error) {
        console.error('Error loading inventory item:', error);
    }
}

async function handleInventorySave(e) {
    e.preventDefault();
    
    const id = document.getElementById('inventory-id').value;
    const itemData = {
        name: document.getElementById('inv-name').value,
        category: document.getElementById('inv-category').value,
        department: document.getElementById('inv-department').value,
        quantity: parseFloat(document.getElementById('inv-quantity').value),
        unit: document.getElementById('inv-unit').value,
        minStockLevel: parseFloat(document.getElementById('inv-min-stock').value),
        location: document.getElementById('inv-location').value,
        supplier: document.getElementById('inv-supplier').value,
        costPerUnit: parseFloat(document.getElementById('inv-cost').value) || 0,
        batchNumber: document.getElementById('inv-batch').value,
        description: document.getElementById('inv-description').value
    };
    
    try {
        if (id) {
            await apiRequest(`/inventory/${id}`, {
                method: 'PUT',
                body: JSON.stringify(itemData)
            });
            showToast('Inventory item updated successfully', 'success');
        } else {
            await apiRequest('/inventory', {
                method: 'POST',
                body: JSON.stringify(itemData)
            });
            showToast('Inventory item added successfully', 'success');
        }
        
        closeModal();
        loadInventory();
        updateDashboardStats();
    } catch (error) {
        console.error('Error saving inventory:', error);
    }
}

async function deleteInventory(id) {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
        return;
    }
    
    try {
        await apiRequest(`/inventory/${id}`, { method: 'DELETE' });
        showToast('Inventory item deleted successfully', 'success');
        loadInventory();
        updateDashboardStats();
    } catch (error) {
        console.error('Error deleting inventory:', error);
    }
}

async function viewInventoryDetails(id) {
    try {
        const data = await apiRequest(`/inventory/${id}`);
        const item = data.inventory;
        
        const details = `
            <div style="line-height: 1.8;">
                <h4 style="margin-bottom: 15px;">${item.name}</h4>
                <p><strong>Category:</strong> ${item.category}</p>
                <p><strong>Department:</strong> ${item.department}</p>
                <p><strong>Quantity:</strong> ${item.quantity} ${item.unit}</p>
                <p><strong>Min Stock Level:</strong> ${item.minStockLevel} ${item.unit}</p>
                ${item.location ? `<p><strong>Location:</strong> ${item.location}</p>` : ''}
                ${item.supplier ? `<p><strong>Supplier:</strong> ${item.supplier}</p>` : ''}
                ${item.batchNumber ? `<p><strong>Batch Number:</strong> ${item.batchNumber}</p>` : ''}
                ${item.costPerUnit ? `<p><strong>Cost Per Unit:</strong> $${item.costPerUnit}</p>` : ''}
                ${item.description ? `<p><strong>Description:</strong> ${item.description}</p>` : ''}
                <p><strong>Added By:</strong> ${item.addedBy?.name || 'Unknown'}</p>
                <p><strong>Date Added:</strong> ${new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
        `;
        
        alert(details.replace(/<[^>]*>/g, '\n'));
    } catch (error) {
        console.error('Error viewing inventory:', error);
    }
}

// Request Management
async function loadRequests() {
    try {
        const data = await apiRequest('/requests');
        allRequests = data.requests;
        displayRequests(allRequests);
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

function displayRequests(requests) {
    const tbody = document.getElementById('requests-table-body');
    
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">No requests found</td></tr>';
        return;
    }
    
    tbody.innerHTML = requests.map(req => `
        <tr>
            <td><strong>${req.requestNumber}</strong></td>
            <td>${req.requestedBy?.name || 'Unknown'}</td>
            <td>${req.department}</td>
            <td>${req.items.length} item(s)</td>
            <td><span class="status-badge status-${req.status}">${req.status}</span></td>
            <td><span class="status-badge priority-${req.priority}">${req.priority}</span></td>
            <td>${new Date(req.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="viewRequestDetails('${req._id}')" title="View">👁️</button>
                    ${currentUser.role === 'admin' && req.status === 'pending' ? `
                        <button class="btn-icon btn-edit" onclick="showReviewModal('${req._id}')" title="Review">✅</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function filterRequests() {
    const statusFilter = document.getElementById('request-status-filter').value;
    
    const filtered = allRequests.filter(req => {
        return !statusFilter || req.status === statusFilter;
    });
    
    displayRequests(filtered);
}

function showNewRequestModal() {
    document.getElementById('request-form').reset();
    document.getElementById('request-items-container').innerHTML = '';
    addRequestItem();
    openModal('request-modal');
}

function addRequestItem() {
    const container = document.getElementById('request-items-container');
    const itemIndex = container.children.length;
    
    const itemHtml = `
        <div class="request-item" data-index="${itemIndex}">
            <div class="form-group">
                <label>Item</label>
                <select class="item-select" required>
                    <option value="">Select item...</option>
                    ${allInventory.filter(item => {
                        if (currentUser.role === 'staff') {
                            return item.department === currentUser.department || item.department === 'All';
                        }
                        return true;
                    }).map(item => `
                        <option value="${item._id}" data-unit="${item.unit}">
                            ${item.name} (${item.quantity} ${item.unit} available)
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" class="item-quantity" min="1" required>
            </div>
            <button type="button" class="btn-remove-item" onclick="removeRequestItem(${itemIndex})">×</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', itemHtml);
}

function removeRequestItem(index) {
    const item = document.querySelector(`.request-item[data-index="${index}"]`);
    if (item) {
        item.remove();
    }
}

async function handleRequestSubmit(e) {
    e.preventDefault();
    
    const items = [];
    document.querySelectorAll('.request-item').forEach(item => {
        const inventoryId = item.querySelector('.item-select').value;
        const quantity = parseInt(item.querySelector('.item-quantity').value);
        if (inventoryId && quantity) {
            items.push({ inventory: inventoryId, requestedQuantity: quantity });
        }
    });
    
    if (items.length === 0) {
        showToast('Please add at least one item', 'error');
        return;
    }
    
    const requestData = {
        items,
        reason: document.getElementById('req-reason').value,
        priority: document.getElementById('req-priority').value,
        notes: document.getElementById('req-notes').value
    };
    
    try {
        await apiRequest('/requests', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
        
        showToast('Request submitted successfully', 'success');
        closeModal();
        loadRequests();
        updateDashboardStats();
    } catch (error) {
        console.error('Error submitting request:', error);
    }
}

async function viewRequestDetails(id) {
    try {
        const data = await apiRequest(`/requests/${id}`);
        const req = data.request;
        
        let details = `Request: ${req.requestNumber}\n`;
        details += `Requested By: ${req.requestedBy?.name}\n`;
        details += `Department: ${req.department}\n`;
        details += `Status: ${req.status}\n`;
        details += `Priority: ${req.priority}\n`;
        details += `Reason: ${req.reason}\n\n`;
        details += `Items:\n`;
        req.items.forEach(item => {
            details += `- ${item.itemName}: ${item.requestedQuantity} ${item.unit}`;
            if (item.approvedQuantity > 0) {
                details += ` (Approved: ${item.approvedQuantity})`;
            }
            details += `\n`;
        });
        if (req.adminNotes) {
            details += `\nAdmin Notes: ${req.adminNotes}`;
        }
        if (req.rejectionReason) {
            details += `\nRejection Reason: ${req.rejectionReason}`;
        }
        
        alert(details);
    } catch (error) {
        console.error('Error viewing request:', error);
    }
}

async function showReviewModal(id) {
    try {
        const data = await apiRequest(`/requests/${id}`);
        const req = data.request;
        
        document.getElementById('review-request-id').value = id;
        
        // Display request details
        const detailsHtml = `
            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4>${req.requestNumber}</h4>
                <p><strong>Requested By:</strong> ${req.requestedBy?.name} (${req.department})</p>
                <p><strong>Priority:</strong> <span class="status-badge priority-${req.priority}">${req.priority}</span></p>
                <p><strong>Reason:</strong> ${req.reason}</p>
                ${req.notes ? `<p><strong>Notes:</strong> ${req.notes}</p>` : ''}
            </div>
        `;
        document.getElementById('review-details').innerHTML = detailsHtml;
        
        // Build items approval section
        const itemsHtml = req.items.map((item, index) => `
            <div class="form-group">
                <label>${item.itemName}</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span>Requested: ${item.requestedQuantity} ${item.unit}</span>
                    <input type="number" 
                           id="approved-qty-${index}" 
                           min="0" 
                           max="${item.requestedQuantity}" 
                           value="${item.requestedQuantity}" 
                           style="width: 100px;"
                           placeholder="Approve qty">
                </div>
            </div>
        `).join('');
        
        document.getElementById('items-approval-section').innerHTML = `
            <h4 style="margin: 20px 0 10px;">Approve Quantities</h4>
            ${itemsHtml}
        `;
        
        openModal('review-modal');
    } catch (error) {
        console.error('Error loading request for review:', error);
    }
}

function toggleReviewFields() {
    const status = document.getElementById('review-status').value;
    const rejectionGroup = document.getElementById('rejection-reason-group');
    const itemsSection = document.getElementById('items-approval-section');
    
    if (status === 'rejected') {
        rejectionGroup.style.display = 'block';
        itemsSection.style.display = 'none';
        document.getElementById('review-rejection-reason').required = true;
    } else {
        rejectionGroup.style.display = 'none';
        itemsSection.style.display = 'block';
        document.getElementById('review-rejection-reason').required = false;
    }
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('review-request-id').value;
    const status = document.getElementById('review-status').value;
    const adminNotes = document.getElementById('review-admin-notes').value;
    const rejectionReason = document.getElementById('review-rejection-reason').value;
    
    const reviewData = {
        status,
        adminNotes,
        rejectionReason,
        items: []
    };
    
    if (status !== 'rejected') {
        // Collect approved quantities
        const approvalInputs = document.querySelectorAll('[id^="approved-qty-"]');
        approvalInputs.forEach(input => {
            reviewData.items.push({
                approvedQuantity: parseInt(input.value) || 0
            });
        });
    }
    
    try {
        await apiRequest(`/requests/${id}/review`, {
            method: 'PUT',
            body: JSON.stringify(reviewData)
        });
        
        showToast(`Request ${status} successfully`, 'success');
        closeModal();
        loadRequests();
        loadInventory();
        updateDashboardStats();
    } catch (error) {
        console.error('Error reviewing request:', error);
    }
}

// User Management (Admin Only)
async function loadUsers() {
    if (currentUser.role !== 'admin') return;
    
    try {
        const data = await apiRequest('/users');
        allUsers = data.users;
        displayUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.name}</strong></td>
            <td>${user.email}</td>
            <td><span class="status-badge ${user.role === 'admin' ? 'status-approved' : 'status-pending'}">${user.role}</span></td>
            <td>${user.department}</td>
            <td><span class="status-badge ${user.isActive ? 'status-ok' : 'status-out-of-stock'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editUser('${user._id}')" title="Edit">✏️</button>
                    ${user._id !== currentUser.id ? `
                        <button class="btn-icon btn-delete" onclick="deactivateUser('${user._id}')" title="Deactivate">🗑️</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function showAddUserModal() {
    document.getElementById('user-modal-title').textContent = 'Add User';
    document.getElementById('user-form').reset();
    document.getElementById('user-id').value = '';
    document.getElementById('password-group').style.display = 'block';
    document.getElementById('user-password').required = true;
    openModal('user-modal');
}

async function editUser(id) {
    try {
        const data = await apiRequest(`/users/${id}`);
        const user = data.user;
        
        document.getElementById('user-modal-title').textContent = 'Edit User';
        document.getElementById('user-id').value = user._id;
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-department').value = user.department;
        document.getElementById('user-active').checked = user.isActive;
        document.getElementById('password-group').style.display = 'none';
        document.getElementById('user-password').required = false;
        
        openModal('user-modal');
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

async function handleUserSave(e) {
    e.preventDefault();
    
    const id = document.getElementById('user-id').value;
    const userData = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        role: document.getElementById('user-role').value,
        department: document.getElementById('user-department').value,
        isActive: document.getElementById('user-active').checked
    };
    
    if (!id) {
        userData.password = document.getElementById('user-password').value;
    }
    
    try {
        if (id) {
            await apiRequest(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            showToast('User updated successfully', 'success');
        } else {
            await apiRequest('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            showToast('User created successfully', 'success');
        }
        
        closeModal();
        loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
    }
}

async function deactivateUser(id) {
    if (!confirm('Are you sure you want to deactivate this user?')) {
        return;
    }
    
    try {
        await apiRequest(`/users/${id}`, { method: 'DELETE' });
        showToast('User deactivated successfully', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error deactivating user:', error);
    }
}

// Audit Logs (Admin Only)
async function loadAuditLogs() {
    if (currentUser.role !== 'admin') return;
    
    try {
        const data = await apiRequest('/audit');
        allAuditLogs = data.logs;
        displayAuditLogs(allAuditLogs);
    } catch (error) {
        console.error('Error loading audit logs:', error);
    }
}

function displayAuditLogs(logs) {
    const tbody = document.getElementById('audit-table-body');
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: var(--text-secondary);">No audit logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${new Date(log.createdAt).toLocaleString()}</td>
            <td>${log.action.replace(/_/g, ' ')}</td>
            <td>${log.performedBy?.name || 'System'}</td>
            <td>${log.description}</td>
        </tr>
    `).join('');
}

// Reports (Admin Only)
async function exportReport(type, format) {
    try {
        let endpoint = '';
        let filename = '';
        
        if (type === 'inventory') {
            endpoint = `/reports/inventory/${format}`;
            filename = `inventory-report.${format}`;
        } else if (type === 'requests') {
            endpoint = `/reports/requests/${format}`;
            filename = `requests-report.${format === 'excel' ? 'xlsx' : format}`;
        } else if (type === 'audit') {
            endpoint = `/reports/audit/${format}`;
            filename = `audit-log-report.${format === 'excel' ? 'xlsx' : format}`;
        }
        
        // Download the file
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate report');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Report downloaded successfully', 'success');
    } catch (error) {
        console.error('Error exporting report:', error);
        showToast('Failed to export report', 'error');
    }
}

// Modal Management
function openModal(modalId) {
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById(modalId).classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// Utility Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

