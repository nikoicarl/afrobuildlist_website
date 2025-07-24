document.addEventListener('DOMContentLoaded', () => {
    const iconMap = {
        'construction': 'bi-hammer',
        'interior': 'bi-house',
        'electrical': 'bi-lightning-charge',
        'plumbing': 'bi-tools',
        'landscaping': 'bi-tree',
        'masonry': 'bi-bricks',
        'concrete': 'bi-truck-front',
        'road': 'bi-cone-striped',
        'drainage': 'bi-droplet',
        'foundation': 'bi-layers-half',
        'structural': 'bi-diagram-3',
        'brick': 'bi-bricks',
        'block': 'bi-bricks',
        'plaster': 'bi-paint-bucket',
        'render': 'bi-paint-bucket',
        'roof': 'bi-house-door',
        'tiling': 'bi-grid-3x3-gap',
        'paint': 'bi-palette',
        'carpent': 'bi-hammer',
        'ceiling': 'bi-arrows-collapse-vertical',
        'screed': 'bi-grip-horizontal',
        'weld': 'bi-nut',
        'metal': 'bi-nut',
        'glass': 'bi-windows',
        'aluminum': 'bi-award',
        'electricals': 'bi-plug',
        'solar': 'bi-sun',
        'ac': 'bi-wind',
        'borehole': 'bi-droplet-half',
        'repair': 'bi-tools',
        'handyman': 'bi-person-lines-fill',
        'furniture': 'bi-basket',
        'door': 'bi-door-closed',
        'lock': 'bi-lock',
        'generator': 'bi-plug',
        'appliance': 'bi-cpu',
        'tile': 'bi-grid-3x3-gap',
        'leak': 'bi-water',
        'compound': 'bi-grid-1x2',
        'fence': 'bi-border-style',
        'gate': 'bi-aspect-ratio',
        'quantity': 'bi-clipboard2-data',
        'other': 'bi-three-dots'
    };

    const nav = document.getElementById('categories-nav');

    if (!nav) {
        console.error('Missing #categories-nav element');
        return;
    }

    function findIconClass(categoryName) {
        const name = categoryName.toLowerCase().trim();
        if (iconMap[name]) return iconMap[name];

        for (const keyword in iconMap) {
            if (name.includes(keyword)) return iconMap[keyword];
        }
        return 'bi-question-circle';
    }

    function renderCategories(categories) {
    if (!categories || categories.length === 0) {
        nav.innerHTML = `<div class="text-muted">No categories available at the moment.</div>`;
        return;
    }

    nav.innerHTML = '';

    categories.slice(0, 9).forEach(category => {
        if (!category.name) return;

        const iconClass = findIconClass(category.name);

        const link = document.createElement('a');
        link.href = '/service';
        link.className = 'text-decoration-none text-dark'; 

        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <div class="icon mb-2 p-1" style="width: 50px; height: 50px; margin: 0 auto; font-size: 2rem; color: var(--primary-color);">
                <i class="bi ${iconClass}"></i>
            </div>
            <span class="category-label d-block" title="${category.name}" style="
                font-size: 0.9rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 160px;
                display: inline-block;">
                ${category.name}
            </span>
        `;

        link.appendChild(item);
        nav.appendChild(link);
    });

    startHorizontalAutoScroll(nav);
}


    function loadCachedCategories() {
        const cached = sessionStorage.getItem('cachedCategories');
        if (cached) {
            try {
                const categories = JSON.parse(cached);
                if (categories && categories.length > 0) {
                    renderCategories(categories);
                    return true;
                }
            } catch (e) {
                console.error('Error parsing cached categories:', e);
                sessionStorage.removeItem('cachedCategories');
            }
        }
        return false;
    }

    function fetchCategories() {
        fetch(`${API_BASE}/category/`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(result => {
                const categories = result.data || result;
                if (categories && categories.length > 0) {
                    sessionStorage.setItem('cachedCategories', JSON.stringify(categories));
                    renderCategories(categories);
                } else {
                    nav.innerHTML = `<div class="text-muted">No categories available at the moment.</div>`;
                }
            })
            .catch(error => {
                console.error('Error fetching categories:', error);
                if (!loadCachedCategories()) {
                    nav.innerHTML = `<div class="text-danger">Failed to load categories.</div>`;
                }
            });
    }

    function startHorizontalAutoScroll(container) {
        let scrollAmount = 0;
        const scrollStep = 120;
        const interval = 2500;
        let isHovered = false;
        let autoScrollInterval = null;

        function scrollNext() {
            if (isHovered) return;

            if (scrollAmount + container.clientWidth >= container.scrollWidth) {
                scrollAmount = 0;
            } else {
                scrollAmount += scrollStep;
            }

            container.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }

        // Start the interval loop
        autoScrollInterval = setInterval(scrollNext, interval);

        // Pause on hover
        container.addEventListener('mouseenter', () => {
            isHovered = true;
        });

        container.addEventListener('mouseleave', () => {
            isHovered = false;
        });
    }


    if (!loadCachedCategories()) {
        fetchCategories();
    }
});
