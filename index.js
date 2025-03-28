const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Secret key for JWT (in real-world, use environment variable)
const JWT_SECRET = 'your_super_secret_key_2024!';

// In-memory storage (replace with database in production)
const users = [];
const events = [
    {
        id: 1,
        name: "Tech Conference 2024",
        description: "Annual technology conference",
        date: "2024-09-15",
        location: "Silicon Valley, CA",
        availableSeats: 250,
        price: 299.99
    },
    {
        id: 2,
        name: "Web Development Workshop",
        description: "Hands-on web development training",
        date: "2024-07-22",
        location: "New York, NY",
        availableSeats: 100,
        price: 199.50
    },
    {
        id: 3,
        name: "AI Innovation Summit",
        description: "Exploring the future of artificial intelligence",
        date: "2024-10-10",
        location: "Boston, MA",
        availableSeats: 150,
        price: 349.99
    }
];
const registrations = [];

// User Registration Endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, full_name, phone } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = users.find(u => u.email === email || u.username === username);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = {
            id: users.length + 1,
            username,
            email,
            password: hashedPassword,
            full_name,
            phone
        };

        users.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// User Login Endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get Events Endpoint
app.get('/api/events', (req, res) => {
    res.json(events);
});

// Event Registration Endpoint
app.post('/api/events/:id/register', (req, res) => {
    const eventId = parseInt(req.params.id);
    
    // Find the event
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    // Check seat availability
    if (event.availableSeats <= 0) {
        return res.status(400).json({ error: 'No seats available' });
    }

    // Reduce available seats
    event.availableSeats--;

    // Create registration
    const registration = {
        id: registrations.length + 1,
        eventId,
        eventName: event.name,
        registrationDate: new Date()
    };

    registrations.push(registration);

    res.status(201).json({
        message: 'Successfully registered for the event',
        registration,
        availableSeats: event.availableSeats
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export for potential testing
module.exports = app;
