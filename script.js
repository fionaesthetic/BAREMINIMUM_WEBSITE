// BARE MINIMUM Static Website Core Script

// API URL selection based on current hostname
const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : 'https://bareminimum-production.up.railway.app';

// 1. Vending Machine Data Set (loaded dynamically from database)
let dispenserLocations = [];

// Async function to fetch locations from backend API
async function loadDispenserLocations() {
    try {
        const response = await fetch(`${apiUrl}/api/machines`);
        if (!response.ok) throw new Error("Failed to fetch from backend");
        const data = await response.json();
        
        if (Array.isArray(data)) {
            dispenserLocations = data.map(m => ({
                id: m.id,
                name: m.name,
                locationType: m.location_type,
                address: m.address,
                description: m.description || "ตู้จ่ายผ้าอนามัย BARE MINIMUM พร้อมให้บริการรับฟรีสำหรับสมาชิก",
                lat: m.lat,
                lon: m.lon
            }));
            console.log("Loaded locations from backoffice API:", dispenserLocations);
        }
    } catch (err) {
        console.error("Backend API not reachable. Unable to load dispenser locations.", err);
    }
}

let map;
let mapMarkers = [];

// 2. Initialize Longdo Map
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    try {
        // Create the map object centered on central Bangkok
        map = new longdo.Map({
            placeholder: mapContainer,
            location: { lon: 100.53, lat: 13.74 },
            zoom: 13
        });

        // Add UI constraints safely
        try {
            if (map && map.Ui) {
                if (map.Ui.Zoombar) map.Ui.Zoombar.visible(true);
                if (map.Ui.Geolocation) map.Ui.Geolocation.visible(false);
                if (map.Ui.DPad) map.Ui.DPad.visible(false);
            }
        } catch (uiError) {
            console.warn("Failed to set map UI settings:", uiError);
        }

        // Wait until map is ready before adding markers
        map.Event.bind('ready', function() {
            // Plot all dispenser markers
            dispenserLocations.forEach(location => {
                try {
                    console.log("Plotting marker:", location.name, "at lat:", location.lat, "lon:", location.lon);
                    if (location.lat === null || location.lon === null || location.lat === undefined || location.lon === undefined) {
                        console.warn("Skipping marker due to invalid coordinates:", location);
                        return;
                    }
                    const marker = new longdo.Marker({ lon: location.lon, lat: location.lat }, {
                        title: location.name,
                        detail: `${location.address}<br>${location.description}`,
                        icon: {
                            html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="48"><path fill="#ef4444" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/></svg>',
                            offset: { x: 18, y: 48 }
                        }
                    });

                    if (map && map.Overlays) {
                        map.Overlays.add(marker);
                        mapMarkers.push({ id: location.id, markerObj: marker, data: location });
                    }
                } catch (markerError) {
                    console.error("Failed to add map marker:", markerError, location);
                }
            });

            // Adjust bounds/zoom to fit the dispensers
            if (dispenserLocations.length > 0) {
                if (dispenserLocations.length === 1) {
                    map.location({ lat: dispenserLocations[0].lat, lon: dispenserLocations[0].lon }, true);
                    map.zoom(14, true);
                } else {
                    const lats = dispenserLocations.map(l => l.lat).filter(l => l !== null);
                    const lons = dispenserLocations.map(l => l.lon).filter(l => l !== null);
                    if (lats.length > 0 && lons.length > 0) {
                        const minLat = Math.min(...lats);
                        const maxLat = Math.max(...lats);
                        const minLon = Math.min(...lons);
                        const maxLon = Math.max(...lons);
                        map.bound({ minLat, minLon, maxLat, maxLon });
                    }
                }
            }
        });
    } catch (mapError) {
        console.error("Failed to initialize Longdo Map:", mapError);
        // Show fallback text inside map container if map fails to initialize
        mapContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 2rem; text-align: center; color: #a6a4a0; background: rgba(255, 255, 255, 0.02);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #e5a89e; margin-bottom: 1rem;"></i>
                <p style="margin-bottom: 0.5rem; color: #ffffff; font-weight: 600;">ไม่สามารถโหลดแผนที่แบบโต้ตอบได้ในขณะนี้</p>
                <p style="font-size: 0.85rem; max-width: 320px; line-height: 1.5;">พิกัดและข้อมูลของตู้จ่ายผ้าอนามัยสามารถตรวจสอบได้จากรายการด้านข้าง</p>
            </div>
        `;
    }
}

// 3. Render Vending Locations List Panel
function renderLocationsList() {
    const listContainer = document.getElementById('location-items');
    const activeCountEl = document.getElementById('active-count');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    dispenserLocations.forEach(loc => {
        const itemHTML = `
            <div class="location-item" data-id="${loc.id}" onclick="focusLocation('${loc.id}')">
                <div class="item-header" style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <span class="item-title">${loc.name}</span>
                    ${loc.locationType ? `<span class="location-badge" style="font-size: 0.7rem; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 4px; padding: 2px 6px; font-weight: 600; text-transform: uppercase;">${loc.locationType}</span>` : ''}
                </div>
                <div class="item-description">${loc.address}</div>
                <div style="font-size: 0.78rem; color: #a6a4a0; margin-top: 0.35rem;">
                    <i class="fas fa-info-circle"></i> ${loc.description}
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', itemHTML);
    });

    if (activeCountEl) {
        activeCountEl.textContent = dispenserLocations.length;
    }
}

