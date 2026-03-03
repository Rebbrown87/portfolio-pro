// ============================================================================
// LIKALANI SHADRACK - PORTFOLIO SCRIPT
// Professional Graphic Design Portfolio with E-commerce Functionality
// ============================================================================
// Features:
// - Netlify Identity Authentication
// - Cloudinary Image Uploads
// - Order Management System
// - Payment Integration (Stripe, PayPal, Mobile Money, Bank Transfer)
// - Admin Dashboard
// - Client Portal
// - Testimonial Slider
// - Contact Forms
// - LocalStorage Data Management
// ============================================================================

// ============================================================================
// CONFIGURATION - UPDATE THESE WITH YOUR ACTUAL VALUES
// ============================================================================
const CONFIG = {
    // Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: 'dzayqmiuc',
    CLOUDINARY_UPLOAD_PRESET: 'Likalani',
    
    // Payment Configuration
    STRIPE_PUBLISHABLE_KEY: 'pk_test_YOUR_STRIPE_KEY_HERE',
    PAYPAL_CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID_HERE',
    
    // Admin Configuration
    ADMIN_EMAIL: 'rebbrownlikalani87@gmail.com',
    
    // Service Prices (Deposits are 50% of total)
    SERVICE_PRICES: {
        'Brand Identity': 299,
        'UI/UX Design': 499,
        'Digital Illustration': 149,
        'Print Design': 199,
        'Motion Graphics': 399,
        'Design Consultation': 75
    }
};

// ============================================================================
// GLOBAL STATE MANAGEMENT
// ============================================================================
const AppState = {
    currentUser: null,
    currentOrder: null,
    currentStep: 1,
    selectedPaymentMethod: null,
    pendingOrderService: null
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    initializeNetlifyIdentity();
    initializeCloudinaryWidget();
    initializeOrderButtons();
    initializeContactForm();
    initializeOrderForm();
    initializeTestimonialSlider();
    initializeModalClose();
    injectIdentityWidget();
    loadSavedImages();
    checkExistingOrder();
    
    console.log('✅ Likalani Portfolio initialized successfully');
});

// ============================================================================
// MOBILE MENU
// ============================================================================
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });
    }
}

// ============================================================================
// NETLIFY IDENTITY AUTHENTICATION
// ============================================================================
function initializeNetlifyIdentity() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.init();
        
        // Login event
        window.netlifyIdentity.on('login', user => {
            AppState.currentUser = user;
            showNotification('✅ Logged in successfully!', 'success');
            updateUIForLoggedInUser();
            
            // If there was a pending order, proceed with it
            if (AppState.pendingOrderService) {
                const service = AppState.pendingOrderService;
                AppState.pendingOrderService = null;
                redirectToClientPortal(service);
            }
        });
        
        // Logout event
        window.netlifyIdentity.on('logout', () => {
            AppState.currentUser = null;
            showNotification('👋 Logged out', 'info');
            updateUIForLoggedOutUser();
        });
        
        // Check existing session
        AppState.currentUser = window.netlifyIdentity.currentUser();
        if (AppState.currentUser) {
            updateUIForLoggedInUser();
        }
    }
}

function injectIdentityWidget() {
    if (document.getElementById('netlify-identity-widget')) return;
    
    const script = document.createElement('script');
    script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
    script.id = 'netlify-identity-widget';
    document.body.appendChild(script);
}

function updateUIForLoggedInUser() {
    if (!AppState.currentUser) return;
    
    const userName = AppState.currentUser.user_metadata?.full_name || AppState.currentUser.email || 'User';
    
    // Update all user email displays
    document.querySelectorAll('.user-email-display').forEach(el => {
        el.textContent = userName;
    });
    
    // Enable order buttons
    document.querySelectorAll('.btn-order-small').forEach(btn => {
        btn.disabled = false;
        btn.title = 'Place order for this service';
    });
    
    // Show logged-in sections in client portal
    const loginSection = document.getElementById('login-section');
    const loggedInSection = document.getElementById('logged-in-section');
    
    if (loginSection && loggedInSection) {
        loginSection.style.display = 'none';
        loggedInSection.style.display = 'block';
        document.getElementById('user-email-display').textContent = userName;
    }
}

