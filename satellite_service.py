from flask import Flask, jsonify
from skyfield.api import load, Topos, EarthSatellite
from datetime import datetime, timedelta
import requests

app = Flask(__name__)
ts = load.timescale()

# Endpoint to get TLE data from an external API
@app.route('/get_positions/<sat_id>')
def get_positions(sat_id):
    response = requests.get(f'https://tle.ivanstanojevic.me/api/tle/{sat_id}')
    tle_data = response.json()
    satellite = EarthSatellite(tle_data['line1'], tle_data['line2'], tle_data['name'], ts)

    t = ts.now()
    times = ts.utc(t.utc_datetime(), t.utc_datetime() + timedelta(days=3), step=7200)  # Steps are every 2 hours

    positions = [{
        'time': time.utc_iso(),
        'latitude': satellite.at(time).subpoint().latitude.degrees,
        'longitude': satellite.at(time).subpoint().longitude.degrees
    } for time in times]

    return jsonify(positions)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
