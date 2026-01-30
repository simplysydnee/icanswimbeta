#!/bin/bash
# Setup script for Excel skill migration

echo "========================================="
echo "Excel Skill Migration Setup"
echo "========================================="

# Check Python version
echo "Checking Python version..."
python3 --version || { echo "Python 3 is required"; exit 1; }

# Install required packages
echo "Installing required Python packages..."
pip install -r requirements_migration.txt || {
    echo "Failed to install packages. Trying with pip3..."
    pip3 install -r requirements_migration.txt || {
        echo "Please install packages manually:"
        echo "pip install pandas openpyxl supabase python-dotenv"
        exit 1
    }
}

# Check .env.local file
echo "Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    echo "WARNING: .env.local file not found"
    echo "Create .env.local with:"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "SUPABASE_SECRET_KEY=your-service-role-key"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✓ .env.local file found"
fi

# Make scripts executable
chmod +x excel_skill_migration.py test_excel_migration.py

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Place Excel files in a directory"
echo "2. Run test simulation:"
echo "   python3 test_excel_migration.py"
echo "3. Run migration (test mode first):"
echo "   python3 excel_skill_migration.py"
echo ""
echo "For detailed instructions, see EXCEL_MIGRATION_README.md"