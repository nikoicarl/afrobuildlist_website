document.addEventListener('DOMContentLoaded', () => {
    const iconMap = {
        'construction': 'bi-hammer',
        'interior': 'bi-house',
        'electrical': 'bi-lightning-charge',
        'plumbing': 'bi-tools',
        'landscaping': 'bi-tree',
        'masonry': 'bi-bricks',
        'concrete': 'bi-truck-front',
        'road construction': 'bi bi-cone-striped',
        'road works': 'bi-sign-stop',
        'drainage': 'bi-droplet'
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
    return 'bi-question-circle'; // Bootstrap’s default "question" icon
}


    function renderCategories(categories) {
    nav.innerHTML = '';

    if (!categories || categories.length === 0) {
        nav.innerHTML = `<div class="text-muted">No categories available at the moment.</div>`;
        return;
    }

    categories.forEach(category => {
        if (!category.name) return;

        const iconClass = findIconClass(category.name);
        const item = document.createElement('div');
        item.className = 'category-item text-center';
        item.style.width = '100px';
        item.innerHTML = `
            <div class="icon mb-2 p-1" style="width: 50px; height: 50px; margin: 0 auto; font-size: 2.0rem;color: var(--primary-color);">
                <i class="bi ${iconClass}"></i>
            </div>
            <span class="category-label d-block" style="font-size: 0.9rem;">${category.name}</span>
        `;
        nav.appendChild(item);
    });
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

    if (!loadCachedCategories()) {
        fetchCategories();
    }
});
