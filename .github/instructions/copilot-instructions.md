# Global Development Workflow

## Documentation References
- **Main project overview**: #file:README.md
- **Backend details**: #file:backend/README.md
- **Frontend details**: #file:frontend/README.md
- **Local setup**: #file:LOCAL_SETUP.md
- **Deployment**: #file:DEPLOYMENT.md
- **Google Sheets setup**: #file:GOOGLE_SHEETS_SETUP.md

## Before Making Changes
1. Review relevant README files based on the area you're working in
2. Understand the user request carefully
3. Think step-by-step and create a plan
4. Execute the plan systematically
5. Test implementation thoroughly
6. Verify existing functionality is not broken
7. Update relevant README files if structure changes

## Code Standards
- Always run tests before completing
- Maintain backward compatibility
- Document architectural changes in appropriate README

## Python Environment
**IMPORTANT**: Always activate the virtual environment before installing Python packages:
```bash
# Windows
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate
```

Then install packages:
```bash
pip install <package_name>
```

Or use the venv pip directly:
```bash
# Windows
.\.venv\Scripts\pip.exe install <package_name>
```