function updateUIForLoggedOutUser() {
    // Update all user email displays
    document.querySelectorAll('.user-email-display').forEach(el => {
        el.textContent = 'Guest';
    });
    
    // Disable order buttons
    document.querySelectorAll('.btn-order-small').forEach(btn => {
        btn.disabled = true;
        btn.title = 'Login required to order';
    });
    
    // Show login sections in client portal
    const loginSection = document.getElementById('login-section');
    const loggedInSection = document.getElementById('logged-in-section');
    
    if (loginSection && loggedInSection) {
        loginSection.style.display = 'block';
        loggedInSection.style.display = 'none';
    }
}

function handleLogout() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.logout();
    }
}

function openLoginModal() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.open();
    } else {
        showNotification('❌ Authentication not available. Please refresh.', 'error');
    }
}

// ============================================================================
// CLOUDINARY IMAGE UPLOAD
// ============================================================================
function initializeCloudinaryWidget() {
    const uploadButton = document.getElementById('cloudinary-upload-btn');
    if (!uploadButton) return;
    
    if (typeof cloudinary === 'undefined') {
        console.warn('Cloudinary widget not loaded');
        return;
    }
    
    const uploadWidget = cloudinary.createUploadWidget(
        {
            cloudName: CONFIG.CLOUDINARY_CLOUD_NAME,
            uploadPreset: CONFIG.CLOUDINARY_UPLOAD_PRESET,
            sources: ['local', 'camera', 'url'],
            multiple: true,
            maxFiles: 10,
            maxFileSize: 10000000, // 10MB
            styles: {
                palette: {
                    window: '#1e1e1e',
                    sourceBg: '#121212',
                    windowBorder: '#00d2ff',
                    tabIcon: '#ffffff',
                    menuIcons: '#00d2ff',
                    textDark: '#ffffff',
                    textLight: '#b3b3b3',
                    link: '#00d2ff',
                    action: '#00d2ff',
                    inactiveTabIcon: '#888888',
                    error: '#ff4757',
                    inProgress: '#00d2ff',
                    complete: '#00c853'
                }
            }
        },
        (error, result) => {
            if (!error && result && result.event === 'success') {
                const imageUrl = result.info.secure_url;
                const publicId = result.info.public_id;
                
                addImageToGallery(imageUrl, publicId);
                saveImageToStorage(imageUrl, publicId);
                showNotification('✅ Image uploaded successfully!', 'success');
            } else if (error) {
                console.error('Upload error:', error);
                showNotification('❌ Upload failed. Please try again.', 'error');
            }
        }
    );
    
    uploadButton.addEventListener('click', () => {
        uploadWidget.open();
    });
}

function addImageToGallery(imageUrl, publicId) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('gallery-item');
    itemDiv.dataset.publicId = publicId;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Graphic Creation by Likalani Shadrack';
    img.loading = 'lazy';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = 'Remove from gallery (local only)';
    deleteBtn.onclick = function(e) {
        e.stopPropagation();
        if(confirm('Remove this image from your local gallery view?')) {
            itemDiv.remove();
            removeImageFromStorage(publicId);
        }
    };
    
    itemDiv.style.cursor = 'pointer';
    itemDiv.onclick = function() {
        openLightbox(imageUrl);
    };
    
    itemDiv.appendChild(img);
    itemDiv.appendChild(deleteBtn);
    gallery.appendChild(itemDiv);
}

function saveImageToStorage(imageUrl, publicId) {
    let images = JSON.parse(localStorage.getItem('Likalani_images') || '[]');
    
    // Avoid duplicates
    if (!images.find(img => img.publicId === publicId)) {
        images.push({ 
            url: imageUrl, 
            publicId: publicId, 
            date: new Date().toISOString() 
        });
        
        // Limit to 100 images to avoid storage quota issues
        if (images.length > 100) images.shift();
        
        localStorage.setItem('Likalani_images', JSON.stringify(images));
    }
}

function loadSavedImages() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    let images = JSON.parse(localStorage.getItem('Likalani_images') || '[]');
    images.forEach(img => addImageToGallery(img.url, img.publicId));
}

function removeImageFromStorage(publicId) {
    let images = JSON.parse(localStorage.getItem('Likalani_images') || '[]');
    images = images.filter(img => img.publicId !== publicId);
    localStorage.setItem('Likalani_images', JSON.stringify(images));
}

