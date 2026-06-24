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

        // Plot all dispenser markers
        dispenserLocations.forEach(location => {
            try {
                const marker = new longdo.Marker({ lon: location.lon, lat: location.lat }, {
                    title: location.name,
                    detail: `${location.address}<br>${location.description}`,
                    icon: {
                        url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjQ4Ij48cGF0aCBmaWxsPSIjZWY0NDQ0IiBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMi0yLjUgMi41LTIuNSAyLjUgMS4xMiAyLjUgMi41LTEuMTIgMi41LTIuNSAyLjV6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSI5IiByPSIyLjUiIGZpbGw9IiNGRkZGRkYiLz48L3N2Zz4=',
                        size: { width: 28, height: 38 },
                        offset: { x: 14, y: 38 }
                    }
                });

                if (map && map.Overlays) {
                    map.Overlays.add(marker);
                    mapMarkers.push({ id: location.id, markerObj: marker, data: location });
                }
            } catch (markerError) {
                console.error("Failed to add map marker:", markerError);
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
    const matched = mapMarkers.find(m => m.id === id);

    // Update active visual state in list item panel (run regardless of map status)
    document.querySelectorAll('.location-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-id') === id) {
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
                modals[key].classList.add('active');
                document.body.style.overflow = 'hidden'; // Disable page scrolling
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

// 8. Document Ready Hook
document.addEventListener('DOMContentLoaded', async () => {
    // Load dispenser locations from backoffice API
    await loadDispenserLocations();

    // Wait until Longdo Map library finishes load, then initialize map
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
    }

    renderLocationsList();
    initScrollReveal();
    setupModals();
    initGeneralUI();
});
