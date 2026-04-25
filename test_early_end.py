import requests
import time

BASE_URL = "http://localhost:8000/api/v1"

# We need a valid token to test. 
# We can just make the python script login as candidate
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "hr_test@careerconnect.ai",
    "password": "Password123!"
})
token = login_resp.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

# Create a session
start_resp = requests.post(f"{BASE_URL}/interview/start", headers=headers, json={
    "jobID": 1,
    "experience": 2,
    "bio": ""
})
print("Start Response:", start_resp.text)
session_id = start_resp.json().get("sessionID")
print("Started:", session_id)

# Post an answer
ans_resp = requests.post(f"{BASE_URL}/interview/answer", headers=headers, json={
    "sessionID": session_id,
    "transcript": "(Ended Early)"
})
print("Answered:", ans_resp.json())

# End
end_resp = requests.post(f"{BASE_URL}/interview/end", headers=headers, json={
    "sessionID": session_id
})
print("Ended:", end_resp.status_code, end_resp.text)

