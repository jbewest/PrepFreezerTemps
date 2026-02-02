const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const ExcelJS = require("exceljs");

// Parse command-line arguments
const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Usage: node processFreezerTemps.js <input-csv-file>");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`Error: File not found: ${inputFile}`);
  process.exit(1);
}

// Function to convert 24-hour time to 12-hour format with AM/PM
function convertTo12Hour(time24) {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const min = minutes || "00";

  if (hour === 0) {
    return `12:${min} AM`;
  } else if (hour === 12) {
    return `12:${min} PM`;
  } else if (hour < 12) {
    return `${hour}:${min} AM`;
  } else {
    return `${hour - 12}:${min} PM`;
  }
}

// Function to generate output filename with current date and timestamp
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

// Read and parse CSV
const results = [];

fs.createReadStream(inputFile)
  .pipe(csv())
  .on("data", (row) => {
    // Handle BOM in column name - find the timestamp column by matching the key
    let timestamp = null;
    let temperature = null;

    for (const key in row) {
      if (key.includes("Timestamp") || key.includes("timestamp")) {
        timestamp = row[key];
      }
      if (key.includes("Temperature") || key.includes("temperature")) {
        temperature = parseFloat(row[key]);
      }
    }

    if (!timestamp || isNaN(temperature)) {
      return; // Skip invalid rows
    }

    // Parse timestamp: "M/D/YYYY H:MM"
    const [datePart, timePart] = timestamp.split(" ");
    if (!datePart || !timePart) {
      return; // Skip invalid timestamps
    }

    // Extract hour and minute
    const [hour, minute] = timePart.split(":");
    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);

    // Filter for 9:01 AM (9:01) or 5:01 PM (17:01)
    if (
      (hourNum === 9 && minuteNum === 1) ||
      (hourNum === 17 && minuteNum === 1)
    ) {
      // Convert time to 12-hour format
      const time12Hour = convertTo12Hour(timePart);

      // Round temperature to nearest integer
      const roundedTemp = Math.round(temperature);

      // Parse date string (M/D/YYYY) to Date object for Excel
      const dateObj = new Date(datePart);

      results.push({
        date: dateObj,
        time: time12Hour,
        temperature: roundedTemp,
      });
    }
  })
  .on("end", () => {
    // Sort results by date and time (9:01 AM before 5:01 PM on same day)
    results.sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      // 9:01 AM comes before 5:01 PM
      return a.time.includes("AM") ? -1 : 1;
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Temperature Log");

    // Set column headers
    worksheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Time", key: "time", width: 12 },
      { header: "Unit/Freezer ID", key: "freezerId", width: 18 },
      { header: "Frozen Storage\nTemp (°F)", key: "temperature", width: 20 },
      { header: "Status", key: "status", width: 10 },
      { header: "Notes / Corrective Actions", key: "notes", width: 30 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: "top", wrapText: true };

    // Add data rows (date is a Date object so Excel stores it as a date)
    results.forEach((result) => {
      worksheet.addRow({
        date: result.date,
        time: result.time,
        freezerId: "BASEMENT-001",
        temperature: result.temperature,
        status: "OK",
        notes: "",
      });
    });

    // Format Date column as Excel date (M/D/YYYY) so Excel interprets it as a date
    worksheet.getColumn(1).numFmt = "m/d/yyyy";

    // Generate output filename
    const outputFilename = generateOutputFilename();
    const outputPath = path.join(path.dirname(inputFile), outputFilename);

    // Write Excel file
    workbook.xlsx
      .writeFile(outputPath)
      .then(() => {
        console.log(`Successfully created: ${outputPath}`);
        console.log(`Processed ${results.length} temperature readings.`);
      })
      .catch((error) => {
        console.error("Error writing Excel file:", error);
        process.exit(1);
      });
  })
  .on("error", (error) => {
    console.error("Error reading CSV file:", error);
    process.exit(1);
  });
