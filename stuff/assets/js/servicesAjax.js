document.addEventListener("DOMContentLoaded", function () {
    const servicesContainer = document.getElementById("servicesContainer");
    const cacheKey = "cachedServices";

    // Helper to create a card DOM element
    function createCardElement(service) {
        let docsArray = [];
        if (service.documents && service.documents.trim()) {
            docsArray = service.documents
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
        }
        const imageUrl = docsArray.length
            ? `/images/services/${docsArray[0]}`
            : 'assets/img/default-service-image.jpg';

        // Create card container
        const card = document.createElement('div');
        card.className = "afrobuild-product-card h-100";

        card.innerHTML = `
            <div class="afrobuild-product-card-image">
                <img src="${imageUrl}" alt="${service?.name ? service.name.replace(/"/g, '&quot;') : 'Service image'}" />
            </div>
            <div class="afrobuild-product-card-body">
                <h4 class="afrobuild-product-card-title">${service?.name || 'Service Name'}</h4>
                <p class="afrobuild-product-card-description">${service?.description || 'No description provided.'}</p>
                <div class="afrobuild-product-card-footer">
                    <div class="afrobuild-product-card-price">
                        <span class="afrobuild-product-price-label">From</span>
                        <span class="afrobuild-product-price-amount">GH₵${typeof service?.price === 'number' ? service.price.toFixed(2) : '0.00'}</span>
                    </div>
                    <div class="afrobuild-product-card-actions">
                        <input 
                            type="number" 
                            class="quantity-input" 
                            value="1" 
                            min="1"
                            style="width:60px;"
                        >
                        <button 
                            class="afrobuild-btn afrobuild-btn-success afrobuild-btn-sm afrobuild-px-3"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Attach event listener for "Add to Cart"
        card.querySelector('button').addEventListener('click', function () {
            const qty = parseInt(card.querySelector('.quantity-input').value, 10) || 1;
            addToCart(service.id, qty);
        });

        return card;
    }

    // Render all services in a simple equal grid
    function renderServices(services) {
        servicesContainer.innerHTML = "";
        if (!services || services.length === 0) {
            servicesContainer.innerHTML = `<div class="col-12 text-center"><p>No services available.</p></div>`;
            return;
        }

        const row = document.createElement('div');
        row.className = "row";

        services.forEach(service => {
            const col = document.createElement('div');
            // 3 per row on desktop, 2 on tablet, 1 on mobile
            col.className = "col-lg-3 col-md-6 col-12 mb-4 d-flex";
            col.appendChild(createCardElement(service));
            row.appendChild(col);
        });

        servicesContainer.appendChild(row);
    }

    // Fetch and cache services
    function fetchAndCacheServices() {
        fetch(`${API_BASE}/services`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                }
                renderServices(data);
            })
            .catch(error => {
                console.error('Error fetching services:', error);
                servicesContainer.innerHTML = `<div class="col-12 text-center"><p>Failed to load services.</p></div>`;
            });
    }

    // Add to cart stub (replace with your logic)
    function addToCart(serviceId, quantity) {
        alert(`Added service ID ${serviceId} (qty: ${quantity}) to cart!`);
        // Your cart logic here
    }

    // Main logic
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const services = JSON.parse(cached);
            renderServices(services);
        } catch (e) {
            localStorage.removeItem(cacheKey);
            fetchAndCacheServices();
        }
    } else {
        fetchAndCacheServices();
    }
});
