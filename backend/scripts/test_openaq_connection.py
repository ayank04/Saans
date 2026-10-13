import os
import httpx
from dotenv import load_dotenv

def main():
    load_dotenv()
    api_key = os.getenv("OPENAQ_API_KEY")
    if not api_key:
        print("ERROR: OPENAQ_API_KEY environment variable is missing.")
        print("Please add OPENAQ_API_KEY=your_key_here to your .env file.")
        return

    url = "https://api.openaq.org/v3/locations"
    params = {
        "coordinates": "12.9716,77.5946",
        "radius": 25000,
        "limit": 5
    }
    headers = {
        "X-API-Key": api_key
    }

    print("Testing OpenAQ v3 API connection...")
    try:
        response = httpx.get(url, params=params, headers=headers, timeout=10.0)
        print(f"HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            print(f"Number of stations discovered: {len(results)}")
            if results:
                print("\nSample station (sanitized):")
                sample = results[0]
                print({
                    "id": sample.get("id"),
                    "name": sample.get("name"),
                    "provider": sample.get("provider", {}).get("name"),
                    "coordinates": sample.get("coordinates")
                })
        else:
            print("Failed to fetch data.")
            print(response.text)
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()
