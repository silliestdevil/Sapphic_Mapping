// Custom Ease function using GSAP
CustomEase.create("cubic", "0.83, 0, 0.17, 1");

// Flag to track animation
let isAnimating = false;

// Utility Functions
function splitTextIntoSpans(selector) {
    document.querySelectorAll(selector).forEach(element => {
        element.innerHTML = element.innerText.split("").map(char => `<span>${char === " " ? "&nbsp;&nbsp;" : char}</span>`).join("");
    });
}

function setCardBorderColor(cardElement, eventType) {
    const colors = {
        "Sport": "rgb(218, 215, 205)",
        "Theatre": "rgb(58, 90, 64)",
        "Social": "rgb(92, 129, 87)",
        "Club Night": "rgb(163, 177, 138)",
        "Bar": "rgb(82, 121, 111)",
        "default": "rgb(72, 100, 98)"
    };
    cardElement.style.borderColor = colors[eventType] || colors["default"];
}

function parseDate(dateStr) {
    if (dateStr === "permanent") {
        return new Date(9999, 11, 31); // Use a far future date for "permanent" events
    }
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
}

// Card Management
function createCard(record) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.eventId = record.id;

    const copyElement = document.createElement('div');
    copyElement.className = 'copy';

    copyElement.innerHTML = `
        <h1>${record.fields.Event_Organisation}</h1>
        <p>${record.fields.Event_Title}</p>
        <p>Location: ${record.fields.Location}</p>
        <p>Date: ${record.fields.Date}</p>
        <a href="${record.fields.Link}" target="_blank">Link</a>
    `;

    cardElement.appendChild(copyElement);
    setCardBorderColor(cardElement, record.fields["Event Type"]);

    return cardElement;
}

function initializeCards(records) {
    const filteredRecords = records.map(record => ({
        id: record.id,
        fields: {
            Event_Organisation: record.fields.Event_Organisation,
            Event_Title: record.fields.Event_Title,
            Location: record.fields.Location,
            Link: record.fields.Link,
            Date: record.fields.Date,
            "Event Type": record.fields["Event Type"]
        }
    }));

    // Sort records by date
    filteredRecords.sort((a, b) => parseDate(a.fields.Date) - parseDate(b.fields.Date));

    const fragment = document.createDocumentFragment();
    filteredRecords.forEach(record => fragment.appendChild(createCard(record)));
    document.querySelector('.slider').appendChild(fragment);
}

function updateCards(filteredEvents) {
    const slider = document.querySelector('.slider');
    slider.innerHTML = '';

    // Sort records by date
    filteredEvents.sort((a, b) => parseDate(a.fields.Date) - parseDate(b.fields.Date));

    const fragment = document.createDocumentFragment();
    filteredEvents.forEach(record => fragment.appendChild(createCard(record)));
    slider.appendChild(fragment);
}

// Animation Functions
function bringCardToFront(eventId) {
    const slider = document.querySelector(".slider");
    const cards = Array.from(slider.querySelectorAll(".card"));
    const targetCard = cards.find(card => card.dataset.eventId === eventId);

    if (targetCard) {
        gsap.to(targetCard.querySelectorAll("h1 span"), {
            y: 400,
            duration: 0.75,
            ease: "cubic",
        });

        const screenWidth = window.innerWidth;

        gsap.to(cards, {
            y: (index) => {
                if (index === cards.indexOf(targetCard)) {
                    return screenWidth >= 800 ? -200 : -100;
                } else {
                    return "+=250%";
                }
            },
            duration: 0.75,
            ease: "cubic",
            onComplete: () => {
                slider.prepend(targetCard);
                gsap.set(targetCard.querySelectorAll("h1 span"), { y: -200 });
                setTimeout(() => { isAnimating = false; }, 1000);
            },
        });
    }
}
// Map Management
mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhcmxvdHRleTEzIiwiYSI6ImNsdnRnbTBydjE3bGgyaW52ZmhnOWk1cnQifQ.RtR2iK3qYrJ9M7E-Ol32Wg';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-0.1240123, 51.5103456],
    zoom: 10,
    pitch: 62,
    bearing: -20
});

map.on('style.load', () => {
    map.setFog({});
});

function addMarkers(records) {
    if (window.markers) {
        window.markers.forEach(marker => marker.remove());
    }
    window.markers = [];

    records.forEach(record => {
        const { Latitude, Longitude, "Event Type": eventType, Event_Organisation, Location } = record.fields;
        if (!isNaN(Latitude) && !isNaN(Longitude)) {
            const markerColor = {
                "Sport": "rgb(218, 215,205)",
                "Theatre": "rgb(58,90,64)",
                "Social": "rgb(92, 129, 87)",
                "Club Night": "rgb(163,177,138)",
                "Bar": "rgb(82, 121, 111)",
                "default": "red"
            }[eventType] || "red";

            const marker = new mapboxgl.Marker({ color: markerColor })
                .setLngLat([Longitude, Latitude])
                .addTo(map);

            const popup = new mapboxgl.Popup({ offset: [0, -15] })
                .setHTML(`<h3>${Event_Organisation}</h3><p>Location: ${Location}</p>`);

            marker.getElement().addEventListener('mouseenter', () => popup.setLngLat([Longitude, Latitude]).addTo(map));
            marker.getElement().addEventListener('mouseleave', () => popup.remove());
            marker.getElement().addEventListener('click', () => bringCardToFront(record.id));

            window.markers.push(marker);
        }
    });
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    splitTextIntoSpans(".copy h1");

    const table = new Airpuck.Table({
        name: "Sapphic",
        baseID: "appgWjtXezZjNtkDt",
        apiKey:"patDRbo36fKb6OBw2.ec391562fcd356e344b2321d11cd4a5218fd69cad4231d9b7ae75d356a4345b4"
    }, _ => {
        const records = table.records();
        initializeCards(records);
        gsap.set("h1 span", { y: -200 });
        gsap.set(".slider .card:last-child h1 span", { y: 0 });
        addMarkers(records);

        // Automatically filter events by the current date on load
        const currentDate = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" }).split(',')[0];
        console.log("Current Date (UK):", currentDate);

        document.getElementById('select-month').addEventListener('change', function () {
            const selectedMonth = this.value.padStart(2, '0');
            const originalEvents = table.records();

            if (selectedMonth === "00") {
                updateCards(originalEvents);
                addMarkers(originalEvents);
                return;
            }

            const filteredEvents = originalEvents.filter(event => {
                const eventDate = event.fields.Date;

                if (eventDate) {
                    if (eventDate === "permanent") return true;

                    const [day, month, year] = eventDate.split('/');
                    return month === selectedMonth;
                }
                return false;
            });

            console.log(`Filtered events: ${filteredEvents.length}`);
            updateCards(filteredEvents);
            addMarkers(filteredEvents);
        });
    });

    // Click event listener for card animations
    document.addEventListener("click", () => {
        if (isAnimating) return;
        isAnimating = true;

        const slider = document.querySelector(".slider");
        const cards = Array.from(slider.querySelectorAll(".card"));
        const lastCard = cards.pop();
        const nextCard = cards[cards.length - 1];

        gsap.to(lastCard.querySelectorAll("h1 span"), { y: 200, duration: 0.75, ease: "cubic" });
        gsap.to(lastCard, {
            y: "+=250%",
            duration: 0.75,
            ease: "cubic",
            onComplete: () => {
                slider.prepend(lastCard);
                gsap.set(lastCard.querySelectorAll("h1 span"), { y: -200 });
                setTimeout(() => { isAnimating = false; }, 1000);
            },
        });
    });
});

