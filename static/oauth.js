// Initialize toasts for response
$('.toast').toast()

// Client ID and API key via AJAX call from server
function get_env() {
  var CLIENT_ID1;
  var CLIENT_ID2;
  var API_KEY;
  $.ajax({
    type : "POST",
    url : "/",
    contentType: 'application/json;charset=UTF-8',
    success: function(data) {
      CLIENT_ID1 = data.GC_ID1;
      CLIENT_ID2 = data.GC_ID2;
      API_KEY = data.API_SECRET;
      handleClientLoad();
    },
    error:  function(data) {
      console.log("error getting API keys")
    }
  });
}



// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/calendar";

var loginButton = document.getElementById('login_button');
var logoutButton = document.getElementById('logout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
 /*gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, callbackAuthResult);*/
  
var GoogleAuth;
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID1 + "-" + CLIENT_ID2 + ".apps.googleusercontent.com",
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    GoogleAuth = gapi.auth2.getAuthInstance();
    GoogleAuth.isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(GoogleAuth.isSignedIn.get());
    loginButton.onclick = handleAuthClick;
    logoutButton.onclick = handleSignoutClick;
  }, function(error) {
    alert(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    loginButton.style.display = "none";
    logoutButton.style.display = "block";
    if (document.getElementById("clearGoogle-btn") !== null) {
      document.getElementById("clearGoogle-btn").style.display = "block";
    }
    $("#accessModal").modal('hide')
    // Add bootstrap toast to signify login
  } else {
    try {
    loginButton.style.display = "block";
    logoutButton.style.display = "none";
    document.getElementById("clearGoogle-btn").style.display = "none";
    } catch (TypeError) {
      
    }
    
    // Add bootstrap toast to signify logout
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  GoogleAuth.signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  GoogleAuth.signOut();
}


async function sync_calendar() {
  var shows;
  try {
    shows = await db.collection("shows").get()
  } 
  catch(error) {
      console.log('error: ', error);
  }
  
  if (GoogleAuth.isSignedIn.get()) {
    gapi.auth.authorize({
      client_id: CLIENT_ID1 + "-" + CLIENT_ID2 + ".apps.googleusercontent.com",
      scope: SCOPES,
      immediate: true
      }, handleAuthResult);
    
    function handleAuthResult (authResult) {
      if (authResult && !authResult.error) {
        // Create a named function which will make an add event request to Google Calendar for every event in the events array
        function add_event(calendar_id) {
          var checkcal = new Promise (function(events) {
            var eventslist = [];
            var list_request = gapi.client.calendar.events.list({
              "calendarId": calendar_id,
            });
            list_request.execute(function(response){
              for (let i = 0; i < response.items.length; i++) {
                eventslist.push(response.items[i].summary)
                events(eventslist)
              }
              if (response.items.length == 0) {
                events(eventslist)
              }
            })
          })
         
          checkcal.then(function(events){
            addtoGoogle(events);
          });

          function addtoGoogle(eventslist) {
            // Create a function to add an event object to gcal_events array for every show in localbase
            // Currently uses count to add event instances but should change it to end date so that netflix shows only show up once
            for (let i = 0; i < shows.length; i++) {
              if (eventslist.indexOf(shows[i].title) == -1) {
                var gcal_events = {
                  "summary": shows[i].title,
                  "start": {
                    "dateTime": shows[i].calendar_startDateTime,
                    "timeZone": "UTC"
                  },
                  "end": { 
                    "dateTime": shows[i].calendar_endDateTime,
                    "timeZone": "UTC"
                  },
                  "recurrence": [
                    "RRULE:FREQ=WEEKLY;UNTIL=" + shows[i].calendar_endRecur + ";BYDAY=" + shows[i].airing_days + ";WKST=MO"
                  ],
                  "description": "Shown on " + shows[i].network.join(", ")
                }
                var add_request = gapi.client.calendar.events.insert({
                  "calendarId": calendar_id,
                  "resource": gcal_events
                }, headers='Content-Type: application/json');

                add_request.execute(function(response){
                  $("#SuccessAddToast").toast("show");
                }); 
              } else {
                $("#FailAddToast").toast("show");
              }
            }
          };
        };   
        var getcalendarList = new Promise(function(myResolve) {
          var calendar_id;
          var request = gapi.client.calendar.calendarList.list();
          request.execute(async function(response) {
            // Get list of calendars from user's calendars and look for "Kalendar KDrama"
            var calendars = response.items;
            for (let i = 0; i < calendars.length; i++) {
              // Loop through calendars and look for "Kalendar Kdrama" which we'll use to inject KDrama events
              if (calendars[i].summary === "Kalendar KDramas") {
                // return with calendar ID
                var calendar_id = calendars[i].id
                myResolve(calendar_id);
                break
              } 
            }
            if (calendar_id === undefined) {
              // If no "Kalendar KDramas" is found, make one
              var create_cal_request = gapi.client.calendar.calendars.insert({
                "summary": "Kalendar KDramas"
              });
              create_cal_request.execute(function(response){
                var calendar_id = response.id
                myResolve(calendar_id);
              })
            }
          });
        });
        getcalendarList.then(function(result) {
          add_event(result)
        });
      } else {
        console.log("Unauthorized.")
      }
    }
  } else {
    $("#accessModal").modal('show')
    document.getElementById("access-btn").addEventListener("click", GoogleAuth.signIn);
  }
}


async function deletefrom_GCal(show_title) {
  var showTitle = show_title;
  if (GoogleAuth.isSignedIn.get()) {
    gapi.auth.authorize({
      client_id: CLIENT_ID1 + "-" + CLIENT_ID2 + ".apps.googleusercontent.com",
      scope: SCOPES,
      immediate: true
      }, handleAuthResult);
    
    function handleAuthResult (authResult) {
      if (authResult && !authResult.error) {
        // Get the list of events (shows) in the Kalendar Calendar in GCal. Get the ID and Title.
        function delete_event(calendar_id) {
          var checkcal = new Promise (function(events, empty) {
            var showlist = {};
            var list_request = gapi.client.calendar.events.list({
              "calendarId": calendar_id,
            });
            list_request.execute(function(response){
              for (let i = 0; i < response.items.length; i++) {
                showlist[response.items[i].summary] = response.items[i].id
                events(showlist)
              }
              if (response.items.length == 0) {
                events(showlist)
              }
            })
          })
         
          checkcal.then(function(events){
            deletefromGoogle(events);
          });

          function deletefromGoogle(showList) {
            // Create a function to add an event object to gcal_events array for every show in localbase
            // Currently uses count to add event instances but should change it to end date so that netflix shows only show up once
              if (showTitle in showList) {
                var add_request = gapi.client.calendar.events.delete({
                  "calendarId": calendar_id,
                  "eventId": showList[showTitle]
                });

                add_request.execute(function(response){
                  $("#deleteModal").modal('hide')
                  $("#SuccessDeleteToast").toast("show");
                }); 
              } 
            
          };
        };   
        var getcalendarList = new Promise(function(myResolve, myReject) {
          var calendar_id;
          var request = gapi.client.calendar.calendarList.list();
          request.execute(async function(response) {
            // Get list of calendars from user's calendars and look for "Kalendar KDrama"
            var calendars = response.items;
            for (let i = 0; i < calendars.length; i++) {
              // Loop through calendars and look for "Kalendar Kdrama" which we'll use to inject KDrama events
              if (calendars[i].summary === "Kalendar KDramas") {
                // return with calendar ID
                var calendar_id = calendars[i].id
                myResolve(calendar_id);
                break
              } 
            }
            if (calendar_id === undefined) {
              // If no "Kalendar KDramas" is found, return and alert
              myReject("No Kalendar found.");
            }
          });
        });
        getcalendarList.then(function(result) {
          delete_event(result)
        });
      } else {
        console.log("Unauthorized.")
      }
    }
  } else {
    $("#accessModal").modal('show')
    document.getElementById("access-btn").addEventListener("click", GoogleAuth.signIn);
  }
}


function clear_GCal() {

  if (GoogleAuth.isSignedIn.get()) {
    gapi.auth.authorize({
      client_id: CLIENT_ID1 + "-" + CLIENT_ID2 + ".apps.googleusercontent.com",
      scope: SCOPES,
      immediate: true
      }, handleAuthResult);
    
    function handleAuthResult (authResult) {
      if (authResult && !authResult.error) {
        var getcalendarList = new Promise(function(myResolve, myReject) {
          var calendar_id;
          var request = gapi.client.calendar.calendarList.list();
          request.execute(async function(response) {
            // Get list of calendars from user's calendars and look for "Kalendar KDrama"
            var calendars = response.items;
            for (let i = 0; i < calendars.length; i++) {
              // Loop through calendars and look for "Kalendar Kdrama" which we'll use to inject KDrama events
              if (calendars[i].summary === "Kalendar KDramas") {
                // return with calendar ID
                var calendar_id = calendars[i].id
                myResolve(calendar_id);
                break
              } 
            }
            if (calendar_id === undefined) {
              // If no "Kalendar KDramas" is found, return and alert
                myReject("No Kalendar found.");
            }
          });
        });
        getcalendarList.then(function(resolve) {
          clear_cal(resolve)
        }, function(reject) {
          $("#FailDeleteToast").toast("show");
        });
        function clear_cal(calendar_id) {
          var clear_request = gapi.client.calendar.calendars.delete({
            "calendarId": calendar_id,
          });
          clear_request.execute(function(response){
            $("#SuccessClearToast").toast("show");
          });
        }
      } else {
        console.log("Unauthorized.")
      }
    }
  } else {
    $("#accessModal").modal('show')
    document.getElementById("access-btn").addEventListener("click", GoogleAuth.signIn());
  }

}

  
 


 


  





 
