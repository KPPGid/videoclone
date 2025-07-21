const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

// Buat folder upload jika belum ada
const fs = require("fs");
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// Setup database
const db = new sqlite3.Database("video.db");
db.run(`
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Middleware
app.use(express.static("public"));
app.use("/videos", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));

// Setup multer
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});
const upload = multer({ storage });

// Halaman utama
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Upload handler
app.post("/upload", upload.single("video"), (req, res) => {
  const id = uuidv4();
  const filename = req.file.filename;

  db.run("INSERT INTO videos (id, filename) VALUES (?, ?)", [id, filename], () => {
    res.redirect(`/upload.html?id=${id}`);
  });
});

// Halaman pemutar video
app.get("/v", (req, res) => {
  const id = req.query.id;
  db.get("SELECT filename FROM videos WHERE id = ?", [id], (err, row) => {
    if (!row) return res.status(404).send("Video not found.");
    res.send(`
      <h2>Video:</h2>
      <video width="100%" controls autoplay>
        <source src="/videos/${row.filename}" type="video/mp4" />
      </video>
    `);
  });
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
