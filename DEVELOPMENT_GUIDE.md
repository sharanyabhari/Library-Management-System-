# 🔧 Development Guide - Library Management System

## Table of Contents
1. [Project Architecture](#project-architecture)
2. [How to Add Features](#how-to-add-features)
3. [Code Examples](#code-examples)
4. [Database Modifications](#database-modifications)
5. [API Extension Patterns](#api-extension-patterns)
6. [Frontend Customization](#frontend-customization)
7. [Debugging Guide](#debugging-guide)

---

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────┐
│              Web Browser (Frontend)             │
│         (HTML, CSS, JavaScript)                │
└─────────────┬───────────────────────────────────┘
              │ HTTP/JSON
              │
┌─────────────▼───────────────────────────────────┐
│         Flask Web Server (Backend)              │
│     (Python REST API)                          │
│   - Route handlers                             │
│   - Business logic                             │
│   - Error handling                             │
└─────────────┬───────────────────────────────────┘
              │ SQL
              │
┌─────────────▼───────────────────────────────────┐
│      SQLite Database                            │
│   - Users Table                                 │
│   - Books Table                                 │
│   - Transactions Table                         │
└─────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Separation of Concerns**
   - Backend: Data and business logic
   - Frontend: User interface and interaction

2. **REST API Pattern**
   - Standard HTTP methods (GET, POST, PUT, DELETE)
   - JSON request/response format
   - Stateless requests

3. **Raw SQL Approach**
   - Direct database control
   - Better performance understanding
   - Educational value

---

## 🎯 How to Add Features

### Feature: Add a Fine System for Overdue Books

#### Step 1: Modify Database Schema

Add a new table to track fines:

```python
# In backend/init_db.py, add this in init_database() function:

cursor.execute('''
    CREATE TABLE IF NOT EXISTS Fines (
        FineID INTEGER PRIMARY KEY AUTOINCREMENT,
        TransactionID INTEGER NOT NULL,
        Amount REAL NOT NULL,
        DateCreated TEXT NOT NULL,
        Status TEXT DEFAULT 'Unpaid' CHECK(Status IN ('Paid', 'Unpaid')),
        FOREIGN KEY (TransactionID) REFERENCES Transactions(TransactionID)
    )
''')
```

#### Step 2: Add Backend Route

In `backend/app.py`, add new routes:

```python
@app.route('/api/fines', methods=['GET'])
def get_all_fines():
    """Get all fines"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = '''
            SELECT f.FineID, f.TransactionID, t.UserID, u.FullName, 
                   f.Amount, f.DateCreated, f.Status
            FROM Fines f
            JOIN Transactions t ON f.TransactionID = t.TransactionID
            JOIN Users u ON t.UserID = u.UserID
            ORDER BY f.DateCreated DESC
        '''
        cursor.execute(query)
        fines = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return jsonify({'success': True, 'data': fines}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/fines/<int:fine_id>/pay', methods=['POST'])
def pay_fine(fine_id):
    """Mark fine as paid"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = 'UPDATE Fines SET Status = "Paid" WHERE FineID = ?'
        cursor.execute(query, (fine_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Fine marked as paid'}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

#### Step 3: Add Frontend HTML

In `frontend/index.html`, add a new section:

```html
<!-- In the main element, add: -->
<section id="fines" class="section">
    <div class="section-title">Fines Management</div>
    
    <div class="list-container">
        <h3>Overdue Fines</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Transaction ID</th>
                    <th>User</th>
                    <th>Fine Amount</th>
                    <th>Date Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="finesTableBody">
                <!-- Fines will be loaded here -->
            </tbody>
        </table>
    </div>
</section>

<!-- Add to navbar: -->
<li><a href="#fines" class="nav-link" onclick="showSection('fines')">Fines</a></li>
```

#### Step 4: Add Frontend JavaScript

In `frontend/js/script.js`, add:

```javascript
function loadFines() {
    fetch(`${API_BASE_URL}/fines`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('finesTableBody');
                tbody.innerHTML = '';
                
                data.data.forEach(fine => {
                    const row = document.createElement('tr');
                    const statusClass = fine.Status === 'Paid' ? 'status-returned' : 'status-issued';
                    
                    row.innerHTML = `
                        <td>${fine.TransactionID}</td>
                        <td>${fine.FullName}</td>
                        <td>$${fine.Amount.toFixed(2)}</td>
                        <td>${fine.DateCreated}</td>
                        <td><span class="${statusClass}">${fine.Status}</span></td>
                        <td>
                            ${fine.Status === 'Unpaid' ? 
                                `<button class="btn btn-success btn-small" onclick="payFine(${fine.FineID})">Pay</button>` : 
                                '<span class="text-success">✓ Paid</span>'}
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
        });
}

function payFine(fineId) {
    if (confirm('Mark this fine as paid?')) {
        fetch(`${API_BASE_URL}/fines/${fineId}/pay`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Fine paid successfully!', 'success');
                loadFines();
            } else {
                showNotification(data.error, 'error');
            }
        });
    }
}

// Add to showSection() function:
else if (sectionId === 'fines') {
    loadFines();
}

// Add to DOMContentLoaded:
loadFines();
setInterval(loadFines, 30000);

// Add to navbar nav-menu:
document.getElementById('finesLink') = 'Fines';
```

---

## 💻 Code Examples

### Example 1: Create a New API Endpoint

```python
# Pattern for adding a new GET endpoint
@app.route('/api/books/available', methods=['GET'])
def get_available_books():
    """Get only books with available copies"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Write your SQL query
        query = '''
            SELECT BookID, Title, Author, QuantityAvailable
            FROM Books
            WHERE QuantityAvailable > 0
            ORDER BY Title ASC
        '''
        cursor.execute(query)
        books = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return jsonify({'success': True, 'data': books}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

### Example 2: Create a New Frontend Function

```javascript
function loadAvailableBooks() {
    fetch(`${API_BASE_URL}/books/available`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('availableBooksSelect');
                select.innerHTML = '<option value="">-- Select Book --</option>';
                
                data.data.forEach(book => {
                    const option = document.createElement('option');
                    option.value = book.BookID;
                    option.textContent = `${book.Title} (${book.QuantityAvailable} available)`;
                    select.appendChild(option);
                });
            }
        });
}
```

### Example 3: Add Form Validation

```javascript
function validateBookForm(data) {
    // Check if title is not empty
    if (!data.title || data.title.trim().length === 0) {
        showNotification('Title cannot be empty', 'error');
        return false;
    }
    
    // Check if ISBN format is valid (simple check)
    if (!/^\d{10,13}$/.test(data.isbn.replace(/-/g, ''))) {
        showNotification('ISBN must be 10 or 13 digits', 'error');
        return false;
    }
    
    // Check if quantity is positive
    if (data.quantity <= 0) {
        showNotification('Quantity must be at least 1', 'error');
        return false;
    }
    
    return true;
}
```

---

## 🗄️ Database Modifications

### Adding a New Column to Existing Table

```python
# In backend/init_db.py, modify the Books table creation:

cursor.execute('''
    ALTER TABLE Books
    ADD COLUMN Category TEXT DEFAULT 'General'
''')
```

### Creating a New Index

```python
# In backend/init_db.py:

# Add this to the init_database() function
cursor.execute('CREATE INDEX IF NOT EXISTS idx_books_category ON Books(Category)')
```

### Creating a Complex Query

```python
# Get user borrowing statistics
query = '''
    SELECT 
        u.UserID,
        u.FullName,
        COUNT(t.TransactionID) as total_borrowed,
        COUNT(CASE WHEN t.Status = 'Returned' THEN 1 END) as total_returned,
        COUNT(CASE WHEN t.Status = 'Issued' THEN 1 END) as currently_borrowed,
        AVG(CAST((julianday(COALESCE(t.ReturnDate, 'now')) - julianday(t.IssueDate)) AS REAL)) as avg_days_borrowed
    FROM Users u
    LEFT JOIN Transactions t ON u.UserID = t.UserID
    GROUP BY u.UserID
    ORDER BY currently_borrowed DESC
'''
```

---

## 📡 API Extension Patterns

### Pattern 1: Filter and Sort

```python
@app.route('/api/books/search', methods=['GET'])
def search_books():
    """Search and filter books"""
    try:
        # Get query parameters
        title = request.args.get('title', '')
        author = request.args.get('author', '')
        sort_by = request.args.get('sort', 'title')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build dynamic query
        query = 'SELECT * FROM Books WHERE 1=1'
        params = []
        
        if title:
            query += ' AND Title LIKE ?'
            params.append(f'%{title}%')
        
        if author:
            query += ' AND Author LIKE ?'
            params.append(f'%{author}%')
        
        query += f' ORDER BY {sort_by} ASC'
        
        cursor.execute(query, params)
        books = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return jsonify({'success': True, 'data': books}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

### Pattern 2: Pagination

```python
@app.route('/api/books/paginated', methods=['GET'])
def get_books_paginated():
    """Get books with pagination"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute('SELECT COUNT(*) as count FROM Books')
        total = cursor.fetchone()['count']
        
        # Get paginated data
        query = 'SELECT * FROM Books ORDER BY Title ASC LIMIT ? OFFSET ?'
        cursor.execute(query, (per_page, offset))
        books = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': books,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

---

## 🎨 Frontend Customization

### Change Color Scheme

In `frontend/css/style.css`, modify the `:root` variables:

```css
:root {
    --primary-color: #1a3a52;      /* Dark blue */
    --secondary-color: #2ecc71;    /* Green */
    --success-color: #27ae60;
    --danger-color: #e74c3c;
    --warning-color: #f39c12;
    --light-gray: #ecf0f1;
    --dark-gray: #34495e;
    --border-color: #bdc3c7;
    --text-color: #2c3e50;
    --background-color: #f8f9fa;
}
```

### Add a Custom Component

```html
<!-- Custom Statistics Card -->
<div class="custom-stat-card">
    <div class="stat-icon">📖</div>
    <h3>Most Read Book</h3>
    <p class="stat-highlight" id="mostReadBook">Loading...</p>
</div>
```

```css
.custom-stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.stat-icon {
    font-size: 2rem;
    margin-bottom: 10px;
}

.stat-highlight {
    font-size: 1.3rem;
    font-weight: bold;
}
```

---

## 🐛 Debugging Guide

### Backend Debugging

```python
# Add logging to your routes
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.route('/api/books', methods=['GET'])
def get_all_books():
    logger.debug('Fetching all books...')
    try:
        # ... code ...
        logger.debug(f'Found {len(books)} books')
        return jsonify({'success': True, 'data': books}), 200
    except Exception as e:
        logger.error(f'Error fetching books: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500
```

### Frontend Debugging

```javascript
// Add detailed logging
function loadBooks() {
    console.log('Starting to load books...');
    
    fetch(`${API_BASE_URL}/books`)
        .then(response => {
            console.log('Response received:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Data parsed:', data);
            if (data.success) {
                console.log(`Found ${data.data.length} books`);
                // ... rest of code ...
            } else {
                console.error('API returned error:', data.error);
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
}
```

### Common Issues and Solutions

```
Issue: "TypeError: Cannot read property 'length' of undefined"
Solution: Check if API returned data in expected format
         Log the response to see what's returned

Issue: CORS error when calling API
Solution: Make sure Flask-CORS is installed
         Check that @CORS(app) is in app.py

Issue: Database locked error
Solution: Close the browser and restart Flask
         Only one Python process can use the database at a time

Issue: 404 error on API endpoint
Solution: Check route definition matches the API call
         Verify method (GET, POST, etc.) matches
         Check for typos in endpoint name
```

---

## 📚 Testing Your Changes

### Test a New Endpoint

```bash
# Using curl (Windows PowerShell)
curl -X GET "http://localhost:5000/api/books"

# Or with Python
import requests
response = requests.get('http://localhost:5000/api/books')
print(response.json())
```

### Test a POST Request

```bash
curl -X POST "http://localhost:5000/api/books" `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Test Book",
    "author": "Test Author",
    "isbn": "1234567890",
    "quantitytotal": 5
  }'
```

---

## 🔄 Development Workflow

1. **Plan Your Feature**
   - Decide what data you need
   - Plan database changes if needed
   - Design API endpoints

2. **Update Database** (if needed)
   - Modify schema in `init_db.py`
   - Test database creation
   - Consider data migration

3. **Add Backend Route**
   - Write Flask route in `app.py`
   - Add SQL query
   - Test with curl or Postman

4. **Add Frontend Element**
   - Create HTML in `index.html`
   - Add styling in `style.css`
   - Create JavaScript function in `script.js`

5. **Test Everything**
   - Test each endpoint
   - Test form validation
   - Test error cases

6. **Document**
   - Add comments to code
   - Update API documentation
   - Update README if needed

---

## 🚀 Best Practices

### Always Use Parameterized Queries
```python
# ✅ Good - Prevents SQL injection
cursor.execute('SELECT * FROM Users WHERE Email = ?', (email,))

# ❌ Bad - Vulnerable to SQL injection
cursor.execute(f"SELECT * FROM Users WHERE Email = '{email}'")
```

### Always Validate Input
```python
# ✅ Good
if not data.get('email') or '@' not in data['email']:
    return jsonify({'success': False, 'error': 'Invalid email'}), 400

# ❌ Bad - No validation
cursor.execute('INSERT INTO Users VALUES (?, ?)', (name, email))
```

### Use Descriptive Names
```python
# ✅ Good
transaction_id = cursor.lastrowid
available_quantity = book['QuantityAvailable']

# ❌ Bad
id = cursor.lastrowid
qty = book['QuantityAvailable']
```

### Add Error Handling
```python
# ✅ Good
try:
    cursor.execute(query)
    conn.commit()
except sqlite3.IntegrityError:
    return jsonify({'error': 'Email already exists'}), 400
except Exception as e:
    return jsonify({'error': str(e)}), 500

# ❌ Bad - No error handling
cursor.execute(query)
conn.commit()
```

---

## 📞 Getting Help

When stuck:
1. Check the error message in the browser console (F12)
2. Check the Flask server terminal output
3. Review similar existing code
4. Add logging/console.log to trace execution
5. Check SQL_REFERENCE.md for query examples

---

**Happy coding and extending! 🚀**