function openLightbox(imageUrl) {
    // Remove existing lightbox if any
    const existing = document.querySelector('.lightbox-overlay');
    if (existing) existing.remove();
    
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.95); display: flex; align-items: center; 
        justify-content: center; z-index: 5000; cursor: zoom-out;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Full size view';
    img.style.cssText = `
        max-width: 90%; max-height: 90%; border-radius: 8px; 
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute; top: 20px; right: 30px;
        background: none; border: none; color: white;
        font-size: 3rem; cursor: pointer; z-index: 5001;
    `;
    
    lightbox.appendChild(img);
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox);
    
    // Close handlers
    const closeLightbox = () => lightbox.remove();
    lightbox.onclick = (e) => {
        if (e.target === lightbox) closeLightbox();
    };
    closeBtn.onclick = closeLightbox;
    document.onkeydown = function(e) {
        if (e.key === 'Escape') closeLightbox();
    };
}

// ============================================================================
// ORDER SYSTEM - REDIRECT TO CLIENT PORTAL
// ============================================================================
function initializeOrderButtons() {
    document.querySelectorAll('.btn-order-small').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const service = this.dataset.service;
            
            if (!service) {
                showNotification('❌ Service not specified', 'error');
                return;
            }
            
            // Store service info for client portal
            const orderData = {
                service: service,
                selectedDate: new Date().toISOString()
            };
            localStorage.setItem('pending_order', JSON.stringify(orderData));
            
            // Check if user is logged in
            if (AppState.currentUser) {
                redirectToClientPortal(service);
            } else {
                AppState.pendingOrderService = service;
                showNotification('🔐 Please login to continue', 'info');
                openLoginModal();
            }
        });
    });
}

function redirectToClientPortal(service) {
    showNotification('🚀 Redirecting to Client Portal...', 'success');
    setTimeout(() => {
        window.location.href = 'client-portal.html?service=' + encodeURIComponent(service);
    }, 1000);
}

function createOrderInPortal(orderData) {
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    const deposit = calculateDeposit(orderData.service);
    
    const newOrder = {
        orderId: orderId,
        service: orderData.service,
        clientName: orderData.clientName || '',
        clientEmail: orderData.clientEmail || '',
        projectDetails: orderData.projectDetails || '',
        timeline: orderData.timeline || 'Flexible',
        budget: orderData.budget || 'To discuss',
        phone: orderData.phone || '',
        orderDate: new Date().toISOString(),
        status: 'pending',
        paymentStatus: 'pending',
        deposit: deposit,
        totalPrice: deposit * 2,
        timeline: {
            order_placed: false,
            discovery: false,
            concept: false,
            review: false,
            revisions: false,
            final: false,
            delivery: false,
            complete: false
        },
        messages: [],
        files: []
    };
    
    // Save to localStorage
    const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
    orders.push(newOrder);
    localStorage.setItem('all_orders', JSON.stringify(orders));
    localStorage.setItem('current_order_id', orderId);
    
    return newOrder;
}

function calculateDeposit(service) {
    return CONFIG.SERVICE_PRICES[service] || 299;
}

function checkExistingOrder() {
    const orderId = localStorage.getItem('current_order_id');
    if (!orderId) return;
    
    const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
    const order = orders.find(o => o.orderId === orderId);
    
    if (order && order.status !== 'pending') {
        AppState.currentOrder = order;
        
        // If on client portal, go directly to tracking
        if (window.location.pathname.includes('client-portal.html')) {
            AppState.currentStep = 4;
            document.querySelectorAll('.step-form').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.order-step').forEach(el => {
                el.classList.remove('active');
                el.classList.add('completed');
            });
            const step4 = document.getElementById('step-4');
            const step4Indicator = document.getElementById('step-4-indicator');
            if (step4) step4.classList.add('active');
            if (step4Indicator) step4Indicator.classList.add('active');
            loadTrackingStep();
        }
    }
}

