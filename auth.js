// Minimal updateTabHighlight implementation to prevent errors
function updateTabHighlight(tabId) {
    // Optionally, visually update the tab highlight here
    // This is a placeholder to prevent ReferenceError
}
// User session management
if (typeof currentUser === 'undefined') {
    var currentUser = null;
}
let isInitialized = false;
let authInitialization = null;

// Get backend URL dynamically to match frontend host
function getBackendUrl(path) {
    const backendPort = 5000;
    const backendHost = window.location.hostname;
    return `http://${backendHost}:${backendPort}${path}`;
}

// Listen for social login success from popup and update UI
window.addEventListener('message', function(event) {
    console.log('Received postMessage:', event.data, 'from origin:', event.origin);
    
    // Accept messages from backend (port 5000) or from the same origin
    const backendOrigin = `http://${window.location.hostname}:5000`;
    const sameOrigin = window.location.origin;
    const allowedOrigins = [backendOrigin, sameOrigin];
    
    if (!allowedOrigins.includes(event.origin)) {
        console.log('Ignoring message from unexpected origin:', event.origin, 'allowed:', allowedOrigins);
        return;
    }
    
    if (event.data && (event.data.socialLogin === 'success' || event.data.type === 'social-login-success')) {
        console.log('Social login success detected, processing...');
        
        // If user data is provided directly in the message, use it
        if (event.data.user) {
            console.log('User data received directly:', event.data.user);
            currentUser = event.data.user;
            if (typeof closeAuthModal === 'function') closeAuthModal();
            updateUserProfileUI();
            showMessage('Login successful! Welcome, ' + (currentUser.name || currentUser.username), 'success');
            return;
        }
        
        // Otherwise, fetch user info from backend for consistency
        console.log('Fetching user info from backend...');
        fetch(getBackendUrl('/api/user'), { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                console.log('User info after social login:', data);
                if (data && data.logged_in && data.user) {
                    currentUser = data.user;
                    console.log('Updated currentUser:', currentUser);
                    if (typeof closeAuthModal === 'function') closeAuthModal();
                    updateUserProfileUI();
                    showMessage('Login successful! Welcome, ' + (currentUser.name || currentUser.username), 'success');
                } else {
                    console.log('No valid user data received');
                    showError('Login failed - please try again');
                }
            })
            .catch(e => {
                console.error('Error fetching user info after social login:', e);
                showError('Login failed - please try again');
            });
    }
});

// updateUserUI is now a no-op, use updateUserProfileUI instead
function updateUserUI(user) {}

// Show loading state
function showLoading() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.id = 'auth-loading';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);
    document.body.classList.add('loading');
}

// Hide loading state
function hideLoading() {
    const loadingOverlay = document.getElementById('auth-loading');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
    document.body.classList.remove('loading');
}

// Show error message
function showError(message) {
    // If modal is open, show error inside modal message container
    const modal = document.getElementById('auth-modal');
    const modalMsg = document.getElementById('modal-message-container');
    if (modal && modal.classList.contains('active') && modalMsg) {
        modalMsg.innerHTML = `<div class="message animate" role="alert">${message}</div>`;
        // Also focus the message for screen readers
        modalMsg.setAttribute('tabindex', '-1');
        modalMsg.focus && modalMsg.focus();
        // Auto-hide after 5s
        setTimeout(() => { modalMsg.innerHTML = ''; }, 5000);
        return;
    }
    // Otherwise, show global error
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(errorElement);
    setTimeout(() => {
        errorElement.classList.add('fade-out');
        setTimeout(() => errorElement.remove(), 300);
    }, 5000);
}

// Show success/info message (similar to showError)
function showMessage(message, type = 'info') {
    const modal = document.getElementById('auth-modal');
    const modalMsg = document.getElementById('modal-message-container');
    const color = type === 'success' ? '#16a34a' : (type === 'error' ? '#b91c1c' : '#2563eb');
    if (modal && modal.classList.contains('active') && modalMsg) {
        modalMsg.innerHTML = `<div class="message animate" role="status" style="color:${color}">${message}</div>`;
        modalMsg.setAttribute('tabindex', '-1');
        modalMsg.focus && modalMsg.focus();
        setTimeout(() => { modalMsg.innerHTML = ''; }, 5000);
        return;
    }
    // Otherwise, show global
    const msg = document.createElement('div');
    msg.className = 'error-message';
    msg.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
    msg.style.color = color;
    document.body.appendChild(msg);
    setTimeout(() => {
        msg.classList.add('fade-out');
        setTimeout(() => msg.remove(), 300);
    }, 5000);
}

