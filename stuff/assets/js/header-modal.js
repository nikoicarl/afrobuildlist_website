// Prevent default navigation, show modal instead
document.getElementById('profileLink').addEventListener('click', function (e) {
    e.preventDefault();
    showProfile();
});

document.getElementById('ordersLink').addEventListener('click', function (e) {
    e.preventDefault();
    showOrders();
});

function sanitize(str) {
    if (!str || str.toLowerCase() === 'null') return 'N/A';
    return str;
}

function capitalizeFirstLetter(str) {
    str = sanitize(str);
    if (str === 'N/A') return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatMemberSince(dateStr) {
    dateStr = sanitize(dateStr);
    if (dateStr === 'N/A') return dateStr;

    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';

    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

function showProfile() {
    const firstNameRaw = localStorage.getItem('first_name');
    const lastNameRaw = localStorage.getItem('last_name');
    const emailRaw = localStorage.getItem('email');
    const addressRaw = localStorage.getItem('address');
    const memberSinceRaw = localStorage.getItem('datetime');
    const userID = localStorage.getItem('userID');

    const firstName = capitalizeFirstLetter(firstNameRaw);
    const lastName = capitalizeFirstLetter(lastNameRaw);
    const email = sanitize(emailRaw);
    const address = capitalizeFirstLetter(addressRaw);
    const memberSince = formatMemberSince(memberSinceRaw);

    const fullName = [firstName, lastName].filter(n => n !== 'N/A').join(' ') || 'N/A';

    Swal.fire({
        title: 'My Profile',
        html: `
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Member since:</strong> ${memberSince}</p>
            <hr />
            <button id="changePassBtn" class="swal2-confirm swal2-styled" 
                style="background-color: var(--primary-color); margin-top: 10px;">
                Change Password
            </button>
        `,
        showConfirmButton: false,
        width: '400px',
        didRender: () => {
            document.getElementById('changePassBtn').addEventListener('click', () => {
                Swal.fire({
                    title: 'Change Password',
                    html: `
                        <input type="password" id="currentPass" class="swal2-input" placeholder="Current Password" />
                        <input type="password" id="newPass" class="swal2-input" placeholder="New Password" />
                        <input type="password" id="confirmPass" class="swal2-input" placeholder="Confirm New Password" />
                    `,
                    confirmButtonText: 'Update',
                    confirmButtonColor: "#09622e",
                    showCancelButton: true,
                    buttonsStyling: true,
                    preConfirm: () => {
                        const currentPass = Swal.getPopup().querySelector('#currentPass').value;
                        const newPass = Swal.getPopup().querySelector('#newPass').value;
                        const confirmPass = Swal.getPopup().querySelector('#confirmPass').value;

                        if (!currentPass || !newPass || !confirmPass) {
                            Swal.showValidationMessage('Please fill out all fields');
                            return false;
                        }
                        if (newPass !== confirmPass) {
                            Swal.showValidationMessage('New passwords do not match');
                            return false;
                        }
                        if (newPass.length < 6) {
                            Swal.showValidationMessage('New password should be at least 6 characters');
                            return false;
                        }

                        return { currentPass, newPass };
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const { currentPass, newPass } = result.value;

                        try {
                            const response = await fetch(`${API_BASE}/change-password`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    userID,
                                    currentPassword: currentPass,
                                    newPassword: newPass,
                                }),
                            });

                            const data = await response.json();

                            if (response.ok) {
                                Swal.fire('Success', 'Password updated successfully.', 'success');
                            } else {
                                Swal.fire('Error', data.message || 'Failed to update password.', 'error');
                            }
                        } catch (error) {
                            Swal.fire('Error', 'An unexpected error occurred.', 'error');
                        }
                    }
                });
            });
        }
    });
}





function showOrders() {
    Swal.fire({
        title: 'My Orders',
        html: `
        <ul style="text-align: left; padding-left: 1.5em;">
          <li>Order #1234 - Delivered</li>
          <li>Order #5678 - Processing</li>
          <li>Order #9012 - Cancelled</li>
        </ul>
      `,
        icon: 'info',
        confirmButtonText: 'Close',
        width: '400px',
    });
}