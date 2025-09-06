# SQL to CSV Converter

A Python script that converts SQL backup files to CSV format. This tool can handle various SQL formats including CREATE TABLE statements, INSERT statements, and different data types.

## Features

- ✅ Converts SQL backup files to CSV format
- ✅ Handles multiple tables in a single SQL file
- ✅ Supports various SQL data types (strings, numbers, booleans, NULL values)
- ✅ Preserves table structure and column names
- ✅ Handles quoted strings and special characters
- ✅ Supports both single and multi-row INSERT statements
- ✅ Creates output directories automatically
- ✅ Provides detailed progress information

## Requirements

- Python 3.6 or higher
- No external dependencies (uses only standard library)

## Installation

1. Download the `sql_to_csv_converter.py` script
2. Make it executable (optional):
   ```bash
   chmod +x sql_to_csv_converter.py
   ```

## Usage

### Basic Usage

```bash
# Convert all tables to CSV files in a directory
python sql_to_csv_converter.py backup.sql

# Convert to specific output directory
python sql_to_csv_converter.py backup.sql --output-dir ./csv_files

# Convert single table to specific CSV file
python sql_to_csv_converter.py backup.sql --table users --output users.csv
```

### Command Line Options

- `sql_file`: Path to the SQL backup file (required)
- `--output, -o`: Output CSV file path (for single table)
- `--output-dir, -d`: Output directory for multiple tables
- `--table, -t`: Specific table to convert
- `--list-tables, -l`: List all tables found in the SQL file

### Examples

#### 1. List all tables in SQL file
```bash
python sql_to_csv_converter.py backup.sql --list-tables
```

#### 2. Convert all tables to CSV files
```bash
python sql_to_csv_converter.py backup.sql --output-dir ./export
```

#### 3. Convert specific table to CSV
```bash
python sql_to_csv_converter.py backup.sql --table users --output users.csv
```

#### 4. Convert specific table to directory
```bash
python sql_to_csv_converter.py backup.sql --table products --output-dir ./data
```

## Example Output

When you run the script with the example SQL file:

```bash
python sql_to_csv_converter.py example_backup.sql --output-dir ./output
```

You'll see output like:
```
📖 Reading SQL file: example_backup.sql
📋 Found table: users with 5 columns
📋 Found table: products with 6 columns
📋 Found table: orders with 5 columns
📥 Found INSERT statement for table: users with 4 rows
📥 Found INSERT statement for table: products with 5 rows
📥 Found INSERT statement for table: orders with 5 rows
📊 Wrote 4 rows to ./output/users.csv
✅ Converted table 'users' to: ./output/users.csv
📊 Wrote 5 rows to ./output/products.csv
✅ Converted table 'products' to: ./output/products.csv
📊 Wrote 5 rows to ./output/orders.csv
✅ Converted table 'orders' to: ./output/orders.csv

🎉 Conversion completed successfully!
📁 Output directory: ./output
```

## Supported SQL Features

### CREATE TABLE Statements
- Standard CREATE TABLE syntax
- Column definitions with data types
- Primary keys and constraints
- Default values

### INSERT Statements
- Single and multi-row INSERT statements
- Column name specifications
- Various data types:
  - Strings (quoted and unquoted)
  - Numbers (integers and decimals)
  - Booleans (TRUE/FALSE)
  - NULL values
  - Dates and timestamps

### Data Types Handled
- `VARCHAR`, `TEXT`, `CHAR`
- `INT`, `BIGINT`, `SMALLINT`
- `DECIMAL`, `FLOAT`, `DOUBLE`
- `BOOLEAN`
- `DATE`, `TIMESTAMP`, `DATETIME`
- `NULL` values

## Troubleshooting

### Common Issues

#### 1. "No data found in SQL file"
- Check if your SQL file contains INSERT statements
- Ensure the SQL syntax is correct
- Verify the file encoding (UTF-8 or Latin-1)

#### 2. "Column count mismatch" warning
- This occurs when the number of values doesn't match the number of columns
- Check your INSERT statements for missing or extra values
- Ensure all rows have the same number of columns

#### 3. Encoding issues
- The script automatically tries UTF-8 first, then Latin-1
- If you have encoding issues, try converting your SQL file to UTF-8

#### 4. Large files
- For very large SQL files, the script loads the entire file into memory
- Consider splitting large files if you encounter memory issues

### Debug Mode

To see more detailed information about the parsing process, you can modify the script to add debug prints or use Python's logging module.

## File Structure

After conversion, you'll have:
```
output/
├── users.csv
├── products.csv
└── orders.csv
```

Each CSV file will contain:
- Header row with column names
- Data rows with values
- Proper handling of quoted strings and special characters

## Limitations

- Currently supports MySQL-style SQL syntax
- Does not handle complex SQL features like:
  - Stored procedures
  - Views
  - Triggers
  - Complex constraints
- Assumes INSERT statements follow standard format
- Does not handle binary data or BLOB fields

## Contributing

Feel free to submit issues or pull requests to improve the script. Common improvements might include:
- Support for more SQL dialects (PostgreSQL, SQLite, etc.)
- Better handling of complex data types
- Performance optimizations for large files
- Additional output formats (JSON, XML, etc.)

## License

This script is provided as-is for educational and practical use. Feel free to modify and distribute as needed.
