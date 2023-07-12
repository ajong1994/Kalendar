# Kalendar
#### Video Demo:  https://youtu.be/M17uCaSmbQA

## Background
I had just finished week 9 of CS50 and I was watching KDrama—a good few of them, actually, when the idea for this final project hit me. I was following more shows than I could mentally keep track of, and because their schedules and release times were all different, I only had a vague idea of when to check the streaming apps if the latest episodes had been uploaded. Then I figured, since the essence of programming is to automate processes and actions, then why don’t I automate the process of looking up shows, getting their information, and translating the schedule data onto a calendar?

Somewhere along the way of coding though, I decided that my app wouldn’t be able to do notifications and would be much more useful if it were integrated with another app that could—hence the Google Calendar function.

## File Breakdown

### Crawl.py
This particular file was built together from code from TheBoringDude and shane-tw to scrape a popular KDrama resource page since APIs weren’t directly available from any source which provided the necessary information. Because their initial code didn’t scrape the javascript which included air times, I added that in.

The app wasn’t even supposed to include time data because from my initial glance, that information wasn’t available. But as I learned more about page sources and their structure, I realized that it was possible, and so the scope of the project grew again.

### getDate.py
Because I didn’t want users to have to bother with shows that have already aired—for the reason that the airing dates and schedules of completed shows didn’t matter so much when they can already be binged—I had to figure out a way to present a dynamic list of shows that changed depending on the date (in this case, quarter). This file started as a way to break down the tabs on the show page into quarters which would default to the current quarter. However, since Q1 shows didn’t matter so much if the time period was already Q2, I made the functions leaner and to just split data into the current quarter and the next two quarters.

### helper.py
Helper, as its name implies, is inspired by the helper python files that we used in CS50. This python file is in charge of making API calls when needed or synthesizing data from crawl.py to generate show information in json format. It houses the functions that app.py calls on whenever ajax calls are made for dynamic show information.

### app.py
As we learned in week 9, the app.py contains the routes and function calls whenever POST or GET http calls are made on the website. Alongside helper.py, app.py serves as the backbone of the web app.

### calendar.js
Calendar.js reads the local database, essentially an IndexDB simplified by the Localbase library. Based on the data in the database, table rows for the watchlist are generated dynamically. I also used the Full Calendar js library to implement a local version of a calendar which will display the shows as events. Most of the buttons and functions that are found in this file are directly related to oauth.js since the calendar sync and delete functions can be found here.

### oauth.js
The goauth file contains javascript relating to Google API. The base file came from Google’s own starter code, and I added in parts like getting the credentials from the env via an Ajax call, and several functions which process Google Calendar data—creating, reading, updating, and deleting calendar lists and events. These functions are tied to the Calendar.js file and are triggered upon button clicks.

### shows.js
This javascript file allows the dynamic display of shows based on season via ajax call to the app.py. Whenever a card is clicked, an ajax call is made to app.py and subsequently crawl.py for the show information. If a show is added to the watchlist, its data is then saved to the local database and sent as an event to the Full Calendar initialized calendar.

### Layout
As for the layout, I wanted to make sure I was thorough with my acknowledgements and sourcing, so the footer is packed with attributions, external links and notes. To wrap it all up, I included Privacy Policy and Terms of Service pages, which Google requires, to clearly outline what happens on the back-end.
