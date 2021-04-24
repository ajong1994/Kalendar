import os
import requests
import urllib.parse

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
    try:
        url = f"https://kuryana.vercel.app/seasonal/{year}/{quarter}"
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException:
        return None

    # Parse response
    korean_shows = []
    korean_count = 0
    temp_count = 0
    try:
        results = response.json()
        for result in results:
            result_info = {}
            if result["content_type"] == "Korean Drama":
                try: 
                    result_info["title"] = result.setdefault("title", "N/A")
                    result_info["episodes"] = result.setdefault("episodes", "N/A")
                    result_info["type"] = result.setdefault("type", "N/A")
                    result_info["synopsis"] = result.setdefault("synopsis", "N/A")
                    result_info["released_at"] = result.setdefault("released_at", "N/A")
                    result_info["url"] = result.setdefault("url", "N/A")
                    result_info["genres"] = result.setdefault("genres", "N/A")
                    result_info["thumbnail"] = result.setdefault("thumbnail", "N/A")
                    korean_shows.append(result_info)
                    temp_count += 1
                except:
                    return None      
    except (KeyError, TypeError, ValueError):
        return None
    
    if len(korean_shows) != 0:
        return(korean_shows)


def fetch(drama_url):
    """Get additional info of specific kdrama"""

    # Contact API
    try_counter = 0
    connection_error = True
    while try_counter < 500 and connection_error == True:
        try:
            url = f"https://kuryana.vercel.app/id{drama_url}"
            response = requests.get(url)
            response.raise_for_status()
            connection_error = False
        except requests.RequestException:
            try_counter += 1
            return None

    # Parse response
    try:
        info = response.json()
        return {
            "title": info["data"].setdefault("title", "N/A"),
            "rating": info["data"].setdefault("rating", "N/A"),
            "poster": info["data"].setdefault("poster", "N/A"),
            "synopsis": info["data"].setdefault("synopsis", "N/A"),
            "cast": info["data"].setdefault("casts", "N/A"),
            "episodes": info["data"]["details"].setdefault("episodes", "N/A"),
            "start_date": info["data"]["details"].setdefault("aired", "N/A").split("-")[0],
            "end_date": info["data"]["details"].setdefault("aired", "N/A").split("-")[1],
            "aired_on": info["data"]["details"].setdefault("aired_on", "N/A"),
            "network": info["data"]["details"].setdefault("original_network", "N/A")
        }
    except (KeyError, TypeError, ValueError):
        print("error")
        return None