// Ensure auth modal is in the correct state
function ensureAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) {
        console.error('Auth modal not found in the DOM');
        showError('Authentication system error. Please refresh the page.');
        return false;
    }
    return true;
}

// Handle login/signup toggle and modal functionality
async function initAuth() {
    // If already initialized, return the existing promise
    if (isInitialized) {
        console.log('Auth already initialized');
        return Promise.resolve();
    }
    
    // If initialization is in progress, return the existing promise
    if (authInitialization) {
        return authInitialization;
    }
    
    console.log('Initializing authentication...');
    showLoading();
    
    // Create a new promise to track initialization
    authInitialization = new Promise(async (resolve) => {
        try {
            // Ensure auth modal exists
            if (!ensureAuthModal()) {
                throw new Error('Auth modal not found');
            }
            
            // Check for existing user session first (no-op placeholder to prevent error)
            // await checkUserSession();
            
            // Attach auth button listeners (no-op placeholder to prevent error)
            // attachAuthButtonListeners();
            
            // Initialize floating label behavior
            initFloatingLabels();
            
            // Set up modal event listeners
            setupModalListeners();
            
            // Initialize forms
            initializeForms();
            
            isInitialized = true;
            console.log('Authentication initialized successfully');
            resolve();
        } catch (error) {
            console.error('Failed to initialize auth:', error);
            showError('Failed to initialize authentication. Please refresh the page.');
            resolve(); // Still resolve to prevent blocking
        } finally {
            hideLoading();
        }
    });
    
    return authInitialization;
}

// Set up modal event listeners
function setupModalListeners() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    
    // Close modal when clicking outside of it
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeAuthModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAuthModal();
        }
    });
}


// Initialize form event listeners
function initializeForms() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
}

// Minimal handler for forgot password to prevent ReferenceError
function handleForgotPassword(event) {
    event.preventDefault();
    showMessage('Password reset is not implemented yet.', 'info');
}

// Initialize floating labels
function initFloatingLabels() {
    const inputs = document.querySelectorAll('.input-group input');
    
    inputs.forEach(input => {
        // Check if input has value on page load
        if (input.value) {
            input.parentNode.classList.add('has-value');
        }
        
        // Add event listeners
        input.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentNode.classList.remove('focused');
            if (this.value) {
                this.parentNode.classList.add('has-value');
            } else {
                this.parentNode.classList.remove('has-value');
            }
        });
        
        // Trigger blur to set initial state
        input.dispatchEvent(new Event('blur'));
    });
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.querySelector(`[onclick="togglePassword('${inputId}')"] i`);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Social login handler
function loginWithSocial(provider) {
    const backendBase = `http://${window.location.hostname}:5000`;
    let url = '';
    switch (provider) {
        case 'google':
            url = backendBase + '/api/auth/google';
            break;
        case 'facebook':
            url = backendBase + '/api/auth/facebook';
            break;
        case 'apple':
            url = backendBase + '/api/auth/apple';
            break;
        default:
            console.error('Unknown provider:', provider);
            return;
    }

    // Open the backend OAuth endpoint in a popup
    const width = 500, height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    const win = window.open(url, provider + 'Login', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);

    if (!win || win.closed || typeof win.closed === 'undefined') {
        // Popup blocked, fallback to redirect
        window.location.href = url;
        return;
    }

    // Add polling mechanism as fallback for postMessage
    let pollCount = 0;
    const maxPolls = 60; // 30 seconds (500ms intervals)
    const pollInterval = setInterval(() => {
        pollCount++;
        
        // Check if popup is still open
        if (win.closed) {
            clearInterval(pollInterval);
            console.log('Popup closed, checking session...');
            
            // Wait a bit for backend to process, then check session
            setTimeout(() => {
                checkUserSession();
            }, 1000);
            return;
        }
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            console.log('Polling timeout, checking session anyway...');
            checkUserSession();
        }
    }, 500);
}

