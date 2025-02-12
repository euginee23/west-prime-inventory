require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const QRCode = require("qrcode");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 10 * 1024 * 1024, 
    fileSize: 10 * 1024 * 1024, 
    files: 3,
  },
});

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
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const [results] = await db.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.user_type },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.user_type,
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
    });
  } catch (err) {
    console.error("❌ Database Error:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// GET LOGGED IN USER ENDPOINT
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

// GET ADMIN PROFILE SETTINGS ENDPOINT
app.get("/user/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [results] = await db.execute(
      "SELECT first_name, middle_name, last_name, email, phone, user_type, username, password FROM users WHERE user_id = ?",
      [userId]
    );

    if (results.length > 0) {
      const user = results[0];

      res.status(200).json({
        first_name: user.first_name,
        middle_name: user.middle_name || null,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        user_type: user.user_type,
        username: user.username,
        password: user.password,
      });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error("❌ Database Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// UPDATE LOGIN CREDENTIALS (USERNAME & PASSWORD)
app.put("/user/update-credentials", authenticateToken, async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword, username } = req.body;
  const userId = req.user.id;

  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const [results] = await db.execute(
      "SELECT username, password FROM users WHERE user_id = ?",
      [userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = results[0];

    const isUsernameChanged = username !== user.username;
    const isPasswordChanged = newPassword && confirmNewPassword;

    if (isPasswordChanged) {
      if (!oldPassword) {
        return res.status(400).json({ message: "Old password is required to update password." });
      }
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "New passwords do not match." });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect old password." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      if (isUsernameChanged) {
        await db.execute(
          "UPDATE users SET username = ?, password = ? WHERE user_id = ?",
          [username, hashedPassword, userId]
        );
      } else {
        await db.execute("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, userId]);
      }
    } else if (isUsernameChanged) {
      await db.execute("UPDATE users SET username = ? WHERE user_id = ?", [username, userId]);
    } else {
      return res.status(400).json({ message: "No changes detected." });
    }

    res.status(200).json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("❌ Error updating credentials:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

// UPDATE PERSONAL INFORMATION
app.put("/user/update-personal", authenticateToken, async (req, res) => {
  const { first_name, middle_name, last_name, email, phone } = req.body;
  const userId = req.user.id;

  if (!first_name || !last_name || !email || !phone) {
    return res.status(400).json({ message: "All fields except middle name are required." });
  }

  try {
    await db.execute(
      "UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, email = ?, phone = ? WHERE user_id = ?",
      [first_name, middle_name || null, last_name, email, phone, userId]
    );

    res.status(200).json({ message: "Personal information updated successfully." });
  } catch (err) {
    console.error("❌ Error updating personal information:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

// GET LIST OF LABORATORIES
app.get("/laboratories", async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM laboratories ORDER BY lab_id DESC");

    if (results.length === 0) {
      return res.status(200).json({ message: "No laboratories have been added yet.", data: [] });
    }

    res.status(200).json({ message: "Laboratories fetched successfully.", data: results });
  } catch (err) {
    console.error("❌ Error fetching laboratories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADD A NEW LABORATORY
app.post("/laboratories", async (req, res) => {
  const { name, number } = req.body;

  if (!name || !number) {
    return res.status(400).json({ message: "Laboratory name and number are required." });
  }

  try {
    await db.execute("INSERT INTO laboratories (lab_name, lab_number) VALUES (?, ?)", [name, number]);
    res.status(201).json({ message: "Laboratory added successfully." });
  } catch (err) {
    console.error("❌ Error adding laboratory:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET LIST OF PERSONNEL
app.get("/personnels", async (req, res) => {
  try {
    const [results] = await db.execute(
      "SELECT user_id, first_name, middle_name, last_name, phone, email, username, created_at FROM users WHERE user_type = 'Personnel' ORDER BY created_at DESC"
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching personnels:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADD A NEW PERSONNEL
app.post("/personnels", async (req, res) => {
  const { first_name, middle_name, last_name, phone, email, username, password } = req.body;

  if (!first_name || !last_name || !phone || !email || !username || !password) {
    return res.status(400).json({ message: "All fields are required except middle name." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      "INSERT INTO users (user_type, first_name, middle_name, last_name, phone, email, username, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      ["Personnel", first_name, middle_name || null, last_name, phone, email, username, hashedPassword]
    );

    res.status(201).json({ message: "Personnel added successfully." });
  } catch (err) {
    console.error("❌ Error adding personnel:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE PERSONNEL INFORMATION
app.put("/personnels/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, middle_name, last_name, phone, email, username } = req.body;

  if (!first_name || !last_name || !phone || !email || !username) {
    return res.status(400).json({ message: "All fields are required except middle name." });
  }

  try {
    await db.execute(
      "UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, phone = ?, email = ?, username = ? WHERE user_id = ?",
      [first_name, middle_name || null, last_name, phone, email, username, id]
    );

    res.status(200).json({ message: "Personnel updated successfully." });
  } catch (err) {
    console.error("❌ Error updating personnel:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE A PERSONNEL
app.delete("/personnels/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.execute("SELECT * FROM users WHERE user_id = ? AND user_type = 'Personnel'", [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Personnel not found." });
    }

    await db.execute("DELETE FROM users WHERE user_id = ?", [id]);

    res.status(200).json({ message: "Personnel removed successfully." });
  } catch (err) {
    console.error("❌ Error removing personnel:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADD EQUIPMENT WITH IMAGES
app.post("/equipments", upload.array("images", 3), async (req, res) => {
  const { name, number, type, brand, status, description, user_id, laboratory_id } = req.body;
  const images = req.files;

  if (!name || !number || !type || !brand || !status || !description || !user_id || !laboratory_id) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (!images || images.length < 1) {
    return res.status(400).json({ message: "At least one image is required." });
  }

  try {
    const qrData = `Equipment: ${name}, Number: ${number}`;
    const qrCodeImage = await QRCode.toDataURL(qrData);
    const qrBuffer = Buffer.from(qrCodeImage.split(",")[1], "base64");

    const [equipmentResult] = await db.execute(
      `INSERT INTO equipments (name, number, type, brand, status, description, user_id, laboratory_id, qr_img) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, number, type, brand, status, description, user_id, laboratory_id, qrBuffer]
    );

    const equipmentId = equipmentResult.insertId; 

    for (const image of images) {
      await db.execute(
        `INSERT INTO equipment_images (equipment_id, image) VALUES (?, ?)`,
        [equipmentId, image.buffer] 
      );
    }

    res.status(201).json({ message: "Equipment added successfully." });
  } catch (err) {
    console.error("❌ Error adding equipment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET EQUIPMENTS
app.get("/equipments", async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT 
        e.*, 
        ei.img_id, 
        ei.image 
      FROM equipments e
      LEFT JOIN equipment_images ei ON e.equipment_id = ei.equipment_id
    `);

    const equipmentMap = new Map();

    results.forEach((row) => {
      if (!equipmentMap.has(row.equipment_id)) {
        equipmentMap.set(row.equipment_id, {
          equipment_id: row.equipment_id,
          name: row.name,
          number: row.number,
          type: row.type,
          brand: row.brand,
          status: row.status,
          description: row.description,
          user_id: row.user_id,
          laboratory_id: row.laboratory_id,
          qr_img: row.qr_img
            ? `data:image/jpeg;base64,${row.qr_img.toString("base64")}`
            : null,
          images: [], 
        });
      }

      if (row.image) {
        equipmentMap.get(row.equipment_id).images.push(
          `data:image/jpeg;base64,${row.image.toString("base64")}`
        );
      }
    });

    const equipments = Array.from(equipmentMap.values());

    res.status(200).json(equipments);
  } catch (err) {
    console.error("❌ Error fetching equipments:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE EQUIPMENTS
app.put("/equipments/:id", upload.array("images", 3), async (req, res) => {
  const { id } = req.params;
  const { name, number, type, brand, status, description, user_id, laboratory_id, remove_images } = req.body;
  const newImages = req.files;

  if (!name || !number || !type || !brand || !status || !description || !user_id || !laboratory_id) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const [existingEquipment] = await db.execute("SELECT * FROM equipments WHERE equipment_id = ?", [id]);
    if (existingEquipment.length === 0) {
      return res.status(404).json({ message: "Equipment not found." });
    }

    if (remove_images) {
      const imagesToRemove = JSON.parse(remove_images); 
      for (const imageId of imagesToRemove) {
        await db.execute("DELETE FROM equipment_images WHERE img_id = ? AND equipment_id = ?", [imageId, id]);
      }
    }

    const [existingImages] = await db.execute(
      "SELECT COUNT(*) AS imageCount FROM equipment_images WHERE equipment_id = ?",
      [id]
    );
    const currentImageCount = existingImages[0].imageCount;

    if (currentImageCount + newImages.length > 3) {
      return res.status(400).json({ message: `You can only have up to 3 images. Current: ${currentImageCount}, New: ${newImages.length}` });
    }

    await db.execute(
      `UPDATE equipments 
       SET name = ?, number = ?, type = ?, brand = ?, status = ?, description = ?, user_id = ?, laboratory_id = ? 
       WHERE equipment_id = ?`,
      [name, number, type, brand, status, description, user_id, laboratory_id, id]
    );

    for (const image of newImages) {
      await db.execute(
        `INSERT INTO equipment_images (equipment_id, image) VALUES (?, ?)`,
        [id, image.buffer]
      );
    }

    res.status(200).json({ message: "Equipment updated successfully." });
  } catch (err) {
    console.error("❌ Error updating equipment:", err);
    res.status(500).json({ message: "Internal server error" });
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
