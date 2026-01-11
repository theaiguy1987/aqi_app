"""
Map all air quality monitoring stations in India from OpenAQ API.
Saves results to a JSON file with complete station metadata.
"""
import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from openaq import OpenAQ

def main():
    # Load environment variables from .env file
    env_path = Path(__file__).parent / '.env'
    load_dotenv(env_path)
    
    # Get API key from environment
    api_key = os.getenv("OPEN_AQ_API")
    
    if not api_key:
        print("ERROR: OPEN_AQ_API not set in environment")
        return
    
    print("=" * 70)
    print("MAPPING ALL AIR QUALITY STATIONS IN INDIA")
    print("=" * 70)
    print(f"\nUsing API key: {api_key[:20]}...")
    print(f"Rate limit: 60 requests/minute (1 request per second is safe)")
    
    # Initialize OpenAQ client
    client = OpenAQ(api_key=api_key)
    
    all_stations = []
    page = 1
    total_fetched = 0
    
    try:
        while True:
            print(f"\n📡 Fetching page {page}...")
            
            # Fetch locations for India (country_id = 9)
            response = client.locations.list(
                countries_id=9,  # India
                page=page,
                limit=100  # Maximum per page
            )
            
            # Extract metadata
            total_available = response.meta.found
            if isinstance(total_available, str) and total_available.startswith('>'):
                # API returns '>100' when there are more than 100, extract the number
                total_available = int(total_available.replace('>', ''))
                total_available_display = f">{total_available}"
            else:
                total_available = int(total_available)
                total_available_display = str(total_available)
            
            current_batch = len(response.results)
            
            print(f"   • Total stations in India: {total_available_display}")
            print(f"   • Fetched in this page: {current_batch}")
            
            # Process each location
            for loc in response.results:
                station_data = {
                    "id": loc.id,
                    "name": loc.name,
                    "locality": loc.locality,
                    "country": loc.country.name,
                    "country_code": loc.country.code,
                    "coordinates": {
                        "latitude": loc.coordinates.latitude,
                        "longitude": loc.coordinates.longitude
                    },
                    "timezone": loc.timezone,
                    "provider": loc.provider.name,
                    "owner": loc.owner.name,
                    "is_mobile": loc.is_mobile,
                    "is_monitor": loc.is_monitor,
                    "sensors": [
                        {
                            "parameter": s.parameter.name,
                            "display_name": s.parameter.display_name,
                            "units": s.parameter.units
                        }
                        for s in loc.sensors
                    ],
                    "datetime_first": loc.datetime_first.utc if loc.datetime_first else None,
                    "datetime_last": loc.datetime_last.utc if loc.datetime_last else None
                }
                all_stations.append(station_data)
            
            total_fetched += current_batch
            print(f"   • Progress: {total_fetched} stations fetched so far")
            
            # Check if we've fetched everything (no more results)
            if current_batch == 0:
                print(f"\n✓ All stations fetched!")
                break
            
            # Move to next page
            page += 1
            
            # Rate limiting: sleep 1 second between requests (safe for 60/min limit)
            print(f"   ⏳ Waiting 1 second (rate limit protection)...")
            time.sleep(1)
        
        # Save to JSON file
        output_file = Path(__file__).parent / 'india_stations.json'
        
        output_data = {
            "metadata": {
                "total_stations": len(all_stations),
                "country": "India",
                "country_code": "IN",
                "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
                "api_source": "OpenAQ"
            },
            "stations": all_stations
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print("\n" + "=" * 70)
        print(f"✓ SUCCESS: {len(all_stations)} stations saved to {output_file}")
        print("=" * 70)
        
        # Print summary statistics
        print("\n📊 SUMMARY STATISTICS:")
        print(f"   • Total stations: {len(all_stations)}")
        
        # Count unique parameters
        all_parameters = set()
        for station in all_stations:
            for sensor in station['sensors']:
                all_parameters.add(sensor['display_name'])
        print(f"   • Unique pollutants monitored: {len(all_parameters)}")
        print(f"   • Parameters: {', '.join(sorted(all_parameters)[:10])}...")
        
        # Count stations by locality
        localities = {}
        for station in all_stations:
            city = station['locality'] or 'Unknown'
            localities[city] = localities.get(city, 0) + 1
        
        print(f"   • Cities covered: {len(localities)}")
        top_cities = sorted(localities.items(), key=lambda x: x[1], reverse=True)[:5]
        print(f"   • Top 5 cities:")
        for city, count in top_cities:
            print(f"      - {city}: {count} stations")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print(f"Stations fetched before error: {len(all_stations)}")
        
        # Save partial results
        if all_stations:
            output_file = Path(__file__).parent / 'india_stations_partial.json'
            output_data = {
                "metadata": {
                    "total_stations": len(all_stations),
                    "country": "India",
                    "status": "PARTIAL - Error occurred during fetch",
                    "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
                },
                "stations": all_stations
            }
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            print(f"Partial results saved to {output_file}")
    
    finally:
        client.close()

if __name__ == "__main__":
    main()
