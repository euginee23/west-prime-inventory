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
  connectionLimit: 20,
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

app.get("/", async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    res.status(200).json({
      message: "✅ Server is working!",
      database: "✅ Connected to database!",
    });
  } catch (err) {
    console.error("❌ Error testing database connection:", err.message);
    res.status(500).json({
      message: "✅ Server is working!",
      database: "❌ Database connection failed!",
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// LOGIN ENDPOINT
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  let connection;
  try {
    connection = await db.getConnection();
    const [results] = await connection.execute(
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
  } finally {
    if (connection) connection.release();
  }
});

// GET LOGGED IN USER ENDPOINT
app.get("/user", authenticateToken, async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    connection = await db.getConnection();

    const [results] = await connection.execute(
      "SELECT first_name, last_name FROM users WHERE user_id = ?",
      [userId]
    );

    if (results.length > 0) {
      const user = results[0];
      res
        .status(200)
        .json({ first_name: user.first_name, last_name: user.last_name });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error("❌ Database Error:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET ADMIN PROFILE SETTINGS ENDPOINT
app.get("/user/profile", authenticateToken, async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    connection = await db.getConnection();

    const [results] = await connection.execute(
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
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error("❌ Database Error:", err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// UPDATE LOGIN CREDENTIALS (USERNAME & PASSWORD)
app.put("/user/update-credentials", authenticateToken, async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword, username } = req.body;
  const userId = req.user.id;

  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const [results] = await connection.execute(
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
        return res
          .status(400)
          .json({ message: "Old password is required to update password." });
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
        await connection.execute(
          "UPDATE users SET username = ?, password = ? WHERE user_id = ?",
          [username, hashedPassword, userId]
        );
      } else {
        await connection.execute(
          "UPDATE users SET password = ? WHERE user_id = ?",
          [hashedPassword, userId]
        );
      }
    } else if (isUsernameChanged) {
      await connection.execute(
        "UPDATE users SET username = ? WHERE user_id = ?",
        [username, userId]
      );
    } else {
      return res.status(400).json({ message: "No changes detected." });
    }

    res.status(200).json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("❌ Error updating credentials:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// UPDATE PERSONAL INFORMATION
app.put("/user/update-personal", authenticateToken, async (req, res) => {
  const { first_name, middle_name, last_name, email, phone } = req.body;
  const userId = req.user.id;

  if (!first_name || !last_name || !email || !phone) {
    return res
      .status(400)
      .json({ message: "All fields except middle name are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    await connection.execute(
      "UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, email = ?, phone = ? WHERE user_id = ?",
      [first_name, middle_name || null, last_name, email, phone, userId]
    );

    res
      .status(200)
      .json({ message: "Personal information updated successfully." });
  } catch (err) {
    console.error("❌ Error updating personal information:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET LIST OF LABORATORIES
app.get("/laboratories", async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    const [results] = await connection.execute(
      "SELECT * FROM laboratories ORDER BY lab_id DESC"
    );

    if (results.length === 0) {
      return res.status(200).json({
        message: "No laboratories have been added yet.",
        data: [],
      });
    }

    res.status(200).json({
      message: "Laboratories fetched successfully.",
      data: results,
    });
  } catch (err) {
    console.error("❌ Error fetching laboratories:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// ADD A NEW LABORATORY
app.post("/laboratories", async (req, res) => {
  const { name, number } = req.body;

  if (!name || !number) {
    return res
      .status(400)
      .json({ message: "Laboratory name and number are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    await connection.execute(
      "INSERT INTO laboratories (lab_name, lab_number) VALUES (?, ?)",
      [name, number]
    );

    res.status(201).json({ message: "Laboratory added successfully." });
  } catch (err) {
    console.error("❌ Error adding laboratory:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET LIST OF PERSONNEL
app.get("/personnels", async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    const [results] = await connection.execute(
      "SELECT user_id, first_name, middle_name, last_name, phone, email, username, created_at FROM users WHERE user_type = 'Personnel' ORDER BY created_at DESC"
    );

    res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching personnels:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// ADD A NEW PERSONNEL
app.post("/personnels", async (req, res) => {
  const {
    first_name,
    middle_name,
    last_name,
    phone,
    email,
    username,
    password,
  } = req.body;

  if (!first_name || !last_name || !phone || !email || !username || !password) {
    return res
      .status(400)
      .json({ message: "All fields are required except middle name." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.execute(
      "INSERT INTO users (user_type, first_name, middle_name, last_name, phone, email, username, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [
        "Personnel",
        first_name,
        middle_name || null,
        last_name,
        phone,
        email,
        username,
        hashedPassword,
      ]
    );

    res.status(201).json({ message: "Personnel added successfully." });
  } catch (err) {
    console.error("❌ Error adding personnel:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// UPDATE PERSONNEL INFORMATION
app.put("/personnels/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, middle_name, last_name, phone, email, username } =
    req.body;

  if (!first_name || !last_name || !phone || !email || !username) {
    return res
      .status(400)
      .json({ message: "All fields are required except middle name." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    await connection.execute(
      "UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, phone = ?, email = ?, username = ? WHERE user_id = ?",
      [first_name, middle_name || null, last_name, phone, email, username, id]
    );

    res.status(200).json({ message: "Personnel updated successfully." });
  } catch (err) {
    console.error("❌ Error updating personnel:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE A PERSONNEL
app.delete("/personnels/:id", async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();

    const [results] = await connection.execute(
      "SELECT * FROM users WHERE user_id = ? AND user_type = 'Personnel'",
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Personnel not found." });
    }

    await connection.execute("DELETE FROM users WHERE user_id = ?", [id]);

    res.status(200).json({ message: "Personnel removed successfully." });
  } catch (err) {
    console.error("❌ Error removing personnel:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release(); 
  }
});

// GET EQUIPMENTS
app.get("/equipments", async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    const [results] = await connection.execute(`
      SELECT 
        e.*, 
        ei.img_id, 
        ei.image, 
        u.first_name, 
        u.last_name, 
        u.user_type, 
        l.lab_name, 
        l.lab_number
      FROM equipments e
      LEFT JOIN equipment_images ei ON e.equipment_id = ei.equipment_id
      LEFT JOIN users u ON e.user_id = u.user_id
      LEFT JOIN laboratories l ON e.laboratory_id = l.lab_id
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
          description: row.description,
          availability_status: row.availability_status,
          operational_status: row.operational_status,
          created_at: row.created_at,
          qr_img: row.qr_img
            ? `data:image/jpeg;base64,${row.qr_img.toString("base64")}`
            : null,
          images: [],

          user: row.first_name
            ? {
                first_name: row.first_name,
                last_name: row.last_name,
                user_type: row.user_type,
              }
            : null,

          laboratory: row.lab_name
            ? {
                lab_name: row.lab_name,
                lab_number: row.lab_number,
              }
            : null,
        });
      }

      if (row.image) {
        equipmentMap
          .get(row.equipment_id)
          .images.push(`data:image/jpeg;base64,${row.image.toString("base64")}`);
      }
    });

    const equipments = Array.from(equipmentMap.values());

    res.status(200).json(equipments);
  } catch (err) {
    console.error("❌ Error fetching equipments:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release(); 
  }
});

// GET EQUIPMENT BY ID
app.get("/equipments/:equipment_id", async (req, res) => {
  const { equipment_id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();

    const [equipmentRows] = await connection.execute(
      `SELECT e.*, l.lab_name, l.lab_number, u.first_name, u.last_name, u.user_type
       FROM equipments e
       LEFT JOIN laboratories l ON e.laboratory_id = l.lab_id
       LEFT JOIN users u ON e.user_id = u.user_id
       WHERE e.equipment_id = ?`,
      [equipment_id]
    );

    if (equipmentRows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    const equipment = equipmentRows[0];

    const [imageRows] = await connection.execute(
      "SELECT image FROM equipment_images WHERE equipment_id = ?",
      [equipment_id]
    );

    const images = imageRows.map((img) =>
      img.image
        ? `data:image/jpeg;base64,${img.image.toString("base64")}`
        : null
    );

    const responseData = {
      equipment_id: equipment.equipment_id,
      name: equipment.name,
      number: equipment.number,
      type: equipment.type,
      brand: equipment.brand,
      availability_status: equipment.availability_status || "Unknown",
      operational_status: equipment.operational_status || "Unknown",
      laboratory: {
        lab_id: equipment.laboratory_id,
        lab_name: equipment.lab_name || "Unknown",
        lab_number: equipment.lab_number || "N/A",
      },
      user: {
        first_name: equipment.first_name || "Unknown",
        last_name: equipment.last_name || "",
        user_type: equipment.user_type || "Unknown",
      },
      images: images.filter(Boolean),
      created_at: equipment.created_at,
    };

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error fetching equipment:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET EQUIPMENT BY NUMBER
app.get("/equipments/search/:number", async (req, res) => {
  const { number } = req.params;
  let connection;

  try {
    connection = await db.getConnection();

    const [equipmentRows] = await connection.execute(
      `SELECT e.*, l.lab_name, l.lab_number, u.first_name, u.last_name, u.user_type
       FROM equipments e
       LEFT JOIN laboratories l ON e.laboratory_id = l.lab_id
       LEFT JOIN users u ON e.user_id = u.user_id
       WHERE e.number = ?`,
      [number]
    );

    if (equipmentRows.length === 0) {
      return res.json({ found: false });
    }

    const equipment = equipmentRows[0];

    const [imageRows] = await connection.execute(
      "SELECT image FROM equipment_images WHERE equipment_id = ?",
      [equipment.equipment_id]
    );

    const images = imageRows.map((img) =>
      img.image
        ? `data:image/jpeg;base64,${img.image.toString("base64")}`
        : null
    );

    res.json({
      found: true,
      equipment: {
        equipment_id: equipment.equipment_id,
        name: equipment.name,
        number: equipment.number,
        type: equipment.type,
        brand: equipment.brand,
        availability_status: equipment.availability_status || "Unknown",
        operational_status: equipment.operational_status || "Unknown",
        laboratory: {
          lab_id: equipment.laboratory_id,
          lab_name: equipment.lab_name || "Unknown",
          lab_number: equipment.lab_number || "N/A",
        },
        user: {
          first_name: equipment.first_name || "Unknown",
          last_name: equipment.last_name || "",
          user_type: equipment.user_type || "Unknown",
        },
        images: images.filter(Boolean),
        created_at: equipment.created_at,
      },
    });
  } catch (error) {
    console.error("❌ Error searching equipment:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (connection) connection.release(); 
  }
});

// ADD EQUIPMENT
app.post("/equipments", upload.array("images", 3), async (req, res) => {
  const {
    name,
    number,
    type,
    brand,
    availability_status = "Available",
    description,
    user_id,
    laboratory_id,
  } = req.body;
  const images = req.files;

  if (
    !name ||
    !number ||
    !type ||
    !brand ||
    !availability_status ||
    !description ||
    !user_id ||
    !laboratory_id
  ) {
    console.error("🚨 Missing required fields:", {
      name,
      number,
      type,
      brand,
      availability_status,
      description,
      user_id,
      laboratory_id,
    });
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!images || images.length < 1) {
    console.error("🚨 No images uploaded.");
    return res.status(400).json({ message: "At least one image is required." });
  }

  let connection;
  try {
    connection = await db.getConnection(); 

    const parsedUserId = parseInt(user_id, 10);
    const parsedLabId = parseInt(laboratory_id, 10);

    const [equipmentResult] = await connection.execute(
      `INSERT INTO equipments 
       (name, number, type, brand, availability_status, description, user_id, laboratory_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        number,
        type,
        brand,
        availability_status,
        description,
        parsedUserId,
        parsedLabId,
      ]
    );

    const equipmentId = equipmentResult.insertId;

    const qrData = `${equipmentId}`;
    const qrCodeImage = await QRCode.toDataURL(qrData);
    const qrBuffer = Buffer.from(qrCodeImage.split(",")[1], "base64");

    await connection.execute(
      "UPDATE equipments SET qr_img = ? WHERE equipment_id = ?",
      [qrBuffer, equipmentId]
    );

    for (const image of images) {
      await connection.execute(
        `INSERT INTO equipment_images (equipment_id, image) VALUES (?, ?)`,
        [equipmentId, Buffer.from(image.buffer)]
      );
    }

    res.status(201).json({ message: "Equipment added successfully." });
  } catch (err) {
    console.error("❌ Error adding equipment:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release(); 
  }
});

// DELETE EQUIPMENT ALONG WITH IMAGES
app.delete("/equipments/:id", async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();

    const [equipment] = await connection.execute(
      "SELECT * FROM equipments WHERE equipment_id = ?",
      [id]
    );
    if (equipment.length === 0) {
      return res.status(404).json({ message: "Equipment not found." });
    }

    await connection.execute("DELETE FROM equipment_images WHERE equipment_id = ?", [
      id,
    ]);

    await connection.execute("DELETE FROM equipments WHERE equipment_id = ?", [id]);

    res
      .status(200)
      .json({ message: "✅ Equipment and its images removed successfully." });
  } catch (err) {
    console.error("❌ Error deleting equipment:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release(); 
  }
});

// UPDATE EQUIPMENTS
app.put("/equipments/:id", upload.array("images", 3), async (req, res) => {
  console.log("📥 Received Update Request:", req.body);
  console.log("📷 New Uploaded Images:", req.files);

  const { id } = req.params;
  const {
    name,
    number,
    type,
    brand,
    availability_status = "Available",
    description,
    user_id,
    laboratory_id,
    remove_images,
  } = req.body;
  const newImages = req.files;

  if (
    !name ||
    !number ||
    !type ||
    !brand ||
    !availability_status ||
    !description ||
    !user_id ||
    !laboratory_id
  ) {
    console.error("🚨 Missing required fields:", {
      name,
      number,
      type,
      brand,
      availability_status,
      description,
      user_id,
      laboratory_id,
    });
    return res.status(400).json({ message: "All fields are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const parsedUserId = parseInt(user_id, 10);
    const parsedLabId = parseInt(laboratory_id, 10);

    const [existingEquipment] = await connection.execute(
      "SELECT * FROM equipments WHERE equipment_id = ?",
      [id]
    );
    if (existingEquipment.length === 0) {
      return res.status(404).json({ message: "Equipment not found." });
    }

    if (remove_images) {
      try {
        const imagesToRemove = JSON.parse(remove_images);
        for (const imageId of imagesToRemove) {
          await connection.execute(
            "DELETE FROM equipment_images WHERE img_id = ? AND equipment_id = ?",
            [imageId, id]
          );
        }
        console.log(`✅ Removed ${imagesToRemove.length} images`);
      } catch (err) {
        console.error("🚨 Error parsing `remove_images` JSON:", err);
      }
    }

    const [existingImages] = await connection.execute(
      "SELECT COUNT(*) AS imageCount FROM equipment_images WHERE equipment_id = ?",
      [id]
    );
    const currentImageCount = existingImages[0].imageCount;

    if (currentImageCount + newImages.length > 3) {
      return res.status(400).json({
        message: `You can only have up to 3 images. Current: ${currentImageCount}, New: ${newImages.length}`,
      });
    }

    await connection.execute(
      `UPDATE equipments 
       SET name = ?, number = ?, type = ?, brand = ?, availability_status = ?, description = ?, user_id = ?, laboratory_id = ? 
       WHERE equipment_id = ?`,
      [
        name,
        number,
        type,
        brand,
        availability_status,
        description,
        parsedUserId,
        parsedLabId,
        id,
      ]
    );
    console.log(`✅ Equipment ID ${id} updated.`);

    for (const image of newImages) {
      await connection.execute(
        `INSERT INTO equipment_images (equipment_id, image) VALUES (?, ?);`,
        [id, Buffer.from(image.buffer)]
      );
    }
    console.log(
      `✅ ${newImages.length} new images added for equipment ID ${id}.`
    );

    res.status(200).json({ message: "Equipment updated successfully." });
  } catch (err) {
    console.error("❌ Error updating equipment:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release(); 
  }
});

// SEARCH CLIENTS BY NAME, EMAIL, OR CONTACT NUMBER
app.get("/clients/search", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Search query is required." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    const [clients] = await connection.execute(
      `SELECT * FROM clients 
       WHERE contact_number LIKE ? 
       OR email LIKE ? 
       OR CONCAT(first_name, ' ', last_name) LIKE ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    res.status(200).json({ clients });
  } catch (error) {
    console.error("❌ Error searching clients:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// SCANNED EQUIPMENT ACTION
app.post("/scanned-equipment-actions", async (req, res) => {
  const {
    equipment_id,
    lab_id,
    user_id,
    client,
    tracking_code,
    reason,
    date,
    status,
  } = req.body;

  if (
    !equipment_id ||
    !lab_id ||
    !user_id ||
    !client ||
    !tracking_code ||
    !reason ||
    !date ||
    !status
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  let connection;
  try {
    connection = await db.getConnection(); 
    let clientId;

    const [existingClient] = await connection.execute(
      `SELECT client_id FROM clients 
       WHERE contact_number = ? 
       OR email = ? 
       OR (first_name = ? AND last_name = ?);`,
      [client.contact_number, client.email, client.first_name, client.last_name]
    );

    if (existingClient.length > 0) {
      clientId = existingClient[0].client_id;
    } else {

      const [newClient] = await connection.execute(
        "INSERT INTO clients (first_name, middle_name, last_name, contact_number, email, address) VALUES (?, ?, ?, ?, ?, ?);",
        [
          client.first_name,
          client.middle_name,
          client.last_name,
          client.contact_number,
          client.email,
          client.address,
        ]
      );
      clientId = newClient.insertId;
    }

    await connection.execute(
      `INSERT INTO scanned_equipments_actions 
       (equipment_id, lab_id, user_id, client_id, tracking_code, reason, date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        equipment_id,
        lab_id,
        user_id,
        clientId,
        tracking_code,
        reason,
        date,
        status,
      ]
    );

    res
      .status(201)
      .json({ message: "Scanned equipment action recorded successfully." });
  } catch (err) {
    console.error("❌ Error saving scanned equipment action:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release(); 
  }
});

// RETURN EQUIPMENT ACTION
app.post("/scanned-equipment-actions/return/:equipment_id", async (req, res) => {
  const { equipment_id } = req.params;
  const { lab_id, user_id, date } = req.body; 

  if (!lab_id || !user_id || !date) {
    return res.status(400).json({ message: "All required fields must be provided." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const [lastTransaction] = await connection.execute(
      `SELECT * FROM scanned_equipments_actions 
       WHERE equipment_id = ? 
       ORDER BY date DESC LIMIT 1`,
      [equipment_id]
    );

    if (lastTransaction.length === 0) {
      return res.status(404).json({ message: "No previous transaction found." });
    }

    const lastAction = lastTransaction[0];

    await connection.execute(
      `INSERT INTO scanned_equipments_actions 
       (equipment_id, lab_id, user_id, client_id, tracking_code, reason, date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        equipment_id,
        lab_id,
        user_id,
        lastAction.client_id,
        lastAction.tracking_code, 
        lastAction.reason, 
        date,
        "Returned", 
      ]
    );

    await connection.execute(
      "UPDATE equipments SET availability_status = ? WHERE equipment_id = ?",
      ["Available", equipment_id]
    );

    res.status(201).json({
      message: "Equipment successfully returned!",
      tracking_code: lastAction.tracking_code,
      reason: lastAction.reason,
      status: "Returned",
    });
  } catch (err) {
    console.error("❌ Error returning equipment:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// UPDATE EQUIPMENT STATUS
app.put("/equipments/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Equipment status is required." });
  }

  let connection;
  try {
    connection = await db.getConnection(); 

    const [existingEquipment] = await connection.execute(
      "SELECT * FROM equipments WHERE equipment_id = ?",
      [id]
    );
    if (existingEquipment.length === 0) {
      return res.status(404).json({ message: "Equipment not found." });
    }

    await connection.execute(
      "UPDATE equipments SET availability_status = ? WHERE equipment_id = ?",
      [status, id]
    );

    res.status(200).json({ message: `Equipment status updated to '${status}'.` });
  } catch (err) {
    console.error("❌ Error updating equipment status:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET LAST SCANNED
app.get("/scanned-equipment-actions/last/:equipment_id", async (req, res) => {
  const { equipment_id } = req.params;

  let connection;
  try {
    connection = await db.getConnection();

    const [lastTransaction] = await connection.execute(
      `SELECT sea.*, c.first_name, c.middle_name, c.last_name, 
              c.contact_number, c.email, c.address
       FROM scanned_equipments_actions sea
       LEFT JOIN clients c ON sea.client_id = c.client_id
       WHERE sea.equipment_id = ?
       ORDER BY sea.date DESC
       LIMIT 1`,
      [equipment_id]
    );

    if (lastTransaction.length === 0) {
      return res.status(404).json({ message: "No previous transaction found." });
    }

    res.status(200).json(lastTransaction[0]);
  } catch (err) {
    console.error("Error fetching last transaction:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// TOKEN VERIFICATION MIDDLEWARE
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
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
