#!/usr/bin/env python3
import zipfile
import xml.etree.ElementTree as ET
import sys

def read_xlsx(filename):
    """Read Excel file without external libraries"""
    try:
        with zipfile.ZipFile(filename, 'r') as zip_ref:
            # Read shared strings
            try:
                shared_strings_xml = zip_ref.read('xl/sharedStrings.xml')
                strings_root = ET.fromstring(shared_strings_xml)
                shared_strings = [elem.text or ''.join(elem.itertext()) for elem in strings_root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]
            except:
                shared_strings = []

            # Read worksheet
            sheet_xml = zip_ref.read('xl/worksheets/sheet1.xml')
            sheet_root = ET.fromstring(sheet_xml)

            # Parse rows
            rows = []
            for row in sheet_root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                row_data = []
                for cell in row.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    cell_type = cell.get('t')
                    value_elem = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')

                    if value_elem is not None:
                        value = value_elem.text
                        if cell_type == 's':  # Shared string
                            try:
                                row_data.append(shared_strings[int(value)])
                            except:
                                row_data.append(value)
                        else:
                            row_data.append(value)
                    else:
                        row_data.append('')

                if row_data:
                    rows.append(row_data)

            # Print rows as tab-separated values
            for row in rows:
                print('\t'.join(str(cell) for cell in row))

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    return 0

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: read_excel.py <filename>", file=sys.stderr)
        sys.exit(1)

    sys.exit(read_xlsx(sys.argv[1]))
