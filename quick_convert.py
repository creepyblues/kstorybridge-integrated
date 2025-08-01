#!/usr/bin/env python3
"""
Quick tag converter - converts semicolon-separated tags to PostgreSQL array format.
Usage: python3 quick_convert.py "tag1; tag2; tag3"
"""

import sys

def convert(tags):
    if not tags or tags.strip() == '':
        return "ARRAY[]"
    tags_list = []
    for tag in tags.split(';'):
        if tag.strip():
            escaped_tag = tag.strip().replace("'", "''")
            tags_list.append(f"'{escaped_tag}'")
    return f"ARRAY[{', '.join(tags_list)}]"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 quick_convert.py \"tag1; tag2; tag3\"")
        sys.exit(1)
    
    input_tags = sys.argv[1]
    result = convert(input_tags)
    print(result) 