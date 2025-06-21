
$(document).ready(function () {

    // navigation function
    function navigation(open, general) {
        $('.' + general).hide();
        $('.' + open).show();
    }

    // on click of the continue button
    $('.afrobuild_continue_btn').click(function (e) {
        e.preventDefault();
        var firstName = $('#firstName').val();
        var lastName = $('#lastName').val();
        var email = $('#email').val();
        var mobile = $('#mobile').val();
        var country = $('#country').val();
        var region = $('#region').val();
        var password = $('#password').val();
        var confirm_password = $('#confirm_password').val();

        if (firstName && lastName && email && mobile && country && region) {
            navigation('password-section', 'signup_general');

            // change button to submit
            $('.afrobuild_continue_btn').text('Submit');

            $('.afrobuild_continue_btn').attr('type', 'submit');
            $('.afrobuild_continue_btn').attr('id', 'submit_btn');
            $('.afrobuild_continue_btn').attr('id', 'submit_btn');
            $('.afrobuild_continue_btn').attr('onclick', 'return false;');

            // check if password and confirm password are equal
            if (password && confirm_password) {
                if (password !== confirm_password) {
                    // Sweetaleert
                    Swal.fire({
                        title: 'Error!',
                        text: 'Password and Confirm Password do not match',
                        icon: 'error',
                        confirmButtonText: 'Continue',
                        customClass: {
                            confirmButton: 'btn btn-success'
                        }
                    })
                    return;
                }
            }

        } else {
            // Sweetaleert
            Swal.fire({
                title: 'Error!',
                text: 'Please fill in all required fields.',
                icon: 'error',
                confirmButtonText: 'Continue',
                customClass: {
                    confirmButton: 'btn btn-success'
                }
            })
        }
    });

    // on click of the back button
    $('.afrobuild_signup_back_btn').click(function (e) {
        e.preventDefault();
        navigation('signup_general', 'password-section');

        // hide the password section
        $('.password-section').hide();
        $('.afrobuild_continue_btn').text('Continue');
        $('.afrobuild_continue_btn').attr('type', 'button');
        $('.afrobuild_continue_btn').attr('id', 'submit_btn');
        $('.afrobuild_continue_btn').attr('onclick', 'return false;');
    });
});