// Localbase Initialization
var db = new Localbase("db");
var calendar;

document.addEventListener('DOMContentLoaded', async function() {

    // Initialize fullcalendar
    var calendarEl = document.getElementById("calendar");
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        themeSystem: "bootstrap",
        timeZone: "local",
        events: []
    });
    calendar.render();

    // Read show DB from localbase
    try {
        var shows = await db.collection("shows").get()
    } 
    catch(error) {
        console.log('error: ', error);
    }
    
    // Generate table from DB
    document.getElementById("show-table").innterHTML = "";
    let table_row = document.createElement("tr");
    table_row.id = "table-row-0";
    table_header = [];
    for (let i = 0; i < 6; i++) {
        table_header[i] = document.createElement("th");
    }
    table_header[0].innerHTML = "Show #";
    table_header[1].innerHTML = "Title";
    table_header[2].innerHTML = "Day Schedule";
    table_header[3].innerHTML = "Airing Period";
    table_header[4].innerHTML = "Local Show Time";
    table_header[5].innerHTML = "Delete";
    document.getElementById("show-table").append(table_row);
    for (let j = 0; j < 6; j++) {
        document.getElementById("table-row-0").append(table_header[j]);
    }
    // Turns the JS object from the DB into an array of [key, value] arrays which the forEach function can loop over.
    Object.entries(shows).forEach(render_row);
    Object.entries(shows).forEach(addEvent);
    console.log(calendar.getEvents())
});

function render_row([key, value]) {
    let table_row = document.createElement("tr");
    table_row.id = "table-row-" + (Number(key) + 1);
    table_cell = [];
    for (let i = 0; i < 6; i++) {
        table_cell[i] = document.createElement("td");
    } 
    table_cell[0].innerHTML = Number(key) + 1;
    table_cell[1].innerHTML = value.title;
    table_cell[2].innerHTML = value.airing_days;
    table_cell[3].innerHTML = value.airing_dates;
    table_cell[4].innerHTML = new Date(value.localshowtime).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
    document.getElementById("show-table").append(table_row);
    for (let j = 0; j < 6; j++) {
        document.getElementById("table-row-" + (Number(key) + 1)).append(table_cell[j]);
    }
};

function addEvent([key, value]) {
    let endDate = new Date(Date.UTC(value.calendar_endDate.split("-")[0], value.calendar_endDate.split("-")[1] - 1, value.calendar_endDate.split("-")[2]));
    console.log(endDate);
    eventObj = {
        title: value.title,
        rrule: {
            freq: "weekly",
            byweekday: value.calendar_airDays,
            dtstart: value.calendar_startDate,
        },
        duration: value.duration,
        groupId: value.title,
        editable: true,
        displayEventTime: true
    }
    if (value.calendar_endDate !== value.calendar_startDate) {
        eventObj.rrule.until =  new Date(endDate.valueOf() + 24*60*60*1000)
    } 
    else {
        eventObj.rrule.count = 1;
    }
    calendar.addEvent(eventObj);
}





