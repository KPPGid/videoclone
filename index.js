const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Setup database SQLite
const db = new sqlite3.Database("video.db");
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      filename TEXT
    )
  `);
});

// Route upload
app.post("/upload", upload.single("video"), (req, res) => {
  const id = uuidv4();
  db.run("INSERT INTO videos (id, filename) VALUES (?, ?)", [id, req.file.filename], (err) => {
    if (err) return res.status(500).send("Database error.");
    res.redirect(`/upload.html?id=${id}`);
  });
});

// Route tampilkan video
app.get("/v", (req, res) => {
  const id = req.query.id;
  db.get("SELECT filename FROM videos WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).send("Video tidak ditemukan.");
    const videoPath = path.join(__dirname, "uploads", row.filename);
    res.send(`
      <html><body>
      <video width="640" controls>
        <source src="/video/${row.filename}" type="video/mp4">
        Browser tidak mendukung video.
      </video>
      </body></html>
    `);
  });
});

// Serve file video langsung
app.get("/video/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("File video tidak ditemukan.");
  }
});

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
