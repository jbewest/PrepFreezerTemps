const path = require("path");
const express = require("express");
const multer = require("multer");
const { processCsvToResults, resultsToWorkbook } = require("./lib/processTemps");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

function formatDateForJson(date) {
  if (date instanceof Date) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  }
  return date;
}

function generateOutputFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `lamb freezer output for log_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
}

app.post("/process", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "No file uploaded" });
  }

  const buffer = req.file.buffer;
  processCsvToResults(buffer)
    .then((results) => {
      const serialized = results.map((r) => ({
        date: formatDateForJson(r.date),
        time: r.time,
        temperature: r.temperature,
      }));
      res.json({ ok: true, results: serialized });
    })
    .catch((err) => {
      res.status(400).json({
        ok: false,
        error: err.message || "Failed to process CSV",
      });
    });
});

app.post("/download", (req, res) => {
  const { results } = req.body;
  if (!Array.isArray(results)) {
    return res.status(400).json({ ok: false, error: "Missing or invalid results" });
  }

  const withDates = results.map((r) => ({
    date: typeof r.date === "string" ? new Date(r.date) : r.date,
    time: r.time,
    temperature: r.temperature,
  }));

  const workbook = resultsToWorkbook(withDates);
  const filename = generateOutputFilename();

  workbook.xlsx
    .writeBuffer()
    .then((buffer) => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    })
    .catch((err) => {
      res.status(500).json({
        ok: false,
        error: err.message || "Failed to build Excel file",
      });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
