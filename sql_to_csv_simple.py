#!/usr/bin/env python3
"""
Simple SQL to CSV Converter
A more direct approach to convert SQL backup files to CSV format.

Usage:
    python sql_to_csv_simple.py input.sql output.csv
    python sql_to_csv_simple.py input.sql --output-dir ./csv_files
"""

import re
import csv
import argparse
import os
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime


class SimpleSQLToCSVConverter:
    def __init__(self, sql_file_path: str):
        self.sql_file_path = sql_file_path
        
    def parse_sql_file(self) -> Dict[str, List[Dict[str, Any]]]:
        """Parse SQL file using a simpler approach."""
        print(f"📖 Reading SQL file: {self.sql_file_path}")
        
        try:
            with open(self.sql_file_path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
        except Exception as e:
            print(f"❌ Error reading file: {e}")
            return {}
        
        # Find all INSERT statements using a more basic approach
        insert_statements = self._find_insert_statements(content)
        
        # Convert to final format
        return self._convert_insert_statements_to_data(insert_statements)
    
    def _find_insert_statements(self, content: str) -> List[Dict[str, Any]]:
        """Find INSERT statements using a more basic approach."""
        insert_statements = []
        
        # Split content by semicolons to find individual statements
        statements = content.split(';')
        
        for statement in statements:
            statement = statement.strip()
            if statement.upper().startswith('INSERT INTO'):
                try:
                    parsed = self._parse_insert_statement(statement)
                    if parsed:
                        insert_statements.append(parsed)
                except Exception as e:
                    print(f"⚠️  Warning: Could not parse INSERT statement: {e}")
                    continue
        
        print(f"📊 Found {len(insert_statements)} INSERT statements")
        return insert_statements
    
    def _parse_insert_statement(self, statement: str) -> Optional[Dict[str, Any]]:
        """Parse a single INSERT statement."""
        # Remove the INSERT INTO part
        if not statement.upper().startswith('INSERT INTO'):
            return None
        
        # Find the table name
        table_match = re.search(r'INSERT\s+INTO\s+`?(\w+)`?\s*\(', statement, re.IGNORECASE)
        if not table_match:
            return None
        
        table_name = table_match.group(1)
        
        # Find the columns section
        columns_start = statement.find('(')
        if columns_start == -1:
            return None
        
        # Find the end of columns section
        paren_count = 0
        columns_end = -1
        for i, char in enumerate(statement[columns_start:], columns_start):
            if char == '(':
                paren_count += 1
            elif char == ')':
                paren_count -= 1
                if paren_count == 0:
                    columns_end = i
                    break
        
        if columns_end == -1:
            return None
        
        # Extract columns
        columns_section = statement[columns_start + 1:columns_end]
        columns = [col.strip().strip('`') for col in columns_section.split(',')]
        
        # Find VALUES section
        values_start = statement.find('VALUES', columns_end, re.IGNORECASE)
        if values_start == -1:
            return None
        
        values_section = statement[values_start + 6:].strip()
        
        # Parse values
        values_list = self._parse_values_section(values_section)
        
        return {
            'table': table_name,
            'columns': columns,
            'values': values_list
        }
    
    def _parse_values_section(self, values_section: str) -> List[List[Any]]:
        """Parse the VALUES section of an INSERT statement."""
        rows = []
        
        # Split by rows (each row starts with '(')
        row_pattern = r'\(([^)]*(?:\([^)]*\)[^)]*)*)\)'
        matches = re.finditer(row_pattern, values_section, re.DOTALL)
        
        for match in matches:
            row_content = match.group(1)
            row_values = self._parse_row_values(row_content)
            if row_values:
                rows.append(row_values)
        
        return rows
    
    def _parse_row_values(self, row_content: str) -> List[Any]:
        """Parse values in a single row."""
        values = []
        current_value = ""
        in_quotes = False
        quote_char = None
        i = 0
        
        while i < len(row_content):
            char = row_content[i]
            
            if not in_quotes:
                if char in ("'", '"'):
                    in_quotes = True
                    quote_char = char
                    current_value += char
                elif char == ',':
                    values.append(self._clean_value(current_value.strip()))
                    current_value = ""
                else:
                    current_value += char
            else:
                current_value += char
                if char == quote_char:
                    # Check for escaped quotes
                    if i + 1 < len(row_content) and row_content[i + 1] == quote_char:
                        current_value += row_content[i + 1]
                        i += 1
                    else:
                        in_quotes = False
                        quote_char = None
            
            i += 1
        
        # Add the last value
        if current_value.strip():
            values.append(self._clean_value(current_value.strip()))
        
        return values
    
    def _clean_value(self, value: str) -> Any:
        """Clean and convert a value to appropriate type."""
        value = value.strip()
        
        # Handle NULL values
        if value.upper() == 'NULL':
            return None
        
        # Handle quoted strings
        if (value.startswith("'") and value.endswith("'")) or \
           (value.startswith('"') and value.endswith('"')):
            # Remove quotes and handle escaped characters
            value = value[1:-1]
            value = value.replace("''", "'").replace('""', '"')
            return value
        
        # Handle numbers
        try:
            if '.' in value:
                return float(value)
            else:
                return int(value)
        except ValueError:
            return value
    
    def _convert_insert_statements_to_data(self, insert_statements: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Convert INSERT statements to final data format."""
        result = {}
        
        for insert_stmt in insert_statements:
            table_name = insert_stmt['table']
            columns = insert_stmt['columns']
            values_list = insert_stmt['values']
            
            if table_name not in result:
                result[table_name] = []
            
            for values in values_list:
                if len(values) == len(columns):
                    row = dict(zip(columns, values))
                    result[table_name].append(row)
        
        return result
    
    def convert_to_csv(self, output_path: str, table_name: Optional[str] = None) -> str:
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
        
        if os.path.isdir(output_path):
            # Create multiple CSV files
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
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Get fieldnames from first row
        fieldnames = list(rows[0].keys())
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description='Convert SQL backup file to CSV format')
    parser.add_argument('input_file', help='Input SQL file path')
    parser.add_argument('--output', '-o', help='Output CSV file path')
    parser.add_argument('--output-dir', '-d', help='Output directory for multiple CSV files')
    parser.add_argument('--table', '-t', help='Convert specific table only')
    parser.add_argument('--list-tables', '-l', action='store_true', help='List available tables')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_file):
        print(f"❌ Input file not found: {args.input_file}")
        sys.exit(1)
    
    converter = SimpleSQLToCSVConverter(args.input_file)
    
    if args.list_tables:
        data = converter.parse_sql_file()
        if data:
            print(f"\n📊 Found {len(data)} tables with data:")
            for table_name, rows in data.items():
                print(f"   - {table_name}: {len(rows)} rows")
        else:
            print("❌ No data found in SQL file")
        return
    
    # Determine output path
    if args.output_dir:
        output_path = args.output_dir
    elif args.output:
        output_path = args.output
    else:
        output_path = f"output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    try:
        result_path = converter.convert_to_csv(output_path, args.table)
        print(f"\n🎉 Conversion completed successfully!")
        print(f"📁 Output: {result_path}")
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
