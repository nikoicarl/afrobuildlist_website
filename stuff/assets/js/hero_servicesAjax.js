document.addEventListener('DOMContentLoaded', () => {
    const iconMap = {
        'Carpentry': 'assets/img/Table Saw - iconSvg.co.svg',
        'Plumbing': 'assets/img/Plumbing Supplies - iconSvg.co.svg',
        'Electrician': 'assets/img/Electrician License - iconSvg.co.svg',
        'Painting': 'assets/img/Wall Painting - iconSvg.co.svg',
        'Landscaping': 'assets/img/Landscaping - iconSvg.co.svg',
        'Building materials': 'assets/img/Building A Wall - iconSvg.co.svg',
        'Roofing': 'assets/img/Roofing Tiles - iconSvg.co.svg'
    };

    const nav = document.getElementById('services-nav');

    function renderServices(services) {
        nav.innerHTML = '';

        if (!services || services.length === 0) {
            nav.innerHTML = `<div class="text-muted">No services available at the moment.</div>`;
            return;
        }

        services.forEach(service => {
            if (!service.name) return;

            let icon = iconMap[service.name];

            if (!icon && service.documents) {
                const files = service.documents.split(',').map(f => f.trim());
                const file = files.find(f => f.toLowerCase().match(/\.(svg|png|jpg|jpeg|webp)$/));
                if (file) {
                    icon = `assets/img/${file}`;
                }
            }

            if (!icon) {
                icon = 'assets/img/default-service-image.jpg';
            }

            const item = document.createElement('div');
            item.className = 'service-item text-center mx-2 mb-3';

            item.innerHTML = `
                <div class="icon mb-2" style="width: 50px; height: 50px; margin: 0 auto;">
                    <img src="${icon}" alt="${service.name} icon" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <span class="service-label d-block" style="font-size: 0.9rem;">${service.name}</span>
            `;

            nav.appendChild(item);
        });
    }

    function loadCachedServices() {
        const cached = sessionStorage.getItem('cachedServices');
        if (cached) {
            try {
                const services = JSON.parse(cached);
                if (services && services.length > 0) {
                    renderServices(services);
                    return true;
                }
            } catch (e) {
                console.error('Error parsing cached services:', e);
                sessionStorage.removeItem('cachedServices');
            }
        }
        return false;
    }

    function fetchServices() {
        fetch(`${API_BASE}/services/`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(result => {
                const services = result.data || result;
                if (services && services.length > 0) {
                    sessionStorage.setItem('cachedServices', JSON.stringify(services));
                    renderServices(services);
                } else {
                    nav.innerHTML = `<div class="text-muted">No services available at the moment.</div>`;
                }
            })
            .catch(error => {
                console.error('Error fetching services:', error);
                if (!loadCachedServices()) {
                    nav.innerHTML = `<div class="text-danger">Failed to load services.</div>`;
                }
            });
    }

    if (!loadCachedServices()) {
        fetchServices();
    }
});
