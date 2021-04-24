import os

from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from tempfile import mkdtemp
from werkzeug.exceptions import default_exceptions, HTTPException, InternalServerError
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required, lookup, usd

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


# Custom filter
app.jinja_env.filters["usd"] = usd

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///finance.db")

# Make sure API key is set
if not os.environ.get("API_KEY"):
    raise RuntimeError("API_KEY not set")


def calculate():
    # Create local variables for number of stocks bought and sold
    stocks_bought = db.execute(
        "SELECT SUM(quantity) AS qty, stock FROM transactions WHERE action = ? AND user_id = ? GROUP BY stock", "BUY", session["user_id"])
    stocks_sold = db.execute(
        "SELECT SUM(quantity) AS qty, stock FROM transactions WHERE action = ? AND user_id = ? GROUP BY stock", "SELL", session["user_id"])

    stocks_total = 0
    # Create list of stock dicts
    owned_stocks = []
    # Loop over stocks in bought list
    for purchased_stocks in stocks_bought:
        # Initialize dictionary for stock details which will contain info about each stock
        stocks_net = {}
        stocks_net["name"] = purchased_stocks["stock"]
        if not len(stocks_sold) == 0:
            for sold_stocks in stocks_sold:
                if purchased_stocks["stock"] in sold_stocks["stock"]:
                    stocks_net["quantity"] = purchased_stocks["qty"] - sold_stocks["qty"]
                    break
                else:
                    stocks_net["quantity"] = purchased_stocks["qty"]
        else:
            stocks_net["quantity"] = purchased_stocks["qty"]
        if (stocks_net["quantity"] == 0):
            continue
        stocks_net["price"] = lookup(stocks_net["name"])["price"]
        stocks_net["value"] = stocks_net["quantity"] * stocks_net["price"]
        # Every time a dict is complete, get its total holding value and add it to the stock total variable
        stocks_total += stocks_net["value"]

        # Once the stock info dict is complete, add that to the list of stocks
        owned_stocks.append(stocks_net)

    return owned_stocks, stocks_total


@app.route("/")
@login_required
def index():
    """Show list of shows"""

    owned_stocks, stocks_total = calculate()
    # display user's current cash balance and grand total
    user_cash = db.execute("SELECT cash FROM users WHERE id = ?", session["user_id"])[0]["cash"]
    grand_total = user_cash + stocks_total

    return render_template("index.html", stocks=owned_stocks, cash=user_cash, total=stocks_total, grand_total=grand_total )


@app.route("/buy", methods=["GET", "POST"])
@login_required
def buy():
    """Buy shares of stock"""

    if request.method == "POST":
        if not request.form.get("symbol").isalpha():
            return apology("stock symbol must contain only alphabets")
        if not request.form.get("shares").isnumeric():
            return apology("share number must only be an integer")
        if isinstance(request.form.get("shares"), float):
            return apology("share number must not be a float")
        if not lookup(request.form.get("symbol")):
            return apology("enter valid stock symbol")

        stock_symbol = request.form.get("symbol")
        share_number = int(request.form.get("shares"))
        if not stock_symbol:
            return apology("must input stock symbol")
        if not share_number or (share_number < 0):
            return apology("must input positive integer for shares")

        stock_price = lookup(request.form.get("symbol"))["price"]
        user_cash = db.execute("SELECT cash FROM users WHERE id = ?", session["user_id"])[0]["cash"]
        purchaseable_amount = int(user_cash / stock_price)
        if purchaseable_amount >= share_number:
            transaction_value = stock_price * share_number
            balance_post_purchase = user_cash - transaction_value
            db.execute("INSERT INTO transactions (user_id, stock, quantity, price, action, balance_before, transaction_value, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
                       session["user_id"], stock_symbol, share_number, stock_price, "BUY", user_cash, transaction_value, balance_post_purchase)
            db.execute("UPDATE users SET cash = ? WHERE id = ?", balance_post_purchase, session["user_id"])

            return redirect("/")

        else:
            return apology("Share input exceeds purchasing power")

    else:
        return render_template("buy.html")


