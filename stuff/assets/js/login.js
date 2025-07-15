document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".loginForm");
    const rememberCheck = document.querySelector("#rememberCheck");
    const forgotLink = document.querySelector(".forgot-link");
    const googleBtn = document.getElementById("googleSignInCustomBtn");

    if (loginForm) {
        const loginBtn = loginForm.querySelector("button[type='submit']");
        const usernameInput = loginForm.querySelector("input[name='username']");
        const passwordInput = loginForm.querySelector("input[name='password']");

        loginForm.addEventListener("submit", async (e) => {
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
                    const userData = response.userData || {};

                    // Store user data in sessionStorage
                    sessionStorage.setItem("userID", userData.userid || "");
                    sessionStorage.setItem("username", userData.username || "");
                    sessionStorage.setItem("first_name", userData.first_name || "");
                    sessionStorage.setItem("last_name", userData.last_name || "");
                    sessionStorage.setItem("email", userData.email || "");
                    sessionStorage.setItem("phone", userData.phone || "");
                    sessionStorage.setItem("address", userData.address || "");
                    sessionStorage.setItem("datetime", userData.date_time || "");

                    if (rememberCheck.checked) {
                        sessionStorage.setItem("rememberMe", "true");
                        sessionStorage.setItem("savedUsername", username);
                    } else {
                        sessionStorage.removeItem("rememberMe");
                        sessionStorage.removeItem("savedUsername");
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

        // Autofill username if "Remember Me" was set
        if (sessionStorage.getItem("rememberMe")) {
            const savedUsername = sessionStorage.getItem("savedUsername");
            if (savedUsername && savedUsername.trim() !== "") {
                usernameInput.value = savedUsername;
                rememberCheck.checked = true;
            }
        }
    }

    if (forgotLink) {
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
                confirmButtonColor: "#09622e",
                cancelButtonColor: "#6c757d",
                buttonsStyling: true,
                customClass: {
                    popup: "swal2-border-radius",
                },
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
    }

    // Initialize Google OAuth client if google object exists
    if (
        typeof google !== "undefined" &&
        google.accounts &&
        google.accounts.oauth2
    ) {
        const client = google.accounts.oauth2.initTokenClient({
            client_id:
                "31346660715-7u5o5l0557tjsvarlhgsidssgu259doe.apps.googleusercontent.com",
            scope: "email profile openid",
            callback: (tokenResponse) => {
                const accessToken = tokenResponse.access_token;

                if (!accessToken) {
                    Swal.fire("Login Failed", "No access token received.", "error");
                    return;
                }

                fetch(`${API_BASE}/auth/google`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ access_token: accessToken }),
                })
                    .then((res) => {
                        if (!res.ok) throw new Error("Token rejected by server");
                        return res.json();
                    })
                    .then((res) => {
                        // insert into username input
                        const usernameInput = loginForm.querySelector("input[name='username']");
                        if (usernameInput) {
                            usernameInput.value = res.user.email;
                        }
                    })
                    .catch((err) => {
                        console.error("Login error:", err);
                        Swal.fire(
                            "Login Failed",
                            "Google sign-in failed. Try again.",
                            "error"
                        );
                    });
            },
        });

        if (googleBtn) {
            googleBtn.addEventListener("click", () => {
                client.requestAccessToken();
            });
        }
    }
});
