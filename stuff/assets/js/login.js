document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".loginForm");
    const rememberCheck = document.querySelector("#rememberCheck");
    const loginBtn = loginForm.querySelector("button[type='submit']");
    const usernameInput = loginForm.querySelector("input[name='username']");
    const passwordInput = loginForm.querySelector("input[name='password']");

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            Swal.fire({
                icon: "warning",
                title: "Missing Information",
                text: "Please enter both username/email and password.",
                timer: 2000,
                showConfirmButton: false,
            });
            if (!username) usernameInput.focus();
            else passwordInput.focus();
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "Loading...";

        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                // Handle HTTP errors with meaningful messages
                let message = "Login failed. Please try again.";
                if (res.status === 401) {
                    message = "Invalid username/email or password.";
                } else if (res.status >= 500) {
                    message = "Server error. Please try again later.";
                }
                Swal.fire({
                    icon: "error",
                    title: "Login Failed",
                    text: message,
                    timer: 2500,
                    showConfirmButton: false,
                });
                loginBtn.disabled = false;
                loginBtn.textContent = "Log In";
                return;
            }

            const response = await res.json();

            if (response.type === "success") {
                // Store user data
                localStorage.setItem("userID", response.userData.userid);
                localStorage.setItem("username", response.userData.username);
                localStorage.setItem("first_name", response.userData.first_name);
                localStorage.setItem("last_name", response.userData.last_name);
                localStorage.setItem("email", response.userData.email);
                localStorage.setItem("phone", response.userData.phone);
                localStorage.setItem("address", response.userData.address);
                localStorage.setItem("datetime", response.userData.date_time);

                if (rememberCheck.checked) {
                    localStorage.setItem("rememberMe", true);
                    localStorage.setItem("savedUsername", username);
                } else {
                    localStorage.removeItem("rememberMe");
                    localStorage.removeItem("savedUsername");
                }

                Swal.fire({
                    icon: "success",
                    title: "Login Successful",
                    text: "Redirecting...",
                    timer: 1500,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = "/dashboard";
                });
            } else {
                // Server responded with a failure, show specific message if available
                Swal.fire({
                    icon: "error",
                    title: "Login Failed",
                    text: response.message || "Invalid username/email or password.",
                    timer: 2500,
                    showConfirmButton: false,
                });
                passwordInput.focus();
            }
        } catch (err) {
            console.error("Login error:", err);
            Swal.fire({
                icon: "error",
                title: "Login Error",
                text: "An unexpected error occurred. Please try again.",
                timer: 2500,
                showConfirmButton: false,
            });
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "Log In";
        }
    });

    // Auto-fill username if "Remember Me" was previously set
    if (localStorage.getItem("rememberMe")) {
        const savedUsername = localStorage.getItem("savedUsername");
        if (savedUsername && savedUsername.trim() !== "") {
            usernameInput.value = savedUsername;
            rememberCheck.checked = true;
        }
    }


    const forgotLink = document.querySelector(".forgot-link");

    forgotLink.addEventListener("click", async (e) => {
        e.preventDefault();

        const { value: email } = await Swal.fire({
            title: "Reset Password",
            input: "email",
            inputLabel: "Enter your email address",
            inputPlaceholder: "you@example.com",
            inputValidator: (value) => {
                if (!value) return "Please enter your email address";
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(value)) return "Please enter a valid email address";
            },
            showCancelButton: true,
            confirmButtonText: "Send Reset Link",
            confirmButtonColor: "#09622e",  // Your brand green
            cancelButtonColor: "#6c757d",   // Bootstrap gray
            buttonsStyling: true,
            customClass: {
                popup: 'swal2-border-radius', // optional if you want to style popup corners
            }
        });

        if (email) {
            try {
                Swal.fire({
                    title: "Sending reset link...",
                    didOpen: () => Swal.showLoading(),
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                });

                const response = await fetch(`${API_BASE}/forgot-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();

                if (response.ok && data.type === "success") {
                    Swal.fire({
                        icon: "success",
                        title: "Email Sent",
                        text: data.message || "Check your email for password reset instructions.",
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: data.message || "Failed to send reset email. Please try again.",
                    });
                }
            } catch (err) {
                console.error("Forgot password error:", err);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "An unexpected error occurred. Please try again.",
                });
            }
        }
    });
});
