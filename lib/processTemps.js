const csv = require("csv-parser");
const ExcelJS = require("exceljs");
const { Readable } = require("stream");

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

/**
 * Process CSV input (stream or buffer) and return filtered/sorted results.
 * @param {import("stream").Readable|Buffer} input - CSV as a stream or buffer
 * @returns {Promise<Array<{ date: Date, time: string, temperature: number }>>}
 */
function processCsvToResults(input) {
  const stream = Buffer.isBuffer(input) ? Readable.from(input) : input;
  const results = [];

  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on("data", (row) => {
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
          return;
        }

        const [datePart, timePart] = timestamp.split(" ");
        if (!datePart || !timePart) {
          return;
        }

        const [hour, minute] = timePart.split(":");
        const hourNum = parseInt(hour, 10);
        const minuteNum = parseInt(minute, 10);

        if (
          (hourNum === 9 && minuteNum === 1) ||
          (hourNum === 17 && minuteNum === 1)
        ) {
          const time12Hour = convertTo12Hour(timePart);
          const roundedTemp = Math.round(temperature);
          const dateObj = new Date(datePart);

          results.push({
            date: dateObj,
            time: time12Hour,
            temperature: roundedTemp,
          });
        }
      })
      .on("end", () => {
        results.sort((a, b) => {
          const dateCompare = new Date(a.date) - new Date(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.time.includes("AM") ? -1 : 1;
        });
        resolve(results);
      })
      .on("error", reject);
  });
}

/**
 * Build an ExcelJS workbook from results (same format as CLI output).
 * @param {Array<{ date: Date, time: string, temperature: number }>} results
 * @returns {ExcelJS.Workbook}
 */
function resultsToWorkbook(results) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Temperature Log");

  worksheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Time", key: "time", width: 12 },
    { header: "Unit/Freezer ID", key: "freezerId", width: 18 },
    { header: "Frozen Storage\nTemp (°F)", key: "temperature", width: 20 },
    { header: "Status", key: "status", width: 10 },
    { header: "Notes / Corrective Actions", key: "notes", width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: "top", wrapText: true };

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

  worksheet.getColumn(1).numFmt = "m/d/yyyy";

  return workbook;
}

module.exports = {
  processCsvToResults,
  resultsToWorkbook,
};
