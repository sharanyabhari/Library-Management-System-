// ============================================================================
// Library Management System - Frontend JavaScript
// ============================================================================

const API_BASE_URL = 'http://localhost:5000/api';

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Application initialized');
    
    // Load initial data
    loadDashboard();
    loadBooks();
    loadUsers();
    loadTransactions();
    populateSelectLists();
    
    // Set up form event listeners
    document.getElementById('addBookForm').addEventListener('submit', handleAddBook);
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
    document.getElementById('issueBookForm').addEventListener('submit', handleIssueBook);
    document.getElementById('editBookForm').addEventListener('submit', handleEditBook);
    document.getElementById('editUserForm').addEventListener('submit', handleEditUser);
    
    // Set up search event listeners
    document.getElementById('bookSearchInput').addEventListener('keyup', filterBooks);
    document.getElementById('userSearchInput').addEventListener('keyup', filterUsers);
    document.getElementById('transactionStatusFilter').addEventListener('change', loadTransactions);
    
    // Refresh data every 30 seconds
    setInterval(loadDashboard, 30000);
    setInterval(loadBooks, 30000);
    setInterval(loadUsers, 30000);
    setInterval(loadTransactions, 30000);
});

// ============================================================================
// NAVIGATION
// ============================================================================

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked nav link
    event.target.classList.add('active');
    
    // Refresh data for the section
    if (sectionId === 'dashboard') {
        loadDashboard();
    } else if (sectionId === 'books') {
        loadBooks();
    } else if (sectionId === 'users') {
        loadUsers();
    } else if (sectionId === 'transactions') {
        loadTransactions();
    }
}

// ============================================================================
// DASHBOARD
// ============================================================================

function loadDashboard() {
    fetch(`${API_BASE_URL}/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('statTotalUsers').textContent = data.data.total_users;
                document.getElementById('statTotalBooks').textContent = data.data.total_books;
                document.getElementById('statAvailableBooks').textContent = data.data.available_books;
                document.getElementById('statActiveTransactions').textContent = data.data.active_transactions;
            } else {
                console.error('Error loading dashboard:', data.error);
            }
        })
        .catch(error => console.error('Error:', error));
}

// ============================================================================
// BOOKS MANAGEMENT
// ============================================================================

function loadBooks() {
    fetch(`${API_BASE_URL}/books`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('booksTableBody');
                tbody.innerHTML = '';
                
                if (data.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No books found</td></tr>';
                    return;
                }
                
                data.data.forEach(book => {
                    const row = document.createElement('tr');
                    const availabilityClass = book.QuantityAvailable > 0 ? 'text-success' : 'text-danger';
                    
                    row.innerHTML = `
                        <td>${book.BookID}</td>
                        <td>${book.Title}</td>
                        <td>${book.Author}</td>
                        <td>${book.ISBN}</td>
                        <td>${book.QuantityTotal}</td>
                        <td class="${availabilityClass}"><strong>${book.QuantityAvailable}</strong></td>
                        <td>
                            <button class="btn btn-warning btn-small" onclick="openEditBookModal(${book.BookID})">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteBook(${book.BookID})">Delete</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                console.error('Error loading books:', data.error);
            }
        })
        .catch(error => console.error('Error:', error));
}

function handleAddBook(event) {
    event.preventDefault();
    
    const data = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookISBN').value,
        quantitytotal: parseInt(document.getElementById('bookQuantity').value)
    };
    
    fetch(`${API_BASE_URL}/books`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Book added successfully!', 'success');
            document.getElementById('addBookForm').reset();
            loadBooks();
            populateSelectLists();
        } else {
            showNotification(data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred', 'error');
    });
}

function openEditBookModal(bookId) {
    fetch(`${API_BASE_URL}/books/${bookId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const book = data.data;
                document.getElementById('editBookId').value = book.BookID;
                document.getElementById('editBookTitle').value = book.Title;
                document.getElementById('editBookAuthor').value = book.Author;
                document.getElementById('editBookISBN').value = book.ISBN;
                document.getElementById('editBookQuantity').value = book.QuantityTotal;
                
                openModal('editBookModal');
            }
        })
        .catch(error => console.error('Error:', error));
}

function handleEditBook(event) {
    event.preventDefault();
    
    const bookId = document.getElementById('editBookId').value;
    const data = {
        title: document.getElementById('editBookTitle').value,
        author: document.getElementById('editBookAuthor').value,
        isbn: document.getElementById('editBookISBN').value,
        quantitytotal: parseInt(document.getElementById('editBookQuantity').value)
    };
    
    fetch(`${API_BASE_URL}/books/${bookId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Book updated successfully!', 'success');
            closeModal('editBookModal');
            loadBooks();
        } else {
            showNotification(data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred', 'error');
    });
}

function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Book deleted successfully!', 'success');
                loadBooks();
                populateSelectLists();
            } else {
                showNotification(data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred', 'error');
        });
    }
}

