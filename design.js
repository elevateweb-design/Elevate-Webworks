// =========================================================================
// PORTFOLIO WEBSITE INTERACTIVITY (Headroom Scroll, Theme Toggle, Rotator)
// =========================================================================

document.addEventListener('DOMContentLoaded', function() {

    // ---------- 1. DARK / LIGHT MODE TOGGLE (Warm Paper vs Dark Ink) ----------
    const themeToggles = document.querySelectorAll('.theme-toggle-btn');
    const root = document.documentElement;
    
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        root.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.setAttribute('data-theme', 'dark');
    } else {
        root.setAttribute('data-theme', 'light');
    }
    
    themeToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = root.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    });

    // ---------- 1.1 CURRENCY DETECTOR & TOGGLER (INR / USD) ----------
    const currencyToggles = document.querySelectorAll('.currency-toggle-btn');
    const currencyLabels = document.querySelectorAll('.currency-label');
    const priceElements = document.querySelectorAll('[data-price-inr]');

    const updateCurrencyUI = (currency) => {
        priceElements.forEach(el => {
            if (currency === 'USD') {
                el.textContent = el.getAttribute('data-price-usd');
            } else {
                el.textContent = el.getAttribute('data-price-inr');
            }
        });
        currencyLabels.forEach(label => {
            label.textContent = currency === 'USD' ? '$' : '₹';
        });
    };

    const getSavedCurrency = () => {
        return localStorage.getItem('currency') || null;
    };

    const setCurrency = (currency) => {
        localStorage.setItem('currency', currency);
        updateCurrencyUI(currency);
    };

    // Auto-detect based on IP Geolocation if no preference is saved
    const savedCurrency = getSavedCurrency();
    if (savedCurrency) {
        setCurrency(savedCurrency);
    } else {
        // Fast, anonymous fallback detection using ipapi.co
        fetch('https://ipapi.co/json/')
            .then(res => res.ok ? res.json() : Promise.reject('Geolocation HTTP error'))
            .then(data => {
                if (data && data.country_code && data.country_code !== 'IN') {
                    setCurrency('USD');
                } else {
                    setCurrency('INR');
                }
            })
            .catch(err => {
                console.warn('Geolocation failed, defaulting to INR:', err);
                setCurrency('INR'); // Default fallback
            });
    }

    currencyToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentCurrency = localStorage.getItem('currency') === 'USD' ? 'INR' : 'USD';
            setCurrency(currentCurrency);
        });
    });

    // ---------- 2. MOBILE NAVIGATION TOGGLE ----------
    const navToggle = document.querySelector('[data-nav-toggle]');
    const primaryNav = document.querySelector('[data-nav-primary]');
    const headerEl = document.querySelector('.site-chrome header');
    
    if (navToggle && primaryNav && headerEl) {
        const toggleMenu = (open) => {
            headerEl.classList.toggle('is-open', open);
            document.body.classList.toggle('menu-open', open);
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        };

        navToggle.addEventListener('click', function(ev) {
            ev.stopPropagation();
            const isOpen = headerEl.classList.contains('is-open');
            toggleMenu(!isOpen);
        });

        // Close menu when clicking navigation links
        primaryNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggleMenu(false);
            });
        });

        // Close menu when clicking outside of header
        document.addEventListener('click', function(ev) {
            if (!headerEl.contains(ev.target)) {
                toggleMenu(false);
            }
        });

        // Close menu on ESC key press
        document.addEventListener('keydown', function(ev) {
            if (ev.key === 'Escape') {
                toggleMenu(false);
            }
        });
    }

    // ---------- 3. HEADROOM HEADER NAVIGATION (COLLAPSE ON SCROLL DOWN) ----------
    const chromeEl = document.querySelector('[data-chrome-headroom]');
    if (chromeEl) {
        let lastY = window.scrollY;
        let ticking = false;
        const showTopThreshold = 100;
        const scrollDelta = 6;

        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const y = window.scrollY;
                const delta = y - lastY;

                if (y <= showTopThreshold) {
                    chromeEl.classList.remove('is-hidden');
                } else if (delta > scrollDelta) {
                    // Scrolling down - hide header
                    chromeEl.classList.add('is-hidden');
                } else if (delta < -scrollDelta) {
                    // Scrolling up - show header
                    chromeEl.classList.remove('is-hidden');
                }
                lastY = y;
                ticking = false;
            });
        }, { passive: true });
    }

    // ---------- 4. SMOOTH SCROLL (With offset calculation) ----------
    const navHeight = () => {
        const header = document.querySelector('.site-chrome');
        return header ? header.offsetHeight + 10 : 80;
    };

    const internalLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                const offset = navHeight();
                window.scrollTo({
                    top: elementPosition - offset,
                    behavior: 'smooth'
                });
                history.pushState(null, null, targetId);
            }
        });
    });

    // Check on initial page load if hash exists
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                const offset = navHeight();
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.scrollY - offset,
                    behavior: 'smooth'
                });
            }
        }, 300);
    }

    // ---------- 5. ACTIVE NAV LINK HIGHLIGHT ON SCROLL ----------
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    function highlightActiveLink() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - navHeight() - 20;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        // Edge case: scrolled to absolute bottom
        const isAtBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 5;
        if (isAtBottom && sections.length > 0) {
            current = sections[sections.length - 1].getAttribute('id');
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightActiveLink);
    highlightActiveLink();

    // ---------- 6. TYPING TEXT ROTATOR ----------
    const typingSpan = document.querySelector('.typing-text');
    if (typingSpan) {
        const roles = [
            "Web Developer",
            "UI/UX Designer",
            "App Developer",
            "Data Analyst",
            "Blogger"
        ];
        let index = 0;
        
        // Simple rotating behavior mimicking typed lines
        setInterval(() => {
            index = (index + 1) % roles.length;
            typingSpan.style.opacity = 0;
            setTimeout(() => {
                typingSpan.textContent = roles[index];
                typingSpan.style.opacity = 1;
            }, 300);
        }, 2800);
    }

    // ---------- 7. ANIMATED STATS COUNTERS ----------
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length) {
        const animateNumber = (element) => {
            const raw = element.innerText.trim();
            const target = parseInt(raw, 10);
            if (isNaN(target)) return; // "BEST" or other texts left as is
            const suffix = raw.replace(/^\d+/, ''); // Extract suffix e.g. "%", "hr", "+"
            let current = 0;
            const duration = 1200; // milliseconds
            const startTime = performance.now();
            
            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out quad function
                const easeProgress = progress * (2 - progress);
                current = Math.floor(easeProgress * target);
                
                element.innerText = current + suffix;
                
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    element.innerText = target + suffix;
                }
            };
            requestAnimationFrame(updateCounter);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateNumber(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => observer.observe(stat));
    }

    // ---------- 8. DYNAMIC GOOGLE FORM PRE‑FILL FOR PRICING BUTTONS ----------
    const PLAN_ENTRY_ID = '546913836';
    const FORM_BASE_URL = 'https://docs.google.com/forms/d/1XxNe5_WG-wAanO6U07uIXiYTBlBRsB-J5b52zIYjQcg/viewform';
    
    const getStartedButtons = document.querySelectorAll('.pricing-card .btn');
    getStartedButtons.forEach(button => {
        const href = button.getAttribute('href');
        if (href && href.includes('docs.google.com/forms')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const planCard = this.closest('.pricing-card');
                let plan = '';
                if (planCard) {
                    const planNameElement = planCard.querySelector('.plan-badge');
                    if (planNameElement) {
                        plan = planNameElement.textContent.trim().replace('Popular', '').trim();
                    }
                }
                if (!plan) plan = 'Not sure';
                const prefilledUrl = `${FORM_BASE_URL}?usp=pp_url&entry.${PLAN_ENTRY_ID}=${encodeURIComponent(plan)}`;
                window.open(prefilledUrl, '_blank');
            });
        }
    });

    // ---------- 8.1. COOKIE CONSENT BANNER ----------
    if (!localStorage.getItem('cookieConsent')) {
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.innerHTML = `
            <p>We use cookies to analyze website traffic and optimize your agency experience. By continuing to browse, you agree to our <a href="privacy.html">Privacy Policy</a>.</p>
            <div class="cookie-banner-actions">
                <button class="cookie-banner-btn accept">Accept</button>
            </div>
        `;
        document.body.appendChild(banner);
        
        // Trigger animation
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);

        const acceptBtn = banner.querySelector('.accept');
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            banner.classList.remove('show');
            banner.classList.add('hide');
            setTimeout(() => {
                banner.remove();
            }, 400);
        });
    }

    // ---------- 9. FIX FOR MOBILE VH UNITS ----------
    const setVH = () => {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    window.addEventListener('resize', setVH);
    setVH();

});