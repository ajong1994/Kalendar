// Localbase Initialization
var db = new Localbase("db");
var calendar;

document.addEventListener('DOMContentLoaded', async function() {
    // Check if mobile to render different calendar views and settings
    function mobileviewCheck() {
        if (window.innerWidth >= 768 ) {
            return false;
        } else {
            return true;
        }
    }
    // Initialize bootstrap popovers for events
    $(function () {
        $('[data-toggle="popover"]').popover()
      })

    // Initialize fullcalendar
    var calendarEl = document.getElementById("calendar");
    calendar = new FullCalendar.Calendar(calendarEl, {
        // Solution derived from Simon Botero's answer on https://stackoverflow.com/questions/41908295/fullcalendar-change-view-for-mobile-devices
        initialView: mobileviewCheck() ? "listMonth" : "dayGridMonth",
        contentHeight: mobileviewCheck() ? 400 : "auto",
        headerToolbar: {
            left: "dayGridMonth,listMonth",
            center: "title",
            right: "prev,next",
        },
        buttonText: {
            month: "Grid",
            list: "List",
            today: "Today"
        },
        eventDidMount: function(info) {
            $(info.el).popover({
                trigger: "click",
                title: info.event.title,
                content: "Air time: " + info.event.start.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
             });
        },
        timeZone: "local",
        events: []
    });
    calendar.render();

    // Close tooltip when user clicks outside of the body from user28490 and kn0mad1c on https://stackoverflow.com/questions/11703093/how-to-dismiss-a-twitter-bootstrap-popover-by-clicking-outside
    $("html").on("mouseup", function (e) {
        var l = $(e.target);
        try {
            if (l[0].className.indexOf("popover") == -1) {
                $(".popover").each(function () {
                    $(this).popover("hide");
                });
            }
        } catch (TypeError) {
            // Empty catch the errors that occur when a click is made on a non calendar event
        }

    });


    // Click listener to adjust calendar height if the device is mobile and the view is grid and unset it otherwise
    document.querySelector(".fc-dayGridMonth-button").addEventListener("click", function() {
        if (mobileviewCheck()) {
            calendar.setOption('contentHeight', "auto");
        }
    });
    document.querySelector(".fc-listMonth-button").addEventListener("click", function() {
        if (mobileviewCheck()) {
            calendar.setOption('contentHeight', 400);
        }
    });
    

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
        let thead = document.createElement("thead");
        let table_row = document.createElement("tr");
        table_row.id = "table-row-0";
        table_header = [];
        for (let i = 0; i < 6; i++) {
            table_header[i] = document.createElement("th");
        }
        table_header[0].textContent = "#";
        table_header[1].textContent = "Title";
        table_header[2].textContent = "Day Schedule";
        table_header[3].textContent = "Airing Period";
        table_header[4].textContent = "Show Time";
        table_header[5].textContent = "Delete";
        document.getElementById("show-table").append(thead);
        document.querySelector("#show-table thead").append(table_row);
        for (let j = 0; j < 6; j++) {
            document.getElementById("table-row-0").append(table_header[j]);
        }
        let tbody = document.createElement("tbody");
        document.getElementById("show-table").append(tbody);
        document.getElementById("sync-btn").style.display = "block";
        document.getElementById("clearList-btn").style.display = "block";
    } else {
        document.getElementById("show-table").remove();
        document.getElementById("calendar-alert").hidden = false;
    }

    // Turns the JS object from the DB into an array of [key, value] arrays which the forEach function can loop over.
    Object.entries(shows).forEach(render_row);
    Object.entries(shows).forEach(addEvent);


    var removebutton = document.getElementsByClassName("calendar-remove");
    var counter = 0;
    var table_row_id = 0;
    for (let i = removebutton.length - 1; i >= 0; i--) {
        removebutton[i].addEventListener("click", function() {
            table_row_id = "table-row-" + [i + 1]
            let showInfo = removebutton[i].value;
            document.getElementById("del-modal-show-title").textContent = showInfo.split("/*/")[1];
            document.getElementById("delete-show-btn").setAttribute("value", showInfo);
            $("#deleteModal").modal('show');
        });
    };

    // Click listeners for the show table buttons and modals
    document.getElementById("sync-btn").addEventListener("click", sync_calendar);
    document.getElementById("clearList-btn").addEventListener("click", function() {
        $("#clearListModal").modal('show');
    });
    document.getElementById("clearList-confirm").addEventListener("click", function(){
        if (GoogleAuth.isSignedIn.get()) {
            clear_GCal();
        }
        db.collection("shows").delete();
        document.getElementById("show-table").remove();
        document.getElementById("calendar-alert").hidden = false;
        document.getElementById("buttonContainers").remove();
        $("#clearListModal").modal('hide')
    });
    document.getElementById("delete-show-btn").addEventListener("click", function() {
        let showTitle = this.value.split("/*/")[1]
        let showId = this.value.split("/*/")[0];
        if (GoogleAuth.isSignedIn.get()) {
            deletefrom_GCal(showTitle);
        }
        // Delete show from DB before deleting the element so that calling the removebutton doesn't return undefined
        db.collection("shows").doc({ title: showTitle }).delete()
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
    table_cell[2].textContent = value.airing_days.join(", ");
    table_cell[3].textContent = value.airing_dates;
    table_cell[4].textContent = new Date(value.localshowtime).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
    var remove_button_td = document.createElement("button");
    Object.assign(remove_button_td, {
        type: "button",
        className: "calendar-remove",
        value: value.id + "/*/" + value.title
    })
    var svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    var svgWidth = 16;
    var svgHeight = 16;
    var path = document.createElementNS("http://www.w3.org/2000/svg","path");
    svg.setAttributeNS(null, "width", svgWidth);
    svg.setAttributeNS(null, "height", svgHeight);
    svg.setAttributeNS(null, "viewBox", "0 0 " + svgWidth + " " + svgHeight);
    svg.setAttributeNS(null, "fill", "currentColor");
    svg.setAttributeNS(null, "class", "bi bi-x-lg calendar-remove-icon");
    path.setAttributeNS(null, "d", "M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z");
    svg.appendChild(path);
    remove_button_td.appendChild(svg);
    table_cell[5].appendChild(remove_button_td);
    document.querySelector("#show-table tbody").append(table_row)
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
        if (new Date)
        calendar.addEvent(eventObj);
    } catch (TypeError) {
        console.log(TypeError)
    }
}




