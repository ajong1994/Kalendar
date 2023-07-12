var current = location.pathname.split("/")[1];

// Get container element and put all nav links with class "nav-link" inside the above container
var navs = document.querySelector(".navbar-nav").getElementsByClassName("nav-link");

// Loop through the nav links and compare it with the pathname set as current. If user is on the current page, "active" will be added as a class
for (var i = 0; i < navs.length; i++) {
    // Do this for all pages except the index page
    if (current !== "") {
        if (navs[i].getAttribute("href").split("/").indexOf(current) !== -1) {
            navs[i].className += " active";
        }
    }
}

if (current !== "") {
    document.getElementById("main-nav").className += " kalendar-bg-dark";
} else {
    document.getElementById("main-nav").className += " kalendar-nav-violet"; 
}

