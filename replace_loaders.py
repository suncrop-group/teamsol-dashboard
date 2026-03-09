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
            r"(import \{\s*[^}]*TableBody[^}]*\}\s*from\s*['\"]@/components/ui/table['\"];?)",
            r"\1\nimport { TableSkeleton } from '@/components/ui/table-skeleton';",
            content
        )

    # Replace the loader div with a generic table skeleton wrap
    loader_pattern = r'<div className="flex justify-center items-center h-64">\s*<Loader2 className="h-8 w-8 animate-spin text-purple-600" />\s*</div>'
    replacement = r'''<div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableBody>
                    <TableSkeleton columns={6} rows={5} />
                  </TableBody>
                </Table>
              </div>'''
    
    content = re.sub(loader_pattern, replacement, content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Done")
