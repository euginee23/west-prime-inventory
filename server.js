require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// JWT_SECRET DEFINITION
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined in the environment variables.");
  process.exit(1);
}

// MYSQL POOL
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// START UP DATABASE CONNECTION TEST
async function testDBConnection() {
  try {
    const connection = await db.getConnection();
    console.log("✅ Connected to MySQL Database");
    connection.release();
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
    process.exit(1);
  }
}

testDBConnection();

// MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());

app.use((err, req, res, next) => {
  console.error("❌ Internal Server Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// LOGIN ENDPOINT
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    const [results] = await db.execute(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (results.length > 0) {
      const user = results[0];

      const token = jwt.sign(
        { id: user.user_id, role: user.user_type },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        message: "Login successful",
        token,
        role: user.user_type,
        first_name: user.first_name,
        last_name: user.last_name,
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("❌ Database Error:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// GET USER ENDPOINT
app.get("/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [results] = await db.execute(
      "SELECT first_name, last_name FROM users WHERE user_id = ?",
      [userId]
    );

    if (results.length > 0) {
      const user = results[0];
      res.status(200).json({ first_name: user.first_name, last_name: user.last_name });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error("❌ Database Error:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});


// TOKEN VERIFICATION MIDDLEWARE
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
}

// PROTECTED ROUTE
app.get("/protected", authenticateToken, (req, res) => {
  res.json({
    message: "Welcome to the protected route",
    user: req.user,
  });
});

// GRACEFUL SHUTDOWN
process.on("SIGINT", async () => {
  console.log("\n🔄 Closing database connections...");
  await db.end();
  console.log("✅ Database connections closed. Exiting...");
  process.exit(0);
});

// START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
