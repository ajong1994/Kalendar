$(function fill_modal() {
    $(".see-btn").click(function post() {
        modify_modal();
        var self = $(this);
        $.ajax({
            type : "POST",
            url : "/",
            dataType: "json",
            data: JSON.stringify({handle: self.val()}),
            contentType: 'application/json;charset=UTF-8',
            success: function(data) {
                modify_modal(data);
            },
            error:  function(data) {
                $(dramaInfoModalLabel).html("<span style='color:red'>Sorry!</span>");
                $(dramaInfoLine1).html("")
                $(dramaInfoLine2).html("Source data for this drama is inaccessible.")
                $(dramaInfoLine3).html("");
                $(dramaInfoLine4).html("");
                // disable add to calendar button
            }
        });
    });
});


function modify_modal(data="None") {
    if (data == "None") {
        $(dramaInfoModalLabel).html("<div id='loading-title'></div>");
        $(dramaInfoModalBody).children().html("<div class='loading-line mb-4'></div>");
    }
    else {
        $(dramaInfoModalLabel).html(data.title);
        $(dramaInfoLine1).html("Synopsis: " + data.synopsis);
        $(dramaInfoLine2).html("Cast: " + data.cast);
        $(dramaInfoLine3).html("Airing dates: " + data.air_date);
        $(dramaInfoLine4).html("Schedule: " + data.aired_on);
    }
};