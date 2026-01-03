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
    # List of files with conflict markers
    files_to_fix = [
        r"frontend\src\services\superadminService.js",
        r"frontend\src\services\adminService.js",
        r"frontend\src\pages\vi\VIVolunteerDashboardPage.jsx",
        r"frontend\src\pages\vi\VIVolunteerDashboardPage.css",
        r"frontend\src\pages\vi\VIInterviewFormPage.css",
        r"frontend\src\pages\vi\VICompletedInterviewsPage.css",
        r"frontend\src\pages\superadmin\SuperadminAssignVIPage.css",
        r"frontend\src\pages\superadmin\SuperadminDashboardPage.css",
        r"frontend\src\pages\superadmin\SuperadminRealInterviewStudentsPage.jsx",
        r"frontend\src\pages\superadmin\SuperadminDashboardPage.jsx",
        r"frontend\src\pages\superadmin\SuperadminAssignVIPage.jsx",
        r"frontend\src\pages\superadmin\SuperadminAssignRealInterviewPage.css",
        r"frontend\src\pages\superadmin\SuperadminAssignRealInterviewPage.jsx",
        r"frontend\src\pages\admin\AdminAssignPage.jsx",
        r"frontend\src\pages\admin\AdminAssignPVPage.jsx",
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
    
    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == "__main__":
    main()
