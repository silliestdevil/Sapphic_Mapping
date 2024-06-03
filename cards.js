//EVENT CARDS

// Custom Ease function using GSAP
CustomEase.create("cubic", "0.83, 0, 0.17, 1");

// Flag to track animation
let isAnimating = false;

// Function to split text content into spans
function splitTextIntoSpans(selector) {
    let elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
        let text = element.innerText;
        let splitText = text.split("").map(function (char) {
            return `<span>${char === " " ? "&nbsp;&nbsp;" : char}</span>`;
        }).join("");
        element.innerHTML = splitText;
    });
}

// Function to set the card border color based on the event type
function setCardBorderColor(cardElement, eventType) {
    if (eventType === "Sport") {
        cardElement.style.borderColor = "rgb(218, 215,205)"; //color for Sport
    } else if (eventType === "Theatre") {
        cardElement.style.borderColor = "rgb(58,90,64)"; //color for Theatre
    } else if (eventType === "Social") {
        cardElement.style.borderColor = "rgb(92, 129, 87)"; //color for socials
    } else if (eventType === "Club Night") {
        cardElement.style.borderColor = "rgb(163,177,138)"; //color for club night
    } else if (eventType === "Bar") {
        cardElement.style.borderColor = "rgb(82, 121, 111)"; //color for bars
    } else {
        cardElement.style.borderColor = "rgb(72, 100, 98)"; // Default color if no match
    }
}

// Function to create a card element
function createCard(record) { //All the created cards stick to this hmtl structure
    const cardElement = document.createElement('div');
    cardElement.className = 'card';

    const copyElement = document.createElement('div');
    copyElement.className = 'copy';

    const h1Element = document.createElement('h1'); // the event organisation is presented as the title
    h1Element.textContent = record.fields.Event_Organisation;
    copyElement.appendChild(h1Element);
    

    const pElement1 = document.createElement('p');//the Event title is presented next
    pElement1.textContent =  record.fields.Event_Title;
    copyElement.appendChild(pElement1);

    const pElement2 = document.createElement('p');//the Location is presented next
    pElement2.textContent = `Location: ${record.fields.Location}`;
    copyElement.appendChild(pElement2);

    const pElement3 = document.createElement('p'); //the date is presented next
    pElement3.textContent = `Date: ${record.fields.Date}`;
    copyElement.appendChild(pElement3);

    const linkElement = document.createElement('a'); //make the event link a actual link opening a new window 
    linkElement.href = record.fields.Link;
    linkElement.textContent = 'Link';
    linkElement.target = '_blank';
    copyElement.appendChild(linkElement);

    cardElement.appendChild(copyElement);

    // Apply border color based on the event type
    const eventType = record.fields["Event Type"];
    setCardBorderColor(cardElement, eventType);

    return cardElement;
}

// Function to initialize and render all cards
function initializeCards(records) { 
    const keyNotes = ["Event_Organisation", "Event_Title", "Location", "Link", "Date", "Event Type"]; // this is the data fields I want to retrieve
    const filteredRecords = records.map(record => { //fetch the data from airtable 
        let filteredRecord = {};
        keyNotes.forEach(field => {
            if (record.fields[field] !== undefined) {
                filteredRecord[field] = record.fields[field];
            }
        });
        return filteredRecord; //return the data 
    });

    console.log("Filtered Records:", filteredRecords);  // Log data for debugging

    let cardsHTML = '';
    filteredRecords.forEach(filteredRecord => { //place this data on the cards 
        const cardElement = createCard({ fields: filteredRecord });
        document.querySelector('.slider').appendChild(cardElement); // attach to slider animation 
    });
}

// Function to update cards
function updateCards(filteredEvents) {
    console.log("Filtered Events:", filteredEvents); // Log filtered events for debugging

    document.querySelector('.slider').innerHTML = ''; // Clear current cards

    filteredEvents.forEach(filteredRecord => { //for each filtered event create cards and add to slider
        const cardElement = createCard(filteredRecord);
        document.querySelector('.slider').appendChild(cardElement);
    });
}

// Initialization logic on DOM content load
document.addEventListener("DOMContentLoaded", function() {
    splitTextIntoSpans(".copy h1"); 

    const table = new Airpuck.Table({ //fetch the data records from Airtable 
        name: "Sapphic", //name of data 
        baseID: "appgWjtXezZjNtkDt", //the base ID 
        apiKey: "patDRbo36fKb6OBw2.ec391562fcd356e344b2321d11cd4a5218fd69cad4231d9b7ae75d356a4345b4" // apikey 
    }, _ => {
        const records = table.records();
        initializeCards(records); // set initial cards to the data retrieved from here 

        gsap.set("h1 span", { y: -200 }); //card layout 
        gsap.set(".slider .card:last-child h1 span", { y:0 });
    });
    const selectMonth = document.getElementById('select-month');  //month selection 
    selectMonth.addEventListener('change', function() {
        const selectedMonth = this.value.padStart(2, '0'); // Ensure selected month has leading zero if necessary
        const originalEvents = table.records(); //retrieve the original events

        if (selectedMonth === "00") { // if the month selected it 'Month', value 0
            updateCards(originalEvents); // Display all events
            return; 
        }
        const filteredEvents = originalEvents.filter(event => {
            const eventDate = event.fields.Date; //filter the events based upon the date 
            const eventType = event.fields.Event;
    
            if (eventDate) {
                if (eventDate === "Permenant") {
                    console.log(`Permanent Event: ${eventType}, Date: ${eventDate}, selectedMonth: ${selectedMonth}`);
                    return true;  // Always include permanent events on any month
                }
    
                try {
                    const dateParts = eventDate.split('/');
                    if (dateParts.length !== 3) { 
                        console.warn("Unexpected date format:", eventDate);
                        return false; //it was struggling to recognise just 'permenant' so I included this 
                    }
    
                    const eventMonth = dateParts[1];  // retrieve the month,  DD/MM/YYYY format
                    
                    console.log(`Event: ${eventType}, Date: ${eventDate}, eventMonth: ${eventMonth}, selectedMonth: ${selectedMonth}`);
    
                    return eventMonth === selectedMonth; //make sure selected month and month on data match 
                } catch (error) {
                    console.error("Error processing record:", event, error);
                    return false;
                }
            } else {
                console.warn("Record missing Date field:", event);
                return false;
            }
        });
    
        console.log(`Filtered events: ${filteredEvents.length}`);
        updateCards(filteredEvents); // function to update the displayed cards
    });
});
    

// Click event listener for card animations
document.addEventListener("click", function () { //To click through cards animation 
    if (isAnimating) return;
    isAnimating = true; 

    let slider = document.querySelector(".slider"); 
    let cards = Array.from(slider.querySelectorAll(".card"));
    let lastCard = cards.pop();
    let nextCard = cards[cards.length - 1];

    gsap.to(lastCard.querySelectorAll("h1 span"), { //displaying the text 
        y: 200,
        duration: 0.75,
        ease: "cubic",
    });

    gsap.to(lastCard, { //the cards animating, dropping 
        y: "+=250%",
        duration: 0.75,
        ease: "cubic",
        onComplete: () => {
            slider.prepend(lastCard);
            gsap.set(lastCard.querySelectorAll("h1 span"), { y: -200 });
            setTimeout(() => {
                isAnimating = false;
            }, 1000);
        },
    });
});
