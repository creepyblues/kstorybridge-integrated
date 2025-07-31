#!/usr/bin/env python3
"""
Generate SQL UPDATE statements from CSV data to update cover images in Supabase
"""

import csv
import sys

def generate_sql_from_csv(csv_file):
    """Generate SQL update statements from CSV data"""
    
    updates = []
    individual_updates = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                english_title = row.get('english_title', '').strip()
                cover_image = row.get('cover_image', '').strip()
                
                # Skip rows without english title or cover image
                if not english_title or not cover_image:
                    continue
                
                # Escape single quotes in the data
                english_title_escaped = english_title.replace("'", "''")
                cover_image_escaped = cover_image.replace("'", "''")
                
                # Add to CASE statement
                case_line = f"    WHEN '{english_title_escaped}' THEN '{cover_image_escaped}'"
                updates.append(case_line)
                
                # Add to individual updates
                individual_line = f"UPDATE titles SET title_image = '{cover_image_escaped}' WHERE title_name_en = '{english_title_escaped}';"
                individual_updates.append(individual_line)
        
        return updates, individual_updates
        
    except FileNotFoundError:
        print(f"Error: File {csv_file} not found")
        return [], []
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return [], []

def main():
    csv_file = 'toons_kr_enhanced_progress_40.csv'
    
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    
    print(f"Generating SQL from {csv_file}...")
    
    case_updates, individual_updates = generate_sql_from_csv(csv_file)
    
    if not case_updates:
        print("No valid data found in CSV")
        return
    
    # Extract english titles for IN clause
    english_titles = []
    for update in case_updates:
        # Extract english title from CASE statement
        title = update.split("WHEN '")[1].split("' THEN")[0]
        english_titles.append(f"    '{title}'")
    
    # Generate the complete SQL file
    sql_content = f"""-- SQL script to update title_image column with new cover images from scraped data
-- Generated from {csv_file}
-- Maps english_title from CSV to title_name_en in titles table

-- Method 1: Single UPDATE with CASE statement (more efficient)
UPDATE titles 
SET title_image = CASE title_name_en
{chr(10).join(case_updates)}
    ELSE title_image -- Keep existing image if no match
END
WHERE title_name_en IN (
{',\n'.join(english_titles)}
);

-- Method 2: Individual UPDATE statements (for selective updates)
/*
{chr(10).join(individual_updates)}
*/

-- Verification query to check updated records:
SELECT title_name_en, title_image, updated_at 
FROM titles 
WHERE title_name_en IN (
{',\n'.join(english_titles)}
)
ORDER BY title_name_en;

-- Count of updated records:
SELECT COUNT(*) as updated_count
FROM titles 
WHERE title_name_en IN (
{',\n'.join(english_titles)}
);
"""
    
    # Write to file
    output_file = 'update_cover_images_complete.sql'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"✅ Generated SQL with {len(case_updates)} updates")
    print(f"📄 Output file: {output_file}")
    print(f"🎯 Ready to run in Supabase!")
    
    # Show preview
    print(f"\n📋 Preview (first 3 updates):")
    for i, update in enumerate(individual_updates[:3]):
        english_title = update.split("title_name_en = '")[1].split("'")[0]
        print(f"{i+1}. {english_title}")

if __name__ == "__main__":
    main()