/**
 * Website Security Module
 * Comprehensive security implementation for client-side protection
 */

class WebSecurity {
    constructor(config = {}) {
        this.config = {
            MAX_LOGIN_ATTEMPTS: config.maxLoginAttempts || 5,
            LOCKOUT_DURATION: config.lockoutDuration || 15 * 60 * 1000, // 15 minutes
            SESSION_TIMEOUT: config.sessionTimeout || 30 * 60 * 1000, // 30 minutes
            CSRF_TOKEN_HEADER: config.csrfHeader || 'X-CSRF-Token',
            RATE_LIMIT_WINDOW: config.rateLimitWindow || 60 * 1000, // 1 minute
            MAX_REQUESTS_PER_WINDOW: config.maxRequestsPerWindow || 30,
            ENABLE_DEV_TOOLS_DETECTION: config.enableDevToolsDetection !== false,
            ENABLE_RIGHT_CLICK_DISABLE: config.enableRightClickDisable !== false,
            ENABLE_HOTKEY_DISABLE: config.enableHotkeyDisable !== false,
            ...config
        };

        this.state = {
            loginAttempts: parseInt(localStorage.getItem('loginAttempts') || '0'),
            lastAttempt: parseInt(localStorage.getItem('lastLoginAttempt') || '0'),
            requestCount: 0,
            windowStart: Date.now(),
            csrfToken: '',
            sessionStart: Date.now(),
            suspiciousActivity: 0
        };

        this.eventListeners = [];
        this.init();
    }

    init() {
        this.initCSRF();
        this.initEventListeners();
        this.initSecurityHeaders();
        this.initContentProtection();
        this.initSessionManagement();
        
        if (this.config.ENABLE_DEV_TOOLS_DETECTION) {
            this.initDevToolsDetection();
        }
        
        if (this.config.ENABLE_RIGHT_CLICK_DISABLE) {
            this.disableRightClick();
        }
        
        if (this.config.ENABLE_HOTKEY_DISABLE) {
            this.disableDebugHotkeys();
        }

        console.log('🔒 WebSecurity initialized successfully');
    }

    // CSRF Protection
    initCSRF() {
        this.state.csrfToken = this.generateCSRFToken();
        this.updateFormTokens();
        
        // Refresh CSRF token every 10 minutes
        setInterval(() => {
            this.state.csrfToken = this.generateCSRFToken();
            this.updateFormTokens();
        }, 10 * 60 * 1000);
    }

    generateCSRFToken() {
        const array = new Uint8Array(32);
        if (window.crypto && window.crypto.getRandomValues) {
            crypto.getRandomValues(array);
        } else {
            // Fallback for older browsers
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
        }
        return btoa(String.fromCharCode.apply(null, array));
    }

    updateFormTokens() {
        document.querySelectorAll('form[data-csrf-token]').forEach(form => {
            form.setAttribute('data-csrf-token', this.state.csrfToken);
            
            let csrfInput = form.querySelector('input[name="csrf_token"]');
            if (!csrfInput) {
                csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                form.appendChild(csrfInput);
            }
            csrfInput.value = this.state.csrfToken;
        });
    }

    validateCSRFToken(token) {
        return token === this.state.csrfToken;
    }