// ============================================================================
// CLIENT PORTAL NAVIGATION
// ============================================================================
function nextStep(step) {
    // Validate current step before proceeding
    if (AppState.currentStep === 1) {
        if (!AppState.currentUser) {
            showNotification('🔐 Please login first', 'error');
            openLoginModal();
            return;
        }
    }
    
    if (AppState.currentStep === 2) {
        const form = document.getElementById('order-details-form');
        if (form && !form.checkValidity()) {
            form.reportValidity();
            return;
        }
    }
    
    // Hide current step
    const currentStepEl = document.getElementById(`step-${AppState.currentStep}`);
    const currentIndicator = document.getElementById(`step-${AppState.currentStep}-indicator`);
    
    if (currentStepEl) currentStepEl.classList.remove('active');
    if (currentIndicator) currentIndicator.classList.remove('active');
    
    // Show next step
    AppState.currentStep = step;
    const nextStepEl = document.getElementById(`step-${AppState.currentStep}`);
    const nextIndicator = document.getElementById(`step-${AppState.currentStep}-indicator`);
    
    if (nextStepEl) nextStepEl.classList.add('active');
    if (nextIndicator) nextIndicator.classList.add('active');
    
    // Mark previous steps as completed
    for (let i = 1; i < AppState.currentStep; i++) {
        const indicator = document.getElementById(`step-${i}-indicator`);
        if (indicator) indicator.classList.add('completed');
    }
    
    // Load step-specific data
    if (AppState.currentStep === 3) {
        loadPaymentStep();
    }
    
    if (AppState.currentStep === 4) {
        loadTrackingStep();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function previousStep(step) {
    const currentStepEl = document.getElementById(`step-${AppState.currentStep}`);
    const currentIndicator = document.getElementById(`step-${AppState.currentStep}-indicator`);
    
    if (currentStepEl) currentStepEl.classList.remove('active');
    if (currentIndicator) currentIndicator.classList.remove('active');
    
    AppState.currentStep = step;
    
    const nextStepEl = document.getElementById(`step-${AppState.currentStep}`);
    const nextIndicator = document.getElementById(`step-${AppState.currentStep}-indicator`);
    
    if (nextStepEl) nextStepEl.classList.add('active');
    if (nextIndicator) nextIndicator.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// ORDER FORM HANDLING
// ============================================================================
function initializeOrderForm() {
    const orderForm = document.getElementById('order-details-form');
    if (!orderForm) return;
    
    // Update order summary when service changes
    const serviceSelect = document.getElementById('order-service');
    const budgetSelect = document.getElementById('order-budget');
    
    if (serviceSelect) {
        serviceSelect.addEventListener('change', updateOrderSummary);
    }
    if (budgetSelect) {
        budgetSelect.addEventListener('change', updateOrderSummary);
    }
    
    // Handle form submission
    orderForm.addEventListener('submit', handleOrderSubmit);
}

function updateOrderSummary() {
    const service = document.getElementById('order-service')?.value;
    if (!service) return;
    
    const deposit = calculateDeposit(service);
    const total = deposit * 2;
    const balance = total - deposit;
    
    const summaryService = document.getElementById('summary-service');
    const summaryDeposit = document.getElementById('summary-deposit');
    const summaryTotal = document.getElementById('summary-total');
    const summaryBalance = document.getElementById('summary-balance');
    
    if (summaryService) summaryService.textContent = service;
    if (summaryDeposit) summaryDeposit.textContent = '$' + deposit;
    if (summaryTotal) summaryTotal.textContent = '$' + total;
    if (summaryBalance) summaryBalance.textContent = '$' + balance;
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    const orderData = {
        service: document.getElementById('order-service').value,
        budget: document.getElementById('order-budget').value,
        clientName: document.getElementById('order-client-name').value,
        clientEmail: document.getElementById('order-client-email').value,
        projectDetails: document.getElementById('order-project-details').value,
        timeline: document.getElementById('order-timeline').value,
        phone: document.getElementById('order-phone')?.value || ''
    };
    
    // Create order
    AppState.currentOrder = createOrderInPortal(orderData);
    
    showNotification('✅ Order created successfully!', 'success');
    nextStep(3);
}

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================
function loadPaymentStep() {
    if (!AppState.currentOrder) {
        const orderId = localStorage.getItem('current_order_id');
        const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
        AppState.currentOrder = orders.find(o => o.orderId === orderId);
    }
    
    if (AppState.currentOrder) {
        const elements = {
            'payment-order-id': AppState.currentOrder.orderId,
            'payment-service-name': AppState.currentOrder.service,
            'payment-deposit-amount': '$' + AppState.currentOrder.deposit,
            'payment-balance-amount': '$' + AppState.currentOrder.deposit,
            'bank-amount': '$' + AppState.currentOrder.deposit
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }
}

function selectPaymentMethod(method) {
    AppState.selectedPaymentMethod = method;
    
    // Hide all payment options
    ['stripe', 'paypal', 'mobile', 'bank'].forEach(m => {
        const el = document.getElementById(`${m}-payment`);
        if (el) el.style.display = 'none';
    });
    
    // Remove selection from all methods
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Show selected method
    const paymentEl = document.getElementById(`${method}-payment`);
    if (paymentEl) paymentEl.style.display = 'block';
    
    // Add selection styling
    if (event?.currentTarget) {
        event.currentTarget.classList.add('selected');
    }
    
    // Show complete button for bank transfer
    const completeBtn = document.getElementById('complete-order-btn');
    if (completeBtn) {
        completeBtn.style.display = method === 'bank' ? 'block' : 'none';
    }
}

async function processStripePayment() {
    if (typeof Stripe === 'undefined') {
        showNotification('❌ Stripe not loaded', 'error');
        return;
    }
    
    const stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    const submitBtn = document.getElementById('stripe-pay-btn');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
    }
    
    try {
        // In production, create payment intent via Netlify Function
        // For demo, simulate success
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showPaymentSuccess();
        
    } catch (error) {
        console.error('Stripe payment error:', error);
        showNotification('❌ Payment failed: ' + error.message, 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Pay with Stripe';
        }
    }
}

function initPayPalButton() {
    if (typeof paypal === 'undefined') {
        console.warn('PayPal SDK not loaded');
        return;
    }
    
    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    
    paypal.Buttons({
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: AppState.currentOrder?.deposit?.toFixed(2) || '299.00'
                    },
                    description: `Deposit for ${AppState.currentOrder?.service || 'Service'}`,
                    custom_id: AppState.currentOrder?.orderId || 'ORD-DEMO'
                }]
            });
        },
        
        onApprove: async function(data, actions) {
            const submitBtn = document.getElementById('paypal-pay-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Verifying...';
            }
            
            try {
                await actions.order.capture();
                showPaymentSuccess();
            } catch (error) {
                console.error('PayPal payment error:', error);
                showNotification('❌ Payment verification failed', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Pay with PayPal';
                }
            }
        },
        
        onError: function(err) {
            console.error('PayPal error:', err);
            showNotification('❌ PayPal payment failed', 'error');
        },
        
        onCancel: function() {
            showNotification('Payment cancelled', 'info');
        }
        
    }).render('#paypal-button-container');
}

