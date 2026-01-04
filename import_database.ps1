# Database Import Script for Collaborators
# This script imports the MySQL database dump

param(
    [string]$DumpFile = ""
)

# Find the most recent dump file if not specified
if ($DumpFile -eq "") {
    $DumpFile = Get-ChildItem -Filter "database_dump_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty Name
    
    if (-not $DumpFile) {
        Write-Host "❌ No database dump file found!" -ForegroundColor Red
        Write-Host "Please specify the dump file: .\import_database.ps1 -DumpFile 'database_dump_2025-12-27.sql'" -ForegroundColor Yellow
        exit 1
    }
}

if (-not (Test-Path $DumpFile)) {
    Write-Host "❌ File not found: $DumpFile" -ForegroundColor Red
    exit 1
}

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️  No .env file found. Please create one first." -ForegroundColor Yellow
    Write-Host "See COLLABORATION_GUIDE.md for instructions." -ForegroundColor Cyan
    exit 1
}

$DB_HOST = $env:DB_HOST
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

Write-Host "Importing database: $DB_NAME" -ForegroundColor Green
Write-Host "From file: $DumpFile" -ForegroundColor Cyan
Write-Host ""

# Check if database exists, create if not
Write-Host "Checking if database exists..." -ForegroundColor Yellow
$checkDb = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DB_NAME'"
$dbExists = mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e $checkDb 2>$null

if (-not $dbExists) {
    Write-Host "Creating database: $DB_NAME" -ForegroundColor Yellow
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "CREATE DATABASE $DB_NAME"
}

# Import the dump
Write-Host "Importing data..." -ForegroundColor Yellow
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < $DumpFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Database imported successfully!" -ForegroundColor Green
    Write-Host "You can now run the application with: python app.py" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Import failed!" -ForegroundColor Red
    Write-Host "Make sure MySQL is running and credentials in .env are correct." -ForegroundColor Yellow
}