    // Input Sanitization
    sanitizeInput(input) {
        if (!input || !input.value) return;
        
        const maxLength = parseInt(input.getAttribute('data-max-length')) || 1000;
        let value = input.value;
        
        // Trim to max length
        if (value.length > maxLength) {
            value = value.substring(0, maxLength);
        }
        
        // HTML encode dangerous characters
        value = this.escapeHtml(value);
        
        // Remove script tags and javascript: protocols
        value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        value = value.replace(/javascript:/gi, '');
        value = value.replace(/on\w+\s*=/gi, '');
        value = value.replace(/data:text\/html/gi, '');
        
        input.value = value;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Rate Limiting
    checkRateLimit() {
        const now = Date.now();
        
        if (now - this.state.windowStart > this.config.RATE_LIMIT_WINDOW) {
            this.state.requestCount = 0;
            this.state.windowStart = now;
        }
        
        this.state.requestCount++;
        
        if (this.state.requestCount > this.config.MAX_REQUESTS_PER_WINDOW) {
            this.showSecurityMessage('Too many requests. Please slow down.', 'error');
            this.logSuspiciousActivity('rate_limit_exceeded');
            return false;
        }
        
        return true;
    }

    // Login Attempt Tracking
    checkLoginAttempts() {
        const now = Date.now();
        
        if (this.state.loginAttempts >= this.config.MAX_LOGIN_ATTEMPTS) {
            const timeSinceLastAttempt = now - this.state.lastAttempt;
            if (timeSinceLastAttempt < this.config.LOCKOUT_DURATION) {
                const remainingTime = Math.ceil((this.config.LOCKOUT_DURATION - timeSinceLastAttempt) / 60000);
                this.showSecurityMessage(`Account temporarily locked. Try again in ${remainingTime} minutes.`, 'error');
                return false;
            }
            this.resetLoginAttempts();
        }
        
        return true;
    }

    recordFailedLogin() {
        this.state.loginAttempts++;
        this.state.lastAttempt = Date.now();
        localStorage.setItem('loginAttempts', this.state.loginAttempts.toString());
        localStorage.setItem('lastLoginAttempt', this.state.lastAttempt.toString());
        
        const remaining = this.config.MAX_LOGIN_ATTEMPTS - this.state.loginAttempts;
        if (remaining > 0) {
            this.showSecurityMessage(`Invalid credentials. ${remaining} attempts remaining.`, 'warning');
        }
        
        this.logSuspiciousActivity('failed_login');
    }

    resetLoginAttempts() {
        this.state.loginAttempts = 0;
        this.state.lastAttempt = 0;
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastLoginAttempt');
    }

    // Session Management
    checkSession() {
        const now = Date.now();
        if (now - this.state.sessionStart > this.config.SESSION_TIMEOUT) {
            this.showSecurityMessage('Session expired. Please log in again.', 'warning');
            this.logSuspiciousActivity('session_expired');
            return false;
        }
        return true;
    }

    refreshSession() {
        this.state.sessionStart = Date.now();
    }

    // Content Protection
    initContentProtection() {
        // Disable text selection on sensitive areas
        const style = document.createElement('style');
        style.textContent = `
            .no-select, .auth-form, .sensitive-content {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
            
            .protected-content {
                pointer-events: none;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -khtml-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
        `;
        document.head.appendChild(style);
    }

    disableRightClick() {
        const handler = (e) => {
            e.preventDefault();
            this.logSuspiciousActivity('right_click_attempt');
            return false;
        };
        
        document.addEventListener('contextmenu', handler);
        this.eventListeners.push({ element: document, event: 'contextmenu', handler });
    }

    disableDebugHotkeys() {
        const handler = (e) => {
            // F12, Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+C
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'u')) {
                e.preventDefault();
                this.logSuspiciousActivity('debug_hotkey_attempt');
                return false;
            }
        };
        
