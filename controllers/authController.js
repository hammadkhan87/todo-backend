import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/index.js';

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this";

// Register user
export async function register(req, res) {
  const { name, email, password } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: "All fields are required", 
        required: ["name", "email", "password"] 
      });
    }

    // Name validation
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 30) {
      return res.status(400).json({ 
        error: "Name must be between 2 and 30 characters long" 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Please provide a valid email address" 
      });
    }

    // Password validation
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1", 
      [email.toLowerCase().trim()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: "User with this email already exists" 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Store token in session
    req.session.token = token;
    req.session.userId = newUser.id;

    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      },
      token: token
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
}

// Login user
export async function login(req, res) {
  const { email, password } = req.body;

  try {
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Please provide a valid email address" 
      });
    }

    // Check if user exists
    const result = await pool.query(
      "SELECT id, name, email, password FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: "Invalid email or password" 
      });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: "Invalid email or password" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Store token in session
    req.session.token = token;
    req.session.userId = user.id;

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token: token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
}

// Logout user
export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    
    res.clearCookie('connect.sid');
    
    res.json({ 
      message: "Logged out successfully" 
    });
  });
}

// Check authentication status
export function authStatus(req, res) {
  if (req.session.token) {
    jwt.verify(req.session.token, JWT_SECRET, (err, user) => {
      if (!err) {
        return res.json({ 
          authenticated: true, 
          user: { userId: user.userId, email: user.email } 
        });
      }
    });
  }
  res.json({ authenticated: false });
}