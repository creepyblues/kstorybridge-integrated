#!/usr/bin/env python3
"""
Script to convert semicolon-separated tags to PostgreSQL array format.
Input format: "#게임; #아포칼립스; #헌터물; #판타지; #게임판타지; #세계관; #레드아이스"
Output format: ARRAY['#게임', '#아포칼립스', '#헌터물', '#판타지', '#게임판타지', '#세계관', '#레드아이스']
"""

import re
import sys

def convert_tags_to_postgres_array(tags_string):
    """
    Convert semicolon-separated tags to PostgreSQL array format.
    
    Args:
        tags_string (str): Tags separated by semicolons, e.g., "#게임; #아포칼립스; #헌터물"
    
    Returns:
        str: PostgreSQL array format, e.g., "ARRAY['#게임', '#아포칼립스', '#헌터물']"
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

def main():
    """Main function to handle command line input or interactive mode."""
    
    if len(sys.argv) > 1:
        # Command line argument provided
        input_tags = ' '.join(sys.argv[1:])
        result = convert_tags_to_postgres_array(input_tags)
        print(f"Input: {input_tags}")
        print(f"PostgreSQL Array: {result}")
    else:
        # Interactive mode
        print("Tag to PostgreSQL Array Converter")
        print("Enter tags separated by semicolons (or 'quit' to exit):")
        print("Example: #게임; #아포칼립스; #헌터물")
        print("-" * 50)
        
        while True:
            try:
                user_input = input("\nEnter tags: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("Goodbye!")
                    break
                
                if not user_input:
                    print("Please enter some tags.")
                    continue
                
                result = convert_tags_to_postgres_array(user_input)
                print(f"PostgreSQL Array: {result}")
                
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    main() 