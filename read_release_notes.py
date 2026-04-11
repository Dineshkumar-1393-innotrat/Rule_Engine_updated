import sys
import os

pdf_file = "M6_Jeep_Migration_Sprint_11_Release_Notes_v11.pdf"
output_file = "sprint_11_notes.txt"

try:
    try:
        from pypdf import PdfReader
    except ImportError:
        from PyPDF2 import PdfReader
except ImportError:
    print("Error: Neither pypdf nor PyPDF2 is installed.")
    sys.exit(1)

try:
    reader = PdfReader(pdf_file)
    with open(output_file, "w", encoding="utf-8") as f:
        for i, page in enumerate(reader.pages):
            f.write(f"--- PAGE {i+1} ---\n")
            text = page.extract_text()
            if text:
                f.write(text)
                f.write("\n")
    print(f"Successfully extracted text to {output_file}")
except Exception as e:
    print(f"Error reading PDF: {e}")
    sys.exit(1)
