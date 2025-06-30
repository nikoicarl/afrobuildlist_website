$(document).ready(function () {
    $(".loginForm").on("submit", async function (e) {
        e.preventDefault();

        const $form = $(this);
        const $btn = $form.find("button[type='submit']");

        const username = $form.find("input[name='username']").val();
        const password = $form.find("input[name='password']").val();

        $btn.prop("disabled", true);
        const originalText = $btn.text();
        $btn.text("Loading...");

        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password })
            });

            const response = await res.json();

            if (res.ok && response.type === "success") {
                // ✅ Store user ID and data for use in dashboard
                localStorage.setItem("userID", response.userData.userid);
                localStorage.setItem("username", response.userData.username); // optional

                Swal.fire({
                    icon: 'success',
                    title: 'Login Successful',
                    showConfirmButton: false, // Hide the "Okay" button
                    timer: 2000 // Auto-close after 2 seconds
                }).then(() => {
                    window.location.href = '/dashboard';
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Login Failed',
                    text: response.message,
                    showConfirmButton: false, // Hide the "Okay" button
                    timer: 2000 // Auto-close after 2 seconds
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Login Error',
                text: "There was an error with the login process.",
                showConfirmButton: false, // Hide the "Okay" button
                timer: 2000 // Auto-close after 2 seconds
            });
        } finally {
            $btn.prop("disabled", false);
            $btn.text(originalText);
        }
    });
});
