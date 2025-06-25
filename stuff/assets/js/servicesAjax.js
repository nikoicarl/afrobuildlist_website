document.addEventListener("DOMContentLoaded", function () {
    const servicesContainer = document.getElementById("servicesContainer");
    const cacheKey = "cachedServices";

    function renderServices(services) {
        if (!services || services.length === 0) {
            servicesContainer.innerHTML = `<div class="col-12 text-center"><p>No services available.</p></div>`;
            return;
        }

        servicesContainer.innerHTML = "";

        // Left main card
        if (services[0]) {
            servicesContainer.innerHTML += createCardHTML(services[0], "col-md-6 col-12");
        }

        // Right column (2 small stacked + 1 wide)
        const rightWrapper = document.createElement("div");
        rightWrapper.className = "col-md-6 col-12 d-flex flex-column";
        rightWrapper.innerHTML = `
            <div class="row">
                ${[1, 2].map(i => services[i] ? `
                    <div class="col-md-6 col-12">
                        ${createCardHTML(services[i])}
                    </div>` : "").join('')}
            </div>
            <div class="row">
                <div class="col-12 mt-4">
                    ${services[3] ? createCardHTML(services[3]) : ""}
                </div>
            </div>
        `;
        servicesContainer.appendChild(rightWrapper);
    }

    function createCardHTML(service, colClass = "col-12") {
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

        return `
            <div class="service-card h-100 mb-4">
                <div class="card-image" style="position: relative; overflow: hidden;">
                    <img src="${imageUrl}" alt="${service.name}" class="img-fluid w-100" style="height: 100%; object-fit: cover;">
                    <div class="card-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${service.name}</h3>
                    <p class="card-description">${service.description || 'No description provided.'}</p>
                    <div class="card-footer d-flex justify-content-between align-items-center">
                        <div class="price text-right">
                            <div class="price-label small text-muted">From</div>
                            <div class="price-amount font-weight-bold ">GH₵${service.price?.toFixed(2) || '0.00'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

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