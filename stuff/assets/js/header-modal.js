// Prevent default navigation, show modal instead
document.querySelector('.dropdown-menu.nav-dropdown .profileLink').addEventListener('click', function (e) {
    e.preventDefault();
    showProfile();
});

document.querySelector('.dropdown-menu.nav-dropdown .ordersLink').addEventListener('click', function (e) {
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
    const firstNameRaw = sessionStorage.getItem('first_name');
    const lastNameRaw = sessionStorage.getItem('last_name');
    const emailRaw = sessionStorage.getItem('email');
    const phoneRaw = sessionStorage.getItem('phone');
    const addressRaw = sessionStorage.getItem('address');
    const memberSinceRaw = sessionStorage.getItem('datetime');
    const userID = sessionStorage.getItem('userID');

    const firstName = getValueOrNA(capitalizeFirstLetter(firstNameRaw));
    const lastName = getValueOrNA(capitalizeFirstLetter(lastNameRaw));
    const email = getValueOrNA(sanitize(emailRaw));
    const phone = getValueOrNA(sanitize(phoneRaw));
    const address = getValueOrNA(capitalizeFirstLetter(addressRaw));
    const memberSince = getValueOrNA(formatMemberSince(memberSinceRaw));


    const fullName = [firstName, lastName].filter(n => n !== 'N/A').join(' ') || 'N/A';

    Swal.fire({
        title: 'My Profile',
        html: `
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> <span id="editableEmail" style="border-bottom: 1px dashed #ccc; padding: 2px 4px; cursor: text;">${email}</span></p>
            <p><strong>Phone:</strong> <span id="editablePhone" style="border-bottom: 1px dashed #ccc; padding: 2px 4px; cursor: text;">${phone}</span></p>
            <p><strong>Address:</strong> <span id="editableAddress" style="border-bottom: 1px dashed #ccc; padding: 2px 4px; cursor: text;">${address}</span></p>
            <p><strong>Member since:</strong> ${memberSince}</p>
            <hr />
            <div style="display:flex; gap: 10px; flex-wrap: wrap;">
                <button id="editBtn" class="swal2-confirm swal2-styled" style="flex:1; min-width: 120px; background-color: var(--primary-color);">Edit</button>
                <button id="updateBtn" class="swal2-confirm swal2-styled" style="flex:1; min-width: 120px; background-color: #09622e; display:none;">Update</button>
                <button id="changePassBtn" class="swal2-confirm swal2-styled" style="flex:1; min-width: 120px; background-color: var(--primary-color);">Change Password</button>
            </div>
        `,
        showConfirmButton: false,
        width: '480px',
        didRender: () => {
            const container = Swal.getPopup();
            if (container) {
                container.style.minHeight = '450px';  // increased height for better spacing
                container.style.paddingTop = '20px';
                container.style.paddingBottom = '20px';
            }

            const emailSpan = document.getElementById('editableEmail');
            const phoneSpan = document.getElementById('editablePhone');
            const addressSpan = document.getElementById('editableAddress');
            const editBtn = document.getElementById('editBtn');
            const updateBtn = document.getElementById('updateBtn');
            const changePassBtn = document.getElementById('changePassBtn');

            function toggleEditing(enable) {
                emailSpan.contentEditable = enable;
                phoneSpan.contentEditable = enable;
                addressSpan.contentEditable = enable;

                if (enable) {
                    [emailSpan, phoneSpan, addressSpan].forEach(el => {
                        el.style.backgroundColor = "#fff8dc";
                        el.style.outline = "1px solid #09622e";
                        el.style.cursor = "text";
                    });
                } else {
                    [emailSpan, phoneSpan, addressSpan].forEach(el => {
                        el.style.backgroundColor = "";
                        el.style.outline = "none";
                        el.style.cursor = "default";
                    });
                }

                editBtn.style.display = enable ? 'none' : 'inline-block';
                updateBtn.style.display = enable ? 'inline-block' : 'none';
            }

            toggleEditing(false);

            editBtn.addEventListener('click', () => {
                toggleEditing(true);
                emailSpan.focus();
                document.execCommand('selectAll', false, null);
            });

            updateBtn.addEventListener('click', async () => {
                const newEmail = emailSpan.textContent.trim();
                const newPhone = phoneSpan.textContent.trim();
                const newAddressRaw = addressSpan.textContent.trim();
                const newAddress = newAddressRaw.charAt(0).toUpperCase() + newAddressRaw.slice(1);

                if (!validateEmail(newEmail)) {
                    Swal.fire('Invalid Email', 'Please enter a valid email address.', 'error');
                    emailSpan.focus();
                    return;
                }

                if (!validatePhone(newPhone)) {
                    Swal.fire('Invalid Phone', 'Please enter a valid phone number.', 'error');
                    phoneSpan.focus();
                    return;
                }

                try {
                    await updateUserProfileBatch(userID, { email: newEmail, phone: newPhone, address: newAddress });

                    sessionStorage.setItem('email', newEmail);
                    sessionStorage.setItem('phone', newPhone);
                    sessionStorage.setItem('address', newAddress);

                    emailSpan.textContent = newEmail;
                    phoneSpan.textContent = newPhone;
                    addressSpan.textContent = newAddress;

                    toggleEditing(false);
                    Swal.fire('Success', 'Profile updated successfully.', 'success');
                } catch {
                    Swal.fire('Error', 'Failed to update profile. Please try again.', 'error');
                }
            });

            changePassBtn.addEventListener('click', () => {
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
                                headers: { 'Content-Type': 'application/json' },
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

    async function updateUserProfileBatch(userID, updates) {
        const payload = { userID, ...updates };

        const response = await fetch(`${API_BASE}/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('Update failed');
        }

        return response.json();
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePhone(phone) {
        return /^[\d +()-]{5,20}$/.test(phone);
    }

    function capitalizeFirstLetter(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatMemberSince(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
}

function showOrders() {
    const userID = sessionStorage.getItem('userID');

    if (!userID) {
        Swal.fire('Not Logged In', 'Please log in to view your orders.', 'warning');
        return;
    }

    const getStatusBadge = (statusRaw) => {
        const status = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase(); // Normalize case

        const colors = {
            Delivered: { bg: '#d4f8dc', text: '#28a745', border: '#28a745' },
            Processing: { bg: '#d1e7ff', text: '#0366d6', border: '#0366d6' },
            Cancelled: { bg: '#f8d7da', text: '#d73a49', border: '#d73a49' },
            Flagged: { bg: '#fff3cd', text: '#856404', border: '#ffc107' },
            Pending: { bg: '#e2e3e5', text: '#6c757d', border: '#adb5bd' },
        };

        const color = colors[status] || { bg: '#e1e4e8', text: '#6a737d', border: '#6a737d' };

        return `<span style="
        display: inline-block;
        background-color: ${color.bg};
        color: ${color.text};
        border: 1px solid ${color.border};
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 13px;
        user-select: none;
        white-space: nowrap;
    ">${status}</span>`;
    };


    Swal.fire({
        title: 'Loading your orders...',
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
        showConfirmButton: false,
        width: 750,
    });

    fetch(`${API_BASE}/orders?userID=${userID}`)
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data.orders)) throw new Error('Invalid order data');

            const allOrders = data.orders;
            let currentStatus = 'All';

            const renderOrders = (filterStatus = 'All') => {
                const filteredOrders = filterStatus === 'All'
                    ? allOrders
                    : allOrders.filter(o => {
                        const statusNormalized = o.status.charAt(0).toUpperCase() + o.status.slice(1).toLowerCase();
                        return statusNormalized === filterStatus;
                    });


                const htmlContent = filteredOrders.length
                    ? `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-height: 450px; overflow-y: auto; padding-right: 10px;">
                        ${filteredOrders.map(order => `
                            <div style="
                                border: 1px solid #e1e4e8; 
                                border-radius: 12px; 
                                padding: 20px; 
                                margin-bottom: 20px; 
                                box-shadow: 0 1px 3px rgb(27 31 35 / 0.1);
                                background-color: #fff;
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <div style="font-weight: 700; font-size: 18px; color: #24292e;">
                                        Order #${order.transactionid}
                                    </div>
                                    ${getStatusBadge(order.status)}
                                </div>
                                <div style="color: #586069; font-size: 14px; margin-bottom: 15px;">
                                    <span><strong>Amount:</strong> $${Number(order.amount).toFixed(2)}</span> &nbsp;&nbsp;|&nbsp;&nbsp; 
                                    <span><strong>Date:</strong> ${new Date(order.datetime).toLocaleString()}</span>
                                </div>
                                ${order.items && order.items.length ? `
                                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                        <thead>
                                            <tr style="background-color: #f6f8fa; text-align: left;">
                                                <th style="padding: 8px; border-bottom: 1px solid #d1d5da;">Item</th>
                                                <th style="padding: 8px; border-bottom: 1px solid #d1d5da;">Quantity</th>
                                                <th style="padding: 8px; border-bottom: 1px solid #d1d5da;">Price</th>
                                                <th style="padding: 8px; border-bottom: 1px solid #d1d5da;">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${order.items.map(item => `
                                                <tr>
                                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">$${Number(item.price).toFixed(2)}</td>
                                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">$${Number(item.subtotal).toFixed(2)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                ` : '<div style="font-style: italic; color: #6a737d;">No items found</div>'}
                            </div>
                        `).join('')}
                    </div>
                    `
                    : '<p style="font-family: Arial, sans-serif;">No orders found for the selected status.</p>';

                document.querySelector('.swal2-html-container').innerHTML = `
    <div style="max-height: 500px; overflow-y: auto; padding-right: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="display: flex; justify-content: start; align-items: center; margin-bottom: 18px;">
            <label for="orderStatusFilter" style="font-weight: 600; font-size: 14px; margin-right: 8px;">Filter by status:</label>
            <select id="orderStatusFilter" style="
                padding: 6px 12px;
                border: 1px solid #d1d5da;
                border-radius: 6px;
                font-size: 14px;
                color: #24292e;
                cursor: pointer;
            ">
                <option${filterStatus === 'All' ? ' selected' : ''}>All</option>
                <option${filterStatus === 'Processing' ? ' selected' : ''}>Processing</option>
                <option${filterStatus === 'Delivered' ? ' selected' : ''}>Delivered</option>
                <option${filterStatus === 'Cancelled' ? ' selected' : ''}>Cancelled</option>
                <option${filterStatus === 'Pending' ? ' selected' : ''}>Pending</option>
                <option${filterStatus === 'Flagged' ? ' selected' : ''}>Flagged</option>
                <option${filterStatus === 'Completed' ? ' selected' : ''}>Completed</option>
            </select>
        </div>
        ${htmlContent}
    </div>
`;


                setTimeout(() => {
                    document.getElementById('orderStatusFilter')?.addEventListener('change', e => {
                        currentStatus = e.target.value;
                        renderOrders(currentStatus);
                    });
                }, 0);
            };

            Swal.fire({
                title: 'My Orders',
                html: '<div>Loading orders...</div>',
                showConfirmButton: true,
                confirmButtonText: 'Close',
                confirmButtonColor: "#09622e",
                buttonsStyling: true,
                width: 750,
                didOpen: () => renderOrders()
            });
        })
        .catch(err => {
            console.error(err);
            Swal.fire('Error', 'Could not load orders. Please try again later.', 'error');
        });
}


function getValueOrNA(value) {
    if (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && (
            value.trim() === '' ||
            value.trim().toLowerCase() === 'null' ||
            value.trim().toLowerCase() === 'undefined'
        ))
    ) {
        return 'N/A';
    }
    return value;
}

