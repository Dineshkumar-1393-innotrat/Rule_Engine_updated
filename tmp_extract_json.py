import re
import json

def extract_payloads():
    with open('tmp_output_pdf.txt', 'r', encoding='utf-8') as f:
        text = f.read()

    # Find blocks of HTTP Request: ... { ... }
    # Also HTTP Response: ... { ... }
    
    # Simple state machine to extract JSON blocks after "HTTP Request" or "HTTP Response"
    lines = text.split('\n')
    results = []
    
    in_json = False
    json_lines = []
    current_title = ""
    brace_count = 0
    
    for line in lines:
        if "HTTP Request:" in line or "HTTP Response:" in line:
            current_title = line.strip()
            
        if "{" in line and not in_json and current_title:
            in_json = True
            json_lines = []
            brace_count = 0
            
        if in_json:
            json_lines.append(line)
            brace_count += line.count('{')
            brace_count -= line.count('}')
            
            if brace_count == 0:
                in_json = False
                payload_str = "\n".join(json_lines)
                results.append(f"Title: {current_title}\n{payload_str}\n")
                current_title = ""

    with open('tmp_payload_examples.txt', 'w', encoding='utf-8') as f:
        f.write("\n".join(results))

if __name__ == '__main__':
    extract_payloads()
