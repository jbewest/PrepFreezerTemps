# Freezer Temperature Log Processor

A Node.js script that processes freezer temperature CSV data and generates formatted Excel reports for food safety compliance logging.

## What It Does

This script automates the creation of temperature logs for frozen food storage. It:

1. **Reads** temperature data from a CSV file
2. **Filters** for specific monitoring times (9:01 AM and 5:01 PM)
3. **Converts** 24-hour timestamps to 12-hour format
4. **Rounds** temperature readings to nearest whole degree
5. **Generates** a formatted Excel spreadsheet with proper headers and columns
6. **Timestamps** the output file automatically

Think of it like a quality control assistant that takes raw sensor data and turns it into a professional compliance log ready for inspection.

## Prerequisites

Before running this script, you need:

### 1. Node.js Installed
- **Version:** Node.js 14.x or higher recommended
- **Check if installed:** Open a terminal/command prompt and type:
  ```bash
  node --version
  ```
- **If not installed:** Download from [nodejs.org](https://nodejs.org/)

### 2. Required NPM Packages
The script uses three external libraries:
- `csv-parser` - Reads CSV files
- `exceljs` - Creates Excel files
- `fs` and `path` - Built into Node.js (no installation needed)

## Installation

### Step 1: Set Up Your Project Folder

Create a folder for your temperature processing project:

```bash
mkdir freezer-temp-processor
cd freezer-temp-processor
```

### Step 2: Copy the Script

Save the `processFreezerTemps.js` file into this folder.

### Step 3: Initialize NPM (if not already done)

```bash
npm init -y
```

This creates a `package.json` file to track your dependencies.

### Step 4: Install Dependencies

Run this command to install the required packages:

```bash
npm install csv-parser exceljs
```

**What this does:** Downloads the two libraries and their dependencies into a `node_modules` folder.

You should see output confirming the installation and a new `node_modules` folder appear.

## How to Run the Script

### Basic Command Structure

```bash
node processFreezerTemps.js <path-to-your-csv-file>
```

### Example 1: CSV in Same Folder

If your CSV file `temps_jan2025.csv` is in the same folder as the script:

```bash
node processFreezerTemps.js temps_jan2025.csv
```

### Example 2: CSV in Different Location

**Windows:**
```bash
node processFreezerTemps.js "C:\Users\Joel\Documents\FreezerData\temps_jan2025.csv"
```

**Mac/Linux:**
```bash
node processFreezerTemps.js /home/joel/freezer-data/temps_jan2025.csv
```

### What Happens When You Run It

1. Script reads the CSV file
2. Filters temperature readings for 9:01 AM and 5:01 PM
3. Creates an Excel file in the **same folder as your input CSV**
4. Names it: `lamb freezer output for log_YYYYMMDD_HHMMSS.xlsx`
5. Displays success message with file location

**Example Output:**
```
Successfully created: C:\Users\Joel\Documents\FreezerData\lamb freezer output for log_20250125_143022.xlsx
Processed 42 temperature readings.
```

## Input CSV Format

Your CSV file must have these columns (the script is flexible with column names):

- A **Timestamp** column (variations: "Timestamp", "timestamp", or containing "Timestamp")
- A **Temperature** column (variations: "Temperature", "temperature", or containing "Temperature")

### Example Input CSV:

```csv
Timestamp,Temperature
1/20/2025 9:01,-2.5
1/20/2025 10:30,-1.8
1/20/2025 17:01,-3.2
1/21/2025 9:01,-2.1
1/21/2025 17:01,-2.8
```

**Important Notes:**
- Timestamp format: `M/D/YYYY H:MM` (e.g., `1/5/2025 9:01`)
- Only readings at exactly **9:01** (AM) or **17:01** (5:01 PM) are included
- Temperature can have decimals (will be rounded to nearest integer)

## Output Excel Format

The generated Excel file contains these columns:

| Date | Time | Unit/Freezer ID | Frozen Storage Temp (°F) | Status | Notes / Corrective Actions |
|------|------|-----------------|--------------------------|--------|----------------------------|
| 1/20/2025 | 9:01 AM | BASEMENT-001 | -3 | OK | |
| 1/20/2025 | 5:01 PM | BASEMENT-001 | -3 | OK | |

**Features:**
- Bold headers
- Pre-filled "BASEMENT-001" as Freezer ID
- Pre-filled "OK" status
- Empty notes column for manual entry
- Sorted chronologically (AM readings before PM on same day)

## Testing the Script

### Test 1: Create Sample CSV

Create a test file named `test_temps.csv`:

```csv
Timestamp,Temperature
1/23/2025 9:01,-2.5
1/23/2025 12:30,-1.8
1/23/2025 17:01,-3.2
1/24/2025 9:01,-2.1
1/24/2025 14:45,-2.5
1/24/2025 17:01,-2.8
1/25/2025 9:01,-1.9
```

### Test 2: Run the Script

```bash
node processFreezerTemps.js test_temps.csv
```

### Test 3: Verify Output

**Expected results:**
- Excel file created: `lamb freezer output for log_[timestamp].xlsx`
- Console shows: `Processed 5 temperature readings.`
- Only the 9:01 and 17:01 readings should appear (5 total)
- The 12:30 and 14:45 readings should be filtered out

### Test 4: Open the Excel File

Open the generated Excel file and verify:
- ✅ 5 rows of data (3 from 1/23, 2 from 1/24, 0 from 1/25 5:01 PM since it wasn't in test data)
- ✅ Times show as "9:01 AM" and "5:01 PM"
- ✅ Temperatures are rounded integers (-3, -3, -2, -3, -2)
- ✅ Headers are bold
- ✅ All columns are properly labeled

## Troubleshooting

### Error: "Usage: node processFreezerTemps.js <input-csv-file>"

**Problem:** No CSV file specified

**Solution:** Provide the CSV filename:
```bash
node processFreezerTemps.js your_file.csv
```

---

### Error: "File not found"

**Problem:** Script can't locate your CSV file

**Solutions:**
1. Make sure the file exists in the specified location
2. Check spelling of the filename
3. Use quotes around paths with spaces:
   ```bash
   node processFreezerTemps.js "my folder/temps.csv"
   ```
4. Try using the full/absolute path to the file

---

### Error: "Cannot find module 'csv-parser'" or "'exceljs'"

**Problem:** Dependencies not installed

**Solution:** Install the required packages:
```bash
npm install csv-parser exceljs
```

---

### No Error, But No Output File Created

**Possible causes:**

1. **CSV has wrong column names**
   - Check that columns contain "Timestamp" and "Temperature" (case-insensitive)

2. **No readings at 9:01 or 17:01**
   - Verify your CSV has times exactly at 9:01 or 17:01
   - Script ignores 9:00, 9:02, 17:00, 17:02, etc.

3. **Invalid timestamp format**
   - Must be: `M/D/YYYY H:MM` format
   - Example: `1/25/2025 9:01` ✅
   - Not: `01/25/2025 09:01:00` ❌

---

### Temperatures Look Wrong

**Check these:**
- Script rounds to nearest integer: -2.4 becomes -2, -2.6 becomes -3
- Negative temperatures are normal for freezers
- Temperature column must contain numbers (text values will be skipped)

---

### Permission Denied Error

**Problem:** Can't write to output location

**Solutions:**
- Ensure you have write permissions in the folder
- Try running terminal/command prompt as administrator (Windows)
- Check that the CSV file isn't open in Excel (may lock the folder)

## Customizing the Script

### Change Freezer ID

Find this line (around line 122):
```javascript
freezerId: 'BASEMENT-001',
```

Change to your freezer name:
```javascript
freezerId: 'GARAGE-002',
```

### Change Target Times

Find these lines (around line 76):
```javascript
if ((hourNum === 9 && minuteNum === 1) || (hourNum === 17 && minuteNum === 1)) {
```

Modify to your desired times. For example, 8:00 AM and 6:00 PM:
```javascript
if ((hourNum === 8 && minuteNum === 0) || (hourNum === 18 && minuteNum === 0)) {
```

### Change Output Filename Pattern

Find this line (around line 39):
```javascript
return `lamb freezer output for log_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
```

Modify the template string to your preference.

## File Locations

**Script expects:**
- Input: CSV file (you specify the location)
- Output: Excel file created in the **same folder** as your input CSV

**Example:**
```
If input is:  C:\Freezer\Data\temps.csv
Output goes:  C:\Freezer\Data\lamb freezer output for log_20250125_143022.xlsx
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│  FREEZER TEMP PROCESSOR - QUICK START               │
├─────────────────────────────────────────────────────┤
│  1. Install Node.js (nodejs.org)                    │
│  2. npm install csv-parser exceljs                  │
│  3. node processFreezerTemps.js your_file.csv       │
│  4. Find output Excel in same folder as CSV         │
└─────────────────────────────────────────────────────┘

CSV Format Required:
  - Columns: Timestamp, Temperature
  - Times: M/D/YYYY H:MM (e.g., 1/25/2025 9:01)
  - Captures: Only 9:01 AM and 5:01 PM (17:01) readings

Output Includes:
  ✓ Date and Time (12-hour format)
  ✓ Freezer ID (BASEMENT-001)
  ✓ Rounded temperature (°F)
  ✓ Status and Notes columns
```

## Support

If you encounter issues not covered here:

1. **Check Node.js version:** `node --version` (should be 14+ or higher)
2. **Verify CSV format:** Open in text editor to see raw format
3. **Check file paths:** Use absolute paths if relative paths fail
4. **Review error messages:** They usually indicate the specific problem

## License

This script is for personal use in food safety compliance logging.
