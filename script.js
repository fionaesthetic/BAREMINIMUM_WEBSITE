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
                lon: m.lon,
                googleMapsUrl: m.google_maps_url || (m.lat && m.lon ? `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}` : "")
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
                    const gmapUrl = location.googleMapsUrl || (location.lat && location.lon ? `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}` : "");
                    const gmapPopupHtml = gmapUrl ? `
                        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(0,0,0,0.1);">
                            <a href="${gmapUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 5px; background: #e5a89e; color: #1a1a1a; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 0.78rem; font-weight: 600;">
                                <i class="fas fa-location-arrow"></i> นำทางผ่าน Google Maps
                            </a>
                        </div>
                    ` : '';

                    const marker = new longdo.Marker({ lon: location.lon, lat: location.lat }, {
                        title: location.name,
                        detail: `<div style="font-family: inherit; font-size: 0.85rem; line-height: 1.4;">${location.address}<br><span style="color: #666; font-size: 0.8rem;">${location.description}</span>${gmapPopupHtml}</div>`,
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

    if (dispenserLocations.length === 0) {
        listContainer.innerHTML = `
            <div class="no-locations-fallback" style="padding: 3rem 1.5rem; text-align: center; color: var(--color-text-muted); font-size: 1.05rem; font-weight: 500; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <i class="fas fa-map-marker-slash" style="font-size: 2.2rem; color: var(--color-accent-hover); opacity: 0.85;"></i>
                <span>แบร์ มินิมัม จะให้บริการเร็วๆนี้</span>
            </div>
        `;
    } else {
        dispenserLocations.forEach(loc => {
            const gmapUrl = loc.googleMapsUrl || (loc.lat && loc.lon ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}` : "");
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
                    ${gmapUrl ? `
                    <div class="item-actions" style="margin-top: 0.75rem;">
                        <a href="${gmapUrl}" target="_blank" rel="noopener noreferrer" class="btn-gmap-direct" onclick="event.stopPropagation()">
                            <i class="fas fa-map-marker-alt"></i> เปิดบน Google Maps <i class="fas fa-external-link-alt" style="font-size: 0.68rem; margin-left: 2px; opacity: 0.85;"></i>
                        </a>
                    </div>
                    ` : ''}
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', itemHTML);
        });
    }

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
        partner: document.getElementById('modal-partner'),
        partnerBrand: document.getElementById('modal-partner-brand')
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
                    window.location.href = 'https://lin.ee/9WE7ZkA';
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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Form Submissions to Backend API
    const hostForm = document.getElementById('host-form');
    if (hostForm) {
        hostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = hostForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerText : 'ส่งข้อมูลเสนอพื้นที่';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'กำลังส่งข้อมูล...';
            }

            const payload = {
                form_type: 'host_dispenser',
                name: document.getElementById('host-name')?.value?.trim() || '',
                email: document.getElementById('host-email')?.value?.trim() || '',
                phone: document.getElementById('host-phone')?.value?.trim() || '',
                location_details: document.getElementById('host-location-details')?.value?.trim() || ''
            };

            try {
                const res = await fetch(`${apiUrl}/api/website/inquiries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Failed to submit form');

                // Trigger toast alert
                if (toast) {
                    toast.classList.add('active');
                    setTimeout(() => {
                        toast.classList.remove('active');
                    }, 4500);
                }

                closeAllModals();
                hostForm.reset();
            } catch (err) {
                console.error('Submission error:', err);
                alert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }
            }
        });
    }

    const partnerForm = document.getElementById('partner-form');
    if (partnerForm) {
        partnerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = partnerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerText : 'ส่งคำขอข้อมูลพาร์ทเนอร์';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'กำลังส่งข้อมูล...';
            }

            const payload = {
                form_type: 'partner',
                name: document.getElementById('partner-company')?.value?.trim() || '',
                contact_person: document.getElementById('partner-contact')?.value?.trim() || '',
                phone: document.getElementById('partner-phone')?.value?.trim() || '',
                email: document.getElementById('partner-email')?.value?.trim() || '',
                message: document.getElementById('partner-msg')?.value?.trim() || ''
            };

            try {
                const res = await fetch(`${apiUrl}/api/website/inquiries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Failed to submit form');

                if (toast) {
                    toast.classList.add('active');
                    setTimeout(() => {
                        toast.classList.remove('active');
                    }, 4500);
                }

                closeAllModals();
                partnerForm.reset();
            } catch (err) {
                console.error('Submission error:', err);
                alert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }
            }
        });
    }
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

    // Toggle Card Flip on click
    const flipCard = document.getElementById('how-it-works-card');
    if (flipCard) {
        flipCard.addEventListener('click', () => {
            flipCard.classList.toggle('flipped');
        });
    }
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

        // Clean pageName and targetPage to match both extensioned and extensionless URLs
        const cleanPageName = pageName.replace('.html', '') || 'index';
        const cleanTargetPage = targetPage.replace('.html', '').replace('./', '') || 'index';

        let isActive = false;
        if (cleanPageName === cleanTargetPage) {
            isActive = true;
        } else if (cleanPageName === 'index' && (href.startsWith('#about') || href === '#')) {
            isActive = true;
        }

        if (isActive) {
            link.classList.add('active-nav');
        } else {
            link.classList.remove('active-nav');
        }
    });
}

// 9. Tab Scroll Animation for Become Our Partner section
function initTabScrollAnimation() {
    const tabItems = document.querySelectorAll('.scroll-tab-item');
    const contentCards = document.querySelectorAll('.scroll-content-card');
    const tabList = document.querySelector('.scroll-tabs-list');
    if (tabItems.length === 0 || contentCards.length === 0) return;

    function updateTabScroll() {
        const viewportHeight = window.innerHeight;
        const targetLine = viewportHeight * 0.45; // Focus line at 45% of viewport height
        let activeIdx = 0;
        let minDiff = Infinity;

        // On mobile, the target line is higher to account for sticky tab bar
        const isMobile = window.innerWidth <= 992;
        const activeTargetLine = isMobile ? viewportHeight * 0.55 : targetLine;

        contentCards.forEach((card, idx) => {
            const rect = card.getBoundingClientRect();
            // We measure distance of the card top to our target line
            const diff = Math.abs(rect.top - activeTargetLine);
            if (diff < minDiff) {
                minDiff = diff;
                activeIdx = idx;
            }
        });

        // Update active classes
        contentCards.forEach((card, idx) => {
            if (idx === activeIdx) {
                card.classList.add('active');
                card.classList.add('revealed');
            } else {
                card.classList.remove('active');
                card.classList.remove('revealed');
            }
        });

        tabItems.forEach((tab, idx) => {
            const progressBar = tab.querySelector('.progress-bar');
            
            if (idx === activeIdx) {
                tab.classList.add('active');
                
                // Scroll the mobile horizontal tab bar to keep active tab centered
                if (isMobile && tabList) {
                    const tabRect = tab.getBoundingClientRect();
                    const listRect = tabList.getBoundingClientRect();
                    const scrollLeftOffset = tab.offsetLeft - (listRect.width / 2) + (tabRect.width / 2);
                    tabList.scrollTo({
                        left: scrollLeftOffset,
                        behavior: 'smooth'
                    });
                }

                // Calculate progress within this card
                const activeCard = contentCards[activeIdx];
                const cardRect = activeCard.getBoundingClientRect();
                const startPoint = viewportHeight * 0.8;
                const endPoint = viewportHeight * 0.2;
                
                let progress = (startPoint - cardRect.top) / (startPoint - endPoint);
                progress = Math.max(0, Math.min(1, progress));
                
                if (progressBar) {
                    progressBar.style.width = `${progress * 100}%`;
                }
            } else {
                tab.classList.remove('active');
                if (progressBar) {
                    progressBar.style.width = idx < activeIdx ? '100%' : '0%';
                }
            }
        });
    }

    // Tab Clicking smooth scroll
    tabItems.forEach((tab, idx) => {
        tab.addEventListener('click', () => {
            const targetCard = contentCards[idx];
            if (!targetCard) return;

            const isMobile = window.innerWidth <= 992;
            const yOffset = isMobile ? -140 : -100; // Account for headers/sticky elements
            const rect = targetCard.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetY = rect.top + scrollTop + yOffset;

            window.scrollTo({
                top: targetY,
                behavior: 'smooth'
            });
        });
    });

    window.addEventListener('scroll', updateTabScroll);
    window.addEventListener('resize', updateTabScroll);
    updateTabScroll();
}

// 10. Impact Counter (Fetch Total Pads Dispensed from Back Office Dispensal Report & Running Digit-Up Animation)
async function initImpactCounter() {
    const counterEl = document.getElementById('impact-counter');
    if (!counterEl) return;

    let totalPads = 0;
    const baseUrls = [apiUrl];
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
        baseUrls.push('https://bareminimum-production.up.railway.app');
    }

    const candidateUrls = [];
    for (const base of baseUrls) {
        candidateUrls.push(`${base}/api/admin/reports/dispensals?summary=true`);
        candidateUrls.push(`${base}/api/website/stats`);
    }

    for (const url of candidateUrls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const count = typeof data.totalPads === 'number'
                    ? data.totalPads
                    : data.total_pads_dispensed;
                if (typeof count === 'number') {
                    totalPads = count;
                    break;
                }
            }
        } catch (err) {
            console.warn(`Unable to fetch impact stats from ${url}:`, err);
        }
    }

    renderRollingDigits(counterEl, Math.max(0, Math.floor(totalPads)));
}

function renderRollingDigits(container, targetNumber) {
    const formatted = targetNumber.toLocaleString('en-US');
    container.innerHTML = '';
    container.setAttribute('aria-label', `${formatted}+`);

    const ribbons = [];
    let digitIdx = 0;

    for (const ch of formatted) {
        if (ch === ',') {
            const sep = document.createElement('span');
            sep.className = 'impact-digit-separator';
            sep.textContent = ',';
            container.appendChild(sep);
            continue;
        }

        const targetDigit = parseInt(ch, 10) || 0;
        const loops = 1 + digitIdx; // Higher place values settle first, ones digit spins more
        const digitsSequence = [];

        for (let l = 0; l < loops; l++) {
            for (let d = 0; d <= 9; d++) {
                digitsSequence.push(d);
            }
        }
        for (let d = 0; d <= targetDigit; d++) {
            digitsSequence.push(d);
        }

        const box = document.createElement('span');
        box.className = 'impact-digit-box';

        const viewport = document.createElement('span');
        viewport.className = 'impact-digit-viewport';

        const ribbon = document.createElement('span');
        ribbon.className = 'impact-digit-ribbon';

        digitsSequence.forEach(num => {
            const digitSpan = document.createElement('span');
            digitSpan.className = 'impact-digit';
            digitSpan.textContent = String(num);
            ribbon.appendChild(digitSpan);
        });

        viewport.appendChild(ribbon);
        box.appendChild(viewport);
        container.appendChild(box);

        ribbons.push({
            el: ribbon,
            totalItems: digitsSequence.length,
            index: digitIdx
        });
        digitIdx++;
    }

    const plusSpan = document.createElement('span');
    plusSpan.className = 'impact-digit-plus';
    plusSpan.textContent = '+';
    container.appendChild(plusSpan);

    // Trigger upward digit roll animation on next paint frame
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            ribbons.forEach(({ el, totalItems, index }) => {
                const duration = 1.6 + index * 0.35;
                const translatePct = ((totalItems - 1) / totalItems) * 100;
                el.style.transition = `transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1)`;
                el.style.transform = `translateY(-${translatePct}%)`;
            });
        });
    });
}

// ========================================================
// 11. Bare Minimum's Partner Marketplace (Rotating Banners & Categorized Brands)
// ========================================================
const partnerMarketplaceState = {
    banners: [],
    categories: [],
    brands: [],
    activeCategory: 'all', // 'all' | category id string | 'uncategorized'
    currentBannerIndex: 0,
    bannerTimer: null
};

function resolvePartnerMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('/')) {
        return `${apiUrl}${url}`;
    }
    return url;
}

function getChannelMeta(type) {
    const key = (type || 'website').toLowerCase();
    const map = {
        website:   { icon: 'fas fa-globe',          defaultLabel: 'Website',        cls: 'type-website' },
        shopee:    { icon: 'fas fa-shopping-bag',   defaultLabel: 'Shopee',         cls: 'type-shopee' },
        lazada:    { icon: 'fas fa-shopping-cart',  defaultLabel: 'Lazada',         cls: 'type-lazada' },
        line:      { icon: 'fab fa-line',           defaultLabel: 'LINE Official',  cls: 'type-line' },
        instagram: { icon: 'fab fa-instagram',      defaultLabel: 'Instagram',      cls: 'type-instagram' },
        tiktok:    { icon: 'fab fa-tiktok',         defaultLabel: 'TikTok',         cls: 'type-tiktok' },
        facebook:  { icon: 'fab fa-facebook-f',     defaultLabel: 'Facebook',       cls: 'type-facebook' },
        other:     { icon: 'fas fa-store',          defaultLabel: 'ช่องทางจำหน่าย',  cls: 'type-other' }
    };
    return map[key] || map.other;
}

async function initPartnerMarketplace() {
    const section = document.getElementById('bm-partners');
    if (!section) return;

    try {
        const res = await fetch(`${apiUrl}/api/website/partners`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        partnerMarketplaceState.banners = Array.isArray(data.banners) ? data.banners : [];
        partnerMarketplaceState.categories = Array.isArray(data.categories) ? data.categories : [];
        partnerMarketplaceState.brands = Array.isArray(data.brands) ? data.brands : [];
    } catch (err) {
        console.warn('Unable to load partner marketplace data from API:', err);
        partnerMarketplaceState.banners = [];
        partnerMarketplaceState.categories = [];
        partnerMarketplaceState.brands = [];
    }

    const offerSection = document.getElementById('what-we-offer');

    // Hide the entire Our Partner section when no active brands are listed
    if (partnerMarketplaceState.brands.length === 0) {
        section.style.display = 'none';
        if (offerSection) offerSection.classList.add('standalone-section');
        return;
    }

    section.style.display = '';
    if (offerSection) offerSection.classList.remove('standalone-section');

    renderPartnerBanners();
    renderPartnerCategoryPills();
    renderPartnerBrands();
}

function renderPartnerBanners() {
    const wrapper = document.getElementById('partner-banner-wrapper');
    const carousel = document.getElementById('partner-banner-carousel');
    const prevBtn = document.getElementById('partner-banner-prev');
    const nextBtn = document.getElementById('partner-banner-next');
    const dotsEl = document.getElementById('partner-banner-dots');

    if (!wrapper || !carousel) return;

    if (partnerMarketplaceState.bannerTimer) {
        clearInterval(partnerMarketplaceState.bannerTimer);
        partnerMarketplaceState.bannerTimer = null;
    }

    const banners = partnerMarketplaceState.banners;
    if (!banners.length) {
        wrapper.classList.add('is-hidden');
        return;
    }

    wrapper.classList.remove('is-hidden');
    carousel.innerHTML = '';
    if (dotsEl) dotsEl.innerHTML = '';
    partnerMarketplaceState.currentBannerIndex = 0;

    banners.forEach((banner, idx) => {
        const hasLink = Boolean(banner.link_url && banner.link_url.trim());
        const slideEl = document.createElement(hasLink ? 'a' : 'div');
        slideEl.className = `partner-banner-slide${idx === 0 ? ' active' : ''}`;
        if (hasLink) {
            slideEl.href = banner.link_url;
            slideEl.target = '_blank';
            slideEl.rel = 'noopener noreferrer';
        }

        const img = document.createElement('img');
        img.src = resolvePartnerMediaUrl(banner.image_url);
        img.alt = banner.title || `Bare Minimum Partner Banner ${idx + 1}`;
        img.className = 'partner-banner-slide-img';
        img.loading = idx === 0 ? 'eager' : 'lazy';
        slideEl.appendChild(img);

        const hasText = Boolean((banner.title && banner.title.trim()) || (banner.subtitle && banner.subtitle.trim()));
        if (hasText) {
            const overlay = document.createElement('div');
            overlay.className = 'partner-banner-overlay';

            if (banner.title && banner.title.trim()) {
                const h3 = document.createElement('h3');
                h3.className = 'partner-banner-title';
                h3.textContent = banner.title;
                overlay.appendChild(h3);
            }
            if (banner.subtitle && banner.subtitle.trim()) {
                const p = document.createElement('p');
                p.className = 'partner-banner-subtitle';
                p.textContent = banner.subtitle;
                overlay.appendChild(p);
            }
            if (hasLink) {
                const cta = document.createElement('span');
                cta.className = 'partner-banner-cta-pill';
                cta.innerHTML = 'ดูรายละเอียด <i class="fas fa-arrow-right"></i>';
                overlay.appendChild(cta);
            }
            slideEl.appendChild(overlay);
        }

        carousel.appendChild(slideEl);

        if (dotsEl && banners.length > 1) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = `partner-banner-dot${idx === 0 ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Banner ${idx + 1}`);
            dot.addEventListener('click', () => {
                goToPartnerBanner(idx);
                restartPartnerBannerAutoplay();
            });
            dotsEl.appendChild(dot);
        }
    });

    if (prevBtn && nextBtn) {
        if (banners.length > 1) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            prevBtn.onclick = () => {
                goToPartnerBanner(partnerMarketplaceState.currentBannerIndex - 1);
                restartPartnerBannerAutoplay();
            };
            nextBtn.onclick = () => {
                goToPartnerBanner(partnerMarketplaceState.currentBannerIndex + 1);
                restartPartnerBannerAutoplay();
            };
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    }

    if (banners.length > 1) {
        // Pause rotation on hover
        wrapper.onmouseenter = () => {
            if (partnerMarketplaceState.bannerTimer) {
                clearInterval(partnerMarketplaceState.bannerTimer);
                partnerMarketplaceState.bannerTimer = null;
            }
        };
        wrapper.onmouseleave = () => {
            restartPartnerBannerAutoplay();
        };

        // Touch swipe support for mobile
        let touchStartX = 0;
        wrapper.ontouchstart = (e) => {
            if (e.touches && e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
            }
        };
        wrapper.ontouchend = (e) => {
            if (!e.changedTouches || e.changedTouches.length === 0) return;
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(deltaX) > 40) {
                if (deltaX < 0) {
                    goToPartnerBanner(partnerMarketplaceState.currentBannerIndex + 1);
                } else {
                    goToPartnerBanner(partnerMarketplaceState.currentBannerIndex - 1);
                }
                restartPartnerBannerAutoplay();
            }
        };

        restartPartnerBannerAutoplay();
    }
}

function goToPartnerBanner(targetIndex) {
    const banners = partnerMarketplaceState.banners;
    if (banners.length <= 1) return;

    const total = banners.length;
    const nextIdx = ((targetIndex % total) + total) % total;
    partnerMarketplaceState.currentBannerIndex = nextIdx;

    const slides = document.querySelectorAll('#partner-banner-carousel .partner-banner-slide');
    const dots = document.querySelectorAll('#partner-banner-dots .partner-banner-dot');

    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === nextIdx);
    });
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === nextIdx);
    });
}

function restartPartnerBannerAutoplay() {
    if (partnerMarketplaceState.bannerTimer) {
        clearInterval(partnerMarketplaceState.bannerTimer);
        partnerMarketplaceState.bannerTimer = null;
    }
    if (partnerMarketplaceState.banners.length <= 1) return;

    partnerMarketplaceState.bannerTimer = setInterval(() => {
        goToPartnerBanner(partnerMarketplaceState.currentBannerIndex + 1);
    }, 4500);
}

function getPartnerCategoryGroups() {
    const { categories, brands } = partnerMarketplaceState;
    const groups = [];

    // Include every active category created in Backoffice so tabs always reflect all categories
    categories.forEach(cat => {
        const catBrands = brands.filter(b => b.category_id === cat.id);
        groups.push({
            key: String(cat.id),
            name: cat.name,
            description: cat.description || '',
            brands: catBrands
        });
    });

    const knownCatIds = new Set(categories.map(c => c.id));
    const uncategorized = brands.filter(b => !b.category_id || !knownCatIds.has(b.category_id));
    if (uncategorized.length > 0) {
        groups.push({
            key: 'uncategorized',
            name: 'Other',
            description: '',
            brands: uncategorized
        });
    }

    return groups;
}

function renderPartnerCategoryPills() {
    const bar = document.getElementById('partner-category-bar');
    const pillsEl = document.getElementById('partner-category-pills');
    if (!bar || !pillsEl) return;

    const groups = getPartnerCategoryGroups();
    if (partnerMarketplaceState.brands.length === 0) {
        bar.style.display = 'none';
        return;
    }

    bar.style.display = 'block';
    pillsEl.innerHTML = '';

    const totalBrands = partnerMarketplaceState.brands.length;
    const tabItems = [
        { key: 'all', name: 'All Brands', count: totalBrands },
        ...groups.map(g => ({ key: g.key, name: g.name, count: g.brands.length }))
    ];

    tabItems.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `partner-category-pill${partnerMarketplaceState.activeCategory === item.key ? ' active' : ''}`;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', partnerMarketplaceState.activeCategory === item.key ? 'true' : 'false');

        const labelSpan = document.createElement('span');
        labelSpan.textContent = item.name;
        btn.appendChild(labelSpan);

        const countSpan = document.createElement('span');
        countSpan.className = 'partner-pill-count';
        countSpan.textContent = String(item.count);
        btn.appendChild(countSpan);

        btn.addEventListener('click', () => {
            partnerMarketplaceState.activeCategory = item.key;
            renderPartnerCategoryPills();
            renderPartnerBrands();
        });

        pillsEl.appendChild(btn);
    });
}

function renderPartnerBrands() {
    const container = document.getElementById('partner-brands-container');
    if (!container) return;

    const groups = getPartnerCategoryGroups();
    container.innerHTML = '';

    if (partnerMarketplaceState.brands.length === 0) {
        const section = document.getElementById('bm-partners');
        const offerSection = document.getElementById('what-we-offer');
        if (section) section.style.display = 'none';
        if (offerSection) offerSection.classList.add('standalone-section');
        return;
    }

    const activeKey = partnerMarketplaceState.activeCategory;
    const isAllTab = activeKey === 'all';
    const activeGroup = isAllTab ? null : groups.find(g => g.key === activeKey);
    const displayBrands = isAllTab
        ? partnerMarketplaceState.brands
        : (activeGroup ? activeGroup.brands : []);

    if (activeGroup && activeGroup.description) {
        const desc = document.createElement('p');
        desc.className = 'partner-tab-description';
        desc.textContent = activeGroup.description;
        container.appendChild(desc);
    }

    if (displayBrands.length === 0) {
        const emptyTab = document.createElement('div');
        emptyTab.className = 'partner-tab-empty';
        emptyTab.textContent = 'ยังไม่มีแบรนด์ในหมวดหมู่นี้';
        container.appendChild(emptyTab);
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'partner-brands-grid';

    displayBrands.forEach(brand => {
        const channels = Array.isArray(brand.channels)
            ? brand.channels.filter(ch => ch && ch.url && ch.url.trim())
            : [];
        const brandCategoryName = brand.category_name || (activeGroup ? activeGroup.name : '');

        let cardEl;
        if (channels.length === 1) {
            cardEl = document.createElement('a');
            cardEl.href = channels[0].url;
            cardEl.target = '_blank';
            cardEl.rel = 'noopener noreferrer';
            cardEl.className = 'partner-brand-card';
            cardEl.setAttribute('aria-label', `${brand.name} - ${channels[0].label || 'Website'}`);
        } else if (channels.length > 1) {
            cardEl = document.createElement('button');
            cardEl.type = 'button';
            cardEl.className = 'partner-brand-card';
            cardEl.setAttribute('aria-label', `${brand.name} - เลือกช่องทางการจำหน่าย (${channels.length} ช่องทาง)`);
            cardEl.addEventListener('click', () => openPartnerBrandModal(brand, brandCategoryName));
        } else {
            cardEl = document.createElement('div');
            cardEl.className = 'partner-brand-card is-static';
        }

        if (channels.length > 1) {
            const badge = document.createElement('span');
            badge.className = 'partner-brand-channel-badge';
            badge.innerHTML = `<i class="fas fa-store"></i> ${channels.length} ช่องทาง`;
            cardEl.appendChild(badge);
        }

        const logoBox = document.createElement('div');
        logoBox.className = 'partner-brand-logo-box';

        const logoImg = document.createElement('img');
        logoImg.src = resolvePartnerMediaUrl(brand.logo_url);
        logoImg.alt = brand.name;
        logoImg.className = 'partner-brand-logo-img';
        logoImg.loading = 'lazy';
        logoBox.appendChild(logoImg);
        cardEl.appendChild(logoBox);

        const footer = document.createElement('div');
        footer.className = 'partner-brand-footer';

        if (isAllTab && brandCategoryName) {
            const catTag = document.createElement('span');
            catTag.className = 'partner-brand-cat-label';
            catTag.textContent = brandCategoryName;
            footer.appendChild(catTag);
        }

        const nameSpan = document.createElement('div');
        nameSpan.className = 'partner-brand-name';
        nameSpan.textContent = brand.name;
        nameSpan.title = brand.name;
        footer.appendChild(nameSpan);

        if (brand.tagline && brand.tagline.trim()) {
            const tagEl = document.createElement('p');
            tagEl.className = 'partner-brand-tagline';
            tagEl.textContent = brand.tagline.trim();
            footer.appendChild(tagEl);
        }

        if (channels.length > 0) {
            const visitBtn = document.createElement('span');
            visitBtn.className = 'partner-visit-btn';
            visitBtn.innerHTML = channels.length === 1
                ? 'Visit Brand <i class="fas fa-arrow-up-right-from-square"></i>'
                : 'Visit Brand <i class="fas fa-chevron-right"></i>';
            footer.appendChild(visitBtn);
        }

        cardEl.appendChild(footer);
        grid.appendChild(cardEl);
    });

    container.appendChild(grid);
}

function openPartnerBrandModal(brand, categoryName) {
    const modal = document.getElementById('modal-partner-brand');
    const logoEl = document.getElementById('partner-brand-modal-logo');
    const catEl = document.getElementById('partner-brand-modal-cat');
    const nameEl = document.getElementById('partner-brand-modal-name');
    const taglineEl = document.getElementById('partner-brand-modal-tagline');
    const listEl = document.getElementById('partner-brand-channels-list');

    if (!modal || !listEl) return;

    if (logoEl) {
        logoEl.src = resolvePartnerMediaUrl(brand.logo_url);
        logoEl.alt = brand.name;
    }
    if (catEl) {
        const displayCat = brand.category_name || categoryName || '';
        if (displayCat) {
            catEl.textContent = displayCat;
            catEl.style.display = 'inline-block';
        } else {
            catEl.style.display = 'none';
        }
    }
    if (nameEl) {
        nameEl.textContent = brand.name;
    }
    if (taglineEl) {
        if (brand.tagline && brand.tagline.trim()) {
            taglineEl.textContent = brand.tagline;
            taglineEl.style.display = 'block';
        } else {
            taglineEl.style.display = 'none';
        }
    }

    listEl.innerHTML = '';
    const channels = Array.isArray(brand.channels) ? brand.channels : [];
    channels.forEach(ch => {
        if (!ch || !ch.url) return;
        const meta = getChannelMeta(ch.type);

        const a = document.createElement('a');
        a.href = ch.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'partner-channel-link';

        const left = document.createElement('div');
        left.className = 'partner-channel-left';

        const iconBox = document.createElement('span');
        iconBox.className = `partner-channel-icon ${meta.cls}`;
        iconBox.innerHTML = `<i class="${meta.icon}"></i>`;
        left.appendChild(iconBox);

        const label = document.createElement('span');
        label.className = 'partner-channel-label';
        label.textContent = (ch.label && ch.label.trim()) ? ch.label : meta.defaultLabel;
        left.appendChild(label);

        const arrow = document.createElement('span');
        arrow.className = 'partner-channel-arrow';
        arrow.innerHTML = '<i class="fas fa-external-link-alt"></i>';

        a.appendChild(left);
        a.appendChild(arrow);
        listEl.appendChild(a);
    });

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 12. Document Ready Hook
document.addEventListener('DOMContentLoaded', async () => {
    // Load impact counter stats on home page
    initImpactCounter();

    // Load Bare Minimum's Partner marketplace on advertisers page
    initPartnerMarketplace();

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
    initTabScrollAnimation();
});
