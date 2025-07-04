
document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const payload = {};

    // Build the payload object from form fields
    formData.forEach((value, key) => {
        payload[key] = value.trim();
    });

    try {
        const res = await fetch(`${API_BASE}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            Swal.fire({
                icon: "error",
                title: "Registration Failed",
                text: data.message || "An error occurred. Please try again."
            });
            return;
        }

        Swal.fire({
            icon: "success",
            title: "Success",
            text: "Your account was created successfully.",
            confirmButtonText: 'Login',
                customClass: {
                    confirmButton: 'afrobuild-btn-success'
                },
                buttonsStyling: true
        }).then(() => {
            window.location.href = "/login";
        });

    } catch (err) {
        console.error(err);
        Swal.fire({
            icon: "error",
            title: "Network Error",
            text: "Something went wrong. Please check your connection and try again."
        });
    }
});