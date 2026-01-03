import os
import re

def remove_conflict_markers(file_path):
    """Remove git conflict markers from a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Remove conflict markers and their associated lines
        # Pattern: <<<<<<< HEAD ... ======= ... >>>>>>> branch
        pattern = r'<{7}\s+HEAD\r?\n.*?\r?\n={7}\r?\n(.*?)\r?\n>{7}\s+\w+\r?\n'
        content = re.sub(pattern, r'\1\n', content, flags=re.DOTALL)
        
        # Remove standalone conflict markers
        content = re.sub(r'^<{7}\s+.*?\r?\n', '', content, flags=re.MULTILINE)
        content = re.sub(r'^={7}\r?\n', '', content, flags=re.MULTILINE)
        content = re.sub(r'^>{7}\s+.*?\r?\n', '', content, flags=re.MULTILINE)
        
        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Fixed: {file_path}")
            return True
        return False
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return False

def main():
    # Additional files with conflict markers
    files_to_fix = [
        r"frontend\src\pages\admin\AdminViewPage.jsx",
        r"frontend\src\pages\admin\AdminAssignPVPage.css",
        r"frontend\src\pages\admin\AdminAssignPage.css",
        r"frontend\package-lock.json",
        r"backend\routes\real_interview.py",
    ]
    
    base_dir = r"e:\PROJECT\volunteer-comments-analysis"
    fixed_count = 0
    
    for file_rel_path in files_to_fix:
        file_path = os.path.join(base_dir, file_rel_path)
        if os.path.exists(file_path):
            if remove_conflict_markers(file_path):
                fixed_count += 1
        else:
            print(f"⚠ File not found: {file_path}")
    
    print(f"\n✅ Fixed {fixed_count} additional files")

if __name__ == "__main__":
    main()