// 4. Focus Map & Highlight Selected Location List Item
window.focusLocation = function (id) {
    const matched = mapMarkers.find(m => String(m.id) === String(id));

    // Update active visual state in list item panel (run regardless of map status)
    document.querySelectorAll('.location-item').forEach(item => {
        item.classList.remove('active');
        if (String(item.getAttribute('data-id')) === String(id)) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    if (!matched || !map) return;

    // Center and activate marker on the map safely
    try {
        if (typeof map.location === 'function') {
            map.location({ lon: matched.data.lon, lat: matched.data.lat }, true);
        }
        if (typeof map.zoom === 'function') {
            map.zoom(16, true);
        }
        if (typeof map.ActiveMarker === 'function') {
            map.ActiveMarker(matched.markerObj);
        }
    } catch (err) {
        console.warn("Map focus interaction failed:", err);
    }
};

// 5. Scroll Reveal Effect
function initScrollReveal() {
    const revealElements = document.querySelectorAll('[data-reveal]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Stop observing once animated in
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => {
        observer.observe(el);
    });
}

// 6. Modal Operations
function setupModals() {
    const modals = {
        member: document.getElementById('modal-member'),
        host: document.getElementById('modal-host'),
        partner: document.getElementById('modal-partner')
    };

    const triggers = {
        member: document.querySelectorAll('.btn-member-trigger'),
        host: document.querySelectorAll('#btn-host-trigger, #btn-host-trigger-footer'),
        partner: document.querySelectorAll('#btn-partner-trigger, #btn-partner-trigger-footer')
    };

    const closeButtons = document.querySelectorAll('.modal-close');
    const toast = document.getElementById('toast');

    // Open trigger events
    Object.keys(triggers).forEach(key => {
        triggers[key].forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();

                // If Become Member is clicked on Mobile device, redirect to LINE LIFF link immediately
                if (key === 'member' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    window.location.href = 'https://lin.ee/QVbHF6t';
                    return;
                }

                // Otherwise open modal
                if (modals[key]) {
                    modals[key].classList.add('active');
                    document.body.style.overflow = 'hidden'; // Disable page scrolling
                }
            });
        });
    });

    // Close on X button click
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Close on clicking modal backdrop
    Object.values(modals).forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });

    function closeAllModals() {
        Object.values(modals).forEach(modal => {
            if (!modal) return;
            modal.classList.remove('active');
        });
        document.body.style.overflow = ''; // Restore page scrolling
    }

    // Form Submissions Mock Handler
    const forms = {
        host: document.getElementById('host-form'),
        partner: document.getElementById('partner-form')
    };

    Object.keys(forms).forEach(key => {
        if (!forms[key]) return;
        forms[key].addEventListener('submit', (e) => {
            e.preventDefault();

            // Trigger toast alert
            if (toast) {
                toast.classList.add('active');
                setTimeout(() => {
                    toast.classList.remove('active');
                }, 4000);
            }

            // Clean up and close modal
            closeAllModals();
            forms[key].reset();
        });
    });
}

// 7. General UI / Scrolling Effects
function initGeneralUI() {
    const header = document.querySelector('.header');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    // Sticky nav layout modification on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Toggle Mobile Navigation Menu Drawer
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            menuToggle.classList.toggle('active');

            // Hamburger animation
            const bars = menuToggle.querySelectorAll('.bar');
            if (mobileNav.classList.contains('active')) {
                bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'rotate(-45deg) translate(6px, -7px)';
            } else {
                bars[0].style.transform = '';
                bars[1].style.opacity = '1';
                bars[2].style.transform = '';
            }
        });

        // Close mobile drawer on link click
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                menuToggle.classList.remove('active');

                const bars = menuToggle.querySelectorAll('.bar');
                bars[0].style.transform = '';
                bars[1].style.opacity = '1';
                bars[2].style.transform = '';
                document.body.style.overflow = '';
            });
        });
    }

    // Smooth Scroll Offset calculation for headers
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            e.preventDefault();
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 8. Highlight Active Navigation Links
function highlightActiveNavLink() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);

    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Extract target page name from href
        const targetPage = href.split('#')[0];

        let isActive = false;
        if (pageName === 'locations.html' && targetPage === 'locations.html') {
            isActive = true;
        } else if (pageName === 'advertisers.html' && targetPage === 'advertisers.html') {
            isActive = true;
        } else if ((pageName === '' || pageName === 'index.html') && (targetPage === 'index.html' || href.startsWith('#about') || href === '#')) {
            isActive = true;
        }

        if (isActive) {
            link.classList.add('active-nav');
        } else {
            link.classList.remove('active-nav');
        }
    });
}

