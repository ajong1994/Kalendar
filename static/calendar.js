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
    var table = document.getElementById("show-table");
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
    if (shows.length !== 0) {
        let table_row = document.createElement("tr");
        table_row.id = "table-row-0";
        table_header = [];
        for (let i = 0; i < 6; i++) {
            table_header[i] = document.createElement("th");
        }
        table_header[0].textContent = "Show #";
        table_header[1].textContent = "Title";
        table_header[2].textContent = "Day Schedule";
        table_header[3].textContent = "Airing Period";
        table_header[4].textContent = "Local Show Time";
        table_header[5].textContent = "Delete";
        document.getElementById("show-table").append(table_row);
        for (let j = 0; j < 6; j++) {
            document.getElementById("table-row-0").append(table_header[j]);
        }
        document.getElementById("clear-all-btn").style.display = "block";
        document.getElementById("sync-btn").style.display = "block";
    } else {
        document.getElementById("show-table").remove();
        document.getElementById("calendar-alert").hidden = false;
    }

    // Turns the JS object from the DB into an array of [key, value] arrays which the forEach function can loop over.
    Object.entries(shows).forEach(render_row);
    Object.entries(shows).forEach(addEvent);


    var removebutton = document.getElementsByClassName("calendar-remove");
    var counter = 0;
    for (let i = removebutton.length - 1; i >= 0; i--) {
        removebutton[i].addEventListener("click", function() {
            let table_row_id = "table-row-" + [i + 1]
            let showId = Number(removebutton[i].value)
            // Delete show from DB before deleting the element so that calling the removebutton doesn't return undefined
            db.collection("shows").doc({ id: showId }).delete()
            // Can't delete the row because it would include the button and shorten the array, thereby changing the index so hide rows instead
            temp_row = document.getElementById(table_row_id);
            while (temp_row.children.length > 1) {
                temp_row.removeChild(temp_row.firstChild)
            }
            temp_row.hidden = true; 
            // Remove show events from calendar
            while (calendar.getEventById(showId)) {
                calendar.getEventById(showId).remove()
            }
            counter = counter + 1;

            // If all rows are hidden (kept track of by using counter), delete header and table then show alert.
            if ( counter === removebutton.length ){
                document.getElementById("show-table").remove();
                document.getElementById("calendar-alert").hidden = false;
                document.getElementById("buttonContainers").remove()
            }
        });
    };

    document.getElementById("sync-btn").addEventListener("click", sync_calendar);
    document.getElementById("clear-all-btn").addEventListener("click", clear_localcalendar);
    document.getElementById("clearGoogle-btn").addEventListener("click", delete_fromGCal);
    
});


function render_row([key, value]) {
    let table_row = document.createElement("tr");
    table_row.id = "table-row-" + (Number(key) + 1);
    table_cell = [];
    for (let i = 0; i < 6; i++) {
        table_cell[i] = document.createElement("td");
    } 
    table_cell[0].textContent = Number(key) + 1;
    table_cell[1].textContent = value.title;
    table_cell[2].textContent = value.airing_days;
    table_cell[3].textContent = value.airing_dates;
    table_cell[4].textContent = new Date(value.localshowtime).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
    var remove_button_td = document.createElement("button");
    Object.assign(remove_button_td, {
        type: "button",
        className: "calendar-remove",
        value: value.id
    })
    var remove_icon = document.createElement("i");
    remove_icon.setAttribute("class","bi bi-x-square btn-outline-danger");
    remove_button_td.appendChild(remove_icon);
    table_cell[5].appendChild(remove_button_td);
    document.getElementById("show-table").append(table_row);
    for (let j = 0; j < 6; j++) {
        document.getElementById("table-row-" + (Number(key) + 1)).append(table_cell[j]);
    }
};

function addEvent([key, value]) {
    try {
        eventObj = {
            title: value.title,
            rrule: { 
                freq: "weekly",
                byweekday: value.calendar_airDays,
                dtstart: value.calendar_startDateTime,
            },
            duration: value.duration,
            id: value.id,
            groupId: value.id,
            editable: true,
            displayEventTime: true
        }
        if (value.calendar_endDate !== value.calendar_startDateTime) {
            //let endDate = new Date(Date.UTC(value.calendar_endDate.split("-")[0], value.calendar_endDate.split("-")[1] - 1, value.calendar_endDate.split("-")[2]));
            //eventObj.rrule.until =  new Date(endDate.valueOf() + 24*60*60*1000)
            eventObj.rrule.until =  value.calendar_endRecur;
        } 
        else {
            eventObj.rrule.count = 1;
        }
        calendar.addEvent(eventObj);
    } catch (TypeError) {
        console.log(TypeError)
    }
}

function clear_localcalendar() {
    db.collection("shows").delete()
    document.getElementById("show-table").remove();
    document.getElementById("calendar-alert").hidden = false;
    document.getElementById("buttonContainers").remove()
}



