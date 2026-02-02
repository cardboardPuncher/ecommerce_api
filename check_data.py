
import requests
import json

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwODg0OTM0LCJpYXQiOjE3Njk2NzUzMzQsImp0aSI6IjJlOGMxNWY2ODQxMTQ2OWE4MDkzZDRmODdiNjQ2Nzg0IiwidXNlcl9pZCI6Mn0.tJusZiNoRYhuOl9hQIFSotf5RxrFKsp5ajGU7MYPRmA"

base_url = "http://127.0.0.1:8000/api/"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

def get_data(endpoint):
    url = f"{base_url}{endpoint}"
    try:
        print(f"--- Fetching {endpoint} ---")
        response = requests.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        data = response.json()
        if 'results' in data:
            print(f"Count: {data['count']}")
            print(f"Next: {data['next']}")
            print("Items (first 2):")
            for item in data['results'][:2]:
                print(json.dumps(item, indent=2))
        else:
            print("Data:", json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error: {e}")

get_data("products/")
get_data("reviews/")