// Initialize when DOM is fully loaded
function initializeAuthSystem() {
    console.log('Auth system initializing...');
    
    // Add a small delay to ensure all DOM elements are ready
    setTimeout(() => {
        initAuth().catch(error => {
            console.error('Auth initialization failed:', error);
            showError('Failed to initialize authentication. Please refresh the page.');
        });
    }, 100);
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuthSystem);
} else {
    // DOMContentLoaded has already fired
    setTimeout(initializeAuthSystem, 100); // Small delay to ensure all elements are available
}

// Handle navigation auth button states
function updateNavAuthButtons(activeTab) {
    const navAuthBtns = document.querySelectorAll('.nav-menu .auth-btn');
    navAuthBtns.forEach(btn => {
        btn.classList.remove('active');
        if ((activeTab === 'login' && btn.textContent.trim() === 'Login') ||
            (activeTab === 'signup' && btn.textContent.trim() === 'Sign Up')) {
            btn.classList.add('active');
        }
    });
}

// Show authentication modal with animation
function showAuthModal(formType = 'login') {
    console.log('showAuthModal called with formType:', formType);
    const modal = document.getElementById('auth-modal');
    if (!modal) {
        console.error('Modal element not found!');
        return;
    }
    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) {
        console.error('Modal content not found!');
        return;
    }
    // Hide all forms and remove active class
    document.querySelectorAll('.auth-form').forEach(form => {
        form.style.display = 'none';
        form.classList.remove('active');
    });
    // Update nav button state
    updateNavAuthButtons(formType);
    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('active');
    // Reset animation classes
    modalContent.classList.remove('modal-animate-out', 'closing');
    void modalContent.offsetWidth;
    modalContent.classList.add('modal-animate-in');
    // Show the correct form
    let formToShow;
    let activeTab = 'login';
    switch(formType) {
        case 'signup':
            formToShow = document.getElementById('signup-form');
            activeTab = 'signup';
            break;
        case 'forgot':
            formToShow = document.getElementById('forgot-password-form');
            activeTab = null; // No tab for forgot
            break;
        case 'login':
        default:
            formToShow = document.getElementById('login-form');
            activeTab = 'login';
    }
    if (formToShow) {
        formToShow.style.display = 'block';
        formToShow.classList.add('active');
        // Focus first input
        const firstInput = formToShow.querySelector('input:not([type="hidden"])');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    } else {
        console.error('Form element not found for type:', formType);
    }
    // Set modal styles
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    modal.style.backdropFilter = 'blur(5px)';
    // Update modal tab highlight and aria attributes
    if (activeTab) {
        updateActiveTab(activeTab);
    } else {
        // Remove highlight if on forgot password
        const tabHighlight = document.querySelector('.tab-highlight');
        if (tabHighlight) tabHighlight.style.opacity = '0';
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
    }
}

// Close authentication modal with animation
function closeAuthModal() {
    console.log('closeAuthModal called');
    
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;
    
    // Start close animation
    modalContent.classList.remove('modal-animate-in');
    modalContent.classList.add('modal-animate-out');
    modal.style.backgroundColor = 'transparent';
    modal.style.backdropFilter = 'none';
    
    // Clean up after animation
    setTimeout(() => {
        if (!modal) return;
        
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        
        // Reset all forms
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            if (form) {
                form.reset();
                form.style.display = 'none';
                form.classList.remove('active');
            }
        });
        
        // Clear any errors
        clearFormErrors();
        
        console.log('Auth modal closed');
    }, 400);
}

