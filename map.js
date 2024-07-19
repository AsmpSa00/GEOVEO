document.addEventListener('DOMContentLoaded', function () {
    var mymap = L.map('mapid').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mymap);
    var drawnItems = new L.FeatureGroup();
    mymap.addLayer(drawnItems);
    var drawControl = new L.Control.Draw({ edit: { featureGroup: drawnItems } });
    mymap.addControl(drawControl);

    mymap.on(L.Draw.Event.CREATED, function (event) {
        var layer = event.layer;
        drawnItems.addLayer(layer);
        if (event.layerType === 'polygon') {
            var latlngs = layer.getLatLngs()[0];
            var area = L.GeometryUtil.geodesicArea(latlngs);
            alert(`Area: ${area.toFixed(2)} square meters`);
            fetchWeatherData(latlngs[0].lat, latlngs[0].lng);
        }
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', async function() {
            var satName = this.getAttribute('data-satid');
            var isChecked = this.checked;
            if (isChecked) {
                var response = await fetch(`/api/satellite-positions/${satName}`);
                var data = await response.json();
                if (data.error) {
                    console.error(data.error);
                    return;
                }
                var positions = data.map(pos => [pos.latitude, pos.longitude]);
                drawSatellitePath(positions, satName);
            } else {
                if (satellitePaths[satName]) {
                    mymap.removeLayer(satellitePaths[satName]);
                    delete satellitePaths[satName];
                }
            }
        });
    });
});

function fetchWeatherData(lat, lon) {
    const urls = [
        `http://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civillight&output=json`,
        `http://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=meteo&output=json`
    ];
    Promise.all(urls.map(url => fetch(url).then(response => response.json()))).then(values => {
        const [civillight, meteo] = values;
        let forecastHTML = '<h3 style="color: white;">Weather Forecast</h3>';
        for (let i = 0; i < 3; i++) {
            const maxTemp = civillight.dataseries[i].temp2m.max;
            const minTemp = civillight.dataseries[i].temp2m.min;
            const cloudCover = meteo.dataseries[i].cloudcover;
            forecastHTML += `<p style="color: white;">Day ${i + 1}: Cloud Cover: ${cloudCover}%, Max Temp: ${maxTemp}°C, Min Temp: ${minTemp}°C</p>`;
        }
        document.getElementById('weather-info').innerHTML = forecastHTML;
    }).catch(error => {
        console.error('Error fetching weather data:', error);
    });
}

function drawSatellitePath(positions, satName) {
    if (satellitePaths[satName]) {
        mymap.removeLayer(satellitePaths[satName]);
    }
    const path = L.polyline(positions, { color: getRandomColor() }).addTo(mymap);
    mymap.fitBounds(path.getBounds());
    satellitePaths[satName] = path;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
