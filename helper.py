import os
import requests
import urllib.parse
import cloudscraper

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
                    result_info["title"] = result.setdefault("title", "None")
                    result_info["episodes"] = result.setdefault("episodes", "None")
                    result_info["type"] = result.setdefault("type", "None")
                    result_info["synopsis"] = result.setdefault("synopsis", "None")
                    result_info["released_at"] = result.setdefault("released_at", "None")
                    result_info["url"] = result.setdefault("url", "None")
                    result_info["genres"] = result.setdefault("genres", "None")
                    result_info["thumbnail"] = result.setdefault("thumbnail", "None")
                    korean_shows.append(result_info)
                    temp_count += 1
                except:
                    return None      
    except (KeyError, TypeError, ValueError):
        return None
    
    if len(korean_shows) != 0:
        return(korean_shows)


def fetch_drama(drama_url):
    """Get additional info of specific kdrama"""

    # Contact API
    try:
        url = f"https://kuryana.vercel.app/id{drama_url}"
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException:
        return None

    # Parse response
    try:
        info = response.json()
    except (KeyError, TypeError, ValueError):
        return None

