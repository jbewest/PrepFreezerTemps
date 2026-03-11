const fs = require("fs");
const path = require("path");
const { processCsvToResults, resultsToWorkbook } = require("./lib/processTemps");

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Usage: node processFreezerTemps.js <input-csv-file>");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`Error: File not found: ${inputFile}`);
  process.exit(1);
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

const inputStream = fs.createReadStream(inputFile);

processCsvToResults(inputStream)
  .then((results) => {
    const workbook = resultsToWorkbook(results);
    const outputFilename = generateOutputFilename();
    const outputPath = path.join(path.dirname(inputFile), outputFilename);

    return workbook.xlsx.writeFile(outputPath).then(() => {
      console.log(`Successfully created: ${outputPath}`);
      console.log(`Processed ${results.length} temperature readings.`);
    });
  })
  .catch((error) => {
    console.error("Error:", error.message || error);
    process.exit(1);
  });
