-- Example SQL Backup File
-- This file demonstrates various SQL structures that the converter can handle

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE products (
    product_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2),
    category VARCHAR(50),
    description TEXT,
    in_stock BOOLEAN DEFAULT FALSE
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    user_id INT,
    order_date DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending'
);

-- Insert data into users table
INSERT INTO users (id, username, email, created_at, is_active) VALUES 
(1, 'john_doe', 'john@example.com', '2024-01-15 10:30:00', TRUE),
(2, 'jane_smith', 'jane@example.com', '2024-01-16 14:20:00', TRUE),
(3, 'bob_wilson', 'bob@example.com', '2024-01-17 09:15:00', FALSE),
(4, 'alice_brown', 'alice@example.com', '2024-01-18 16:45:00', TRUE);

-- Insert data into products table
INSERT INTO products (product_id, name, price, category, description, in_stock) VALUES 
(101, 'Laptop', 999.99, 'Electronics', 'High-performance laptop with latest specs', TRUE),
(102, 'Mouse', 29.99, 'Electronics', 'Wireless optical mouse', TRUE),
(103, 'Keyboard', 89.99, 'Electronics', 'Mechanical gaming keyboard', FALSE),
(104, 'Monitor', 299.99, 'Electronics', '27-inch 4K monitor', TRUE),
(105, 'Headphones', 149.99, 'Audio', 'Noise-cancelling wireless headphones', TRUE);

-- Insert data into orders table
INSERT INTO orders (order_id, user_id, order_date, total_amount, status) VALUES 
(1001, 1, '2024-01-20', 1029.98, 'completed'),
(1002, 2, '2024-01-21', 449.98, 'shipped'),
(1003, 1, '2024-01-22', 89.99, 'pending'),
(1004, 3, '2024-01-23', 149.99, 'cancelled'),
(1005, 4, '2024-01-24', 299.99, 'completed');
