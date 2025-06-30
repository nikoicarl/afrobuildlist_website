$(document).ready(function () {
    $(".loginForm").on("submit", function (e) {
        e.preventDefault();

        const $form = $(this);
        const $btn = $form.find("button[type='submit']");

        const username = $form.find("input[name='username']").val();
        const password = $form.find("input[name='password']").val();

        $btn.prop("disabled", true);
        const originalText = $btn.text();
        $btn.text("Loading...");

        $.ajax({
            url: "http://localhost:3000/login", // API login endpoint
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ username, password }),
            success: function (response) {
                if (response.type === "success") {
                    // ✅ Store user ID and data for use in dashboard
                    localStorage.setItem("userID", response.userData.userid);
                    localStorage.setItem("username", response.userData.username); // optional

                    Swal.fire({
                        icon: 'success',
                        title: 'Login Successful',
                        text: `Melody 1: ${response.melody1}`
                    }).then(() => {
                        window.location.href = '/dashboard';
                    });
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Login Failed',
                        text: response.message,
                    });
                }
            },
            error: function (xhr) {
                const errMsg = xhr.responseJSON?.message || "Server error";
                Swal.fire({
                    icon: 'error',
                    title: 'Login Error',
                    text: errMsg,
                });
            },
            complete: function () {
                $btn.prop("disabled", false);
                $btn.text(originalText);
            }
        });
    });
});
