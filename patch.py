import io

with io.open("backend/app/models.py", "r", encoding="utf-8") as f:
    text = f.read()

target = '    report_url: Mapped[str] = mapped_column(String(500), default="")'
if target in text:
    new_text = text.replace(
        target, 
        target + '\n    insights_json: Mapped[str] = mapped_column(Text, default="{}")'
    )
    with io.open("backend/app/models.py", "w", encoding="utf-8") as f:
        f.write(new_text)
    print("Patched successfully")
else:
    print("Target not found")