// Animate form switching with smooth transitions
function animateFormSwitch(newForm, direction = 'right') {
    const forms = document.querySelectorAll('.auth-form');
    const activeForm = document.querySelector('.auth-form.active');
    
    if (activeForm === newForm) return; // Already on this form
    
    // Add exit animation to current active form
    if (activeForm) {
        activeForm.classList.remove('active');
        activeForm.classList.add(direction === 'right' ? 'form-fade-out-right' : 'form-fade-out');
    }
    
    // Add enter animation to new form
    setTimeout(() => {
        if (activeForm) {
            activeForm.style.display = 'none';
            activeForm.classList.remove('form-fade-out', 'form-fade-out-right');
        }
        
        newForm.style.display = 'block';
        newForm.classList.add(direction === 'right' ? 'form-slide-in-right' : 'form-slide-in-left');
        
        // Force reflow to ensure animation plays
        void newForm.offsetWidth;
        
        newForm.classList.add('active');
        
        // Animate form groups with staggered delay
        const formGroups = newForm.querySelectorAll('.form-group');
        formGroups.forEach((group, index) => {
            setTimeout(() => {
                group.classList.add('animate');
            }, 100 * index);
        });
        
        // Update tab highlight position
        const tabId = newForm.id.replace('-form', '');
        updateTabHighlight(tabId);
        
    }, 300); // Match this with the CSS animation duration
}

// Animate illustration emoji on tab switch
function updateIllustrationEmoji(emoji) {
    const emojiEl = document.getElementById('auth-emoji');
    if (!emojiEl) return;
    emojiEl.textContent = emoji;
    emojiEl.classList.remove('bounce');
    void emojiEl.offsetWidth;
    emojiEl.classList.add('bounce');
}
// Animate form fields with stagger
function animateFormFields(form) {
    const groups = form.querySelectorAll('.form-group');
    groups.forEach((group, idx) => {
        group.style.animationDelay = `${0.08 * idx}s`;
        group.classList.remove('animate');
        void group.offsetWidth;
        group.classList.add('animate');
    });
}
// Enhance showLoginForm, showSignupForm, showForgotPassword to animate emoji and fields
function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-password-form');
    let direction = 'right';
    if (signupForm.classList.contains('active')) direction = 'left';
    else if (forgotForm.classList.contains('active')) direction = 'left';
    animateFormSwitch(loginForm, direction);
    updateActiveTab('login');
    updateIllustrationEmoji('👋');
    setTimeout(() => {
        const emailInput = document.getElementById('login-email');
        if (emailInput) emailInput.focus();
        animateFormFields(loginForm);
    }, 400);
}
function showSignupForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-password-form');
    let direction = 'left';
    if (loginForm.classList.contains('active')) direction = 'right';
    else if (forgotForm.classList.contains('active')) direction = 'left';
    animateFormSwitch(signupForm, direction);
    updateActiveTab('signup');
    updateIllustrationEmoji('🚀');
    setTimeout(() => {
        const usernameInput = document.getElementById('signup-username');
        if (usernameInput) usernameInput.focus();
        animateFormFields(signupForm);
    }, 400);
}
function showForgotPassword() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-password-form');
    const direction = 'right';
    animateFormSwitch(forgotForm, direction);
    // Remove tab highlight and active state
    const tabHighlight = document.querySelector('.tab-highlight');
    if (tabHighlight) tabHighlight.style.opacity = '0';
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    updateIllustrationEmoji('🔑');
    setTimeout(() => {
        const emailInput = document.getElementById('reset-email');
        if (emailInput) emailInput.focus();
        animateFormFields(forgotForm);
    }, 400);
}
// Update active tab and highlight position
function updateActiveTab(activeTab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const tabHighlight = document.querySelector('.tab-highlight');
    tabs.forEach(tab => {
        const isActive = tab.getAttribute('data-tab') === activeTab;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    // Move the highlight under the active tab
    if (tabHighlight) {
        const activeTabEl = Array.from(tabs).find(tab => tab.getAttribute('data-tab') === activeTab);
        if (activeTabEl) {
            const tabRect = activeTabEl.getBoundingClientRect();
            const containerRect = activeTabEl.parentElement.getBoundingClientRect();
            const newLeft = tabRect.left - containerRect.left;
            const newWidth = tabRect.width;
            tabHighlight.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            tabHighlight.style.width = `${newWidth}px`;
            tabHighlight.style.transform = `translateX(${newLeft}px)`;
            tabHighlight.style.opacity = '1';
        }
    }
}

// Debug functions to test modal functionality
function debugTest() {
    const output = document.getElementById('debug-output');
    output.innerHTML = '';
    
    function log(message) {
        output.innerHTML += message + '<br>';
        console.log(message);
    }
    
    log('=== DEBUG TEST START ===');
    log('1. Checking if showAuthModal function exists: ' + (typeof showAuthModal));
    
    if (typeof showAuthModal === 'function') {
        log('2. Function exists, testing call...');
        try {
            showAuthModal('login');
            log('3. Function called successfully');
        } catch (error) {
            log('3. ERROR calling function: ' + error.message);
        }
    } else {
        log('2. ERROR: showAuthModal function not found!');
    }
    
    log('=== DEBUG TEST END ===');
}

function checkModal() {
    const output = document.getElementById('debug-output');
    output.innerHTML = '';
    
    function log(message) {
        output.innerHTML += message + '<br>';
        console.log(message);
    }
    
    log('=== MODAL CHECK START ===');
    
    const modal = document.getElementById('auth-modal');
    log('1. Modal element found: ' + (modal ? 'YES' : 'NO'));
    
    if (modal) {
        log('2. Modal display style: ' + modal.style.display);
        log('3. Modal computed display: ' + window.getComputedStyle(modal).display);
        log('4. Modal classes: ' + modal.className);
        
        const modalContent = modal.querySelector('.modal-content');
        log('5. Modal content found: ' + (modalContent ? 'YES' : 'NO'));
        
        if (modalContent) {
            log('6. Modal content display: ' + window.getComputedStyle(modalContent).display);
        }
    }
    
    log('=== MODAL CHECK END ===');
}

function forceShowModal() {
    const output = document.getElementById('debug-output');
    output.innerHTML = '';
    
    function log(message) {
        output.innerHTML += message + '<br>';
        console.log(message);
    }
    
    log('=== FORCE SHOW MODAL ===');
    
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modal.style.zIndex = '9999';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
        log('Modal forced to show with inline styles');
        
        // Also show the login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.style.display = 'block';
            loginForm.classList.add('active');
            log('Login form made visible');
        }
    } else {
        log('ERROR: Modal not found!');
    }
}

