const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect to MySQL with error handling
db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        process.exit(1); // Stop execution if DB connection fails
    }
    console.log('Connected to MySQL database');
});

// Handle DB connection loss
db.on('error', err => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reconnecting to database...');
        db.connect();
    }
});

// User Registration
app.post('/register', async (req, res) => {
    try {
        const { Aadharid, password } = req.body;

        if (!Aadharid || !password) {
            return res.status(400).json({ error: 'Aadharid and password are required' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        db.query('INSERT INTO users (Aadharid, password) VALUES (?, ?)', 
        [Aadharid, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error: ' + err.message });
            }
            res.json({ message: 'User registered successfully!' });
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
});

// User Login
app.post('/login', (req, res) => {
    const { Aadharid, password } = req.body;

    if (!Aadharid || !password) {
        return res.status(400).json({ error: 'Aadharid and password are required' });
    }

    // Query database for user
    db.query('SELECT * FROM users WHERE Aadharid = ?', [Aadharid], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = results[0];

        // Ensure user has a password before comparing
        if (!user.password) {
            return res.status(401).json({ error: 'Invalid user data' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, userId: user.id });
    });
});

// Submit Health Insurance Claim
app.post('/claim', (req, res) => {
    let { userId, insurance_type, reimbursement_amount, active_status, hospital_name, patient_name } = req.body;

    // Validate input fields
    if (!userId || !insurance_type || !reimbursement_amount || !active_status || !hospital_name || !patient_name) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (isNaN(userId) || isNaN(reimbursement_amount)) {
        return res.status(400).json({ error: 'Invalid user ID or reimbursement amount' });
    }

    reimbursement_amount = parseFloat(reimbursement_amount);

    // Insert claim into the database
    const query = `INSERT INTO claims 
                   (user_id, insurance_type, reimbursement_amount, active_status, hospital_name, patient_name) 
                   VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(query, [userId, insurance_type, reimbursement_amount, active_status, hospital_name, patient_name], 
    (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.json({ message: 'Claim submitted successfully!', claimId: result.insertId });
    });
});

// Fetch All Claims for a User
app.get('/claims/:userId', (req, res) => {
    const userId = req.params.userId;

    // Validate userId
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Query the database
    db.query('SELECT * FROM claims WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No claims found for this user' });
        }

        res.json(results);
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