// 8. Stacked Cards Deck Scroll Animation
function initDeckAnimation() {
    const container = document.querySelector('.deck-scroll-container');
    const cards = document.querySelectorAll('.deck-card');
    if (!container || cards.length === 0) return;

    const totalCards = cards.length;
    const centerIndex = (totalCards - 1) / 2; // e.g., center is index 3
    const maxRot = 8; // maximum rotation at the edges (deg)
    const maxX = 35; // maximum translation at the edges (px)
    const maxY = 12; // maximum Y offset at the edges (px)

    const basePositions = Array.from({ length: totalCards }, (_, i) => {
        const offset = i - centerIndex;
        const ratio = offset / centerIndex;
        return {
            rotation: ratio * maxRot,
            x: ratio * maxX,
            y: Math.abs(ratio) * maxY,
            zIndex: totalCards - i
        };
    });

    cards.forEach((card, idx) => {
        card.style.setProperty('--card-z-index', basePositions[idx].zIndex);
    });

    function updateDeck() {
        if (window.innerWidth <= 768) {
            cards.forEach(card => {
                card.style.transform = '';
                card.style.opacity = '';
            });
            return;
        }

        const rect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const totalScrollableDist = rect.height - viewportHeight;
        
        let progress = -rect.top / totalScrollableDist;
        progress = Math.max(0, Math.min(1, progress));

        const transitionIntervals = totalCards - 1;
        const step = 1 / transitionIntervals;

        cards.forEach((card, idx) => {
            const base = basePositions[idx];
            
            if (idx === totalCards - 1) {
                // Last card: slowly moves to absolute center (0 rot, 0 x, 0 y) as it's active
                const prevStepStart = (idx - 1) * step;
                let activeProgress = 0;
                if (progress > prevStepStart) {
                    activeProgress = (progress - prevStepStart) / step;
                    activeProgress = Math.max(0, Math.min(1, activeProgress));
                }
                const rot = base.rotation * (1 - activeProgress);
                const x = base.x * (1 - activeProgress);
                const y = base.y * (1 - activeProgress);
                
                card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
                card.style.opacity = '1';
                return;
            }

            const startProgress = idx * step;
            const endProgress = (idx + 1) * step;

            if (progress <= startProgress) {
                card.style.transform = `translate3d(${base.x}px, ${base.y}px, 0) rotate(${base.rotation}deg)`;
                card.style.opacity = '1';
            } else if (progress >= endProgress) {
                const dir = idx % 2 === 0 ? -1 : 1;
                // Move out of view (using vw to ensure it exits page width fully)
                card.style.transform = `translate3d(${dir * 120}vw, -80px, 0) rotate(${dir * 25}deg)`;
                card.style.opacity = '0';
            } else {
                const t = (progress - startProgress) / step;
                const easeT = t * t * (3 - 2 * t); // smoothstep ease
                const dir = idx % 2 === 0 ? -1 : 1;
                
                // Exits with a smooth slide out
                const targetX = base.x + easeT * (dir * window.innerWidth * 0.6);
                const targetY = base.y - easeT * 80;
                const targetRot = base.rotation + easeT * (dir * 25 - base.rotation);
                const opacity = 1 - easeT;

                card.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) rotate(${targetRot}deg)`;
                card.style.opacity = opacity;
            }
        });
    }

    window.addEventListener('scroll', updateDeck);
    window.addEventListener('resize', updateDeck);
    updateDeck();
}

// 9. Document Ready Hook
document.addEventListener('DOMContentLoaded', async () => {
    // Load dispenser locations from backoffice API only on map pages
    const hasMapOrList = document.getElementById('map') || document.getElementById('location-items');
    if (hasMapOrList) {
        await loadDispenserLocations();
        renderLocationsList();
    }

    // Wait until Longdo Map library finishes load, then initialize map
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        if (typeof longdo !== 'undefined') {
            initMap();
        } else {
            // Fallback check
            const checkMapLib = setInterval(() => {
                if (typeof longdo !== 'undefined') {
                    initMap();
                    clearInterval(checkMapLib);
                }
            }, 300);
            // Clear check after 10 seconds to avoid infinite loop
            setTimeout(() => clearInterval(checkMapLib), 10000);
        }
    }

    initScrollReveal();
    setupModals();
    initGeneralUI();
    highlightActiveNavLink();
    initDeckAnimation();
});
