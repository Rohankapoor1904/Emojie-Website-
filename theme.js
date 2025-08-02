// Theme Toggle Functionality
function initTheme() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('aria-label', 'Toggle dark mode');
    themeToggle.innerHTML = '🌓';
    
    // Function to set theme
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        
        // Add transition class for smooth theme change
        document.documentElement.classList.add('theme-transition');
        window.setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, 300);
    }
    
    // Check for saved user preference, if any, on load
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    // Apply the saved theme
    setTheme(savedTheme);
    
    // Add transition after initial load
    window.setTimeout(() => {
        document.documentElement.classList.add('theme-transition');
    }, 10);
    
    // Add toggle button to the navigation
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        const themeToggleItem = document.createElement('li');
        themeToggleItem.className = 'nav-item';
        themeToggleItem.appendChild(themeToggle);
        navMenu.appendChild(themeToggleItem);
    }
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        
        // Dispatch event for any other scripts that might need to know about theme changes
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: newTheme }
        }));
    });
    
    // Listen for system theme changes (only if user hasn't set a preference)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme);
        }
    });
}

// Initialize theme when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}
