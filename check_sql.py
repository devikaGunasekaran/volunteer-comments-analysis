import sys
import re

def check_sql(filename, pattern):
    try:
        # Try different encodings
        encodings = ['utf-16le', 'utf-8', 'latin1']
        content = None
        for enc in encodings:
            try:
                with open(filename, 'r', encoding=enc) as f:
                    content = f.readlines()
                    break
            except UnicodeDecodeError:
                continue
        
        if content is None:
            print("Failed to decode file with any encoding.")
            return

        regex = re.compile(pattern, re.IGNORECASE)
        found = False
        for i, line in enumerate(content):
            if regex.search(line):
                print(f"--- Found at line {i+1} ---")
                start = max(0, i)
                end = min(len(content), i + 40)
                for j in range(start, end):
                    print(content[j], end='')
                found = True
                break
        
        if not found:
            print(f"Pattern '{pattern}' not found.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python check_sql.py <filename> <pattern>")
    else:
        check_sql(sys.argv[1], sys.argv[2])
