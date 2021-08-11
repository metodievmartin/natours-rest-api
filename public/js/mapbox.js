export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFydGluLW1ldG9kaWV3IiwiYSI6ImNrcWphanM5djB0dGgyb254a2w0cHB6M24ifQ.-UiyDEzbMxvxxAcAqBaCBw';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/martin-metodiew/ckqjaz4s00j6b18pae5dbbk8t',
        scrollZoom: false
    });

// Create an instance of map bounds object
    const bounds = new mapboxgl.LngLatBounds();

// Loop through all the locations in order to create and add a markers to the map
    locations.forEach(loc => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        })
            .setLngLat(loc.coordinates)
            .addTo(map)

        // Add info popup
        new mapboxgl.Popup({
            offset: 30
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);

        // Extend map bounds to include current location
        // - passing the current location's coordinates
        bounds.extend(loc.coordinates);
    });

// Fit all the locations in the bounds object on the map display area
// - passing bounds object containing all locations
// - passing options object defining some padding on the map display area to avoid markers overlapping with other UI features
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 200,
            right: 200,
        }
    });

};