        document.addEventListener('keydown', handler);
        this.eventListeners.push({ element: document, event: 'keydown', handler });
    }

    // Developer Tools Detection
    initDevToolsDetection() {
        let devtools = { open: false };
        
        const detect = () => {
            const threshold = 160;
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSuspiciousActivity('devtools_detected');
                    this.showSecurityMessage('Developer tools detected', 'warning');
                }
            } else {
                devtools.open = false;
            }
        };
        
        setInterval(detect, 1000);
    }

    // Event Listeners
    initEventListeners() {
        // Session activity tracking
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            const handler = () => this.refreshSession();
            document.addEventListener(event, handler, true);
            this.eventListeners.push({ element: document, event, handler });
        });

        // Visibility change detection
        const visibilityHandler = () => {
            if (document.hidden) {
                this.logSuspiciousActivity('tab_hidden');
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.push({ element: document, event: 'visibilitychange', handler: visibilityHandler });

        // Monitor for excessive clicking
        let clickCount = 0;
        const clickHandler = () => {
            clickCount++;
            if (clickCount > 100) {
                this.logSuspiciousActivity('excessive_clicking');
                this.showSecurityMessage('Suspicious activity detected', 'warning');
                clickCount = 0;
            }
        };
        document.addEventListener('click', clickHandler);
        this.eventListeners.push({ element: document, event: 'click', handler: clickHandler });

        // CSP violation handler
        const cspHandler = (event) => {
            console.warn('CSP Violation:', event.violatedDirective, event.blockedURI);
            this.logSuspiciousActivity('csp_violation', {
                directive: event.violatedDirective,
                blockedURI: event.blockedURI
            });
        };
        document.addEventListener('securitypolicyviolation', cspHandler);
        this.eventListeners.push({ element: document, event: 'securitypolicyviolation', handler: cspHandler });
    }

    // Security Headers
    initSecurityHeaders() {
        // Frame busting
        if (top !== self) {
            top.location.href = self.location.href;
        }

        // Additional client-side security measures
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            this.showSecurityMessage('This site should be accessed over HTTPS', 'warning');
        }
    }

    // Session Management
    initSessionManagement() {
        // Auto-logout on session timeout
        setInterval(() => {
            if (!this.checkSession()) {
                this.logout();
            }
        }, 60000); // Check every minute
    }

    logout() {
        // Clear session data
        this.state.sessionStart = 0;
        sessionStorage.clear();
        
        // Redirect to login or reload page
        if (typeof window.logoutUser === 'function') {
            window.logoutUser();
        }
    }

    // Logging and Monitoring
    logSuspiciousActivity(type, details = {}) {
        this.state.suspiciousActivity++;
        
        const log = {
            timestamp: new Date().toISOString(),
            type,
            details,
            userAgent: navigator.userAgent,
            url: window.location.href,
            sessionId: this.state.csrfToken.substring(0, 8)
        };
        
        console.warn('🚨 Security Event:', log);
        
        // Store locally for analysis
        const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        logs.push(log);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('securityLogs', JSON.stringify(logs));
        
        // Send to server if available
        if (typeof this.config.onSecurityEvent === 'function') {
            this.config.onSecurityEvent(log);
        }
    }

    // UI Messages
    showSecurityMessage(message, type = 'info') {
        const container = document.getElementById('message-container') || 
                         document.getElementById('modal-message-container') || 
                         document.body;
        
        const messageEl = document.createElement('div');
        messageEl.className = `security-message ${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-shield-alt"></i>
            <span>${this.escapeHtml(message)}</span>
            <button onclick="this.parentElement.remove()" class="close-btn">&times;</button>
        `;
        
        container.appendChild(messageEl);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }

    // Form Validation
    validateForm(form) {
        if (!this.checkRateLimit()) return false;
        if (!this.checkSession()) return false;
        
        const formToken = form.getAttribute('data-csrf-token');
        if (!this.validateCSRFToken(formToken)) {
            this.showSecurityMessage('Security token mismatch. Please refresh the page.', 'error');
            return false;
        }
        
        // Validate all inputs
        const inputs = form.querySelectorAll('input[data-max-length]');
        for (let input of inputs) {
            this.sanitizeInput(input);
            
            if (!input.checkValidity()) {
                this.showSecurityMessage('Please correct the highlighted fields', 'error');
                return false;
            }
        }
        
        return true;
    }

    // Public API
    secureSubmit(form, callback) {
        if (this.validateForm(form)) {
            return callback();
        }
        return false;
    }

    // Cleanup
    destroy() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }

    // Get security status
    getSecurityStatus() {
        return {
            loginAttempts: this.state.loginAttempts,
            sessionActive: this.checkSession(),
            suspiciousActivity: this.state.suspiciousActivity,
            lastActivity: new Date(this.state.sessionStart).toISOString()
        };
    }
}

// Initialize global security instance
window.WebSecurity = WebSecurity;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.securityInstance) {
            window.securityInstance = new WebSecurity();
        }
    });
} else {
    if (!window.securityInstance) {
        window.securityInstance = new WebSecurity();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSecurity;
}
