import sqlite3

conn = sqlite3.connect('backend/career_connect_ai.db')
cursor = conn.cursor()

# Get the most recently created HR User (likely the one the user just created or logged into)
cursor.execute("SELECT id, email, full_name, company_name FROM users WHERE role = 'hr' ORDER BY id DESC LIMIT 1")
hr_user = cursor.fetchone()
if not hr_user:
    print("NO HR USER FOUND")
    exit()

hr_id = hr_user[0]
print(f"Assigning data to HR User: ID={hr_user[0]}, Email={hr_user[1]}, Name={hr_user[2]}")

# Ensure HR has at least one JD
cursor.execute("SELECT id FROM job_descriptions WHERE hr_user_id = ?", (hr_id,))
hr_jds = cursor.fetchall()
if not hr_jds:
    print("No jobs found for this HR. Linking all existing jobs to this HR...")
    cursor.execute("UPDATE job_descriptions SET hr_user_id = ?", (hr_id,))
    conn.commit()
    cursor.execute("SELECT id FROM job_descriptions WHERE hr_user_id = ?", (hr_id,))
    hr_jds = cursor.fetchall()
    if not hr_jds:
        print("Creating a dummy job for the HR...")
        cursor.execute("INSERT INTO job_descriptions (hr_user_id, title, status) VALUES (?, ?, ?)", (hr_id, "Software Engineer", "Active"))
        conn.commit()
        hr_jds = [(cursor.lastrowid,)]

first_jd_id = hr_jds[0][0]

# Link all unlinked interview sessions to this JD
cursor.execute("UPDATE interview_sessions SET job_id = ? WHERE job_id IS NULL OR job_id NOT IN (SELECT id FROM job_descriptions WHERE hr_user_id = ?)", (first_jd_id, hr_id))
conn.commit()
print("All interview sessions have been linked to HR's job:", first_jd_id)

cursor.execute("SELECT Count(*) FROM interview_sessions WHERE job_id IN (SELECT id FROM job_descriptions WHERE hr_user_id = ?)", (hr_id,))
session_count = cursor.fetchone()[0]

cursor.execute("SELECT Count(*) FROM users WHERE role = 'candidate'")
candidate_count = cursor.fetchone()[0]

print(f"Success! {session_count} interview sessions are now available on the HR Dashboard.")
print(f"Total Candidates in system: {candidate_count}")
