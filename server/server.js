const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Data file paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const TASKS_FILE = path.join(__dirname, 'data', 'tasks.json');

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Initialize data files
async function initDataFiles() {
    await ensureDataDir();
    
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify([]));
    }
    
    try {
        await fs.access(TASKS_FILE);
    } catch {
        await fs.writeFile(TASKS_FILE, JSON.stringify([]));
    }
}

// Read data from file
async function readData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Write data to file
async function writeData(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Register new user
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const users = await readData(USERS_FILE);
        
        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeData(USERS_FILE, users);

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
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
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const users = await readData(USERS_FILE);
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get current user (verify token)
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const users = await readData(USERS_FILE);
        const user = users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all tasks for authenticated user
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await readData(TASKS_FILE);
        // Ensure tasks have a priority field (default 'low')
        const userTasks = tasks
            .filter(task => task.userId === req.user.id)
            .map(task => ({ ...task, priority: task.priority || 'low' }));
        res.json(userTasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new task
app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { text, priority, status } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Task text is required' });
        }

        // validate priority
        const allowed = ['low', 'medium', 'high'];
        const p = allowed.includes(priority) ? priority : 'low';

        const tasks = await readData(TASKS_FILE);

        const newTask = {
            id: Date.now().toString(),
            userId: req.user.id,
            text: text.trim(),
            completed: false,
            priority: p,
            status: status || 'todo',
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        await writeData(TASKS_FILE, tasks);

        res.status(201).json(newTask);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update task
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { text, completed, priority, status } = req.body;

        const tasks = await readData(TASKS_FILE);
        const taskIndex = tasks.findIndex(t => t.id === id && t.userId === req.user.id);

        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }

        if (text !== undefined) {
            tasks[taskIndex].text = text.trim();
        }
        if (completed !== undefined) {
            tasks[taskIndex].completed = completed;
        }
        if (priority !== undefined) {
            const allowed = ['low', 'medium', 'high'];
            tasks[taskIndex].priority = allowed.includes(priority) ? priority : 'low';
        }
        if (status !== undefined) {
            const allowedStatuses = ['todo', 'inprogress', 'done'];
            tasks[taskIndex].status = allowedStatuses.includes(status) ? status : tasks[taskIndex].status || 'todo';
        }

        await writeData(TASKS_FILE, tasks);

        res.json(tasks[taskIndex]);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const tasks = await readData(TASKS_FILE);
        const taskIndex = tasks.findIndex(t => t.id === id && t.userId === req.user.id);

        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }

        tasks.splice(taskIndex, 1);
        await writeData(TASKS_FILE, tasks);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete all completed tasks
app.delete('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await readData(TASKS_FILE);
        const filteredTasks = tasks.filter(t => !(t.userId === req.user.id && t.completed));
        await writeData(TASKS_FILE, filteredTasks);

        res.json({ message: 'Completed tasks deleted successfully' });
    } catch (error) {
        console.error('Delete completed tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve client app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Initialize and start server
async function startServer() {
    await initDataFiles();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();

