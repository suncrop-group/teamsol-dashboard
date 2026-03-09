import os
import re

files_with_table = [
    "src/pages/Main/Expense/index.tsx",
    "src/pages/Main/CreditLimitApply/index.tsx",
    "src/pages/Main/Sales/index.tsx",
    "src/pages/Main/DailyActivity/index.tsx",
    "src/pages/Main/DailyActivity/RMAreaActivities.tsx",
    "src/pages/Main/Fleet/PersonalUse/index.tsx",
    "src/pages/Main/Fleet/Fuel/index.tsx",
    "src/pages/Main/Fleet/Maintenance/index.tsx",
    "src/pages/Main/Fleet/Toll/index.tsx",
    "src/pages/Main/Events/RegionalManagerEvents/AreaEvents/index.tsx",
    "src/pages/Main/Events/RegionalManagerEvents/EventsForRM/index.tsx",
    "src/pages/Main/Events/TerritoryManagerEvents/index.tsx",
    "src/pages/Main/CreditLimitExtension/index.tsx",
    "src/pages/Main/TemporaryCredit/index.tsx",
    "src/pages/Main/Reports/ExpenseReports.tsx",
]

for file_path in files_with_table:
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add import if missing
    if "TableSkeleton" not in content:
        content = re.sub(
            r"(import \{\s*TableBody,\s*TableCell[^\}]*\}\s*from\s*['\"]@/components/ui/table['\"];?)",
            r"\1\nimport { TableSkeleton } from '@/components/ui/table-skeleton';",
            content
        )

    # Simple approach: Replace Loader2 inside the main loading ternary for desktop
    # Since we don't want to parse complex AST, we can just replace the loader with a generic TableSkeleton wrap if we want, or we can just leave it to proper parsing.
    # A safer approach for script: replace <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    # with a basic Table and TableSkeleton, but we don't know the headers.
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

