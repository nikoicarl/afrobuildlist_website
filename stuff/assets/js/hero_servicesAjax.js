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

            // If not in iconMap, parse documents
            if (!icon && service.documents) {
                const files = service.documents.split(',').map(f => f.trim());
                const file = files.find(f => f.toLowerCase().match(/\.(svg|png|jpg|jpeg|webp)$/));
                if (file) {
                    icon = `assets/img/${file}`;
                }
            }

            if (!icon) {
                icon = 'assets/img/default-icon.svg';
            }

            const item = document.createElement('div');
            item.className = 'service-item';

            item.innerHTML = `
                <div class="icon">
                    <img src="${icon}" alt="${service.name} icon">
                </div>
                <span class="service-label">${service.name}</span>
            `;

            nav.appendChild(item);
        });
    }

    // Try to get from localStorage
    const cached = localStorage.getItem('cachedServices');
    if (cached) {
        try {
            const services = JSON.parse(cached);
            renderServices(services);
        } catch (e) {
            console.error('Error parsing cached services:', e);
            localStorage.removeItem('cachedServices');
        }
    } else {
        // Fetch from API and cache it
        fetch('http://localhost:3000/services')
            .then(response => response.json())
            .then(result => {
                const services = result.data;
                localStorage.setItem('cachedServices', JSON.stringify(services));
                renderServices(services);
            })
            .catch(error => {
                console.error('Error fetching services:', error);
                nav.innerHTML = `<div class="text-danger">Failed to load services.</div>`;
            });
    }
});