document.addEventListener("DOMContentLoaded", () => {
    // --- CONFIGURATION ---
    const API_BASE = window.API_BASE || '';
    const cacheKey = "cachedServices";
    const placeholder = "assets/img/default-service-image.jpg";
    const SLIDE_INTERVAL = 5000;

    // --- DOM REFERENCES ---
    const wrapper = document.getElementById("carouselServices");
    const track = wrapper.querySelector(".afrobuild-carousel-track");
    const indicatorsContainer = document.getElementById("carouselIndicators");
    const searchInput = document.getElementById("serviceSearchInput");
    const searchButton = searchInput?.nextElementSibling;

    // --- STATE ---
    let cardsPerSlide = getCardsPerSlide();
    let currentIndex = 0;
    let totalSlides = 0;
    let interval;
    let allServices = [];

    // --- HELPERS ---
    function getCardsPerSlide() {
        const width = window.innerWidth;
        if (width < 576) return 1;
        if (width < 768) return 2;
        if (width < 992) return 3;
        return 4;
    }

    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // --- CARD CREATOR ---
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
            : placeholder;

        // Card container
        const card = document.createElement('div');
        card.className = "afrobuild-product-card afrobuild-carousel-card h-100";
        card.style.flex = `0 0 ${100 / cardsPerSlide}%`;
        card.style.maxWidth = `${100 / cardsPerSlide}%`;
        card.style.display = "flex";
        card.style.flexDirection = "column";

        // Card image
        const imgDiv = document.createElement('div');
        imgDiv.className = "afrobuild-product-card-image";
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = service?.name ? escapeHTML(service.name) : 'Service image';
        img.loading = "lazy";
        imgDiv.appendChild(img);

        // Card body
        const body = document.createElement('div');
        body.className = "afrobuild-product-card-body";

        // Title
        const title = document.createElement('h4');
        title.className = "afrobuild-product-card-title";
        title.textContent = service?.name || 'Service Name';
        body.appendChild(title);

        // Description
        const desc = document.createElement('p');
        desc.className = "afrobuild-product-card-description";
        desc.textContent = service?.description || 'No description provided.';
        body.appendChild(desc);

        // Footer
        const footer = document.createElement('div');
        footer.className = "afrobuild-product-card-footer";

        // Price
        const priceDiv = document.createElement('div');
        priceDiv.className = "afrobuild-product-card-price";
        priceDiv.innerHTML = `<span class="afrobuild-product-price-label">From</span>
            <span class="afrobuild-product-price-amount">GH₵${typeof service?.price === 'number' ? service.price.toFixed(2) : '0.00'}</span>`;
        footer.appendChild(priceDiv);

        // Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = "afrobuild-product-card-actions";
        const actionWrap = document.createElement('div');

        // Quantity input
        const qtyInput = document.createElement('input');
        qtyInput.type = "number";
        qtyInput.id = `quantity_${service.serviceid}`;
        qtyInput.className = "form-control";
        qtyInput.value = "1";
        qtyInput.min = "1";
        qtyInput.style.width = "60px";
        actionWrap.appendChild(qtyInput);

        // Add to cart button
        const addBtn = document.createElement('button');
        addBtn.className = "afrobuild-btn afrobuild-btn-success mt-2 add-to-cart-btn";
        addBtn.dataset.serviceid = service.serviceid;
        addBtn.textContent = "Add to Cart";
        actionWrap.appendChild(addBtn);

        actionsDiv.appendChild(actionWrap);
        footer.appendChild(actionsDiv);

        body.appendChild(footer);

        // Assemble card
        card.appendChild(imgDiv);
        card.appendChild(body);

        return card;
    }

    // --- CAROUSEL RENDERING ---
    function renderCarousel(services) {
        track.innerHTML = "";
        cardsPerSlide = getCardsPerSlide();
        if (!services || services.length === 0) {
            track.innerHTML = `<p class="text-muted" style="font-size:1.3em;">No services found.</p>`;
            indicatorsContainer.innerHTML = "";
            indicatorsContainer.style.display = "none";
            clearInterval(interval);
            totalSlides = 0;
            return;
        }

        // Create and append cards
        services.forEach(service => {
            track.appendChild(createCardElement(service));
        });

        // Slide calculations
        totalSlides = Math.ceil(services.length / cardsPerSlide);
        currentIndex = 0;
        renderIndicators();
        updateCarouselPosition();
        startAutoSlide();
    }

    // --- INDICATORS ---
    function renderIndicators() {
        indicatorsContainer.innerHTML = "";
        if (totalSlides <= 1) {
            indicatorsContainer.style.display = "none";
            return;
        }
        for (let i = 0; i < totalSlides; i++) {
            const indicator = document.createElement("div");
            indicator.className = "rounded-circle";
            indicator.style.cssText = `
                width: 12px;
                height: 12px;
                background: ${i === 0 ? "#222" : "#bbb"};
                opacity: ${i === 0 ? "1" : "0.5"};
                cursor: pointer;
                margin: 0 4px;
            `;
            indicator.dataset.index = i;
            indicator.addEventListener("click", () => {
                clearInterval(interval);
                currentIndex = i;
                updateCarouselPosition();
                startAutoSlide();
            });
            indicatorsContainer.appendChild(indicator);
        }
        indicatorsContainer.style.display = "flex";
    }

    function updateIndicators() {
        const dots = indicatorsContainer.children;
        for (let i = 0; i < dots.length; i++) {
            dots[i].style.background = i === currentIndex ? "#222" : "#bbb";
            dots[i].style.opacity = i === currentIndex ? "1" : "0.5";
        }
    }

    // --- SLIDE POSITION ---
    function updateCarouselPosition() {
        track.style.transform = `translateX(${-100 * currentIndex}%)`;
        updateIndicators();
    }

    function startAutoSlide() {
        clearInterval(interval);
        if (totalSlides <= 1) return;
        interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarouselPosition();
        }, SLIDE_INTERVAL);
    }

    // --- FETCHING & CACHING ---
    function fetchServices() {
        fetch(`${API_BASE}/services`)
            .then(res => res.json())
            .then(data => {
                allServices = data.data || data;
                localStorage.setItem(cacheKey, JSON.stringify(allServices));
                renderCarousel(allServices);
            })
            .catch(err => {
                console.error("Error fetching services:", err);
                track.innerHTML = `<p class="text-danger">Failed to load services.</p>`;
                indicatorsContainer.style.display = "none";
            });
    }

    function loadServicesFromCache() {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                allServices = JSON.parse(cached);
                renderCarousel(allServices);
            } catch (e) {
                localStorage.removeItem(cacheKey);
                fetchServices();
            }
        } else {
            fetchServices();
        }
    }

    // --- SEARCH ---
    function filterServices(query, serviceList) {
        if (!query) return serviceList;
        const lower = query.toLowerCase();
        return serviceList.filter(service => {
            const name = service.name?.toLowerCase() || "";
            const description = service.description?.toLowerCase() || "";
            const price = service.price !== undefined ? service.price.toString() : "";
            return (
                name.includes(lower) ||
                description.includes(lower) ||
                price.includes(lower)
            );
        });
    }

    function handleSearch() {
        const query = searchInput.value.trim();
        const filtered = filterServices(query, allServices);
        renderCarousel(filtered);
    }

    // --- EVENT LISTENERS ---
    // Search
    if (searchButton && searchInput) {
        searchButton.addEventListener("click", handleSearch);
        searchInput.addEventListener("keydown", e => {
            if (e.key === "Enter") handleSearch();
        });
        searchInput.addEventListener("input", handleSearch);
    }

    // Responsive re-render
    window.addEventListener("resize", () => {
        const newCardsPerSlide = getCardsPerSlide();
        if (newCardsPerSlide !== cardsPerSlide) {
            renderCarousel(filterServices(searchInput.value.trim(), allServices));
        }
    });

    // Add to cart button handler (event delegation)
    track.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const serviceId = e.target.dataset.serviceid;
            const qtyInput = document.getElementById(`quantity_${serviceId}`);
            const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1;
            // Implement your add-to-cart logic here
            alert(`Added service ${serviceId} (qty: ${quantity}) to cart!`);
        }
    });

    // --- INIT ---
    loadServicesFromCache();
});
