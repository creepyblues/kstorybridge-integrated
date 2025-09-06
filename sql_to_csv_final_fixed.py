#!/usr/bin/env python3
"""
Final Fixed SQL to CSV Converter
Handles real-world SQL backup files by using actual column count from INSERT statements.

Usage:
    python sql_to_csv_final_fixed.py input.sql output.csv
    python sql_to_csv_final_fixed.py input.sql --output-dir ./csv_files
    python sql_to_csv_final_fixed.py input.sql --table users --output users.csv
"""

import re
import csv
import argparse
import os
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime


class FinalFixedSQLToCSVConverter:
    def __init__(self, sql_file_path: str):
        self.sql_file_path = sql_file_path
        self.tables = {}
        
    def parse_sql_file(self) -> Dict[str, List[Dict[str, Any]]]:
        """Parse SQL file and extract table data."""
        print(f"📖 Reading SQL file: {self.sql_file_path}")
        
        with open(self.sql_file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Extract INSERT statements first to get actual column count
        self._extract_insert_statements(content)
        
        # Extract table structures for reference
        self._extract_table_structures(content)
        
        # Combine data using actual column count from INSERT statements
        result = {}
        for table_name, insert_data in self.insert_statements.items():
            values = insert_data['values']
            if values:
                # Use the first row to determine column count
                first_row = values[0]
                num_columns = len(first_row)
                
                # Create column names based on actual count
                columns = []
                for i in range(num_columns):
                    # Try to use table structure columns if available
                    if table_name in self.tables:
                        table_columns = self.tables[table_name].get('columns', [])
                        if i < len(table_columns):
                            columns.append(table_columns[i])
                        else:
                            columns.append(f'column_{i+1}')
                    else:
                        columns.append(f'column_{i+1}')
                
                # Create rows
                rows = []
                for value_row in values:
                    row = {}
                    for i, value in enumerate(value_row):
                        if i < len(columns):
                            row[columns[i]] = value
                        else:
                            row[f'column_{i+1}'] = value
                    rows.append(row)
                result[table_name] = rows
            else:
                result[table_name] = []
        
        return result
    
    def _extract_table_structures(self, content: str):
        """Extract CREATE TABLE statements to get column information."""
        create_pattern = r'CREATE TABLE `?(\w+)`?\s*\((.*?)\)\s*ENGINE='
        matches = re.finditer(create_pattern, content, re.IGNORECASE | re.DOTALL)
        
        for match in matches:
            table_name = match.group(1)
            table_def = match.group(2)
            
            # Extract column names
            columns = []
            lines = table_def.split('\n')
            for line in lines:
                line = line.strip()
                if line and not line.startswith(('PRIMARY KEY', 'KEY', 'CONSTRAINT', 'UNIQUE', 'INDEX')):
                    # Extract column name from first part
                    parts = line.split()
                    if parts and not parts[0].startswith(('PRIMARY', 'KEY', 'CONSTRAINT', 'UNIQUE', 'INDEX')):
                        col_name = parts[0].strip('`')
                        if col_name and col_name not in ('PRIMARY', 'KEY', 'CONSTRAINT', 'UNIQUE', 'INDEX'):
                            columns.append(col_name)
            
            self.tables[table_name] = {
                'columns': columns
            }
    
    def _extract_insert_statements(self, content: str):
        """Extract INSERT statements from SQL content."""
        self.insert_statements = {}
        
        # Pattern for INSERT INTO table VALUES (...)
        insert_pattern = r'INSERT INTO `?(\w+)`?\s+VALUES\s*(.*?);'
        matches = re.finditer(insert_pattern, content, re.IGNORECASE | re.DOTALL)
        
        for match in matches:
            table_name = match.group(1)
            values_str = match.group(2)
            
            # Parse values
            values_list = self._parse_values(values_str)
            
            if table_name not in self.insert_statements:
                self.insert_statements[table_name] = {'values': []}
            
            self.insert_statements[table_name]['values'].extend(values_list)
    
    def _parse_values(self, values_str: str) -> List[List[Any]]:
        """Parse VALUES clause into list of value lists."""
        # Remove outer parentheses and split by row
        values_str = values_str.strip()
        if values_str.startswith('('):
            values_str = values_str[1:]
        if values_str.endswith(')'):
            values_str = values_str[:-1]
        
        # Split by row (handles nested parentheses)
        rows = []
        current_row = ""
        paren_count = 0
        
        for char in values_str:
            if char == '(':
                paren_count += 1
            elif char == ')':
                paren_count -= 1
            
            current_row += char
            
            if paren_count == 0 and char == ')':
                # End of a row
                rows.append(current_row.strip())
                current_row = ""
        
        # Parse each row
        result = []
        for row in rows:
            if row:
                # Remove outer parentheses
                row = row.strip()
                if row.startswith('('):
                    row = row[1:]
                if row.endswith(')'):
                    row = row[:-1]
                
                # Split by comma, handling quoted strings
                values = self._split_values(row)
                result.append(values)
        
        return result
    
    def _split_values(self, row_str: str) -> List[Any]:
        """Split a row string into individual values, handling quotes."""
        values = []
        current_value = ""
        in_quotes = False
        quote_char = None
        i = 0
        
        while i < len(row_str):
            char = row_str[i]
            
            if not in_quotes:
                if char in ("'", '"'):
                    in_quotes = True
                    quote_char = char
                    current_value += char
                elif char == ',':
                    values.append(current_value.strip())
                    current_value = ""
                else:
                    current_value += char
            else:
                current_value += char
                if char == quote_char:
                    # Check for escaped quote
                    if i + 1 < len(row_str) and row_str[i + 1] == quote_char:
                        i += 1  # Skip next quote
                        current_value += row_str[i]
                    else:
                        in_quotes = False
                        quote_char = None
            
            i += 1
        
        # Add the last value
        if current_value.strip():
            values.append(current_value.strip())
        
        # Clean up values
        cleaned_values = []
        for value in values:
            value = value.strip()
            if value == 'NULL':
                cleaned_values.append(None)
            elif value.startswith("'") and value.endswith("'"):
                # Remove quotes from string
                cleaned_values.append(value[1:-1])
            elif value.startswith('"') and value.endswith('"'):
                # Remove quotes from string
                cleaned_values.append(value[1:-1])
            else:
                # Try to convert to number
                try:
                    if '.' in value:
                        cleaned_values.append(float(value))
                    else:
                        cleaned_values.append(int(value))
                except ValueError:
                    cleaned_values.append(value)
        
        return cleaned_values
    
    def convert_to_csv(self, output_path: str, table_name: Optional[str] = None, is_output_dir: bool = False) -> str:
        """Convert SQL data to CSV file."""
        data = self.parse_sql_file()
        
        if table_name:
            if table_name not in data:
                raise ValueError(f"Table '{table_name}' not found in SQL file")
            tables_to_convert = {table_name: data[table_name]}
        else:
            tables_to_convert = data
        
        if not tables_to_convert:
            raise ValueError("No data found in SQL file")
        
        if is_output_dir:
            # Create multiple CSV files
            os.makedirs(output_path, exist_ok=True)
            for table_name, rows in tables_to_convert.items():
                if rows:
                    csv_file = os.path.join(output_path, f"{table_name}.csv")
                    self._write_csv_file(csv_file, rows)
                    print(f"✅ Created: {csv_file} ({len(rows)} rows)")
            return output_path
        else:
            # Create single CSV file
            if len(tables_to_convert) == 1:
                table_name, rows = next(iter(tables_to_convert.items()))
                self._write_csv_file(output_path, rows)
                print(f"✅ Created: {output_path} ({len(rows)} rows)")
                return output_path
            else:
                raise ValueError("Multiple tables found. Use --output-dir for multiple tables.")
    
    def _write_csv_file(self, file_path: str, rows: List[Dict[str, Any]]):
        """Write data to CSV file."""
        if not rows:
            return
        
        # Get all unique column names
        all_columns = set()
        for row in rows:
            all_columns.update(row.keys())
        
        # Sort columns for consistent output
        columns = sorted(all_columns)
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=columns)
            writer.writeheader()
            writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description='Convert SQL backup file to CSV format')
    parser.add_argument('sql_file', help='Input SQL file path')
    parser.add_argument('--output', '-o', help='Output CSV file path')
    parser.add_argument('--output-dir', '-d', help='Output directory for multiple CSV files')
    parser.add_argument('--table', '-t', help='Convert specific table only')
    parser.add_argument('--list-tables', action='store_true', help='List available tables')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.sql_file):
        print(f"❌ Error: SQL file '{args.sql_file}' not found")
        sys.exit(1)
    
    converter = FinalFixedSQLToCSVConverter(args.sql_file)
    
    if args.list_tables:
        data = converter.parse_sql_file()
        print(f"\n📊 Found {len(data)} tables:")
        for table_name, rows in data.items():
            print(f"  • {table_name}: {len(rows)} rows")
        return
    
    # Determine output path
    if args.output_dir:
        output_path = args.output_dir
    elif args.output:
        output_path = args.output
    else:
        output_path = "output.csv"
    
    try:
        result_path = converter.convert_to_csv(output_path, args.table, args.output_dir is not None)
        print(f"\n🎉 Conversion completed successfully!")
        print(f"📁 Output: {result_path}")
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