async function processMobileMoneyPayment() {
    const phoneNumber = document.getElementById('mobile-number')?.value;
    const provider = document.getElementById('mobile-provider')?.value || 'M-Pesa';
    
    if (!phoneNumber) {
        showNotification('Please enter your mobile number', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('mobile-pay-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
    }
    
    try {
        // Simulate payment request
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showNotification(`💳 Payment request sent to ${phoneNumber}`, 'success');
        alert(`Please complete payment on your ${provider} app.\n\nAmount: $${AppState.currentOrder?.deposit || 299}`);
        showPaymentSuccess();
        
    } catch (error) {
        console.error('Mobile money error:', error);
        showNotification('❌ Payment failed', 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Pay with Mobile Money';
        }
    }
}

function showBankTransferInstructions() {
    const modal = document.getElementById('bank-transfer-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeBankTransferModal() {
    const modal = document.getElementById('bank-transfer-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function confirmBankTransfer() {
    const transactionCode = document.getElementById('transaction-code')?.value;
    
    if (!transactionCode) {
        showNotification('Please enter transaction code', 'error');
        return;
    }
    
    // Save for admin verification
    localStorage.setItem('pending_transfer_' + AppState.currentOrder?.orderId, transactionCode);
    
    showNotification('✅ Transfer details submitted for verification', 'success');
    closeBankTransferModal();
    showPaymentSuccess();
}

function showPaymentSuccess() {
    const modal = document.getElementById('payment-success-modal');
    if (modal) {
        document.getElementById('success-order-id').textContent = AppState.currentOrder?.orderId || 'ORD-XXXXX';
        modal.classList.add('active');
    }
    
    showNotification('🎉 Payment successful! Order confirmed.', 'success');
}

function completeOrder() {
    if (!AppState.currentOrder) return;
    
    // Update order status
    AppState.currentOrder.status = 'deposit_paid';
    AppState.currentOrder.paymentStatus = 'partial';
    
    // Save to localStorage
    const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
    const index = orders.findIndex(o => o.orderId === AppState.currentOrder.orderId);
    if (index !== -1) {
        orders[index] = AppState.currentOrder;
        localStorage.setItem('all_orders', JSON.stringify(orders));
    }
    
    // Close payment modal
    const paymentModal = document.getElementById('payment-success-modal');
    if (paymentModal) paymentModal.classList.remove('active');
    
    showNotification('🎉 Order completed! Redirecting to tracking...', 'success');
    
    // Go to tracking step
    setTimeout(() => {
        nextStep(4);
    }, 2000);
}

function completePayment() {
    showNotification('💳 Payment portal for balance will open', 'info');
    // In production, redirect to payment page with order ID
}

// ============================================================================
// PROJECT TRACKING
// ============================================================================
function loadTrackingStep() {
    if (!AppState.currentOrder) {
        const orderId = localStorage.getItem('current_order_id');
        const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
        AppState.currentOrder = orders.find(o => o.orderId === orderId);
    }
    
    if (AppState.currentOrder) {
        // Update order info
        const elements = {
            'tracking-order-id': AppState.currentOrder.orderId,
            'tracking-status': formatStatus(AppState.currentOrder.status),
            'tracking-progress': calculateProgress(AppState.currentOrder.status) + '%'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                if (id === 'tracking-status') {
                    el.textContent = value;
                    el.className = `status-badge status-${AppState.currentOrder.status}`;
                } else {
                    el.textContent = value;
                }
            }
        });
        
        // Update progress bar
        const progressBar = document.getElementById('tracking-progress-bar');
        if (progressBar) {
            progressBar.style.width = calculateProgress(AppState.currentOrder.status) + '%';
        }
        
        // Load timeline, messages, files
        loadTimeline();
        loadMessages();
        loadFiles();
    }
}

function loadTimeline() {
    const timeline = document.getElementById('project-timeline');
    if (!timeline) return;
    
    const stages = [
        { id: 'order_placed', name: 'Order Placed', date: 'Day 1', icon: '✅' },
        { id: 'discovery', name: 'Discovery Call', date: 'Day 2-3', icon: '📞' },
        { id: 'concept', name: 'Concept Development', date: 'Day 4-7', icon: '🎨' },
        { id: 'review', name: 'Client Review', date: 'Day 8-10', icon: '👁️' },
        { id: 'revisions', name: 'Revisions', date: 'Day 11-14', icon: '🔄' },
        { id: 'final', name: 'Final Polish', date: 'Day 15-17', icon: '✨' },
        { id: 'delivery', name: 'Delivery', date: 'Day 18', icon: '📦' }
    ];
    
    const currentStage = getCurrentStage(AppState.currentOrder?.status);
    
    timeline.innerHTML = stages.map((stage, index) => {
        const completed = index < currentStage;
        const current = index === currentStage;
        
        return `
            <div class="timeline-item ${completed ? 'completed' : ''} ${current ? 'current' : ''}">
                <div class="timeline-content">
                    <h4>${stage.icon} ${stage.name}</h4>
                    <p>${stage.date}</p>
                    <p style="font-size: 0.75rem; color: #666;">
                        ${completed ? '✅ Completed' : current ? '🔄 In Progress' : '⏳ Pending'}
                    </p>
                </div>
            </div>
        `;
    }).join('');
}

function getCurrentStage(status) {
    const stages = {
        'pending': 0,
        'deposit_paid': 1,
        'in_progress': 2,
        'review': 3,
        'complete': 6
    };
    return stages[status] || 0;
}

function calculateProgress(status) {
    const progress = {
        'pending': 10,
        'deposit_paid': 25,
        'in_progress': 50,
        'review': 75,
        'complete': 100
    };
    return progress[status] || 0;
}

function formatStatus(status) {
    const statuses = {
        'pending': 'Pending',
        'deposit_paid': 'Deposit Paid',
        'in_progress': 'In Progress',
        'review': 'Client Review',
        'complete': 'Complete'
    };
    return statuses[status] || status;
}

// ============================================================================
// MESSAGING SYSTEM
// ============================================================================
function initializeMessageForm() {
    const messageForm = document.getElementById('message-form');
    if (!messageForm) return;
    
    messageForm.addEventListener('submit', handleSendMessage);
}

function loadMessages() {
    const thread = document.getElementById('message-thread');
    if (!thread) return;
    
    const messages = AppState.currentOrder?.messages || [];
    
    if (messages.length === 0) {
        thread.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No messages yet. Start the conversation!</p>';
        return;
    }
    
    thread.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender}">
            <p>${msg.text}</p>
            <small style="color: #666;">${new Date(msg.date).toLocaleString()}</small>
        </div>
    `).join('');
    
    thread.scrollTop = thread.scrollHeight;
}

function handleSendMessage(e) {
    e.preventDefault();
    
    const input = document.getElementById('message-input');
    const text = input?.value.trim();
    
    if (!text) return;
    
    if (!AppState.currentOrder.messages) {
        AppState.currentOrder.messages = [];
    }
    
    AppState.currentOrder.messages.push({
        text: text,
        sender: 'client',
        date: new Date().toISOString()
    });
    
    // Save to localStorage
    const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
    const index = orders.findIndex(o => o.orderId === AppState.currentOrder.orderId);
    if (index !== -1) {
        orders[index] = AppState.currentOrder;
        localStorage.setItem('all_orders', JSON.stringify(orders));
    }
    
    if (input) input.value = '';
    loadMessages();
    
    showNotification('Message sent! Likalani will respond soon.', 'success');
}

// ============================================================================
// FILES SYSTEM
// ============================================================================
function loadFiles() {
    const filesList = document.getElementById('files-list');
    if (!filesList) return;
    
    const files = AppState.currentOrder?.files || [];
    
    if (files.length === 0) {
        filesList.innerHTML = '<p style="color: var(--text-secondary);">No files uploaded yet. Files will appear here when Likalani shares them.</p>';
        return;
    }
    
    filesList.innerHTML = files.map(file => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem;">
            <div>
                <strong style="color: var(--accent);">${file.name}</strong>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">${file.date}</p>
            </div>
            <a href="${file.url}" download class="btn btn-outline" style="padding: 6px 16px; font-size: 0.85rem;">Download</a>
        </div>
    `).join('');
}