@app.route("/history")
@login_required
def history():
    """Show history of transactions"""

    transaction_history = db.execute("SELECT * FROM transactions WHERE user_id = ?", session["user_id"])
    return render_template("history.html", transactions=transaction_history)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        rows = db.execute("SELECT * FROM users WHERE username = ?", request.form.get("username"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/quote", methods=["GET", "POST"])
@login_required
def quote():
    """Get stock quote."""

    # User reached route via POST (as by submitting form via POST)
    if request.method == "POST":
        # Get stock name, price and symbol in dictionary format via lookup function
        if not request.form.get("symbol").isalpha():
            return apology("stock symbol must contain only alphabets")
        if not lookup(request.form.get("symbol")):
            return apology("enter valid stock symbol")
        stock = lookup(request.form.get("symbol"))
        return render_template("quoted.html", stock=stock)

    else:
        return render_template("quote.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""

    # User reached route via POST (as by submitting form via POST)
    if request.method == "POST":

        # Check if user inputted a name
        if not request.form.get("username"):
            return apology("must provide username")

        # Check if user inputted a password
        elif not request.form.get("password"):
            return apology("must provide password")

        # Check if confirmed password is correct
        elif not request.form.get("confirmation") or (request.form.get("confirmation") != request.form.get("password")):
            return apology("passwords must match")

        elif db.execute("SELECT * FROM users WHERE username = ?", request.form.get("username")):
            return apology("username is taken")

        # Save submitted credentials to local variable
        username = request.form.get("username")
        password = generate_password_hash(request.form.get("password"))

        # Add credentials to database
        db.execute("INSERT INTO users (username, hash) VALUES (?, ?)", username, password)

        # Redirect user to login
        return redirect("/")

    else:
        return render_template("register.html")


def outstanding():
    # Get stock called
    stock_called = request.form.get("symbol")
    # Create local variables for number of stocks bought and sold
    stocks_bought = db.execute(
        "SELECT SUM(quantity) AS qty, stock FROM transactions WHERE stock = ? AND action = ? AND user_id = ? GROUP BY stock", stock_called, "BUY", session["user_id"])
    stocks_sold = db.execute(
        "SELECT SUM(quantity) AS qty, stock FROM transactions WHERE stock = ? AND action = ? AND user_id = ? GROUP BY stock", stock_called, "SELL", session["user_id"])
    # Initialize dictionary for stock details which will contain info about each stock
    stocks_net = {}
    # If the stock was ever sold, then...
    if not len(stocks_sold) == 0:
        stocks_net["name"] = stocks_bought[0]["stock"]
        stocks_net["quantity"] = stocks_bought[0]["qty"] - stocks_sold[0]["qty"]
    # If stock was never sold, then just get the value of its name and quantity and put it into stock dict
    else:
        stocks_net["name"] = stocks_bought[0]["stock"]
        stocks_net["quantity"] = stocks_bought[0]["qty"]
        # The price and value will be irrespective of whether it was sold or not, so assign that into the dict after
    stocks_net["price"] = lookup(stocks_net["name"])["price"]
    return stocks_net


@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    """Sell shares of stock"""

    if request.method == "POST":
        if not request.form.get("symbol").isalpha():
            return apology("stock symbol must contain only alphabets")
        if not request.form.get("shares").isnumeric():
            return apology("share number must only be an integer")
        if isinstance(request.form.get("shares"), float):
            return apology("share number must not be a float")
        stocks_net = outstanding()
        share_number = int(request.form.get("shares"))
        if not request.form.get("symbol"):
            return apology("must input stock symbol")
        if not share_number or (int(share_number) < 0):
            return apology("must input positive integer")

        user_cash = db.execute("SELECT cash FROM users WHERE id = ?", session["user_id"])[0]["cash"]
        if not (stocks_net["quantity"] < share_number):
            transaction_value = stocks_net["price"] * share_number
            balance_post_purchase = user_cash + transaction_value
            db.execute("INSERT INTO transactions (user_id, stock, quantity, price, action, balance_before, transaction_value, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       session["user_id"], stocks_net["name"], share_number, stocks_net["price"], "SELL", user_cash, transaction_value, balance_post_purchase)
            db.execute("UPDATE users SET cash = ? WHERE id = ?", balance_post_purchase, session["user_id"])

            return redirect("/")

        else:
            return apology("Share input exceeds held amount")

    else:
        owned_stocks, order_total = calculate()
        return render_template("sell.html", stocks=owned_stocks)


def errorhandler(e):
    """Handle error"""
    if not isinstance(e, HTTPException):
        e = InternalServerError()
    return apology(e.name, e.code)


# Listen for errors
for code in default_exceptions:
    app.errorhandler(code)(errorhandler)
