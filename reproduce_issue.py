
import requests
import json

# Token from debug_log.txt
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwODg0OTM0LCJpYXQiOjE3Njk2NzUzMzQsImp0aSI6IjJlOGMxNWY2ODQxMTQ2OWE4MDkzZDRmODdiNjQ2Nzg0IiwidXNlcl9pZCI6Mn0.tJusZiNoRYhuOl9hQIFSotf5RxrFKsp5ajGU7MYPRmA"

url = "http://127.0.0.1:8000/api/reviews/"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

data = {
    "product": 1,
    "rating": 5,
    "comment": "Test review from script"
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
