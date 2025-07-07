const CATEGORY_CACHE_KEY = 'afrobuild_categories';
const ROLE_CACHE_KEY = 'afrobuild_roles';

function goToStep(step) {
    const steps = document.querySelectorAll(".form-step");
    steps.forEach(s => s.classList.add("d-none"));
    document.getElementById(`step-${step}`).classList.remove("d-none");
}

async function loadCategories() {
    try {
        let cached = localStorage.getItem(CATEGORY_CACHE_KEY);
        let categories = cached ? JSON.parse(cached) : null;

        if (!categories || !Array.isArray(categories)) {
            const res = await fetch(`${API_BASE}/category`);
            if (!res.ok) throw new Error('Failed to fetch categories');

            const json = await res.json();
            categories = json.data || [];
            localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(categories));
        }

        populateCategorySelect(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Unable to load categories. Please try again later.',
        });
    }
}

async function loadRoles() {
    try {
        let cached = localStorage.getItem(ROLE_CACHE_KEY);
        let roles = cached ? JSON.parse(cached) : null;

        if (!roles || !Array.isArray(roles)) {
            const res = await fetch(`${API_BASE}/role`);
            if (!res.ok) throw new Error('Failed to fetch roles');

            const json = await res.json();
            roles = json.data || [];
            localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(roles));
        }

        populateRoleSelect(roles);
    } catch (error) {
        console.error('Error loading roles:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Unable to load roles. Please try again later.',
        });
    }
}

function populateRoleSelect(roles) {
    const select = document.querySelector('select[name="register_category"]');
    if (!select) return;

    select.innerHTML = '<option value="">Register As</option>';
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.roleid;
        option.textContent = role.name;
        select.appendChild(option);
    });
}

function populateCategorySelect(categories) {
    const select = document.querySelector('select[name="category_id"]');
    if (!select) return;

    select.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.categoryid;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

document.getElementById('multiStepForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!document.getElementById('termsCheck').checked) {
        Swal.fire({
            icon: 'warning',
            title: 'Terms Not Accepted',
            text: 'You must agree to the terms and conditions to proceed.',
        });
        return;
    }

    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value.trim();
    });

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await res.json();

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: result.message || 'Registration successful!',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.href = '/login';
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || 'Registration failed. Please try again.',
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Network Error',
            text: 'Could not connect to the server. Please try again later.',
        });
    }
});

window.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadRoles();
});
