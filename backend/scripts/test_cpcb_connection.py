import os
import httpx
from dotenv import load_dotenv

def main():
    load_dotenv()
    api_key = os.getenv("DATA_GOV_IN_API_KEY")
    if not api_key:
        print("ERROR: DATA_GOV_IN_API_KEY environment variable is missing.")
        print("Please add DATA_GOV_IN_API_KEY=your_key_here to your .env file.")
        return

    url = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
    params = {
        "api-key": api_key,
        "format": "json",
        "offset": 0,
        "limit": 5,
        "filters[state]": "Karnataka",
        "filters[city]": "Bengaluru"
    }

    print("Testing CPCB data.gov.in API connection...")
    try:
        response = httpx.get(url, params=params, timeout=10.0)
        print(f"HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            records = data.get("records", [])
            print(f"Number of records returned: {len(records)}")
            if records:
                print("\nSample record (sanitized):")
                print(records[0])
        else:
            print("Failed to fetch data.")
            print(response.text)
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()