// ============================================================================
// CONTACT FORM
// ============================================================================
function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name')?.value || '';
        const email = document.getElementById('email')?.value || '';
        const subject = document.getElementById('subject')?.value || '';
        const message = document.getElementById('message')?.value || '';
        
        const mailSubject = encodeURIComponent(subject || `Portfolio Inquiry from ${name}`);
        const mailBody = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
        
        window.location.href = `mailto:${CONFIG.ADMIN_EMAIL}?subject=${mailSubject}&body=${mailBody}`;
        
        showNotification('📧 Opening your email client...', 'success');
        contactForm.reset();
    });
}

// ============================================================================
// TESTIMONIAL SLIDER
// ============================================================================
function initializeTestimonialSlider() {
    const slider = document.querySelector('.testimonials-slider');
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.testimonial-card');
    if (slides.length <= 1) return;
    
    let currentIndex = 0;
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.style.display = 'block';
                slide.classList.add('active');
            } else {
                slide.style.display = 'none';
                slide.classList.remove('active');
            }
        });
    }
    
    // Auto-rotate every 5 seconds
    setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
        updateTestimonialDots(currentIndex);
    }, 5000);
    
    // Initialize dots
    createTestimonialDots(slides.length, currentIndex);
}

function createTestimonialDots(total, active) {
    const slider = document.querySelector('.testimonials-slider');
    if (!slider) return;
    
    // Remove existing dots
    const existingDots = slider.parentNode.querySelector('.testimonial-dots');
    if (existingDots) existingDots.remove();
    
    // Create new dots
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'testimonial-dots';
    
    for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = 'testimonial-dot' + (i === active ? ' active' : '');
        dot.onclick = () => {
            currentIndex = i;
            showSlide(i);
            updateTestimonialDots(i);
        };
        dotsContainer.appendChild(dot);
    }
    
    slider.parentNode.insertBefore(dotsContainer, slider.nextSibling);
}

