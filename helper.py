import os
import requests
import urllib.parse
from crawl import crawl

from flask import redirect, render_template, request



def apology(message, code=400):
    """Render message as an apology to user."""

    def escape(s):
        """
        Escape special characters.
        """
        for old, new in [("-", "--"), (" ", "-"), ("_", "__"), ("?", "~q"),
                         ("%", "~p"), ("#", "~h"), ("/", "~s"), ("\"", "''")]:
            s = s.replace(old, new)
        return s
    return render_template("error.html", error_code=code, message=escape(message)), code


def generate(year, quarter):
    """Look up list of dramas for the given year & quarter"""

    # Contact API
    url = f"https://kuryana.vercel.app/seasonal/{year}/{quarter}"
    response = check_url(url)

    # Parse response
    korean_shows = []

    results = response.json()
    for result in results:
        result_info = {}
        ## Add filter for only airing dramas
        if result["content_type"] == "Korean Drama":
            try: 
                result_info["title"] = result.setdefault("title", "N/A")
                result_info["episodes"] = result.setdefault("episodes", "N/A")
                result_info["released_at"] = result.setdefault("released_at", "N/A")
                result_info["url"] = result.setdefault("url", "N/A")
                result_info["thumbnail"] = result.setdefault("thumbnail", "N/A")
                korean_shows.append(result_info)
            except (KeyError, TypeError, ValueError):
                    return 103      
    if len(korean_shows) != 0:
        return(korean_shows)


def fetch(drama_url):
    """Get additional info of specific kdrama"""

    # Run Page Crawler
    try_counter = 0
    connection_error = True
    while try_counter < 3 and connection_error == True:
        response = crawl(drama_url)
        if response == 404:
            try_counter += 1
        else:
            connection_error = False


    # Parse response
    try:
        info_unparsed = response
        info_parsed = {}
        info_parsed["title"] = info_unparsed["data"].setdefault("title", "N/A")
        info_parsed["poster"] = info_unparsed["data"].setdefault("poster", "N/A")
        info_parsed["synopsis"] = info_unparsed["data"].setdefault("synopsis", "N/A")
        info_parsed["cast"] = info_unparsed["data"].setdefault("casts", "N/A")
        info_parsed["episodes"] = info_unparsed["data"]["details"].setdefault("episodes", "N/A")
        info_parsed["air_date"] = info_unparsed["data"]["details"].setdefault("aired", "N/A")
        if info_unparsed["data"]["details"]["aired"] == "N/A":
                    info_parsed["air_date"] = info_unparsed["data"]["details"].setdefault("airs", "N/A")
        info_parsed["aired_on"] = info_unparsed["data"]["details"].setdefault("aired_on", "N/A")
        if info_unparsed["data"]["details"]["aired_on"] == "N/A":
            info_parsed["aired_on"] = info_unparsed["data"]["details"].setdefault("airs_on", "N/A")
        info_parsed["network"] = info_unparsed["data"]["details"].setdefault("original_network", "N/A")
        info_parsed["airing_time"] = info_unparsed["data"].setdefault("airing_time", "N/A")
        info_parsed["duration"] = info_unparsed["data"].setdefault("duration", "60")
        info_parsed["genres"] = info_unparsed["data"]["others"].setdefault("genres", "N/A")
        info_parsed["url"] = info_unparsed["data"].setdefault("url", "N/A")
        print(info_parsed)
        return info_parsed
    except (KeyError, TypeError, ValueError):
        return 104

def check_url(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response
    except requests.RequestException:
        return 102
