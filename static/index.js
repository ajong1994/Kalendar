$(function() {
    $(".see-btn").click(function post() {
        var self = $(this);
        console.log(self.val());
        console.log(JSON.stringify({handle: self.val()}));
        $.ajax({
            type : "POST",
            url : "/",
            dataType: "json",
            data: JSON.stringify({handle: self.val()}),
            contentType: 'application/json;charset=UTF-8',
            success: function print(data) {
                console.log(data);
                $(dramaInfoModalLabel).html(data.title);
            },
            error:  function(data) {
                console.log("error");
            }
        });
    });
});