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

    fetch('http://localhost:3000/services')
        .then(response => response.json())
        .then(result => {
            const services = result.data;
            const nav = document.getElementById('services-nav');
            nav.innerHTML = '';

            services.forEach(service => {
                if (!service.name) return;

                let icon = iconMap[service.name];

                // If not in iconMap, parse documents for the first SVG or image
                if (!icon && service.documents) {
                    const files = service.documents.split(',').map(f => f.trim());
                    const svgFile = files.find(f => f.toLowerCase().endsWith('.svg') || f.toLowerCase().match(/\.(png|jpg|jpeg|webp)$/));

                    if (svgFile) {
                        icon = `assets/img/${svgFile}`;
                    }
                }

                // Fallback icon
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
        })
        .catch(error => console.error('Error fetching services:', error));
});