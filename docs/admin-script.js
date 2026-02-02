const API_URL = 'https://chornate.pythonanywhere.com/api/';
let currentSection = 'inventory';

document.addEventListener('DOMContentLoaded', function () {
    checkAdminAccess();
    showSection('inventory');
    fetchCategories();
});

function checkAdminAccess() {
    var userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }
    var user = JSON.parse(userStr);
    if (!user.is_staff) {
        window.location.href = 'index.html';
    }
}

function getAuthHeaders() {
    var userStr = localStorage.getItem('user');
    if (!userStr) return {};
    var user = JSON.parse(userStr);
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + user.token
    };
}

function makeRequest(method, url, headers, body, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    if (headers) {
        for (var key in headers) {
            xhr.setRequestHeader(key, headers[key]);
        }
    }

    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            var data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            callback(null, data, xhr.status);
        } else {
            var errorData = null;
            try {
                errorData = JSON.parse(xhr.responseText);
            } catch (e) { }
            callback(new Error('Request failed'), errorData, xhr.status);
        }
    };

    xhr.onerror = function () {
        callback(new Error('Network error'), null, 0);
    };

    xhr.send(body);
}

function fetchCategories() {
    makeRequest('GET', API_URL + 'categories/', null, null, function (error, data) {
        if (error) {
            console.error('Error fetching categories:', error);
            return;
        }

        var select = document.getElementById('pCategory');
        var editSelect = document.getElementById('editPCategory');

        if (select) {
            select.innerHTML = '<option value="" disabled selected>Select Category</option>';
            data.results.forEach(function (cat) {
                select.innerHTML += '<option value="' + cat.id + '">' + cat.name + '</option>';
            });
        }

        if (editSelect) {
            editSelect.innerHTML = '<option value="" disabled>Select Category</option>';
            data.results.forEach(function (cat) {
                editSelect.innerHTML += '<option value="' + cat.id + '">' + cat.name + '</option>';
            });
        }
    });
}

function showSection(section) {
    currentSection = section;

    document.querySelectorAll('.admin-nav-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });
    document.getElementById('nav-' + section).classList.add('active');

    var title = document.getElementById('section-title');
    var btnContainer = document.getElementById('action-button-container');

    if (section === 'inventory') {
        title.innerText = "Inventory Management";
        btnContainer.style.display = 'block';
    } else {
        title.innerText = section.charAt(0).toUpperCase() + section.slice(1);
        btnContainer.style.display = 'none';
    }

    renderTable();
}

function renderTable() {
    var header = document.getElementById('table-header');
    var body = document.getElementById('admin-data-list');
    body.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';

    if (currentSection === 'inventory') {
        header.innerHTML = '<th>ID</th><th>Name</th><th>Brand</th><th>Price</th><th>Stock</th><th>Action</th>';

        makeRequest('GET', API_URL + 'products/', null, null, function (error, data) {
            if (error) {
                body.innerHTML = '<tr><td colspan="6" class="text-danger text-center">Error loading inventory</td></tr>';
                return;
            }

            var products = data.results || [];
            body.innerHTML = '';
            products.forEach(function (item) {
                body.innerHTML += '<tr>' +
                    '<td>' + item.id + '</td>' +
                    '<td class="fw-bold">' + item.title + '</td>' +
                    '<td>' + (item.brand || '-') + '</td>' +
                    '<td>ETB ' + item.price + '</td>' +
                    '<td>' + item.stock_quantity + '</td>' +
                    '<td>' +
                    '<button class="btn btn-sm text-primary me-2" onclick="editItem(' + item.id + ')">' +
                    '<i class="fas fa-edit"></i>' +
                    '</button>' +
                    '<button class="btn btn-sm text-danger" onclick="deleteItem(' + item.id + ')">' +
                    '<i class="fas fa-trash"></i>' +
                    '</button>' +
                    '</td>' +
                    '</tr>';
            });
        });
    } else if (currentSection === 'orders') {
        header.innerHTML = '<th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th>';
        body.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Order management coming soon</td></tr>';
    } else {
        header.innerHTML = '<th>Customer Name</th><th>Email</th><th>Total Orders</th><th>Member Since</th>';
        body.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Customer management coming soon</td></tr>';
    }
}

document.getElementById('newItemForm').addEventListener('submit', function (e) {
    e.preventDefault();

    var newItem = {
        title: document.getElementById('pName').value,
        category: document.getElementById('pCategory').value,
        description: document.getElementById('pDesc').value || 'No description',
        price: parseFloat(document.getElementById('pPrice').value),
        stock_quantity: parseInt(document.getElementById('pStock').value),
        image_url: document.getElementById('pImage').value,
        platform: 'PC'
    };

    makeRequest('POST', API_URL + 'products/', getAuthHeaders(), JSON.stringify(newItem), function (error, data) {
        if (error) {
            alert('Failed to add product');
            return;
        }

        alert('Product added successfully!');
        var modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        if (modal) modal.hide();
        document.getElementById('newItemForm').reset();
        renderTable();
    });
});

function deleteItem(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        makeRequest('DELETE', API_URL + 'products/' + id + '/', getAuthHeaders(), null, function (error) {
            if (error) {
                alert('Failed to delete product');
                return;
            }
            renderTable();
        });
    }
}

function editItem(id) {
    makeRequest('GET', API_URL + 'products/' + id + '/', null, null, function (error, product) {
        if (error) {
            alert('Failed to load product details');
            return;
        }

        document.getElementById('editProductId').value = product.id;
        document.getElementById('editPName').value = product.title;
        document.getElementById('editPImage').value = product.image_url || '';
        document.getElementById('editPCategory').value = product.category;
        document.getElementById('editPDesc').value = product.description || '';
        document.getElementById('editPPrice').value = product.price;
        document.getElementById('editPStock').value = product.stock_quantity;

        makeRequest('GET', API_URL + 'categories/', null, null, function (error, categoriesData) {
            if (error) return;

            var editCategorySelect = document.getElementById('editPCategory');
            editCategorySelect.innerHTML = '<option value="" disabled>Select Category</option>';
            categoriesData.results.forEach(function (cat) {
                var selected = cat.id === product.category ? 'selected' : '';
                editCategorySelect.innerHTML += '<option value="' + cat.id + '" ' + selected + '>' + cat.name + '</option>';
            });

            var modal = new bootstrap.Modal(document.getElementById('editProductModal'));
            modal.show();
        });
    });
}

document.getElementById('editItemForm').addEventListener('submit', function (e) {
    e.preventDefault();

    var productId = document.getElementById('editProductId').value;
    var updatedItem = {
        title: document.getElementById('editPName').value,
        category: document.getElementById('editPCategory').value,
        description: document.getElementById('editPDesc').value || 'No description',
        price: parseFloat(document.getElementById('editPPrice').value),
        stock_quantity: parseInt(document.getElementById('editPStock').value),
        image_url: document.getElementById('editPImage').value || '',
        platform: 'PC'
    };

    makeRequest('PUT', API_URL + 'products/' + productId + '/', getAuthHeaders(), JSON.stringify(updatedItem), function (error) {
        if (error) {
            alert('Failed to update product');
            return;
        }

        alert('Product updated successfully!');
        var modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        if (modal) modal.hide();
        document.getElementById('editItemForm').reset();
        renderTable();
    });
});
