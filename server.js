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
  console.error("JWT_SECRET is not defined in the environment variables.");
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
    console.error("MySQL Connection Failed:", err.message);
    process.exit(1);
  }
}

testDBConnection();

// MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());

app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

app.get("/", async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    res.status(200).json({
      message: "Server is working!",
      database: "Connected to database!",
    });
  } catch (err) {
    console.error("Error testing database connection:", err.message);
    res.status(500).json({
      message: "Server is working!",
      database: "Database connection failed!",
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
    console.error("Database Error:", err);
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
    console.error("Database Error:", err);
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
    console.error("Database Error:", err);
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
    console.error("Error updating credentials:", err);
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
    console.error("Error updating personal information:", err);
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
    console.error("Error fetching laboratories:", err);
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

    const [existingLab] = await connection.execute(
      "SELECT * FROM laboratories WHERE lab_number = ?",
      [number]
    );

    if (existingLab.length > 0) {
      return res
        .status(409)
        .json({ message: "Laboratory number already exists." });
    }

    await connection.execute(
      "INSERT INTO laboratories (lab_name, lab_number) VALUES (?, ?)",
      [name, number]
    );

    res.status(201).json({ message: "Laboratory added successfully." });
  } catch (err) {
    console.error("Error adding laboratory:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE A LABORATORY
app.delete("/laboratories/:id", async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();

    const [lab] = await connection.execute(
      "SELECT * FROM laboratories WHERE lab_id = ?",
      [id]
    );
    if (lab.length === 0) {
      return res.status(404).json({ message: "Laboratory not found." });
    }

    await connection.execute("DELETE FROM laboratories WHERE lab_id = ?", [id]);

    res.status(200).json({ message: "✅ Laboratory deleted successfully." });
  } catch (err) {
    console.error("Error deleting laboratory:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET ALL PERSONNELS WITH ASSIGNED LABORATORY
app.get("/personnels", async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const [results] = await connection.execute(`
      SELECT u.user_id, u.user_type, u.first_name, u.middle_name, u.last_name, 
             u.phone, u.email, u.username,
             COALESCE(pd.lab_id, NULL) AS lab_id, 
             COALESCE(l.lab_name, '') AS lab_name, 
             COALESCE(l.lab_number, '') AS lab_number
      FROM users u
      LEFT JOIN (
          SELECT user_id, lab_id 
          FROM personnel_designations 
          WHERE status = 'Active'
          GROUP BY user_id
      ) pd ON u.user_id = pd.user_id
      LEFT JOIN laboratories l ON pd.lab_id = l.lab_id
      WHERE u.user_type = 'Personnel'
      GROUP BY u.user_id
    `);

    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching personnels:", err);
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
    console.error("Error adding personnel:", err);
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
    console.error("Error updating personnel:", err);
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
    console.error("Error removing personnel:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET EQUIPMENTS BASED ON USER ROLE AND ASSIGNED LABORATORY
app.get("/equipments", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        e.*, 
        ei.img_id, 
        ei.image, 
        u.first_name, 
        u.last_name, 
        u.user_type, 
        l.lab_id,
        l.lab_name, 
        l.lab_number
      FROM equipments e
      LEFT JOIN equipment_images ei ON e.equipment_id = ei.equipment_id
      LEFT JOIN users u ON e.user_id = u.user_id
      LEFT JOIN laboratories l ON e.laboratory_id = l.lab_id
    `;

    let queryParams = [];

    if (userRole === "Personnel") {
      // Get the latest active lab assignment for the Personnel
      const [designation] = await connection.execute(
        `SELECT lab_id FROM personnel_designations 
         WHERE user_id = ? AND status = 'Active'
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      if (designation.length === 0) {
        return res
          .status(403)
          .json({ message: "No active lab assignment found." });
      }

      const assignedLabId = designation[0].lab_id;

      // Filter equipment by the assigned lab_id
      query += " WHERE e.laboratory_id = ?";
      queryParams.push(assignedLabId);
    }

    const [results] = await connection.execute(query, queryParams);

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

          laboratory: row.lab_id
            ? {
                lab_id: row.lab_id,
                lab_name: row.lab_name,
                lab_number: row.lab_number,
              }
            : null,
        });
      }

      if (row.image) {
        equipmentMap
          .get(row.equipment_id)
          .images.push(
            `data:image/jpeg;base64,${row.image.toString("base64")}`
          );
      }
    });

    const equipments = Array.from(equipmentMap.values());

    res.status(200).json(equipments);
  } catch (err) {
    console.error("Error fetching equipments:", err);
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
    console.error("Error fetching equipment:", error);
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
    console.error("Error searching equipment:", error);
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
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!images || images.length < 1) {
    return res.status(400).json({ message: "At least one image is required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const [existingEquipment] = await connection.execute(
      "SELECT COUNT(*) AS count FROM equipments WHERE number = ?",
      [number]
    );

    if (existingEquipment[0].count > 0) {
      return res
        .status(409)
        .json({ message: "Equipment number already exists." });
    }

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
    console.error("Error adding equipment:", err);
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

    await connection.execute(
      "DELETE FROM equipment_images WHERE equipment_id = ?",
      [id]
    );

    await connection.execute("DELETE FROM equipments WHERE equipment_id = ?", [
      id,
    ]);

    res
      .status(200)
      .json({ message: "Equipment and its images removed successfully." });
  } catch (err) {
    console.error("Error deleting equipment:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// UPDATE EQUIPMENTS
app.put("/equipments/:id", upload.array("images", 3), async (req, res) => {
  const { id } = req.params;
  const {
    name,
    number,
    type,
    brand,
    availability_status = "Available",
    operational_status,
    description,
    laboratory_id,
    remove_images,
  } = req.body;

  if (
    !name ||
    !number ||
    !type ||
    !brand ||
    !availability_status ||
    !description ||
    !laboratory_id
  ) {
    return res.status(400).json({ message: "All fields are required." });
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

    if (remove_images) {
      try {
        const imagesToRemove = JSON.parse(remove_images);
        if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
          for (const base64Image of imagesToRemove) {
            if (!base64Image.startsWith("data:image")) {
              continue;
            }

            const base64Data = base64Image.split(",")[1];
            const imageBuffer = Buffer.from(base64Data, "base64");

            await connection.execute(
              "DELETE FROM equipment_images WHERE image = ? AND equipment_id = ?",
              [imageBuffer, id]
            );
          }
        }
      } catch (err) {
        return res
          .status(500)
          .json({ message: "Error processing image removal." });
      }
    }

    await connection.execute(
      `UPDATE equipments 
       SET name = ?, number = ?, type = ?, brand = ?, availability_status = ?, operational_status = ?, description = ?, laboratory_id = ? 
       WHERE equipment_id = ?`,
      [
        name,
        number,
        type,
        brand,
        availability_status,
        operational_status,
        description,
        laboratory_id,
        id,
      ]
    );

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await connection.execute(
          `INSERT INTO equipment_images (equipment_id, image) VALUES (?, ?)`,
          [id, Buffer.from(file.buffer)]
        );
      }
    }

    res.status(200).json({ message: "Equipment updated successfully." });
  } catch (err) {
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
    console.error("Error searching clients:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET PERSONNEL DESIGNATION LABORATORY
app.get("/personnel_designations/:user_id", async (req, res) => {
  const { user_id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();

    const [results] = await connection.execute(
      `SELECT pd.lab_id, l.lab_name, l.lab_number 
       FROM personnel_designations pd
       LEFT JOIN laboratories l ON pd.lab_id = l.lab_id
       WHERE pd.user_id = ? AND pd.status = 'Active'
       ORDER BY pd.created_at DESC LIMIT 1`,
      [user_id]
    );

    if (results.length === 0) {
      return res.status(200).json({
        message: "No active laboratory assignment found.",
        data: null,
      });
    }

    res.status(200).json({
      message: "Personnel laboratory found.",
      data: results[0],
    });
  } catch (err) {
    console.error("Error fetching personnel lab:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET LATEST PERSONNEL ASSIGNMENTS FOR A LABORATORY (ONLY THE MOST RECENT PER PERSONNEL)
app.get("/personnel_designations/laboratory/:lab_id", async (req, res) => {
  const { lab_id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();

    const [results] = await connection.execute(
      `SELECT pd.*, u.first_name, u.last_name
       FROM personnel_designations pd
       LEFT JOIN users u ON pd.user_id = u.user_id
       WHERE pd.lab_id = ?
       AND pd.created_at = (
           SELECT MAX(pd2.created_at)
           FROM personnel_designations pd2
           WHERE pd2.user_id = pd.user_id
       )
       ORDER BY pd.created_at DESC`,
      [lab_id]
    );

    if (results.length === 0) {
      return res.status(200).json({
        message: "No personnel assigned to this laboratory.",
        data: [],
      });
    }

    const personnelList = results.map((personnel) => ({
      first_name: personnel.first_name,
      last_name: personnel.last_name,
      status: personnel.status,
      created_at: personnel.created_at,
    }));

    res.status(200).json({
      message: "Latest personnel assignments found.",
      data: personnelList,
    });
  } catch (err) {
    console.error("Error fetching assigned personnel:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// ASSIGN PERSONNEL TO A LABORATORY
app.post("/personnel_designations", async (req, res) => {
  const { user_id, lab_id } = req.body;

  if (!user_id || !lab_id) {
    return res
      .status(400)
      .json({ message: "User ID and Lab ID are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    await connection.execute(
      `INSERT INTO personnel_designations (user_id, lab_id, status, created_at) 
       VALUES (?, ?, 'Active', NOW())`,
      [user_id, lab_id]
    );

    res.status(201).json({ message: "Laboratory assigned successfully." });
  } catch (err) {
    console.error("Error assigning laboratory:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// RE-ASSIGN PERSONNEL
app.post("/personnel_designations/reassign", async (req, res) => {
  const { user_id, new_lab_id } = req.body;

  if (!user_id || !new_lab_id) {
    return res
      .status(400)
      .json({ message: "User ID and new Lab ID are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const [currentAssignment] = await connection.execute(
      `SELECT designation_id, lab_id FROM personnel_designations 
       WHERE user_id = ? AND status = 'Active' 
       ORDER BY created_at DESC LIMIT 1`,
      [user_id]
    );

    if (currentAssignment.length === 0) {
      return res
        .status(400)
        .json({ message: "Personnel has no active laboratory assignment." });
    }

    const currentLabId = currentAssignment[0].lab_id;
    const currentDesignationId = currentAssignment[0].designation_id;

    if (currentLabId === parseInt(new_lab_id)) {
      return res.status(400).json({
        message:
          "Personnel is already assigned to this laboratory. Please select a different one.",
      });
    }

    await connection.execute(
      `INSERT INTO personnel_designations (user_id, lab_id, status, created_at) 
       VALUES (?, ?, 'Inactive', NOW())`,
      [user_id, currentLabId]
    );

    await connection.execute(
      `INSERT INTO personnel_designations (user_id, lab_id, status, created_at) 
       VALUES (?, ?, 'Active', NOW())`,
      [user_id, new_lab_id]
    );

    res.status(201).json({ message: "Laboratory reassigned successfully." });
  } catch (err) {
    console.error("Error reassigning laboratory:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// REMOVE PERSONNEL ASSIGNMENT
app.post("/personnel_designations/remove", async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const [activeAssignment] = await connection.execute(
      `SELECT * FROM personnel_designations 
       WHERE user_id = ? AND status = 'Active' 
       ORDER BY created_at DESC LIMIT 1`,
      [user_id]
    );

    if (activeAssignment.length === 0) {
      return res.status(404).json({ message: "No active assignment found." });
    }

    const currentLabId = activeAssignment[0].lab_id;

    await connection.execute(
      `INSERT INTO personnel_designations (user_id, lab_id, status, created_at) 
       VALUES (?, ?, 'Inactive', NOW())`,
      [user_id, currentLabId]
    );

    res
      .status(201)
      .json({ message: "Personnel assignment removed successfully." });
  } catch (err) {
    console.error("Error removing personnel assignment:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET PERSONNEL ASSIGNMENT HISTORY
app.get("/personnel_designations/history/:user_id", async (req, res) => {
  const { user_id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();

    const [results] = await connection.execute(
      `SELECT pd.*, 
              CONCAT(l.lab_name, ' (#', l.lab_number, ')') AS lab_details,
              DATE_FORMAT(pd.created_at, '%Y-%m-%d') AS assign_date 
       FROM personnel_designations pd
       LEFT JOIN laboratories l ON pd.lab_id = l.lab_id
       WHERE pd.user_id = ? 
       ORDER BY pd.created_at DESC`,
      [user_id]
    );

    res.status(200).json({ data: results });
  } catch (err) {
    console.error("Error fetching assignment history:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// INSERT SCANNED EQUIPMENT ACTION - CHECK OUT
app.post("/scanned-equipment-actions", async (req, res) => {
  const {
    equipment_id,
    lab_id,
    user_id,
    client,
    tracking_code,
    reason,
    date,
    time,
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
    !time ||
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

      await connection.execute(
        "UPDATE clients SET client_type = ? WHERE client_id = ?",
        [client.client_type, clientId]
      );
    } else {
      const [newClient] = await connection.execute(
        `INSERT INTO clients (
          first_name, middle_name, last_name, 
          contact_number, email, address, client_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          client.first_name,
          client.middle_name || null,
          client.last_name,
          client.contact_number,
          client.email || null,
          client.address || null,
          client.client_type,
        ]
      );
      clientId = newClient.insertId;
    }

    await connection.execute(
      `INSERT INTO scanned_equipments_actions 
       (equipment_id, lab_id, user_id, client_id, tracking_code, 
        reason, date, time, status, transaction_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        equipment_id,
        lab_id,
        user_id,
        clientId,
        tracking_code,
        reason,
        date,
        time,
        status,
        "Check Out",
      ]
    );

    await connection.execute(
      "UPDATE equipments SET availability_status = ? WHERE equipment_id = ?",
      ["In-Use", equipment_id]
    );

    res.status(201).json({ message: "Equipment successfully checked out!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// INSERT SCANNED EQUIPMENT ACTION - RETURN
app.post(
  "/scanned-equipment-actions/return/:equipment_id",
  async (req, res) => {
    const { equipment_id } = req.params;
    const { lab_id, user_id, date, time } = req.body;

    if (!lab_id || !user_id || !date || !time) {
      return res.status(400).json({
        message:
          "All required fields (lab_id, user_id, date, time) must be provided.",
      });
    }

    let connection;
    try {
      connection = await db.getConnection();

      const [lastCheckOut] = await connection.execute(
        `SELECT * FROM scanned_equipments_actions 
         WHERE equipment_id = ? 
         AND transaction_type = 'Check Out' 
         AND NOT EXISTS (
           SELECT 1 FROM scanned_equipments_actions sea2
           WHERE sea2.equipment_id = scanned_equipments_actions.equipment_id 
           AND sea2.transaction_type = 'Return Equipment' 
           AND sea2.tracking_code = scanned_equipments_actions.tracking_code
         )
         ORDER BY action_id DESC 
         LIMIT 1`,
        [equipment_id]
      );

      if (lastCheckOut.length === 0) {
        return res
          .status(404)
          .json({ message: "No valid Check Out transaction found." });
      }

      const lastAction = lastCheckOut[0];

      await connection.execute(
        `INSERT INTO scanned_equipments_actions 
         (equipment_id, lab_id, user_id, client_id, tracking_code, reason, date, time, status, transaction_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          equipment_id,
          lab_id,
          user_id,
          lastAction.client_id,
          lastAction.tracking_code,
          lastAction.reason,
          date,
          time,
          "Returned",
          "Return Equipment",
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
      console.error("Error returning equipment:", err);
      res.status(500).json({ message: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }
);

// INSERT SCANNED EQUIPMENT ACTION - MARK EQUIPMENT AS LOST
app.post("/equipments/:id/mark-lost", async (req, res) => {
  const { id } = req.params;
  const { lostReason } = req.body; 
  let connection;

  try {
    connection = await db.getConnection();

    const [lastTransaction] = await connection.execute(
      `SELECT * FROM scanned_equipments_actions 
       WHERE equipment_id = ? 
       AND transaction_type = 'Check Out'
       ORDER BY action_id DESC 
       LIMIT 1`,
      [id]
    );

    if (lastTransaction.length === 0) {
      return res
        .status(404)
        .json({ message: "No recent 'Check Out' transaction found." });
    }

    const lastData = lastTransaction[0];
    const reasonToStore = lostReason || "No reason provided.";

    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().split(" ")[0];

    await connection.execute(
      `INSERT INTO scanned_equipments_actions 
       (equipment_id, lab_id, user_id, client_id, tracking_code, reason, date, time, status, transaction_type, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lastData.equipment_id,
        lastData.lab_id,
        lastData.user_id,
        lastData.client_id,
        lastData.tracking_code,
        reasonToStore, 
        date,
        time,
        "Lost",
        "Equipment Lost",
        reasonToStore,
      ]
    );

    await connection.execute(
      "UPDATE equipments SET availability_status = ? WHERE equipment_id = ?",
      ["Lost", id]
    );

    res.status(201).json({
      message: "Equipment marked as lost.",
      date,
      time,
      lostReason: reasonToStore,
    });
  } catch (err) {
    console.error("Error marking equipment as lost:", err);
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

    res
      .status(200)
      .json({ message: `Equipment status updated to '${status}'.` });
  } catch (err) {
    console.error("Error updating equipment status:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET LAST SCANNED EQUIPMENT TRANSACTION
app.get("/scanned-equipment-actions/last/:equipment_id", async (req, res) => {
  const { equipment_id } = req.params;

  let connection;
  try {
    connection = await db.getConnection();

    const [lastTransaction] = await connection.execute(
      `SELECT sea.*, 
              c.first_name AS client_first_name, 
              c.middle_name AS client_middle_name, 
              c.last_name AS client_last_name, 
              c.contact_number AS client_contact_number, 
              c.email AS client_email, 
              c.address AS client_address, 
              c.client_type, 

              t.name AS technician_name, 
              t.contact_number AS technician_contact_number, 
              t.shop_name AS technician_shop_name, 
              t.shop_address AS technician_shop_address

       FROM scanned_equipments_actions sea
       
       LEFT JOIN clients c ON sea.client_id = c.client_id
       LEFT JOIN technicians t ON sea.technician_id = t.technician_id

       WHERE sea.equipment_id = ?
       
       AND (
         sea.transaction_type = 'Check Out' 
         OR sea.transaction_type = 'Maintenance' 
         OR sea.transaction_type = 'Being Maintained'
       )
       
       AND NOT EXISTS (
           SELECT 1 FROM scanned_equipments_actions sea2
           WHERE sea2.equipment_id = sea.equipment_id 
           AND sea2.transaction_type = 'Return Equipment' 
           AND sea2.tracking_code = sea.tracking_code
       )

       ORDER BY sea.action_id DESC
       LIMIT 1`,
      [equipment_id]
    );

    if (lastTransaction.length === 0) {
      return res.status(404).json({
        message: "No valid last transaction found for this equipment.",
      });
    }

    res.status(200).json(lastTransaction[0]);
  } catch (err) {
    console.error("Error fetching last transaction:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET SCANNED TRANSACTIONS
app.get("/scanned-equipment-actions", async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    const [actions] = await connection.execute(
      `SELECT sea.*,
              e.name AS equipment_name, e.type, e.brand, e.operational_status, e.availability_status,
              c.first_name AS client_first_name, c.last_name AS client_last_name,
              l.lab_name, l.lab_number
       FROM scanned_equipments_actions sea
       LEFT JOIN equipments e ON sea.equipment_id = e.equipment_id
       LEFT JOIN clients c ON sea.client_id = c.client_id
       LEFT JOIN laboratories l ON sea.lab_id = l.lab_id
       WHERE sea.action_id = (SELECT MAX(action_id) 
                              FROM scanned_equipments_actions 
                              WHERE tracking_code = sea.tracking_code)
       GROUP BY sea.tracking_code
       ORDER BY sea.date DESC`
    );

    if (actions.length === 0) {
      return res.status(404).json({ message: "No tracking data found." });
    }

    res.status(200).json(actions);
  } catch (err) {
    console.error("Error fetching latest transactions:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// GET TRACKED EQUIPMENT BY TRACKING ID
app.get("/scanned-equipment-actions/:tracking_code", async (req, res) => {
  const { tracking_code } = req.params;

  let connection;
  try {
    connection = await db.getConnection();

    const [actions] = await connection.execute(
      `SELECT sea.*, 
              e.name AS equipment_name, e.number, e.type, e.brand, 
              e.operational_status, e.availability_status, e.description, 
              l.lab_name, l.lab_number, 
              c.first_name AS client_first_name, c.middle_name AS client_middle_name, 
              c.last_name AS client_last_name, c.contact_number AS client_contact, 
              c.email AS client_email, c.address AS client_address, c.client_type,
              u.first_name AS user_first_name, u.middle_name AS user_middle_name, 
              u.last_name AS user_last_name, u.phone AS user_phone, 
              u.email AS user_email, u.user_type,

              t.name AS technician_name, 
              t.contact_number AS technician_contact_number, 
              t.shop_name AS technician_shop_name, 
              t.shop_address AS technician_shop_address

       FROM scanned_equipments_actions sea
       LEFT JOIN equipments e ON sea.equipment_id = e.equipment_id
       LEFT JOIN laboratories l ON sea.lab_id = l.lab_id
       LEFT JOIN clients c ON sea.client_id = c.client_id
       LEFT JOIN users u ON sea.user_id = u.user_id
       LEFT JOIN technicians t ON sea.technician_id = t.technician_id

       WHERE sea.tracking_code = ?
       LIMIT 1`,
      [tracking_code]
    );

    if (actions.length === 0) {
      return res.status(404).json({ message: "No tracking data found." });
    }

    res.status(200).json(actions[0]);
  } catch (err) {
    console.error("Error fetching tracked equipment:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// TRACKING TIMELINE
app.get(
  "/scanned-equipment-actions/history/:tracking_code",
  async (req, res) => {
    const { tracking_code } = req.params;

    let connection;
    try {
      connection = await db.getConnection();

      const [history] = await connection.execute(
        `SELECT sea.tracking_code, 
                CONCAT(sea.date, 'T', sea.time) AS datetime, 
                sea.reason, sea.transaction_type, 
                sea.notes,
                sea.lab_id, sea.user_id, sea.technician_id,
                u.first_name AS user_first_name, u.last_name AS user_last_name, u.user_type, 
                c.first_name AS client_first_name, c.last_name AS client_last_name, 
                l.lab_name, l.lab_number,
                e.name AS equipment_name,
                t.name AS technician_name, t.contact_number AS technician_contact_number, t.shop_name AS technician_shop_name
         FROM scanned_equipments_actions sea
         LEFT JOIN users u ON sea.user_id = u.user_id
         LEFT JOIN clients c ON sea.client_id = c.client_id
         LEFT JOIN laboratories l ON sea.lab_id = l.lab_id
         LEFT JOIN equipments e ON sea.equipment_id = e.equipment_id
         LEFT JOIN technicians t ON sea.technician_id = t.technician_id
         WHERE sea.tracking_code = ?
         ORDER BY sea.date ASC, sea.time ASC`,
        [tracking_code]
      );

      if (history.length === 0) {
        return res.status(404).json({ message: "No tracking history found." });
      }

      const structuredHistory = history.flatMap((entry) => {
        const common = {
          datetime: entry.datetime,
        };

        if (entry.transaction_type === "Check Out") {
          return [
            {
              ...common,
              event: "Check Out Process",
              details: `Handled by ${entry.user_first_name} ${entry.user_last_name} (${entry.user_type})`,
            },
            {
              ...common,
              event: "Equipment Checked Out",
              details: `Client: ${entry.client_first_name} ${entry.client_last_name} checked out ${entry.equipment_name} from ${entry.lab_name} (Lab ${entry.lab_number})`,
            },
          ];
        } else if (entry.transaction_type === "Return Equipment") {
          return [
            {
              ...common,
              event: "Equipment Returned",
              details: `Handled by ${entry.user_first_name} ${entry.user_last_name} (${entry.user_type})`,
            },
            {
              ...common,
              event: "Returned at Laboratory",
              details: `${entry.lab_name} - ${entry.lab_number}`,
            },
          ];
        } else if (entry.transaction_type === "Maintenance") {
          return [
            {
              ...common,
              event: "Maintenance Release Process",
              details: `Handled by ${entry.user_first_name} ${entry.user_last_name} (${entry.user_type}) - ${entry.reason}`,
            },
            {
              ...common,
              event: "Equipment Released for Maintenance",
              details: `(Released from ${entry.lab_name} ${entry.lab_number})`,
            },
          ];
        } else if (entry.transaction_type === "Maintenance Accepted") {
          return [
            {
              ...common,
              event: `Maintenance Accepted - ${entry.reason || "N/A"}`,
              details: `Technician: ${
                entry.technician_name || "N/A"
              } - Contact: ${
                entry.technician_contact_number || "N/A"
              } - Shop: ${entry.technician_shop_name || "N/A"}`,
            },
            {
              ...common,
              event: "Equipment is Being Maintained",
              details: `${entry.equipment_name} is now under maintenance.`,
            },
          ];
        } else if (entry.transaction_type === "Repair Finished & Returned") {
          return [
            {
              ...common,
              event: "Repair Completed & Equipment Returned",
              details: `Technician: ${
                entry.technician_name || "N/A"
              } - Contact: ${
                entry.technician_contact_number || "N/A"
              } - Shop: ${entry.technician_shop_name || "N/A"}`,
            },
            {
              ...common,
              event: "Equipment Returned to Laboratory",
              details: `Returned to ${entry.lab_name} (Lab ${entry.lab_number})`,
            },
            {
              ...common,
              event: "Repair Notes",
              details: entry.notes || "No additional notes provided.",
            },
          ];
        } else if (
          entry.transaction_type === "Maintenance Cancelled & Returned"
        ) {
          return [
            {
              ...common,
              event: "Maintenance Cancelled",
              details: `Cancelled by ${entry.user_first_name} ${entry.user_last_name} (${entry.user_type})`,
            },
            {
              ...common,
              event: "Cancellation Reason",
              details: entry.notes || "No reason provided.",
            },
            {
              ...common,
              event: "Equipment Returned to Laboratory",
              details: `Returned to ${entry.lab_name} (Lab ${entry.lab_number})`,
            },
          ];
        } else if (entry.transaction_type === "Repair Failed & Returned") {
          return [
            {
              ...common,
              event: "Repair Attempt Failed",
              details: `Reason: ${entry.reason || "No reason provided"}`,
            },
            {
              ...common,
              event: "Equipment Returned to Laboratory",
              details: `Returned to ${entry.lab_name} (Lab ${entry.lab_number})`,
            },
          ];
        } else {
          return [
            {
              ...common,
              event: entry.transaction_type,
              details: entry.reason,
            },
          ];
        }
      });

      res.status(200).json(structuredHistory);
    } catch (err) {
      console.error("Error fetching tracking history:", err);
      res.status(500).json({ message: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }
);

// INSERT SCAN MAINTENANCE ACTION - RELEASE
app.post("/maintenance/release", async (req, res) => {
  const { equipment_id, lab_id, user_id, reason, technician } = req.body;

  if (!equipment_id || !lab_id || !user_id || !reason) {
    return res.status(400).json({
      message: "equipment_id, lab_id, user_id, and reason are required.",
    });
  }

  const tracking_code = `MTN-${Date.now()}`;
  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toTimeString().split(" ")[0];
  const status = "Released";
  const transaction_type = "Maintenance";

  let connection;
  try {
    connection = await db.getConnection();

    let technician_id = null;

    if (technician) {
      const { technician_name, contact_number, shop_name, shop_address } =
        technician;

      const [existing] = await connection.execute(
        `SELECT technician_id FROM technicians WHERE name = ? AND contact_number = ? AND shop_name = ?`,
        [technician_name, contact_number, shop_name]
      );

      if (existing.length > 0) {
        technician_id = existing[0].technician_id;
      } else {
        const [inserted] = await connection.execute(
          `INSERT INTO technicians (name, contact_number, shop_name, shop_address)
           VALUES (?, ?, ?, ?)`,
          [technician_name, contact_number, shop_name, shop_address]
        );
        technician_id = inserted.insertId;
      }
    }

    await connection.execute(
      `INSERT INTO scanned_equipments_actions 
       (equipment_id, lab_id, user_id, technician_id, tracking_code, reason, date, time, status, transaction_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        equipment_id,
        lab_id,
        user_id,
        technician_id,
        tracking_code,
        reason,
        date,
        time,
        status,
        transaction_type,
      ]
    );

    await connection.execute(
      "UPDATE equipments SET availability_status = ? WHERE equipment_id = ?",
      ["Maintenance", equipment_id]
    );

    res.status(201).json({
      message: "Maintenance action recorded successfully.",
      tracking_code,
      status,
    });
  } catch (err) {
    console.error("Error logging maintenance action:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// TECHNICIAN SEARCH
app.get("/technicians/search", async (req, res) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    return res
      .status(400)
      .json({ message: "Query must be at least 2 characters long." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const searchQuery = `%${query}%`;

    const [results] = await connection.execute(
      `SELECT technician_id, name, contact_number, shop_name, shop_address
       FROM technicians
       WHERE name LIKE ? 
          OR shop_name LIKE ? 
          OR contact_number = ? 
       LIMIT 10`,
      [searchQuery, searchQuery, query]
    );

    res.json({ technicians: results });
  } catch (err) {
    console.error("Technician search error:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// INSERT SCAN MAINTENANCE ACTION - MAINTENANCE CONFIRMATION
app.post("/maintenance/ongoing-repair", async (req, res) => {
  const { equipment_id } = req.body;

  if (!equipment_id) {
    return res.status(400).json({
      message: "equipment_id is required.",
    });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const [lastTransaction] = await connection.execute(
      `SELECT * FROM scanned_equipments_actions 
       WHERE equipment_id = ? 
       AND transaction_type = 'Maintenance'
       ORDER BY action_id DESC LIMIT 1`,
      [equipment_id]
    );

    if (lastTransaction.length === 0) {
      return res.status(404).json({
        message:
          "No previous maintenance transaction found for this equipment.",
      });
    }

    const lastData = lastTransaction[0];

    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().split(" ")[0];

    await connection.execute(
      `INSERT INTO scanned_equipments_actions 
       (equipment_id, lab_id, user_id, technician_id, tracking_code, reason, date, time, status, transaction_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        lastData.equipment_id,
        lastData.lab_id,
        lastData.user_id,
        lastData.technician_id,
        lastData.tracking_code,
        lastData.reason,
        date,
        time,
        "On-Going-Repair",
        "Maintenance Accepted",
      ]
    );

    await connection.execute(
      "UPDATE equipments SET availability_status = ? WHERE equipment_id = ?",
      ["Being Maintained", equipment_id]
    );

    res.status(201).json({
      message: "Maintenance confirmation recorded successfully.",
      tracking_code: lastData.tracking_code,
      status: "On-Going-Repair",
      date,
      time,
    });
  } catch (err) {
    console.error("Error logging maintenance confirmation:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// INSERT SCAN MAINTENANCE ACTION - CANCEL MAINTENANCE & RETURN EQUIPMENT
app.post("/maintenance/cancel-return", async (req, res) => {
  const { equipment_id, cancel_reason } = req.body;

  if (!equipment_id || !cancel_reason) {
    return res
      .status(400)
      .json({ message: "Equipment ID and cancellation reason are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const [lastTransaction] = await connection.execute(
      `SELECT * FROM scanned_equipments_actions 
       WHERE equipment_id = ? 
       AND (transaction_type = 'Maintenance' OR transaction_type = 'Maintenance Accepted')
       ORDER BY action_id DESC LIMIT 1`,
      [equipment_id]
    );

    if (lastTransaction.length === 0) {
      return res
        .status(404)
        .json({ message: "No active maintenance found for this equipment." });
    }

    const lastData = lastTransaction[0];
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().split(" ")[0];

    await connection.execute(
      `INSERT INTO scanned_equipments_actions 
       (equipment_id, lab_id, user_id, technician_id, tracking_code, reason, date, time, status, transaction_type, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

      [
        lastData.equipment_id,
        lastData.lab_id,
        lastData.user_id,
        lastData.technician_id,
        lastData.tracking_code,
        lastData.reason,
        date,
        time,
        "Cancelled & Returned",
        "Maintenance Cancelled & Returned",
        cancel_reason,
      ]
    );

    await connection.execute(
      "UPDATE equipments SET availability_status = ? WHERE equipment_id = ?",
      ["Available", equipment_id]
    );

    res.status(201).json({
      message: "Maintenance process cancelled and equipment returned.",
      date,
      time,
      cancel_reason,
    });
  } catch (err) {
    console.error("Error cancelling maintenance:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// INSERT SCAN MAINTENANCE ACTION - FINISH REPAIR
app.post("/maintenance/finish-repair", async (req, res) => {
  const { equipment_id, return_notes } = req.body;

  if (!equipment_id || !return_notes) {
    return res
      .status(400)
      .json({ message: "Equipment ID and return notes are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const [lastTransaction] = await connection.execute(
      `SELECT * FROM scanned_equipments_actions 
       WHERE equipment_id = ? 
       AND transaction_type = 'Maintenance Accepted'
       ORDER BY action_id DESC LIMIT 1`,
      [equipment_id]
    );

    if (lastTransaction.length === 0) {
      return res
        .status(404)
        .json({ message: "No active maintenance confirmation found." });
    }

    const lastData = lastTransaction[0];
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().split(" ")[0];

    await connection.execute(
      `INSERT INTO scanned_equipments_actions 
       (equipment_id, lab_id, user_id, technician_id, tracking_code, reason, date, time, status, transaction_type, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lastData.equipment_id,
        lastData.lab_id,
        lastData.user_id,
        lastData.technician_id,
        lastData.tracking_code,
        lastData.reason,
        date,
        time,
        "Returned",
        "Repair Finished & Returned",
        return_notes,
      ]
    );

    await connection.execute(
      "UPDATE equipments SET availability_status = ? WHERE equipment_id = ?",
      ["Available", equipment_id]
    );

    res.status(201).json({
      message: "Equipment successfully returned with notes.",
      date,
      time,
      return_notes,
    });
  } catch (err) {
    console.error("Error finishing repair and returning equipment:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

// INSERT SCAN MAINTENANCE ACTION - REPAIR FAILED & RETURN EQUIPMENT
app.post("/maintenance/repair-failed-return", async (req, res) => {
  const { equipment_id, failure_reason } = req.body;

  if (!equipment_id || !failure_reason) {
    return res
      .status(400)
      .json({ message: "Equipment ID and failure reason are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const [lastTransaction] = await connection.execute(
      `SELECT * FROM scanned_equipments_actions 
       WHERE equipment_id = ? 
       AND transaction_type = 'Maintenance Accepted' 
       ORDER BY action_id DESC LIMIT 1`,
      [equipment_id]
    );

    if (lastTransaction.length === 0) {
      return res
        .status(404)
        .json({ message: "No ongoing maintenance found for this equipment." });
    }

    const lastData = lastTransaction[0];
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().split(" ")[0];

    await connection.execute(
      `INSERT INTO scanned_equipments_actions 
       (equipment_id, lab_id, user_id, technician_id, tracking_code, reason, date, time, status, transaction_type, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

      [
        lastData.equipment_id,
        lastData.lab_id,
        lastData.user_id,
        lastData.technician_id,
        lastData.tracking_code,
        failure_reason,
        date,
        time,
        "Repair Failed & Returned",
        "Repair Failed & Returned",
        failure_reason,
      ]
    );

    await connection.execute(
      "UPDATE equipments SET availability_status = ? WHERE equipment_id = ?",
      ["Available", equipment_id]
    );

    res.status(201).json({
      message: "Repair process failed, and equipment returned.",
      date,
      time,
      failure_reason,
    });
  } catch (err) {
    console.error("Error handling repair failure:", err);
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