function updateTestimonialDots(active) {
    const dots = document.querySelectorAll('.testimonial-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === active);
    });
}

// ============================================================================
// MODAL MANAGEMENT
// ============================================================================
function initializeModalClose() {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Click outside modal
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    });
    
    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

function closeModal() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
    AppState.pendingOrderService = null;
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        padding: 12px 24px; border-radius: 8px;
        background: ${type === 'success' ? '#00c853' : type === 'error' ? '#ff4757' : '#00d2ff'};
        color: white; font-weight: 500; z-index: 4000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function generateOrderId() {
    return 'ORD-' + Date.now().toString(36).toUpperCase();
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================================================
// ADMIN DASHBOARD FUNCTIONS (For admin.html)
// ============================================================================
function loadAdminDashboard() {
    if (!window.location.pathname.includes('admin.html')) return;
    
    // Check admin auth
    checkAdminAuth();
    
    // Load dashboard data
    loadDashboardStats();
    loadOrdersTable();
    loadRevenueStats();
}

function checkAdminAuth() {
    if (window.netlifyIdentity) {
        const user = window.netlifyIdentity.currentUser();
        
        if (!user) {
            window.netlifyIdentity.open();
            return;
        }
        
        const isAdmin = user.email === CONFIG.ADMIN_EMAIL;
        
        if (!isAdmin) {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }
        
        const adminEmail = document.getElementById('admin-email');
        if (adminEmail) adminEmail.textContent = user.email;
    }
}

function loadDashboardStats() {
    const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
    
    const revenue = orders.reduce((sum, order) => {
        if (order.paymentStatus === 'full') return sum + order.totalPrice;
        if (order.paymentStatus === 'partial') return sum + order.deposit;
        return sum;
    }, 0);
    
    const elements = {
        'total-orders': totalOrders,
        'pending-orders': pendingOrders,
        'in-progress-orders': inProgressOrders,
        'revenue': '$' + revenue.toLocaleString()
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

function loadOrdersTable() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;
    
    const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No orders yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><code style="color: var(--accent);">${order.orderId}</code></td>
            <td>${order.clientName || 'N/A'}<br><small style="color: var(--text-secondary);">${order.clientEmail || ''}</small></td>
            <td>${order.service || 'N/A'}</td>
            <td>${formatDate(order.orderDate)}</td>
            <td><span class="status-badge status-${order.status || 'pending'}">${formatStatus(order.status)}</span></td>
            <td><span class="status-badge status-${order.paymentStatus === 'full' ? 'complete' : order.paymentStatus === 'partial' ? 'deposit_paid' : 'pending'}">${formatStatus(order.paymentStatus)}</span></td>
            <td>
                <button class="action-btn action-btn-view" onclick="viewOrder('${order.orderId}')">View</button>
                <button class="action-btn action-btn-edit" onclick="editOrder('${order.orderId}')">Edit</button>
            </td>
        </tr>
    `).join('');
}

function loadRevenueStats() {
    const chartContainer = document.getElementById('revenue-chart');
    if (!chartContainer) return;
    
    const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
    const monthlyRevenue = {};
    
    orders.forEach(order => {
        const month = new Date(order.orderDate).toLocaleString('default', { month: 'short', year: 'numeric' });
        const amount = order.paymentStatus === 'full' ? order.totalPrice : order.deposit;
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + amount;
    });
    
    chartContainer.innerHTML = Object.entries(monthlyRevenue).map(([month, revenue]) => `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #333;">
            <span>${month}</span>
            <span style="color: var(--accent); font-weight: 600;">$${revenue.toLocaleString()}</span>
        </div>
    `).join('') || '<p style="text-align: center; color: var(--text-secondary);">No revenue data yet</p>';
}

function viewOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
    const order = orders.find(o => o.orderId === orderId);
    
    if (!order) return;
    
    const modal = document.getElementById('order-detail-modal');
    const content = document.getElementById('order-detail-content');
    
    if (modal && content) {
        content.innerHTML = `
            <div style="padding: 1rem;">
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Client:</strong> ${order.clientName}</p>
                <p><strong>Email:</strong> ${order.clientEmail}</p>
                <p><strong>Service:</strong> ${order.service}</p>
                <p><strong>Status:</strong> ${formatStatus(order.status)}</p>
                <p><strong>Project Details:</strong><br>${order.projectDetails || 'N/A'}</p>
                <button class="btn" onclick="closeModal()" style="margin-top: 1rem;">Close</button>
            </div>
        `;
        modal.classList.add('active');
    }
}

function editOrder(orderId) {
    viewOrder(orderId);
    showNotification('Edit order details in the modal', 'info');
}

function exportOrders() {
    const orders = JSON.parse(localStorage.getItem('all_orders') || '[]');
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
    
    showNotification('📥 Orders exported successfully!', 'success');
}

// ============================================================================
// END OF SCRIPT
// ============================================================================