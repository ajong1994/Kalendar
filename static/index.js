
var see_btns = document.querySelectorAll('.see-btn');

    for (let i = 0; i < see_btns.length; ++i) {
        see_btns[i].click = function() {
            $.ajax({
                type : "POST",
                url : "/",
                dataType: "json",
                data: JSON.stringify(value),
                contentType: 'application/json;charset=UTF-8',
                success: function (data) {
                    console.log(data);
                }
            });
        };
    };