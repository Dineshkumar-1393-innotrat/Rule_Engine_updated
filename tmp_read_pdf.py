import PyPDF2
import json

def extract_pdf():
    try:
        reader = PyPDF2.PdfReader('TE 01_STLA_M6 Jeep Migration_NorthBound_API_Interface_Specification_V1.3.pdf')
        text = ""
        for i, page in enumerate(reader.pages):
            text += f"\n--- Page {i+1} ---\n"
            text += page.extract_text()
            
        with open('tmp_output_pdf.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    extract_pdf()
