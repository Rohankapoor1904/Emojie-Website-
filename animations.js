// Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    // Initialize animations
    initScrollAnimations();
    initHoverEffects();
    initParallaxEffects();
    initButtonRipples();
    initMagneticButtons();
    initPageTransition();
});

// Scroll-based animations
function initScrollAnimations() {
    const animateOnScroll = (elements, className) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(className);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => observer.observe(el));
    };

    // Animate elements with data-animate attribute
    const animatedElements = document.querySelectorAll('[data-animate]');
    animateOnScroll(animatedElements, 'animate-fade-in-up');

    // Staggered animations for grid items
    const gridItems = document.querySelectorAll('.emoji-item, .gif-item');
    gridItems.forEach((item, index) => {
        item.style.setProperty('--delay', index * 0.1);
        item.style.animationDelay = `${index * 0.1}s`;
    });
}

// Hover effects
function initHoverEffects() {
    // Add hover effect to cards
    const cards = document.querySelectorAll('.card, .emoji-item, .gif-item');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // Add tilt effect to hero content
    const hero = document.querySelector('.hero-content');
    if (hero) {
        hero.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = hero.getBoundingClientRect();
            const x = (e.clientX - left) / width - 0.5;
            const y = (e.clientY - top) / height - 0.5;
            
            hero.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) scale3d(1.03, 1.03, 1.03)`;
        });

        hero.addEventListener('mouseleave', () => {
            hero.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale3d(1, 1, 1)';
        });
    }
}

// Parallax effects
function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    window.addEventListener('scroll', () => {
        const scrollPosition = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-parallax'));
            const yPos = -(scrollPosition * speed);
            element.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
    });
}

// Button ripple effects
function initButtonRipples() {
    const buttons = document.querySelectorAll('.btn, button, .nav-link');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 1000);
        });
    });
}

// Magnetic button effect
function initMagneticButtons() {
    const magneticButtons = document.querySelectorAll('.magnetic');
    
    magneticButtons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPos = (x - rect.width / 2) * 0.3;
            const yPos = (y - rect.height / 2) * 0.3;
            
            button.style.transform = `translate(${xPos}px, ${yPos}px)`;
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translate(0, 0)';
        });
    });
}

// Smooth page transitions
function initPageTransition() {
    const links = document.querySelectorAll('a:not([target="_blank"]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.href === window.location.href) return;
            
            e.preventDefault();
            document.body.classList.add('page-transition');
            
            setTimeout(() => {
                window.location.href = link.href;
            }, 500);
        });
    });
}

// Text animation
function animateText(element) {
    const text = element.textContent;
    element.textContent = '';
    
    for (let i = 0; i < text.length; i++) {
        setTimeout(() => {
            element.textContent += text[i];
        }, i * 50);
    }
}

// Initialize text animations
const animatedTexts = document.querySelectorAll('.animate-text');
animatedTexts.forEach(animateText);

// Add animation delay to elements
function addAnimationDelay(elements, delay) {
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * delay}s`;
    });
}

// === GSAP GLOBAL ANIMATIONS ===

document.addEventListener('DOMContentLoaded', function() {
  // 1. Scroll-based reveal for all [data-animate-on-scroll] using GSAP + ScrollTrigger
  if (window.gsap && window.ScrollTrigger) {
    gsap.utils.toArray('[data-animate-on-scroll]').forEach(function(elem, i) {
      gsap.fromTo(elem, {
        opacity: 0,
        y: 60
      }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: elem,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        delay: i * 0.08
      });
    });
  }

  // 2. Stagger emoji grid items with GSAP
  var emojiGrids = document.querySelectorAll('.emoji-grid');
  emojiGrids.forEach(function(grid) {
    var items = grid.querySelectorAll('.emoji-item');
    if (items.length && window.gsap && window.ScrollTrigger) {
      gsap.from(items, {
        opacity: 0,
        y: 40,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      });
    }
  });

  // 3. Upload area: add GSAP 3D rotation on hover globally
  document.querySelectorAll('.upload-area').forEach(function(area) {
    area.addEventListener('mouseenter', function() {
      gsap.to(area, {rotateY: 18, rotateX: 8, scale: 1.04, duration: 0.4, ease: 'power3.out'});
    });
    area.addEventListener('mouseleave', function() {
      gsap.to(area, {rotateY: 0, rotateX: 0, scale: 1, duration: 0.5, ease: 'power3.inOut'});
    });
  });
});

// Export functions for use in other modules
window.Animations = {
    initScrollAnimations,
    initHoverEffects,
    initParallaxEffects,
    initButtonRipples,
    initMagneticButtons,
    initPageTransition,
    animateText
};