// Utility functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function clearFormErrors() {
    const inputs = document.querySelectorAll('.auth-form input');
    inputs.forEach(input => {
        input.style.borderColor = '#e5e7eb';
    });
}

function showTerms() {
    showMessage('Terms of Service: By using this service, you agree to our terms and conditions.', 'info');
}

// Enhance handleLogin to show loading spinner on button and use backend API
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = form.querySelector('button[type="submit"]');
    if (!validateEmail(email)) {
        showError('Please enter a valid email address.');
        return;
    }
    if (!password) {
        showError('Please enter your password.');
        return;
    }
    btn.classList.add('loading');
    btn.setAttribute('aria-busy', 'true');
    try {
        const res = await fetch(getBackendUrl('/api/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        btn.classList.remove('loading');
        btn.removeAttribute('aria-busy');
        if (data.success) {
            showMessage('Login successful! Welcome, ' + data.username, 'success');
            // Fetch user info from backend to get the consistent user object
            try {
                const userRes = await fetch(getBackendUrl('/api/user'), { credentials: 'include' });
                const userData = await userRes.json();
                if (userData && userData.logged_in && userData.user) {
                    currentUser = userData.user;
                } else {
                    currentUser = { username: data.username, email };
                }
            } catch (e) {
                currentUser = { username: data.username, email };
            }
            updateUserProfileUI();
            closeAuthModal();
        } else {
            showError(data.message || 'Login failed.');
        }
    } catch (err) {
        btn.classList.remove('loading');
        btn.removeAttribute('aria-busy');
        showError('Error connecting to server.');
    }
}

// Update the nav bar to show user profile after login
function updateUserProfileUI() {
    console.log('updateUserProfileUI called with currentUser:', currentUser);
    // Hide login/signup buttons first
    const loginBtn = document.getElementById('nav-login-btn');
    const signupBtn = document.getElementById('nav-signup-btn');
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    // Remove existing user profile from nav-menu (legacy, just in case)
    const existingProfile = document.getElementById('nav-user-profile');
    if (existingProfile) existingProfile.remove();
    // Only update the auth container
    const authContainer = document.querySelector('.nav-item.auth-container');
    if (!authContainer) {
        console.error('Auth container not found');
        return;
    }
    if (currentUser) {
        authContainer.innerHTML = `
            <div class="user-profile" style="display:flex;align-items:center;gap:8px;">
                <i class="fas fa-user-circle" style="font-size:1.6em;"></i>
                <span class="username" style="font-weight:600;">${currentUser.username || currentUser.name || currentUser.email}</span>
                <button class="logout-btn" onclick="logoutUser()" title="Logout" style="background:none;border:none;cursor:pointer;color:inherit;">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
    } else {
        // Restore login/signup buttons
        authContainer.innerHTML = `
            <div class="auth-toggle">
                <button type="button" class="auth-btn" data-tab="login" id="nav-login-btn" onclick="showAuthModal('login')">Login</button>
                <button type="button" class="auth-btn" data-tab="signup" id="nav-signup-btn" onclick="showAuthModal('signup')">Sign Up</button>
                <span class="auth-slider"></span>
            </div>
        `;
    }
}

// Logout function
async function logoutUser() {
    try {
        // Call backend to clear session
        await fetch(getBackendUrl('/api/logout'), { method: 'POST', credentials: 'include' });
    } catch (e) {
        // Ignore errors for now
    }
    currentUser = null;
    updateUserProfileUI();
    showMessage('Logged out successfully.', 'info');
}

// Signup handler using backend API
async function handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const terms = document.getElementById('terms').checked;
    const btn = form.querySelector('button[type="submit"]');
    if (!username) {
        showError('Please enter a username.');
        return;
    }
    if (!validateEmail(email)) {
        showError('Please enter a valid email address.');
        return;
    }
    if (!password) {
        showError('Please enter a password.');
        return;
    }
    if (!terms) {
        showError('You must agree to the terms.');
        return;
    }
    btn.classList.add('loading');
    btn.setAttribute('aria-busy', 'true');
    try {
        const res = await fetch(getBackendUrl('/api/signup'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        btn.classList.remove('loading');
        btn.removeAttribute('aria-busy');
        if (data.success) {
            showMessage('Signup successful! You can now log in.', 'success');
            form.reset();
            setTimeout(() => showLoginForm(), 1200);
        } else {
            showError(data.message || 'Signup failed.');
        }
    } catch (err) {
        btn.classList.remove('loading');
        btn.removeAttribute('aria-busy');
        showError('Error connecting to server.');
    }
}

// Expose checkUserSession function for external calls
window.checkUserSession = async function() {
    console.log('Checking user session...');
    try {
        const res = await fetch(getBackendUrl('/api/user'), { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            console.log('Session check response:', data);
            if (data && data.logged_in && data.user) {
                currentUser = data.user;
                console.log('User is logged in:', currentUser);
            } else {
                currentUser = null;
                console.log('User is not logged in');
            }
        } else {
            currentUser = null;
            console.log('Session check request failed');
        }
    } catch (e) {
        currentUser = null;
        console.log('Error checking session:', e);
    }
    updateUserProfileUI();
};

// Check session immediately when auth.js loads
console.log('Auth.js loaded, checking session immediately...');
window.checkUserSession();

// On page load, check if user is already logged in
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Auth.js: Checking user session on page load...');
    try {
        const res = await fetch(getBackendUrl('/api/user'), { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            console.log('Auth.js: Backend response:', data);
            if (data && data.logged_in && data.user) {
                currentUser = data.user;
                console.log('Auth.js: User is logged in:', currentUser);
            } else {
                currentUser = null;
                console.log('Auth.js: User is not logged in');
            }
        } else {
            currentUser = null;
            console.log('Auth.js: Backend request failed');
        }
    } catch (e) {
        currentUser = null;
        console.log('Auth.js: Error checking session:', e);
    }
    updateUserProfileUI();
});

// Button ripple effect

// Ensure initAuth is available globally for dynamic script loading
if (typeof window !== 'undefined') {
    window.initAuth = initAuth;
}
function addButtonRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn, .btn-primary').forEach(btn => {
        btn.addEventListener('click', addButtonRipple);
    });
    // Auth toggle hover effect for slider
    const authToggle = document.querySelector('.auth-toggle');
    const loginBtn = document.querySelector('.auth-btn[data-tab="login"]');
    const signupBtn = document.querySelector('.auth-btn[data-tab="signup"]');
    if (authToggle && loginBtn && signupBtn) {
        loginBtn.addEventListener('mouseenter', () => {
            authToggle.classList.add('hover-login');
            authToggle.classList.remove('hover-signup');
        });
        loginBtn.addEventListener('mouseleave', () => {
            authToggle.classList.remove('hover-login');
        });
        signupBtn.addEventListener('mouseenter', () => {
            authToggle.classList.add('hover-signup');
            authToggle.classList.remove('hover-login');
        });
        signupBtn.addEventListener('mouseleave', () => {
            authToggle.classList.remove('hover-signup');
        });
    }
});

// Password strength meter for signup
function updatePasswordStrength() {
    const password = document.getElementById('signup-password').value;
    const strength = calculatePasswordStrength(password);
    const strengthText = document.getElementById('password-strength');
    if (strengthText) {
        strengthText.textContent = `Password Strength: ${strength}`;
        strengthText.style.color = getStrengthColor(strength);
    }
}
function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 16) score++;
    if (score <= 1) return 'Very Weak';
    if (score === 2) return 'Weak';
    if (score === 3) return 'Moderate';
    if (score === 4) return 'Strong';
    if (score === 5) return 'Very Strong';
    if (score >= 6) return 'Ultra Strong';
    return 'Very Weak';
}
function getStrengthColor(strength) {
    switch (strength) {
        case 'Very Weak': return '#ff5e5e';
        case 'Weak': return '#ff9800';
        case 'Moderate': return '#ffc107';
        case 'Strong': return '#4caf50';
        case 'Very Strong': return '#388e3c';
        case 'Ultra Strong': return '#1b5e20';
        default: return '#888';
    }
}

// Custom checkbox functionality to handle clicks on checkmark spans
document.addEventListener('DOMContentLoaded', function() {
    // Handle clicks on custom checkmarks and checkbox containers
    document.addEventListener('click', function(event) {
        // Check if clicked element is a checkmark or within a checkbox container
        let target = event.target;
        let checkboxContainer = null;
        
        if (target.classList.contains('checkmark')) {
            checkboxContainer = target.closest('.checkbox-container');
        } else if (target.classList.contains('checkbox-container')) {
            checkboxContainer = target;
        } else if (target.closest('.checkbox-container')) {
            checkboxContainer = target.closest('.checkbox-container');
        }
        
        if (checkboxContainer) {
            // Prevent default behavior and stop propagation
            event.preventDefault();
            event.stopPropagation();
            
            const checkbox = checkboxContainer.querySelector('input[type="checkbox"]');
            const checkmark = checkboxContainer.querySelector('.checkmark');
            
            if (checkbox && checkmark) {
                // Toggle the checkbox state
                checkbox.checked = !checkbox.checked;
                
                // Update visual state using CSS classes
                if (checkbox.checked) {
                    checkmark.classList.add('checked');
                } else {
                    checkmark.classList.remove('checked');
                }
                
                // Trigger change event for any validation or other listeners
                const changeEvent = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(changeEvent);
                
                console.log('Checkbox toggled:', checkbox.id, 'checked:', checkbox.checked);
            }
        }
    });
    
    // Initialize visual state on page load
    document.querySelectorAll('.checkbox-container input[type="checkbox"]').forEach(function(checkbox) {
        const checkmark = checkbox.parentElement.querySelector('.checkmark');
        if (checkmark) {
            if (checkbox.checked) {
                checkmark.classList.add('checked');
            } else {
                checkmark.classList.remove('checked');
            }
        }
    });
});
