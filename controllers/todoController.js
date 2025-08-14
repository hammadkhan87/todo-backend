import pool from '../database/index.js';

// Create todo
export async function createTodo(req, res) {
  const { title, description, priority = 1, due_date } = req.body;
  const user_id = req.user.userId;

  try {
    // Validation
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ 
        error: "Title is required and must be a string" 
      });
    }

    if (title.trim().length === 0 || title.trim().length > 255) {
      return res.status(400).json({ 
        error: "Title must be between 1 and 255 characters" 
      });
    }

    if (description && typeof description !== 'string') {
      return res.status(400).json({ 
        error: "Description must be a string" 
      });
    }

    if (priority && (isNaN(priority) || priority < 1 || priority > 3)) {
      return res.status(400).json({ 
        error: "Priority must be a number between 1 and 3" 
      });
    }

    if (due_date) {
      const date = new Date(due_date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ 
          error: "Invalid due date format" 
        });
      }
    }

    // Insert todo
    const result = await pool.query(
      `INSERT INTO todos (user_id, title, description, priority, due_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, title.trim(), description, priority, due_date]
    );

    res.status(201).json({
      message: "Todo created successfully",
      todo: result.rows[0]
    });

  } catch (error) {
    console.error("Create todo error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
}

// Get all todos for user
export async function getTodos(req, res) {
  const user_id = req.user.userId;
  const { completed, priority, page = 1, limit = 10 } = req.query;
  
  try {
    let query = 'SELECT * FROM todos WHERE user_id = $1';
    const values = [user_id];
    let paramCount = 2;

    // Filter by completed status
    if (completed !== undefined) {
      query += ` AND completed = $${paramCount}`;
      values.push(completed === 'true');
      paramCount++;
    }

    // Filter by priority
    if (priority) {
      query += ` AND priority = $${paramCount}`;
      values.push(parseInt(priority));
      paramCount++;
    }

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), offset);

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM todos WHERE user_id = $1';
    const countValues = [user_id];
    let countParam = 2;

    if (completed !== undefined) {
      countQuery += ` AND completed = $${countParam}`;
      countValues.push(completed === 'true');
      countParam++;
    }

    if (priority) {
      countQuery += ` AND priority = $${countParam}`;
      countValues.push(parseInt(priority));
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      todos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get todos error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
}

// Get single todo
export async function getTodoById(req, res) {
  const { id } = req.params;
  const user_id = req.user.userId;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        error: "Valid todo ID is required" 
      });
    }

    const result = await pool.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: "Todo not found" 
      });
    }

    res.json({
      todo: result.rows[0]
    });

  } catch (error) {
    console.error("Get todo error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
}

// Update todo
export async function updateTodo(req, res) {
  const { id } = req.params;
  const { title, description, priority, due_date, completed } = req.body;
  const user_id = req.user.userId;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        error: "Valid todo ID is required" 
      });
    }

    // Validation
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 255)) {
      return res.status(400).json({ 
        error: "Title must be between 1 and 255 characters" 
      });
    }

    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ 
        error: "Description must be a string" 
      });
    }

    if (priority !== undefined && (isNaN(priority) || priority < 1 || priority > 3)) {
      return res.status(400).json({ 
        error: "Priority must be a number between 1 and 3" 
      });
    }

    if (due_date !== undefined) {
      const date = new Date(due_date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ 
          error: "Invalid due date format" 
        });
      }
    }

    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ 
        error: "Completed must be a boolean value" 
      });
    }

    // Check if todo exists and belongs to user
    const existingTodo = await pool.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (existingTodo.rows.length === 0) {
      return res.status(404).json({ 
        error: "Todo not found" 
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title.trim());
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount}`);
      values.push(priority);
      paramCount++;
    }

    if (due_date !== undefined) {
      updates.push(`due_date = $${paramCount}`);
      values.push(due_date);
      paramCount++;
    }

    if (completed !== undefined) {
      updates.push(`completed = $${paramCount}`);
      values.push(completed);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    if (updates.length === 1) {
      return res.status(400).json({ 
        error: "No valid fields to update" 
      });
    }

    const query = `UPDATE todos SET ${updates.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;
    values.push(id, user_id);

    const result = await pool.query(query, values);

    res.json({
      message: "Todo updated successfully",
      todo: result.rows[0]
    });

  } catch (error) {
    console.error("Update todo error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
}

// Delete todo
export async function deleteTodo(req, res) {
  const { id } = req.params;
  const user_id = req.user.userId;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        error: "Valid todo ID is required" 
      });
    }

    // Check if todo exists and belongs to user
    const existingTodo = await pool.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (existingTodo.rows.length === 0) {
      return res.status(404).json({ 
        error: "Todo not found" 
      });
    }

    // Delete todo
    await pool.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    res.json({
      message: "Todo deleted successfully"
    });

  } catch (error) {
    console.error("Delete todo error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
}

// Toggle todo completion
export async function toggleTodo(req, res) {
  const { id } = req.params;
  const user_id = req.user.userId;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        error: "Valid todo ID is required" 
      });
    }

    // Check if todo exists and belongs to user
    const existingTodo = await pool.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (existingTodo.rows.length === 0) {
      return res.status(404).json({ 
        error: "Todo not found" 
      });
    }

    // Toggle completion status
    const result = await pool.query(
      'UPDATE todos SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );

    res.json({
      message: "Todo completion status toggled",
      todo: result.rows[0]
    });

  } catch (error) {
    console.error("Toggle todo error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
}
