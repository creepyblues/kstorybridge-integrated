#!/usr/bin/env python3
"""
Batch script to convert tags from CSV file to PostgreSQL array format.
This script reads the CSV file and converts the tags column to PostgreSQL array format.
"""

import csv
import sys
import os

def convert_tags_to_postgres_array(tags_string):
    """
    Convert semicolon-separated tags to PostgreSQL array format.
    
    Args:
        tags_string (str): Tags separated by semicolons
    
    Returns:
        str: PostgreSQL array format
    """
    if not tags_string or tags_string.strip() == '':
        return "ARRAY[]"
    
    # Split by semicolon and clean up each tag
    tags = [tag.strip() for tag in tags_string.split(';') if tag.strip()]
    
    # Escape single quotes in tags and wrap in single quotes
    escaped_tags = []
    for tag in tags:
        # Replace single quotes with double single quotes for PostgreSQL
        escaped_tag = tag.replace("'", "''")
        escaped_tags.append(f"'{escaped_tag}'")
    
    # Join with commas and wrap in ARRAY[]
    return f"ARRAY[{', '.join(escaped_tags)}]"

def process_csv_file(input_file, output_file=None):
    """
    Process CSV file and convert tags column to PostgreSQL array format.
    
    Args:
        input_file (str): Path to input CSV file
        output_file (str): Path to output file (optional)
    """
    if not os.path.exists(input_file):
        print(f"Error: File {input_file} not found.")
        return
    
    # Generate output filename if not provided
    if output_file is None:
        base_name = os.path.splitext(input_file)[0]
        output_file = f"{base_name}_postgres_arrays.txt"
    
    converted_count = 0
    total_count = 0
    
    try:
        with open(input_file, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            with open(output_file, 'w', encoding='utf-8') as outfile:
                for row in reader:
                    total_count += 1
                    tags = row.get('tags', '')
                    
                    if tags:
                        postgres_array = convert_tags_to_postgres_array(tags)
                        outfile.write(f"Row {total_count}: {postgres_array}\n")
                        converted_count += 1
                    else:
                        outfile.write(f"Row {total_count}: ARRAY[]\n")
        
        print(f"Processing complete!")
        print(f"Total rows processed: {total_count}")
        print(f"Rows with tags converted: {converted_count}")
        print(f"Output saved to: {output_file}")
        
    except Exception as e:
        print(f"Error processing file: {e}")

def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: python3 batch_convert_tags_to_postgres.py <input_csv_file> [output_file]")
        print("Example: python3 batch_convert_tags_to_postgres.py naver_webtoon_partial_400.csv")
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    process_csv_file(input_file, output_file)

if __name__ == "__main__":
    main() 