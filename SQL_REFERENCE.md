-- ============================================================================
-- Library Management System - SQL Queries Reference
-- ============================================================================
-- This document contains all SQL queries used in the system for reference
-- All queries use parameterized statements (?) to prevent SQL injection
-- ============================================================================

-- ============================================================================
-- TABLE CREATION QUERIES (from init_db.py)
-- ============================================================================

-- Create Users Table
CREATE TABLE IF NOT EXISTS Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    FullName TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    MembershipDate TEXT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Books Table
CREATE TABLE IF NOT EXISTS Books (
    BookID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Author TEXT NOT NULL,
    ISBN TEXT UNIQUE NOT NULL,
    QuantityTotal INTEGER NOT NULL CHECK(QuantityTotal > 0),
    QuantityAvailable INTEGER NOT NULL CHECK(QuantityAvailable >= 0),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS Transactions (
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
);

-- ============================================================================
-- INDEX CREATION (for performance optimization)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON Users(Email);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON Books(ISBN);
CREATE INDEX IF NOT EXISTS idx_books_title ON Books(Title);
CREATE INDEX IF NOT EXISTS idx_transactions_userid ON Transactions(UserID);
CREATE INDEX IF NOT EXISTS idx_transactions_bookid ON Transactions(BookID);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON Transactions(Status);

-- ============================================================================
-- USER CRUD OPERATIONS
-- ============================================================================

-- GET: Retrieve all users (sorted by name)
SELECT UserID, FullName, Email, MembershipDate, CreatedAt
FROM Users
ORDER BY FullName ASC;

-- GET: Retrieve a specific user by ID
SELECT UserID, FullName, Email, MembershipDate, CreatedAt
FROM Users
WHERE UserID = ?;

-- POST: Add a new user
INSERT INTO Users (FullName, Email, MembershipDate)
VALUES (?, ?, ?);

-- PUT: Update a specific user
UPDATE Users
SET FullName = ?,
    Email = ?,
    MembershipDate = ?
WHERE UserID = ?;

-- DELETE: Delete a user (cascades to transactions)
DELETE FROM Users WHERE UserID = ?;

-- ============================================================================
-- BOOKS CRUD OPERATIONS
-- ============================================================================

-- GET: Retrieve all books (sorted by title)
SELECT BookID, Title, Author, ISBN, QuantityTotal, QuantityAvailable, CreatedAt
FROM Books
ORDER BY Title ASC;

-- GET: Retrieve a specific book by ID
SELECT BookID, Title, Author, ISBN, QuantityTotal, QuantityAvailable, CreatedAt
FROM Books
WHERE BookID = ?;

-- POST: Add a new book
INSERT INTO Books (Title, Author, ISBN, QuantityTotal, QuantityAvailable)
VALUES (?, ?, ?, ?, ?);

-- PUT: Update a specific book
UPDATE Books
SET Title = ?,
    Author = ?,
    ISBN = ?,
    QuantityTotal = ?
WHERE BookID = ?;

-- DELETE: Delete a book (cascades to transactions)
DELETE FROM Books WHERE BookID = ?;

-- ============================================================================
-- TRANSACTION CRUD OPERATIONS
-- ============================================================================

-- GET: Retrieve all transactions with user and book details
SELECT 
    t.TransactionID,
    t.UserID,
    u.FullName,
    t.BookID,
    b.Title,
    t.IssueDate,
    t.DueDate,
    t.ReturnDate,
    t.Status,
    t.CreatedAt
FROM Transactions t
JOIN Users u ON t.UserID = u.UserID
JOIN Books b ON t.BookID = b.BookID
ORDER BY t.CreatedAt DESC;

-- GET: Retrieve transactions for a specific user
SELECT 
    t.TransactionID,
    t.UserID,
    u.FullName,
    t.BookID,
    b.Title,
    t.IssueDate,
    t.DueDate,
    t.ReturnDate,
    t.Status,
    t.CreatedAt
FROM Transactions t
JOIN Users u ON t.UserID = u.UserID
JOIN Books b ON t.BookID = b.BookID
WHERE t.UserID = ?
ORDER BY t.CreatedAt DESC;

-- GET: Retrieve a specific transaction
SELECT TransactionID, UserID, BookID, IssueDate, DueDate, ReturnDate, Status
FROM Transactions
WHERE TransactionID = ?;

-- ============================================================================
-- ISSUE BOOK OPERATIONS
-- ============================================================================

-- Step 1: Check if user exists
SELECT UserID FROM Users WHERE UserID = ?;

-- Step 2: Check if book exists and has available copies
SELECT QuantityAvailable FROM Books WHERE BookID = ?;

-- Step 3: Create a new transaction record (ISSUE)
INSERT INTO Transactions (UserID, BookID, IssueDate, DueDate, Status)
VALUES (?, ?, ?, ?, 'Issued');

-- Step 4: Decrement available quantity (ISSUE)
UPDATE Books
SET QuantityAvailable = QuantityAvailable - 1
WHERE BookID = ?;

-- ============================================================================
-- RETURN BOOK OPERATIONS
-- ============================================================================

-- Step 1: Check if transaction exists and is still issued
SELECT TransactionID, BookID FROM Transactions 
WHERE TransactionID = ? AND Status = 'Issued';

-- Step 2: Update transaction record with return date (RETURN)
UPDATE Transactions
SET ReturnDate = ?, Status = 'Returned'
WHERE TransactionID = ?;

-- Step 3: Increment available quantity (RETURN)
UPDATE Books
SET QuantityAvailable = QuantityAvailable + 1
WHERE BookID = ?;

-- ============================================================================
-- DASHBOARD STATISTICS
-- ============================================================================

-- Total number of users
SELECT COUNT(*) as count FROM Users;

-- Total number of books
SELECT COUNT(*) as count FROM Books;

-- Number of active (issued) transactions
SELECT COUNT(*) as count FROM Transactions WHERE Status = 'Issued';

-- Total number of transactions
SELECT COUNT(*) as count FROM Transactions;

-- Total books available across all inventory
SELECT SUM(QuantityAvailable) as count FROM Books;

-- ============================================================================
-- ADVANCED QUERIES (for analysis)
-- ============================================================================

-- Get books with low availability (less than 2 copies)
SELECT BookID, Title, Author, QuantityTotal, QuantityAvailable
FROM Books
WHERE QuantityAvailable < 2
ORDER BY QuantityAvailable ASC;

-- Get users with overdue books
SELECT DISTINCT u.UserID, u.FullName, u.Email, COUNT(t.TransactionID) as overdue_count
FROM Users u
INNER JOIN Transactions t ON u.UserID = t.UserID
WHERE t.Status = 'Issued' AND date(t.DueDate) < date('now')
GROUP BY u.UserID
ORDER BY overdue_count DESC;

-- Get most borrowed books
SELECT b.BookID, b.Title, COUNT(t.TransactionID) as borrow_count
FROM Books b
LEFT JOIN Transactions t ON b.BookID = t.BookID
GROUP BY b.BookID
ORDER BY borrow_count DESC
LIMIT 10;

-- Get user borrowing history
SELECT 
    t.TransactionID,
    b.Title,
    t.IssueDate,
    t.DueDate,
    t.ReturnDate,
    t.Status,
    CAST((julianday(COALESCE(t.ReturnDate, 'now')) - julianday(t.IssueDate)) AS INTEGER) as days_borrowed
FROM Transactions t
JOIN Books b ON t.BookID = b.BookID
WHERE t.UserID = ?
ORDER BY t.IssueDate DESC;

-- ============================================================================
-- DATA INTEGRITY CHECKS
-- ============================================================================

-- Verify all book quantities are non-negative
SELECT BookID, Title, QuantityTotal, QuantityAvailable
FROM Books
WHERE QuantityAvailable < 0 OR QuantityAvailable > QuantityTotal;

-- Check for orphaned transactions (referential integrity)
SELECT t.TransactionID, t.UserID, t.BookID
FROM Transactions t
LEFT JOIN Users u ON t.UserID = u.UserID
LEFT JOIN Books b ON t.BookID = b.BookID
WHERE u.UserID IS NULL OR b.BookID IS NULL;

-- Get transaction counts by status
SELECT Status, COUNT(*) as count
FROM Transactions
GROUP BY Status
ORDER BY count DESC;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Get database size information
PRAGMA table_info(Users);
PRAGMA table_info(Books);
PRAGMA table_info(Transactions);

-- Reset auto-increment counters (if needed)
-- DELETE FROM sqlite_sequence; -- WARNING: Do not run without backup!

-- Analyze query performance (run periodically)
ANALYZE;

-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- Insert sample users
INSERT INTO Users (FullName, Email, MembershipDate)
VALUES 
('Alice Johnson', 'alice@example.com', '2024-01-15'),
('Bob Smith', 'bob@example.com', '2024-02-20'),
('Carol Davis', 'carol@example.com', '2024-03-10'),
('David Wilson', 'david@example.com', '2024-03-25');

-- Insert sample books
INSERT INTO Books (Title, Author, ISBN, QuantityTotal, QuantityAvailable)
VALUES 
('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 5, 3),
('1984', 'George Orwell', '978-0-451-52494-2', 4, 2),
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 6, 4),
('Pride and Prejudice', 'Jane Austen', '978-0-14-143951-8', 3, 2),
('The Catcher in the Rye', 'J.D. Salinger', '978-0-316-76948-0', 4, 3),
('Animal Farm', 'George Orwell', '978-0-451-52634-2', 5, 5);

-- Insert sample transactions
INSERT INTO Transactions (UserID, BookID, IssueDate, DueDate, ReturnDate, Status)
VALUES 
(1, 1, '2024-11-01', '2024-11-15', NULL, 'Issued'),
(2, 2, '2024-11-02', '2024-11-16', '2024-11-14', 'Returned'),
(3, 3, '2024-11-03', '2024-11-17', NULL, 'Issued');

-- ============================================================================
-- QUERY OPTIMIZATION NOTES
-- ============================================================================

-- 1. All frequently searched columns (Email, ISBN, Title, UserID, BookID, Status) 
--    have indexes for O(log n) lookup time
--
-- 2. JOIN queries use indexed columns to minimize table scans
--
-- 3. All user input is parameterized (?) to prevent SQL injection
--
-- 4. Foreign Key constraints ensure referential integrity with CASCADE DELETE
--
-- 5. CHECK constraints prevent invalid data (e.g., negative quantities)
--
-- 6. UNIQUE constraints prevent duplicate emails and ISBNs
--
-- 7. DEFAULT CURRENT_TIMESTAMP tracks when records were created
--
-- 8. Status field limited to specific values via CHECK constraint
--
-- 9. Consider adding pagination for large result sets:
--    SELECT * FROM Books LIMIT ? OFFSET ?;
--
-- 10. Use EXPLAIN QUERY PLAN for analyzing slow queries in SQLite:
--     EXPLAIN QUERY PLAN SELECT ...;