function filterBooks() {
    const input = document.getElementById('bookSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#booksTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });
}

// ============================================================================
// USERS MANAGEMENT
// ============================================================================

function loadUsers() {
    fetch(`${API_BASE_URL}/users`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('usersTableBody');
                tbody.innerHTML = '';
                
                if (data.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
                    return;
                }
                
                data.data.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.UserID}</td>
                        <td>${user.FullName}</td>
                        <td>${user.Email}</td>
                        <td>${user.MembershipDate}</td>
                        <td>
                            <button class="btn btn-warning btn-small" onclick="openEditUserModal(${user.UserID})">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteUser(${user.UserID})">Delete</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                console.error('Error loading users:', data.error);
            }
        })
        .catch(error => console.error('Error:', error));
}

function handleAddUser(event) {
    event.preventDefault();
    
    const data = {
        fullname: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        membershiptdate: document.getElementById('userDate').value
    };
    
    fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('User added successfully!', 'success');
            document.getElementById('addUserForm').reset();
            loadUsers();
            populateSelectLists();
        } else {
            showNotification(data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred', 'error');
    });
}

function openEditUserModal(userId) {
    fetch(`${API_BASE_URL}/users/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const user = data.data;
                document.getElementById('editUserId').value = user.UserID;
                document.getElementById('editUserName').value = user.FullName;
                document.getElementById('editUserEmail').value = user.Email;
                document.getElementById('editUserDate').value = user.MembershipDate;
                
                openModal('editUserModal');
            }
        })
        .catch(error => console.error('Error:', error));
}

function handleEditUser(event) {
    event.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const data = {
        fullname: document.getElementById('editUserName').value,
        email: document.getElementById('editUserEmail').value,
        membershiptdate: document.getElementById('editUserDate').value
    };
    
    fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('User updated successfully!', 'success');
            closeModal('editUserModal');
            loadUsers();
        } else {
            showNotification(data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred', 'error');
    });
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('User deleted successfully!', 'success');
                loadUsers();
                populateSelectLists();
            } else {
                showNotification(data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred', 'error');
        });
    }
}

function filterUsers() {
    const input = document.getElementById('userSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });
}

// ============================================================================
// TRANSACTIONS MANAGEMENT
// ============================================================================

function loadTransactions() {
    const statusFilter = document.getElementById('transactionStatusFilter').value;
    
    fetch(`${API_BASE_URL}/transactions`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('transactionsTableBody');
                tbody.innerHTML = '';
                
                let transactions = data.data;
                
                if (statusFilter) {
                    transactions = transactions.filter(t => t.Status === statusFilter);
                }
                
                if (transactions.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" class="text-center">No transactions found</td></tr>';
                    return;
                }
                
                transactions.forEach(transaction => {
                    const row = document.createElement('tr');
                    const statusClass = `status-${transaction.Status.toLowerCase()}`;
                    const returnButtonDisabled = transaction.Status === 'Returned';
                    
                    row.innerHTML = `
                        <td>${transaction.TransactionID}</td>
                        <td>${transaction.FullName}</td>
                        <td>${transaction.Title}</td>
                        <td>${transaction.IssueDate}</td>
                        <td>${transaction.DueDate}</td>
                        <td>${transaction.ReturnDate || '-'}</td>
                        <td><span class="${statusClass}">${transaction.Status}</span></td>
                        <td>
                            ${!returnButtonDisabled ? `<button class="btn btn-success btn-small" onclick="returnBook(${transaction.TransactionID})">Return</button>` : '<span class="text-success">✓ Returned</span>'}
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                console.error('Error loading transactions:', data.error);
            }
        })
        .catch(error => console.error('Error:', error));
}

function handleIssueBook(event) {
    event.preventDefault();
    
    const userId = document.getElementById('issueUserSelect').value;
    const bookId = document.getElementById('issueBookSelect').value;
    const daysBorrowed = document.getElementById('issueDays').value;
    
    if (!userId || !bookId) {
        showNotification('Please select a user and a book', 'error');
        return;
    }
    
    const data = {
        user_id: parseInt(userId),
        book_id: parseInt(bookId),
        days_borrowed: parseInt(daysBorrowed)
    };
    
    fetch(`${API_BASE_URL}/issue-book`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Book issued successfully!', 'success');
            document.getElementById('issueBookForm').reset();
            loadTransactions();
            loadBooks();
        } else {
            showNotification(data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred', 'error');
    });
}

function returnBook(transactionId) {
    if (confirm('Are you sure you want to mark this book as returned?')) {
        fetch(`${API_BASE_URL}/return-book/${transactionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Book returned successfully!', 'success');
                loadTransactions();
                loadBooks();
            } else {
                showNotification(data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred', 'error');
        });
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function populateSelectLists() {
    // Populate user select
    fetch(`${API_BASE_URL}/users`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('issueUserSelect');
                const currentValue = select.value;
                select.innerHTML = '<option value="">-- Select User --</option>';
                
                data.data.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.UserID;
                    option.textContent = user.FullName;
                    select.appendChild(option);
                });
                
                select.value = currentValue;
            }
        });
    
    // Populate book select
    fetch(`${API_BASE_URL}/books`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('issueBookSelect');
                const currentValue = select.value;
                select.innerHTML = '<option value="">-- Select Book --</option>';
                
                data.data.forEach(book => {
                    if (book.QuantityAvailable > 0) {
                        const option = document.createElement('option');
                        option.value = book.BookID;
                        option.textContent = `${book.Title} by ${book.Author} (${book.QuantityAvailable} available)`;
                        select.appendChild(option);
                    }
                });
                
                select.value = currentValue;
            }
        });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
