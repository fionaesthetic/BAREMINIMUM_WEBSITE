// BARE MINIMUM Static Website Core Script

// 1. Vending Machine Data Set
const dispenserLocations = [
    {
        id: "vm-chula-arts",
        name: "จุฬาลงกรณ์มหาวิทยาลัย",
        locationType: "มหาวิทยาลัย",
        address: "อาคารมหาจักรีสิรินธร คณะอักษรศาสตร์",
        description: "ตู้จ่ายตั้งอยู่บริเวณทางเข้าห้องน้ำหญิง ชั้น 1 ของอาคารมหาจักรีสิรินธร",
        lat: 13.739247,
        lon: 100.529851,
        inventory: 45, // Available
        statusText: "มีสินค้าพร้อมบริการ"
    },
    {
        id: "vm-samyan-mitrtown",
        name: "สามย่านมิตรทาวน์",
        locationType: "ห้างสรรพสินค้า / ออฟฟิศ",
        address: "ชั้น 3 โซนทางเดินห้องน้ำสาธารณะ",
        description: "ตู้จ่ายตั้งอยู่บริเวณห้องน้ำสาธารณะ ชั้น 3 ติดกับบันไดเลื่อนหลักฝั่งทิศใต้",
        lat: 13.733560,
        lon: 100.528405,
        inventory: 12, // Low stock
        statusText: "สินค้าใกล้หมด"
    },
    {
        id: "vm-tu-law",
        name: "มหาวิทยาลัยธรรมศาสตร์",
        locationType: "มหาวิทยาลัย",
        address: "คณะนิติศาสตร์ (ท่าพระจันทร์) ชั้น 2",
        description: "ตู้จ่ายอยู่บริเวณห้องน้ำหญิงชั้น 2 ใกล้กับห้องธุรการคณะนิติศาสตร์",
        lat: 13.757849,
        lon: 100.490802,
        inventory: 0, // Out of stock
        statusText: "สินค้าหมดชั่วคราว"
    },
    {
        id: "vm-chula-hospital",
        name: "โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย",
        locationType: "โรงพยาบาล",
        address: "อาคารภูมิสิริมังคลานุสรณ์ ชั้น 1",
        description: "ตู้จ่ายติดตั้งอยู่ข้างตู้เครื่องดื่มอัตโนมัติ ใกล้ห้องน้ำหญิงโถงต้อนรับชั้น 1",
        lat: 13.731478,
        lon: 100.536924,
        inventory: 38, // Available
        statusText: "มีสินค้าพร้อมบริการ"
    },
    {
        id: "vm-siam-discovery",
        name: "สยามดิสคัฟเวอรี",
        locationType: "ห้างสรรพสินค้า",
        address: "ชั้น 2 โถงห้องน้ำสาธารณะ",
        description: "ตู้จ่ายอยู่ในพื้นที่พักคอยหน้าห้องน้ำหญิง ชั้น 2 ใกล้ร้านค้าหลัก",
        lat: 13.746532,
        lon: 100.531742,
        inventory: 52, // Available
        statusText: "มีสินค้าพร้อมบริการ"
    }
];

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
                // Define pin icon color based on inventory status
                let pinIconUrl = 'https://map.longdo.com/mmmap/images/pin_mark.png'; // Fallback default
                if (location.inventory === 0) {
                    pinIconUrl = 'https://api.longdo.com/map/images/pin_red.png'; // Red for empty
                } else if (location.inventory <= 20) {
                    pinIconUrl = 'https://api.longdo.com/map/images/pin_orange.png'; // Orange for low stock
                } else {
                    pinIconUrl = 'https://api.longdo.com/map/images/pin_green.png'; // Green for good stock
                }

                const marker = new longdo.Marker({ lon: location.lon, lat: location.lat }, {
                    title: location.name,
                    detail: `${location.address}<br><strong>สถานะ:</strong> ${location.statusText}`,
                    icon: {
                        url: pinIconUrl,
                        offset: { x: 0, y: -20 }
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
    let activeDispensers = 0;

    dispenserLocations.forEach(loc => {
        let statusClass = 'status-available';
        if (loc.inventory === 0) {
            statusClass = 'status-empty';
        } else if (loc.inventory <= 20) {
            statusClass = 'status-low';
        } else {
            activeDispensers++;
        }

        const itemHTML = `
            <div class="location-item" data-id="${loc.id}" onclick="focusLocation('${loc.id}')">
                <div class="item-header">
                    <span class="item-title">${loc.name}</span>
                    <span class="item-status ${statusClass}">${loc.statusText}</span>
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
window.focusLocation = function(id) {
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
                    window.location.href = 'https://liff.line.me/2010487787-1JI9RAL6';
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
document.addEventListener('DOMContentLoaded', () => {
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
