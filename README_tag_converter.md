# Tag to PostgreSQL Array Converter

This repository contains scripts to convert semicolon-separated tags to PostgreSQL array format.

## Scripts

### 1. `convert_tags_to_postgres_array.py` - Interactive Converter
A comprehensive script that can be used interactively or with command line arguments.

**Usage:**
```bash
# Interactive mode
python3 convert_tags_to_postgres_array.py

# Command line mode
python3 convert_tags_to_postgres_array.py "#게임; #아포칼립스; #헌터물"
```

**Features:**
- Interactive mode for multiple conversions
- Command line support for single conversions
- Proper escaping of single quotes for PostgreSQL
- Handles empty tags gracefully

### 2. `quick_convert.py` - Quick One-liner Converter
A simple script for quick conversions.

**Usage:**
```bash
python3 quick_convert.py "#게임; #아포칼립스; #헌터물; #판타지; #게임판타지; #세계관; #레드아이스"
```

**Output:**
```
ARRAY['#게임', '#아포칼립스', '#헌터물', '#판타지', '#게임판타지', '#세계관', '#레드아이스']
```

### 3. `batch_convert_tags_to_postgres.py` - Batch CSV Processor
Processes CSV files and converts the tags column to PostgreSQL array format.

**Usage:**
```bash
python3 batch_convert_tags_to_postgres.py input.csv [output.txt]
```

**Features:**
- Reads CSV files with a 'tags' column
- Converts all tag entries to PostgreSQL array format
- Generates a text file with row-by-row conversions
- Handles empty tags as `ARRAY[]`

## Input Format
- Tags separated by semicolons: `#게임; #아포칼립스; #헌터물`
- Can include spaces around semicolons
- Empty tags are handled gracefully

## Output Format
- PostgreSQL array format: `ARRAY['#게임', '#아포칼립스', '#헌터물']`
- Properly escaped single quotes
- Empty tags become `ARRAY[]`

## Examples

### Single Conversion
```bash
$ python3 quick_convert.py "#게임; #아포칼립스; #헌터물"
ARRAY['#게임', '#아포칼립스', '#헌터물']
```

### Interactive Mode
```bash
$ python3 convert_tags_to_postgres_array.py
Tag to PostgreSQL Array Converter
Enter tags separated by semicolons (or 'quit' to exit):
Example: #게임; #아포칼립스; #헌터물
--------------------------------------------------

Enter tags: #로맨스; #청춘; #학원물
PostgreSQL Array: ARRAY['#로맨스', '#청춘', '#학원물']

Enter tags: quit
Goodbye!
```

### Batch Processing
```bash
$ python3 batch_convert_tags_to_postgres.py webtoons.csv
Processing complete!
Total rows processed: 400
Rows with tags converted: 350
Output saved to: webtoons_postgres_arrays.txt
```

## PostgreSQL Usage
The generated arrays can be used directly in PostgreSQL queries:

```sql
-- Insert with array
INSERT INTO webtoons (title, tags) 
VALUES ('My Webtoon', ARRAY['#게임', '#아포칼립스', '#헌터물']);

-- Query with array operators
SELECT * FROM webtoons WHERE '#게임' = ANY(tags);
SELECT * FROM webtoons WHERE tags && ARRAY['#게임', '#로맨스'];
```

## Requirements
- Python 3.6+
- No external dependencies required 