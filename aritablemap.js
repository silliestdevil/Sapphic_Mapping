// MAP SCRIPT

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhcmxvdHRleTEzIiwiYSI6ImNsdnRnbTBydjE3bGgyaW52ZmhnOWk1cnQifQ.RtR2iK3qYrJ9M7E-Ol32Wg';

let markerColor;

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center:  [-0.1240123, 51.5103456], // centre of London 
    zoom: 10, // starting zoom
    pitch: 62, // starting pitch
    bearing: -20 // starting bearing
});

map.on('style.load', () => {
    map.setFog({}); // Set the default atmosphere style
});

document.addEventListener("DOMContentLoaded", function () { 
    const table = new Airpuck.Table({
        name: "Sapphic", //name of the table
        baseID: "appgWjtXezZjNtkDt", //the base ID
        apiKey: "patDRbo36fKb6OBw2.ec391562fcd356e344b2321d11cd4a5218fd69cad4231d9b7ae75d356a4345b4" //the API key
    }, _ => {
        const records = table.records(); //fetching data from airtable
        //the fields I want to fetch
        const latLongFields = ["Latitude", "Longitude", "Event_Title","Event_Organisation" , "Location", "Event Type","Link", "Date"];
        const filteredRecords = records.map(record => {
            let filteredRecord = {};
            latLongFields.forEach(field => {
                if (record.fields[field] !== undefined) {
                    filteredRecord[field] = record.fields[field]; 
                }
            });
            return filteredRecord; //get the data
        });

        console.log("Filtered Records:", filteredRecords);  // Log filtered records for debugging

        let markers = [];

function addMarkers(records) {
    // Remove existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // add markers of different colours based on their event type
    records.forEach(coord => {
        if (!isNaN(coord.Latitude) && !isNaN(coord.Longitude)) {
            const eventType = coord["Event Type"];
            if (eventType === "Sport") {
                markerColor = "rgb(218, 215,205)"; //color for Sport
            } else if (eventType === "Theatre") {
                markerColor = "rgb(58,90,64)"; //color for Theatre
            } else if (eventType === "Social") {
                markerColor = "rgb(	92, 129, 87)"; //color for Social
            } else if (eventType === "Club Night") {
                markerColor = "rgb(163,177,138)"; //color for Club Night
            } else if (eventType === "Bar") {
                markerColor = "rgb(	82, 121, 111)"; //color for Bar
            } else {
                // Default color if none of the conditions are met
                markerColor = "red"; // Example default color
            }//these colours match the colours on the border of the cards

            const marker = new mapboxgl.Marker({
                color: markerColor //markers for the map are the colour of the border of cards
            })
                .setLngLat([coord.Longitude, coord.Latitude])
                .addTo(map);//add markers to map

            const popup = new mapboxgl.Popup({ offset: [0, -15] }) //add a pop-up which says what the event is and where
                .setHTML(`<h3>${coord.Event_Organisation}</h3> 
                           <p style="top:0px;">Location: ${coord.Location}</p>`);

            marker.getElement().addEventListener('mouseenter', () => {
                popup.setLngLat([coord.Longitude, coord.Latitude]).addTo(map);
            });
            marker.getElement().addEventListener('mouseleave', () => {
                popup.remove();
            });

            markers.push(marker);
        }
    });
}

addMarkers(filteredRecords);

const selectMonth = document.getElementById('select-month'); //filter these events by the month 
selectMonth.addEventListener('change', function () {
    const selectedMonth = this.value.padStart(2, '0');

    if (selectedMonth === "00") {
        addMarkers(filteredRecords);
        return; //if the month is not selected, its just 'month' show all events
    }

    const filteredMarkers = filteredRecords.filter(coord => {
        if (!coord.Date) {
            console.warn("Record missing Date field:", coord);
            return true; // Include events without a date field
        }

        if (coord.Date === "Permanent") {
            console.log("Permanent event:", coord);
            return true; // Include permanent events
        }

        // Check if the date is in the expected format "DD/MM/YYYY"
        const dateParts = coord.Date.split('/');
        if (dateParts.length !== 3) {
            console.log("Invalid date format:", coord);
            return true; // Include events with invalid date format
        }

        const eventMonth = dateParts[1]; // if the event month matches the selected month filter to that month
        if (eventMonth === selectedMonth) {
            console.log("Event for month:", selectedMonth, coord);
            return true;
        } else {
            console.log("Event filtered out:", coord);
            return false;
        }
    });

    console.log("Filtered Markers for month", selectedMonth, ":", filteredMarkers); // Log filtered markers for debugging

    addMarkers(filteredMarkers);
});

});
    });

    
    
