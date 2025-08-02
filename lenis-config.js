/**
 * Lenis Smooth Scroll Configuration
 * Enhanced scrolling experience for Emoji Paradise website
 */

class LenisScrollManager {
    constructor() {
        this.lenis = null;
        this.init();
    }

    init() {
        // Initialize Lenis with optimized settings
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
            normalizeWheel: true,
            wheelMultiplier: 1,
        });

        this.setupAnimationFrame();
        this.setupNavigationScrolling();
        this.setupScrollEffects();
        this.setupScrollToTop();
        this.setupParallaxEffects();
        this.setupModalIntegration();
        
        console.log('🚀 Lenis Scroll Manager initialized');
    }

    setupAnimationFrame() {
        const raf = (time) => {
            this.lenis.raf(time);
            requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
    }

    setupNavigationScrolling() {
        // Enhanced navigation scrolling with offset for navbar
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                const target = document.querySelector(targetId);
                
                if (target) {
                    this.lenis.scrollTo(target, {
                        offset: -80, // Account for navbar height
                        duration: 1.5,
                        easing: (t) => 1 - Math.pow(1 - t, 3)
                    });
                }
            });
        });
    }

    setupScrollEffects() {
        // Scroll progress indicator and navbar effects
        let ticking = false;
        
        const updateScrollEffects = () => {
            const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            document.documentElement.style.setProperty('--scroll-progress', `${scrolled}%`);
            
            // Navbar scroll effect - DISABLED
            // const navbar = document.querySelector('.navbar');
            // if (navbar) {
            //     if (window.scrollY > 50) {
            //         navbar.classList.add('scrolled');
            //     } else {
            //         navbar.classList.remove('scrolled');
            //     }
            // }
            
            ticking = false;
        };

        const requestScrollUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    }

    setupScrollToTop() {
        // Enhanced scroll to top with smooth animation
        window.scrollToTop = () => {
            this.lenis.scrollTo(0, {
                duration: 2,
                easing: (t) => 1 - Math.pow(1 - t, 4)
            });
        };
    }

    setupParallaxEffects() {
        // Parallax effect for floating emojis
        this.lenis.on('scroll', ({ scroll }) => {
            const floatingEmojis = document.querySelectorAll('.floating-emoji');
            floatingEmojis.forEach((emoji, index) => {
                const speed = 0.3 + (index * 0.1);
                const yPos = -(scroll * speed);
                emoji.style.transform = `translateY(${yPos}px) translateZ(0)`;
            });

            // Parallax for hero section
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                const heroSpeed = 0.5;
                const heroYPos = -(scroll * heroSpeed);
                heroSection.style.transform = `translateY(${heroYPos}px)`;
            }

            // Smooth content section animations
            const contentSections = document.querySelectorAll('.content-section');
            contentSections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                const inView = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (inView) {
                    const progress = 1 - (rect.top / window.innerHeight);
                    const translateY = Math.max(0, 50 * (1 - progress));
                    section.style.transform = `translateY(${translateY}px)`;
                    section.style.opacity = Math.min(1, progress + 0.3);
                }
            });
        });
    }

    setupModalIntegration() {
        // Stop/start scrolling when modals open/close
        const observeModal = (modal) => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'style') {
                        const isVisible = modal.style.display !== 'none' && modal.style.display !== '';
                        if (isVisible) {
                            this.lenis.stop();
                            document.body.classList.add('modal-open');
                        } else {
                            this.lenis.start();
                            document.body.classList.remove('modal-open');
                        }
                    }
                });
            });
            
            observer.observe(modal, {
                attributes: true,
                attributeFilter: ['style']
            });
        };

        // Observe auth modal
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            observeModal(authModal);
        }

        // Stop scrolling on any modal with class 'modal'
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && e.target === e.currentTarget) {
                // Clicked outside modal content - close modal and resume scrolling
                this.lenis.start();
                document.body.classList.remove('modal-open');
            }
        });
    }

    // Public methods for external control
    scrollTo(target, options = {}) {
        this.lenis.scrollTo(target, {
            duration: 1.2,
            easing: (t) => 1 - Math.pow(1 - t, 3),
            ...options
        });
    }

    stop() {
        this.lenis.stop();
    }

    start() {
        this.lenis.start();
    }

    destroy() {
        this.lenis.destroy();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if Lenis is available
    if (typeof Lenis !== 'undefined') {
        window.lenisManager = new LenisScrollManager();
    } else {
        console.warn('Lenis library not loaded, falling back to default scroll behavior');
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LenisScrollManager;
}
