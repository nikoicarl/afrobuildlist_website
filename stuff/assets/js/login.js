document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".loginForm");
    const rememberCheck = document.querySelector("#rememberCheck");
    const loginBtn = loginForm.querySelector("button[type='submit']");

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = loginForm.querySelector("input[name='username']").value;
        const password = loginForm.querySelector("input[name='password']").value;
        const rememberMe = rememberCheck.checked;

        loginBtn.disabled = true;
        loginBtn.textContent = "Loading...";

        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const response = await res.json();

            if (response.type === "success") {
                // ✅ Store user data for use in dashboard
                localStorage.setItem("userID", response.userData.userid);
                localStorage.setItem("username", response.userData.username);
                localStorage.setItem("first_name", response.userData.first_name); // Store first name
                localStorage.setItem("last_name", response.userData.last_name);   // Store last name

                // If "Remember Me" is checked, store credentials in localStorage
                if (rememberMe) {
                    localStorage.setItem("rememberMe", true);
                    localStorage.setItem("savedUsername", username); // Store the username
                } else {
                    localStorage.removeItem("rememberMe");
                    localStorage.removeItem("savedUsername");
                }

                // Display success alert without text or confirm button
                Swal.fire({
                    icon: 'success',
                    title: 'Login Successful',
                    text: 'Redirecting...', // Add the "Redirecting..." message
                    timer: 1500, // Close after 1.5 seconds
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/dashboard';
                });
            } else {
                // Display error alert without text or confirm button
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    timer: 1500, // Close after 1.5 seconds
                    showConfirmButton: false
                });
            }
        } catch (err) {
            // Handle any errors with a simple error alert
            Swal.fire({
                icon: 'error',
                title: 'Login Error',
                text: 'An error occurred while logging in. Please try again.',
                timer: 1500, // Close after 1.5 seconds
                showConfirmButton: false
            });
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "Log In";
        }
    });

    // Auto-fill the username if "Remember Me" is checked
    if (localStorage.getItem("rememberMe")) {
        const savedUsername = localStorage.getItem("savedUsername");
        // Make sure the saved username is valid and not an empty string
        if (savedUsername && savedUsername.trim() !== "") {
            loginForm.querySelector("input[name='username']").value = savedUsername;
            rememberCheck.checked = true;
        }
    }
});
