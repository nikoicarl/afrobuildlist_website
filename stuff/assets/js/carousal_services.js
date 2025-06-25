document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.getElementById("carouselServices");
    const track = wrapper.querySelector(".afrobuild-carousel-track");
    const indicatorsContainer = document.getElementById("carouselIndicators");
    const cacheKey = "cachedServices";
    const placeholder = "assets/img/default-service-image.jpg";
    const SLIDE_INTERVAL = 5000;
    const CARDS_PER_SLIDE = 4;
    let currentIndex = 0;
    let totalSlides = 0;
    let interval;

    function createCarouselCard(service) {
        let docsArray = [];
        if (service.documents && service.documents.trim()) {
            docsArray = service.documents
                .split(",")
                .map(f => f.trim())
                .filter(f => f.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/));
        }

        const imageUrl = docsArray.length
            ? `/images/services/${docsArray[0]}`
            : placeholder;

        return `
      <div class="afrobuild-carousel-card flex-fill" style="min-width: 25%;">
        <img src="${imageUrl}" alt="${service.name || 'Service'}">
        <div class="afrobuild-carousel-overlay">
          <h5>${service.name || "Unnamed Service"}</h5>
          <p>${service.description || "No description provided."}</p>
          <div class="afrobuild-overlay-footer">
            <span class="afrobuild-price text-center" style="display:block; color: var(--primary-color); margin: 0 auto;">
              Est. GH₵${service.price?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      </div>
    `;
    }


    function renderIndicators() {
        indicatorsContainer.innerHTML = "";
        for (let i = 0; i < totalSlides; i++) {
            const indicator = document.createElement("div");
            indicator.className = "rounded-circle";
            indicator.style.cssText = `
        width: 12px;
        height: 12px;
        background: ${i === 0 ? "#222" : "#bbb"};
        opacity: ${i === 0 ? "1" : "0.5"};
        cursor: pointer;
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
        indicatorsContainer.style.display = totalSlides > 1 ? "flex" : "none";
    }

    function updateIndicators() {
        const dots = indicatorsContainer.children;
        for (let i = 0; i < dots.length; i++) {
            dots[i].style.background = i === currentIndex ? "#222" : "#bbb";
            dots[i].style.opacity = i === currentIndex ? "1" : "0.5";
        }
    }

    function updateCarouselPosition() {
        const translateX = -(100 / CARDS_PER_SLIDE) * CARDS_PER_SLIDE * currentIndex;
        track.style.transform = `translateX(${translateX}%)`;

        // Handle fade-in effect
        const cards = track.querySelectorAll(".afrobuild-carousel-card");
        cards.forEach((card, idx) => {
            const start = currentIndex * CARDS_PER_SLIDE;
            const end = start + CARDS_PER_SLIDE;
            if (idx >= start && idx < end) {
                card.classList.add("active");
            } else {
                card.classList.remove("active");
            }
        });

        updateIndicators();
    }

    function startAutoSlide() {
        if (interval) clearInterval(interval);
        if (totalSlides <= 1) return;
        interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarouselPosition();
        }, SLIDE_INTERVAL);
    }

    function renderCarousel(services) {
        if (!services || services.length === 0) {
            track.innerHTML = `<p class="text-muted">No services found.</p>`;
            indicatorsContainer.innerHTML = "";
            indicatorsContainer.style.display = "none";
            if (interval) clearInterval(interval);
            return;
        }

        track.innerHTML = services.map(createCarouselCard).join("");
        totalSlides = Math.ceil(services.length / CARDS_PER_SLIDE);
        currentIndex = 0;

        renderIndicators();
        updateCarouselPosition();
        startAutoSlide();
    }

    function fetchServices() {
        fetch("http://localhost:3000/services")
            .then(res => res.json())
            .then(data => {
                const services = data.data || data;
                localStorage.setItem(cacheKey, JSON.stringify(services));
                renderCarousel(services);
            })
            .catch(err => {
                console.error("Error fetching services:", err);
                track.innerHTML = `<p class="text-danger">Failed to load services.</p>`;
                indicatorsContainer.style.display = "none";
            });
    }

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const services = JSON.parse(cached);
            renderCarousel(services);
        } catch (e) {
            localStorage.removeItem(cacheKey);
            fetchServices();
        }
    } else {
        fetchServices();
    }
});
