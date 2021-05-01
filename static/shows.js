
// Uses ajax to refresh show list depending on quarter and year chosen
$(function refresh_list() {
    $("input[name='quarter-options']").click(function get_quarter_data() {
        let self = $(this);
        console.log(self.val())
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
    $(".see-btn").click(function() {
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
        $("#dramaInfoLine2").html("Cast: " + data.cast);
        $("#dramaInfoLine3").html("Airing dates: " + data.air_date);
        $("#dramaInfoLine4").html("Schedule: " + data.aired_on);
        $("#dramaInfoLine5").html("Genres: "+ data.genres);
        $("#AddtoCalendar").prop("disabled", false);
    }
};

// Localbase Script
var db = new Localbase('db')

$("#AddtoCalendar").click(addtodb);

function addtodb() {
    db.collection('shows').add({
        title: show_data.title,
        days: show_data.aired_on,
        start_date: show_data.start_date,
        airing_dates: show_data.air_date
    })
};
 
