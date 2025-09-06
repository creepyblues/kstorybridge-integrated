#!/usr/bin/env python3
"""
SQL to CSV Converter
Converts SQL backup files to CSV format.

Usage:
    python sql_to_csv_converter.py input.sql output.csv
    python sql_to_csv_converter.py input.sql --output-dir ./csv_files
    python sql_to_csv_converter.py input.sql --table users --output users.csv
"""

import re
import csv
import argparse
import os
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime
import json


class SQLToCSVConverter:
    def __init__(self, sql_file_path: str):
        self.sql_file_path = sql_file_path
        self.tables = {}
        self.insert_statements = []
        
    def parse_sql_file(self) -> Dict[str, List[Dict[str, Any]]]:
        """Parse SQL file and extract table structures and data."""
        print(f"📖 Reading SQL file: {self.sql_file_path}")
        
        try:
            with open(self.sql_file_path, 'r', encoding='utf-8') as file:
                content = file.read()
        except UnicodeDecodeError:
            # Try with different encoding
            with open(self.sql_file_path, 'r', encoding='latin-1') as file:
                content = file.read()
        
        # Extract CREATE TABLE statements
        self._extract_create_tables(content)
        
        # Extract INSERT statements
        self._extract_insert_statements(content)
        
        # Parse data from INSERT statements
        return self._parse_insert_data()
    
    def _extract_create_tables(self, content: str):
        """Extract CREATE TABLE statements to understand table structure."""
        create_table_pattern = r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\((.*?)\);'
        matches = re.finditer(create_table_pattern, content, re.IGNORECASE | re.DOTALL)
        
        for match in matches:
            table_name = match.group(1)
            table_definition = match.group(2)
            
            # Extract column names
            column_pattern = r'`?(\w+)`?\s+([^,\n]+)'
            columns = re.findall(column_pattern, table_definition)
            
            self.tables[table_name] = {
                'columns': [col[0] for col in columns],
                'definition': table_definition
            }
            print(f"📋 Found table: {table_name} with {len(columns)} columns")
    
    def _extract_insert_statements(self, content: str):
        """Extract INSERT statements from SQL content."""
        # Handle both single and multi-row INSERT statements
        # Updated pattern to better handle multi-line statements
        insert_pattern = r'INSERT\s+INTO\s+`?(\w+)`?\s*\((.*?)\)\s+VALUES\s*((?:\([^)]*\)\s*,?\s*)+);'
        matches = re.finditer(insert_pattern, content, re.IGNORECASE | re.DOTALL)
        
        for match in matches:
            table_name = match.group(1)
            columns_str = match.group(2)
            values_str = match.group(3)
            
            # Parse columns
            columns = [col.strip().strip('`') for col in columns_str.split(',')]
            
            # Parse values
            values_list = self._parse_values(values_str)
            
            self.insert_statements.append({
                'table': table_name,
                'columns': columns,
                'values': values_list
            })
            
            print(f"📥 Found INSERT statement for table: {table_name} with {len(values_list)} rows")
    
    def _parse_values(self, values_str: str) -> List[List[Any]]:
        """Parse VALUES clause into list of value lists."""
        # Clean up the values string
        values_str = values_str.strip()
        
        # Split by row using regex to find complete parentheses groups
        row_pattern = r'\([^)]*\)'
        row_matches = re.findall(row_pattern, values_str)
        
        # Parse each row
        parsed_rows = []
        for row in row_matches:
            if row.startswith('(') and row.endswith(')'):
                row = row[1:-1]  # Remove outer parentheses
            
            # Split by comma, but respect quoted strings
            values = self._split_values(row)
            parsed_values = [self._parse_value(val.strip()) for val in values]
            parsed_rows.append(parsed_values)
        
        return parsed_rows
    
    def _split_values(self, row_str: str) -> List[str]:
        """Split a row string by comma, respecting quoted strings."""
        values = []
        current_value = ""
        in_quotes = False
        quote_char = None
        
        for char in row_str:
            if char in ['"', "'"] and not in_quotes:
                in_quotes = True
                quote_char = char
                current_value += char
            elif char == quote_char and in_quotes:
                in_quotes = False
                current_value += char
            elif char == ',' and not in_quotes:
                values.append(current_value.strip())
                current_value = ""
            else:
                current_value += char
        
        if current_value:
            values.append(current_value.strip())
        
        return values
    
    def _parse_value(self, value: str) -> Any:
        """Parse a single value, handling different data types."""
        value = value.strip()
        
        # Handle NULL
        if value.upper() == 'NULL':
            return None
        
        # Handle quoted strings
        if (value.startswith('"') and value.endswith('"')) or \
           (value.startswith("'") and value.endswith("'")):
            return value[1:-1]
        
        # Handle numbers
        try:
            if '.' in value:
                return float(value)
            else:
                return int(value)
        except ValueError:
            return value
    
    def _parse_insert_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Convert INSERT statements to structured data."""
        table_data = {}
        
        for insert_stmt in self.insert_statements:
            table_name = insert_stmt['table']
            columns = insert_stmt['columns']
            values = insert_stmt['values']
            
            if table_name not in table_data:
                table_data[table_name] = []
            
            for row_values in values:
                if len(row_values) == len(columns):
                    row_dict = dict(zip(columns, row_values))
                    table_data[table_name].append(row_dict)
                else:
                    print(f"⚠️ Warning: Column count mismatch in table {table_name}")
        
        return table_data
    
    def convert_to_csv(self, output_path: str, table_name: Optional[str] = None, data: Optional[Dict[str, List[Dict[str, Any]]]] = None) -> str:
        """Convert SQL data to CSV file."""
        # Use provided data or parse SQL file
        if data is None:
            data = self.parse_sql_file()
        
        if table_name:
            if table_name not in data:
                raise ValueError(f"Table '{table_name}' not found in SQL file")
            tables_to_convert = {table_name: data[table_name]}
        else:
            tables_to_convert = data
        
        if not tables_to_convert:
            raise ValueError("No data found in SQL file")
        
        # If single table and output_path doesn't end with .csv, assume it's a directory
        if len(tables_to_convert) == 1 and not output_path.endswith('.csv'):
            table_name = list(tables_to_convert.keys())[0]
            output_path = os.path.join(output_path, f"{table_name}.csv")
        
        # Create output directory if it doesn't exist
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        if len(tables_to_convert) == 1:
            # Single table - write to specified file
            table_name, table_data = list(tables_to_convert.items())[0]
            self._write_csv(output_path, table_data, table_name)
            print(f"✅ Converted table '{table_name}' to: {output_path}")
            return output_path
        else:
            # Multiple tables - write to directory
            if not output_path.endswith('.csv'):
                output_dir = output_path
            else:
                output_dir = os.path.dirname(output_path)
            
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            written_files = []
            for table_name, table_data in tables_to_convert.items():
                file_path = os.path.join(output_dir, f"{table_name}.csv")
                self._write_csv(file_path, table_data, table_name)
                written_files.append(file_path)
                print(f"✅ Converted table '{table_name}' to: {file_path}")
            
            return output_dir
    
    def _write_csv(self, file_path: str, data: List[Dict[str, Any]], table_name: str):
        """Write data to CSV file."""
        if not data:
            print(f"⚠️ Warning: No data for table '{table_name}'")
            return
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = list(data[0].keys())
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            writer.writerows(data)
        
        print(f"📊 Wrote {len(data)} rows to {file_path}")


def main():
    parser = argparse.ArgumentParser(
        description='Convert SQL backup files to CSV format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python sql_to_csv_converter.py backup.sql output.csv
  python sql_to_csv_converter.py backup.sql --output-dir ./csv_files
  python sql_to_csv_converter.py backup.sql --table users --output users.csv
  python sql_to_csv_converter.py backup.sql --table products --output-dir ./data
        """
    )
    
    parser.add_argument('sql_file', help='Path to the SQL backup file')
    parser.add_argument('--output', '-o', help='Output CSV file path (for single table)')
    parser.add_argument('--output-dir', '-d', help='Output directory for multiple tables')
    parser.add_argument('--table', '-t', help='Specific table to convert')
    parser.add_argument('--list-tables', '-l', action='store_true', 
                       help='List all tables found in the SQL file')
    
    args = parser.parse_args()
    
    # Validate input file
    if not os.path.exists(args.sql_file):
        print(f"❌ Error: SQL file '{args.sql_file}' not found")
        sys.exit(1)
    
    # Initialize converter
    converter = SQLToCSVConverter(args.sql_file)
    
    try:
        # Parse SQL file
        data = converter.parse_sql_file()
        
        if not data:
            print("❌ No data found in SQL file")
            sys.exit(1)
        
        # List tables if requested
        if args.list_tables:
            print("\n📋 Tables found in SQL file:")
            for table_name, table_data in data.items():
                print(f"  - {table_name}: {len(table_data)} rows")
            return
        
        # Determine output path
        if args.output:
            output_path = args.output
        elif args.output_dir:
            output_path = args.output_dir
        else:
            # Default: create output directory with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"sql_export_{timestamp}"
        
        # Convert to CSV
        result_path = converter.convert_to_csv(output_path, args.table, data)
        
        print(f"\n🎉 Conversion completed successfully!")
        if os.path.isdir(result_path):
            print(f"📁 Output directory: {result_path}")
        else:
            print(f"📄 Output file: {result_path}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
