# Library Management System

A complete full-stack web application for managing library books, users, and transactions. Built with Flask backend and vanilla HTML/CSS/JavaScript frontend, using SQLite with raw SQL queries for optimal DBMS performance.

## 📋 Project Overview

This system provides:
- **User Management**: Add, view, update, and delete library members
- **Book Inventory**: Manage book catalog with availability tracking
- **Transaction Management**: Issue and return books with due date tracking
- **Dashboard Statistics**: Real-time insights into library operations
- **Relational Database**: Proper schema with foreign keys and constraints

## 📁 Project Structure

```
Library Management System/
│
├── backend/
│   ├── init_db.py           # Database initialization & schema
│   ├── app.py               # Flask application with all API routes
│   └── library_management.db # SQLite database (auto-created)
│
├── frontend/
│   ├── index.html           # Main HTML template
│   ├── css/
│   │   └── style.css        # Styling
│   └── js/
│       └── script.js        # Frontend logic & API calls
│
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    FullName TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    MembershipDate TEXT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Books Table
```sql
CREATE TABLE Books (
    BookID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Author TEXT NOT NULL,
    ISBN TEXT UNIQUE NOT NULL,
    QuantityTotal INTEGER NOT NULL CHECK(QuantityTotal > 0),
    QuantityAvailable INTEGER NOT NULL CHECK(QuantityAvailable >= 0),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Transactions Table
```sql
CREATE TABLE Transactions (
    TransactionID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    BookID INTEGER NOT NULL,
    IssueDate TEXT NOT NULL,
    DueDate TEXT NOT NULL,
    ReturnDate TEXT,
    Status TEXT NOT NULL DEFAULT 'Issued' CHECK(Status IN ('Issued', 'Returned', 'Overdue')),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE
)
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- A modern web browser

### Installation Steps

1. **Navigate to the backend directory:**
   ```bash
   cd "Library Management System\backend"
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r ..\requirements.txt
   ```

3. **Initialize the database (creates tables and sample data):**
   ```bash
   python init_db.py
   ```
   
   This will:
   - Create `library_management.db`
   - Set up all required tables with constraints and indexes
   - Insert sample data for testing

4. **Start the Flask development server:**
   ```bash
   python app.py
   ```
   
   You should see:
   ```
   * Running on http://0.0.0.0:5000
   * Debug mode: on
   ```

5. **Open the application:**
   - Open your web browser
   - Navigate to `http://localhost:5000`
   - The system is ready to use!

## 📖 API Endpoints Reference

### Users Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/<id>` - Get specific user
- `POST /api/users` - Add new user
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user

### Books Endpoints
- `GET /api/books` - Get all books
- `GET /api/books/<id>` - Get specific book
- `POST /api/books` - Add new book
- `PUT /api/books/<id>` - Update book
- `DELETE /api/books/<id>` - Delete book

### Transactions Endpoints
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/user/<id>` - Get user's transactions
- `POST /api/issue-book` - Issue a book to user
- `POST /api/return-book/<id>` - Return a book

### Dashboard
- `GET /api/stats` - Get dashboard statistics

## 💡 Key Features

### 1. Database Design
- **Relational Schema**: Properly normalized with primary and foreign keys
- **Data Integrity**: CHECK constraints for quantity validation
- **Performance**: Indexed columns for fast queries (Email, ISBN, Title, Status)
- **Cascading Deletes**: Automatic cleanup of transactions when users/books are deleted
- **Timestamps**: Automatic tracking of creation dates

### 2. Book Issue/Return Logic
```
Issue Book:
1. Check if book has available copies
2. Create transaction record with issue date and due date
3. Decrement QuantityAvailable in Books table

Return Book:
1. Verify transaction exists and is in 'Issued' status
2. Update transaction with return date and set status to 'Returned'
3. Increment QuantityAvailable in Books table
```

### 3. CRUD Operations
All operations use raw SQL queries with parameterized statements to prevent SQL injection:
- Dynamic SQL generation for flexible updates
- Proper error handling and validation
- Transaction support for data consistency

### 4. Frontend Features
- Clean, modern responsive UI
- Real-time data updates
- Search and filter functionality
- Modal dialogs for editing
- Toast notifications for user feedback
- Statistics dashboard with auto-refresh

## 🔧 Sample Data

The system comes with sample data for testing:

**Users:**
- Alice Johnson (alice@example.com)
- Bob Smith (bob@example.com)
- Carol Davis (carol@example.com)
- David Wilson (david@example.com)

**Books:**
- To Kill a Mockingbird by Harper Lee
- 1984 by George Orwell
- The Great Gatsby by F. Scott Fitzgerald
- Pride and Prejudice by Jane Austen
- The Catcher in the Rye by J.D. Salinger
- Animal Farm by George Orwell

**Sample Transactions:**
- Alice issued "To Kill a Mockingbird"
- Bob returned "1984" (completed)
- Carol issued "The Great Gatsby"

## 📝 Usage Tips

### Adding a Book
1. Go to "Books" section
2. Fill in Title, Author, ISBN, and Quantity
3. Click "Add Book"
4. Book appears in the books list immediately

### Adding a User
1. Go to "Users" section
2. Fill in Full Name, Email, and Membership Date
3. Click "Add User"
4. User appears in the users list immediately

### Issuing a Book
1. Go to "Transactions" section
2. Select a user and an available book
3. Set the borrowing period (days)
4. Click "Issue Book"
5. Book quantity automatically decreases

### Returning a Book
1. Go to "Transactions" section
2. Find the issued transaction
3. Click "Return" button
4. Status changes to "Returned" and quantity increases

## 🔒 Data Validation

- **Email**: Must be unique and valid format
- **ISBN**: Must be unique across all books
- **Quantities**: Must be positive integers
- **Dates**: Proper ISO format (YYYY-MM-DD)
- **Status**: Limited to 'Issued', 'Returned', 'Overdue'

## 🐛 Troubleshooting

### Database Issues
**Problem**: "database is locked"
- **Solution**: Close all other applications accessing the database and restart Flask

### Port Already in Use
**Problem**: "Address already in use"
- **Solution**: The port 5000 is in use. Either:
  - Stop the other Flask instance: `Ctrl+C` in terminal
  - Or modify the port in `app.py`: Change `port=5000` to another port

### CORS Errors
**Problem**: API calls are blocked
- **Solution**: Ensure Flask-CORS is installed (`pip install flask-cors`)

### Database Not Initializing
**Problem**: "library_management.db" file not created
- **Solution**: Run `python init_db.py` from the backend directory

## 🎨 Customization

### Change Server Port
In `backend/app.py`, modify:
```python
app.run(debug=True, host='0.0.0.0', port=YOUR_PORT_HERE)
```

### Modify Colors
In `frontend/css/style.css`, update CSS variables in `:root`:
```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    /* ... other colors ... */
}
```

### Adjust Auto-Refresh Rate
In `frontend/js/script.js`, modify the interval (milliseconds):
```javascript
setInterval(loadDashboard, 30000); // Change 30000 to desired interval
```

## 📊 Performance Considerations

- **Indexes**: Database has indexes on frequently queried columns
- **Pagination**: Can be added for large datasets
- **Query Optimization**: Uses efficient JOIN operations
- **Connection Pooling**: Can be implemented with database library upgrades

## 🔐 Security Recommendations

For production use:
1. Use environment variables for configuration
2. Implement authentication and authorization
3. Use connection pool for database
4. Add HTTPS/SSL
5. Implement rate limiting
6. Add input sanitization
7. Use prepared statements (already done with parameterized queries)

## 📄 License

This project is open source and available for educational and commercial use.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database schema
3. Check Flask and CORS are installed: `pip list`
4. Verify the database file exists in the backend directory

---

**Created with ❤️ for library management excellence**
