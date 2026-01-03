import re

def carefully_remove_conflict_markers(file_path):
    """Carefully remove ONLY git conflict markers, preserving all code"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        cleaned_lines = []
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Check if this is a conflict marker line
            if re.match(r'^<{7}\s+(HEAD|Updated upstream|Stashed changes)', line):
                i += 1  # Skip this marker line
                continue
            elif re.match(r'^={7}\s*$', line):
                i += 1  # Skip separator line
                continue
            elif re.match(r'^>{7}\s+(Tarun|Stashed changes|Updated upstream)', line):
                i += 1  # Skip this marker line
                continue
            else:
                cleaned_lines.append(line)
                i += 1
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(cleaned_lines)
        
        print(f"✓ Cleaned: {file_path}")
        return True
    except Exception as e:
        print(f"✗ Error: {file_path}: {e}")
        return False

# Files to clean
files = [
    r"e:\PROJECT\volunteer-comments-analysis\frontend\src\pages\admin\AdminAssignPVPage.jsx",
    r"e:\PROJECT\volunteer-comments-analysis\frontend\src\pages\admin\AdminAssignPage.jsx",
    r"e:\PROJECT\volunteer-comments-analysis\frontend\src\pages\admin\AdminViewPage.jsx",
    r"e:\PROJECT\volunteer-comments-analysis\frontend\src\pages\superadmin\SuperadminAssignVIPage.jsx",
    r"e:\PROJECT\volunteer-comments-analysis\frontend\src\pages\vi\VIVolunteerDashboardPage.jsx",
    r"e:\PROJECT\volunteer-comments-analysis\frontend\src\pages\superadmin\SuperadminFinalSelectionPage.jsx",
    r"e:\PROJECT\volunteer-comments-analysis\frontend\src\pages\superadmin\SuperadminRealInterviewStudentsPage.jsx",
]

for file_path in files:
    carefully_remove_conflict_markers(file_path)

print("\n✅ Done!")
