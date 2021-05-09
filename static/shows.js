
// Uses ajax to refresh show list depending on quarter and year chosen
$(function refresh_list() {
    $("input[name='quarter-options']").click(function get_quarter_data() {
        let self = $(this);
        $.ajax({
            type : "POST",
            url : "/refresh",
            dataType: "json",
            data: JSON.stringify({quarter: self.val()}),
            contentType: 'application/json;charset=UTF-8',
            success: function(data) {
                let arr = data;
                $(".row.row-cols-1.row-cols-md-3").empty();
                $.each(arr, function create_card(index, dict) {
                    // Create loading animation
                    // Create card container
                    let product_card = $("<div class='col mb-4'></div>")
                    // append divs containing show info
                    .append($("<div class='card h-100'></div>")
                        .append($("<div class='row no-gutters'></div>")
                            .append($("<div class='col-4'></div>")
                                .append($("<img src='" + dict.thumbnail + "' class='card-img' alt='picture of " + dict.title + "'>"))
                            )
                            .append($("<div class='col-8'></div")
                                .append($("<div class='card-body card-detail'></div")
                                    .append($("<h5>" + dict.title + "</h5>"))
                                    .append($("<p class='card-text'>Episodes: " + dict.episodes + "</p>"))
                                    .append($("<p class='card-text'>Release Date: " + dict.released_at +"</p>"))
                                )
                                .append($("<div class='card-buttons'></div>")
                                    .append($("<button type='button' class='btn btn-primary see-btn' data-toggle='modal' data-target='#dramaInfo' value='" + dict.url + "'>See More</button>"))
                                )
                            )
                        )
                    );
                    // append complete card
                    $(".row.row-cols-1.row-cols-md-3").append(product_card)
                });
            },
            error:  function(data) {
                console.log("error");
            }
        });
    });
});

// initialize show_data global variable which can be used to store and access active show info
var show_data;
$(function fill_modal() {
    $("body").on("click", ".see-btn", function() {
        modify_modal();
        let self = $(this);
        $.ajax({
            type : "POST",
            url : "/shows",
            dataType: "json",
            data: JSON.stringify({handle: self.val()}),
            contentType: 'application/json;charset=UTF-8',
            success: function(data) {
                show_data = data;
                console.log(data);
                modify_modal(data);
            },
            error:  function(data) {
                $("#dramaInfoModalLabel").html("<span style='color:red'>Sorry!</span>");
                $("#dramaInfoLine1").html("");
                $("#dramaInfoLine2").html("Source data for this drama is inaccessible.");
                $("#dramaInfoLine3").html("");
                $("#dramaInfoLine4").html("");
                // disable add to calendar button
            }
        });
    });
});

// Clears modal HTML and adds freshly pulled info
function modify_modal(data="None") {
    if (data == "None") {
        $("#dramaInfoModalLabel").html("<div id='loading-title'></div>");
        $(".dramaInfoLine").html("<div class='loading-line mb-4'></div>");
        $("#dramaInfoLine5").html("");
        $("#AddtoCalendar").prop("disabled",true);
    }
    else {
        $("#dramaInfoModalLabel").html(data.title);
        $("#dramaInfoLine1").html("Synopsis: " + data.synopsis);
        $("#dramaInfoLine2").html("Cast: " + data.cast.join(", "));
        $("#dramaInfoLine3").html("Airing dates: " + data.air_date);
        $("#dramaInfoLine4").html("Schedule: " + data.aired_on);
        $("#dramaInfoLine5").html("Genres: "+ data.genres);
        $("#AddtoCalendar").prop("disabled", false);
        try {
            let errortest = dateConvert(data.air_date.split(" - ")[0], data.airingtime).toISOString();
        } catch(RangeError) {
            console.log("Data incomplete");
            $("#AddtoCalendar").prop("disabled", true);
            $("#AddtoCalendar").html("Data incomplete");
        }
        
    }
};

// Localbase Script
var db = new Localbase("db");
var buttonAddCalendar = document.getElementById("AddtoCalendar");
buttonAddCalendar.addEventListener("click", async function() {
    // This async function waits for the promise from the checkdb function to
    // make sure it's comparing the final result and not a premature undefined
    if ( await checkdb() === undefined ) {
        // if title isn't in the db yet, add it
        addtodb();
    }
});



async function addtodb(){
    var air_days_temp_array = show_data.aired_on.split(", ");
    var air_days_array = air_days_temp_array.map(dayConvert);
    var air_dates_temp_start = show_data.air_date.split(" - ")[0];
    var air_dates_temp_end = show_data.air_date.split(" - ")[1];
    try {
        var air_dates_start = dateConvert(air_dates_temp_start, show_data.airingtime).toISOString();
        
    } catch (RangeError) {
        // disable button if data isn't complete yet 
        var addbutton = document.getElementById("AddtoCalendar");
        addbutton.disabled = true;
        addbutton.innerHTML = "Info Incomplete";
    }
    try {
        var air_dates_end = dateConvert(air_dates_temp_end, show_data.airingtime).toISOString().split("T")[0];
    } catch (TypeError) {
        var air_dates_end = air_dates_start;
    } finally {
        await db.collection("shows").add({
            title: show_data.title,
            airing_days: show_data.aired_on,
            airing_dates: show_data.air_date,
            calendar_airDays: air_days_array,
            calendar_startDate: air_dates_start,
            calendar_endDate: air_dates_end,
            localshowtime: new Date(parseInt(show_data.airing_time)*1000).toISOString(),
            duration: parseInt(show_data.duration)*60*1000
        })
        // Add success prompt here or button change
        var addbutton = document.getElementById("AddtoCalendar");
        addbutton.disabled = true;
        addbutton.innerHTML = "Added";
    }
};

// This promise function checks the DB for the current title and returns undefined 
// if the title is not yet in the DB.
async function checkdb() {
    try {
        let shows = await db.collection("shows")
            .doc({ title: show_data.title})
            .get()
        return shows;
    }
    catch(error) {
        console.log('error: ', error);
    }
};

function dayConvert(day) {
    const days = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    if (days.indexOf(day) > -1) {
        return days.indexOf(day);
    }
    else {
        return 6;
    }
};

function dateConvert(date, epochtime) {
    if (date === undefined ) {
        return;
    }
    let month = date.replace("  "," ").split(" ")[0];
    let day = Number(date.replace("  "," ").split(" ")[1].trim().replace(",",""));
    let year = Number(date.replace("  "," ").split(" ")[2]);
    let hour = new Date(parseInt(show_data.airing_time)*1000).getHours();
    let mins = new Date(parseInt(show_data.airing_time)*1000).getMinutes();
    let secs = 00;
    const monthlist = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (monthlist.indexOf(month) > -1) {
        month = monthlist.indexOf(month);
    }
    else {
        month = 12;
    }
    let jsdate = new Date(year, month, day, hour, mins, secs);
    return jsdate;
};

