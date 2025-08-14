import pool from '../database/index.js';

// Get user profile
export async function getProfile(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    res.json({
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
}