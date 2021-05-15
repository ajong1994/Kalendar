import os
import json
from dotenv import load_dotenv
from flask import Flask, flash, redirect, render_template, request, session, jsonify
from tempfile import mkdtemp
from werkzeug.exceptions import default_exceptions, HTTPException, InternalServerError
from werkzeug.security import check_password_hash, generate_password_hash
from helper import apology, generate, fetch
from getDate import year_now, quarter_now, year_next, quarter_next1, quarter_next2

# Load GAPI credentials from env
load_dotenv()


# Configure application
app = Flask(__name__)

# dont know what this does
# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# dont know what this does
# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# dont know what this does
# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"


@app.route("/calendar", methods=["GET", "POST"])
def calendar():
    """ when accessed via POST using see more button on cards """
    if request.method == "POST":
        specific_show = request.json["handle"]
        show_info = jsonify(fetch(specific_show))
        return show_info
    else:
        """Show list of shows"""
        return render_template("calendar.html")

        
@app.route("/refresh", methods=["POST"])
def refresh():
    """ when accessed via POST using see more button on cards """
    selected_period = request.json["list"]
    if selected_period == "current":
        show_list = generate(year_now(), quarter_now())
        print(quarter_now(),year_now())
    else: 
        if quarter_now() == 3:
            show_list1 = generate(year_now(), quarter_next1())
            show_list2 = generate(year_next(), quarter_next2())
            show_list = show_list1 + show_list2
        elif quarter_now() == 4:
            show_list1 = generate(year_next(), quarter_next1())
            show_list2 = generate(year_next(), quarter_next2())
            show_list = show_list1 + show_list2
        else: 
            show_list1 = generate(year_now(), quarter_next1())
            show_list2 = generate(year_now(), quarter_next2())
            show_list = show_list1 + show_list2
    return jsonify(show_list)



@app.route("/shows", methods=["GET", "POST"])
def shows():
    """ when accessed via POST using see more button on cards """
    if request.method == "POST":
        specific_show = request.json["handle"]
        show_info = jsonify(fetch(specific_show))
        return show_info
    else:
        korean_shows = generate(year_now(),quarter_now())
        quarter = quarter_now()
        return render_template("shows.html", list=korean_shows, quarter=quarter)

@app.route("/login", methods=["GET"])
def login():
        return render_template("login.html")

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        credentials = {}
        credentials["GC_ID1"] = os.getenv('GC_CLIENT_ID1')
        credentials["GC_ID2"] = os.getenv('GC_CLIENT_ID2')
        credentials["API_KEY"] = os.getenv('API_KEY')
        return jsonify(credentials)
    else:
        return render_template("index.html")



# not sure what this does
def errorhandler(e):
    """Handle error"""
    if not isinstance(e, HTTPException):
        e = InternalServerError()
    return (e.name, e.code)


# Listen for errors
for code in default_exceptions:
    app.errorhandler(code)(errorhandler)
