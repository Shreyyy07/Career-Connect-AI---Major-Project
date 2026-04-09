import sqlite3

conn = sqlite3.connect('backend/career_connect_ai.db')
cursor = conn.cursor()

# Get the most recently created HR User
cursor.execute("SELECT id, email, full_name, company_name FROM users WHERE role = 'hr' ORDER BY id DESC LIMIT 1")
hr_user = cursor.fetchone()
if not hr_user:
    print("NO HR USER FOUND")
    exit()

hr_id = hr_user[0]
print(f"Assigning ALL Job Descriptions to HR User: ID={hr_id}, Email={hr_user[1]}")

cursor.execute("UPDATE job_descriptions SET hr_user_id = ?", (hr_id,))
conn.commit()

cursor.execute("SELECT Count(*) FROM job_descriptions WHERE hr_user_id = ?", (hr_id,))
jd_count = cursor.fetchone()[0]

print(f"Success! {jd_count} Job Descriptions are now mapped to this HR user.")
