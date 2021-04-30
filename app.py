import os
import json

from flask import Flask, flash, redirect, render_template, request, session
from tempfile import mkdtemp
from werkzeug.exceptions import default_exceptions, HTTPException, InternalServerError
from werkzeug.security import check_password_hash, generate_password_hash

from helper import apology, generate, fetch

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True


# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"


@app.route("/calendar", methods=["GET", "POST"])
def calendar():
    """ when accessed via POST using see more button on cards """
    if request.method == "POST":
        specific_show = request.json["handle"]
        show_info = fetch(specific_show)
        return show_info
    else:
        """Show list of shows"""
        return render_template("calendar.html")

        
@app.route("/refresh", methods=["POST"])
def refresh():
    """ when accessed via POST using see more button on cards """
    current_quarter = request.json["quarter"]
    show_list = json.dumps(generate(2021, current_quarter))
    return show_list



@app.route("/shows", methods=["GET", "POST"])
def shows():
    """ when accessed via POST using see more button on cards """
    if request.method == "POST":
        specific_show = request.json["handle"]
        show_info = fetch(specific_show)
        return show_info
    else:
        korean_shows = generate(2021,2)
        return render_template("shows.html", list=korean_shows)



@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")




def errorhandler(e):
    """Handle error"""
    if not isinstance(e, HTTPException):
        e = InternalServerError()
    return error(e.name, e.code)


# Listen for errors
for code in default_exceptions:
    app.errorhandler(code)(errorhandler)
