import requests, json, re, time
from bs4 import BeautifulSoup
import cloudscraper
import sys
import re




# First part of scraper modified from shane-tw's own scraper: https://github.com/shane-tw/MyDramaList-Scraper-Parser
# The rest of the scraper is from TheBoringDude's vercel app code base: https://github.com/TheBoringDude/kuryana
def crawl(slug):
    drama_info = {}
    drama_info["synopsis"] = "N/A"
    drama_info["casts"] = []
    headers = {
            "Referer": "https://mydramalist.com",
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.123 Mobile Safari/537.36",
        }
    while True:
        try:
            scraper = cloudscraper.create_scraper()
            drama_page_resp = scraper.get(f"https://mydramalist.com{slug}", headers=headers)
            soup = BeautifulSoup(drama_page_resp.text, "html.parser") 
            break
        except:
            print("Request failed.")
            time.sleep(3)

    if drama_page_resp.status_code != 200:
        print("Drama page does not exist.")
        return 404

    # get the main html container for the each search results
    _img_attrs = ["src", "data-cfsrc", "data-src"]
    # get the main html container for the each search results
    container = soup.find("div", class_="app-body")

    def get_drama_poster(container) -> str:
        poster = container.find("img", class_="img-responsive")

        for i in _img_attrs:
            if poster.has_attr(i):
                return poster[i]

        # blank if none
        return ""

    # append scraped data
    # these are the most important drama infos / details
    drama_info["title"] = (
    container.find("h1", class_="film-title").find("a").get_text()
    )
    drama_info["poster"] = get_drama_poster(container)
    drama_info["synopsis"] = (
        container.find("div", class_="show-synopsis")
        .find("span")
        .get_text()
        .replace("\n", " ")
    )
    drama_info["casts"] = [
        i.find("a", class_="text-primary text-ellipsis")
        .find("b")
        .get_text()
        .strip()
        for i in container.find_all("li", class_="list-item col-sm-4")
    ]



    # get the drama details <= statistics section is added in here
    details = soup.find("ul", class_="list m-a-0 hidden-md-up")

    try:
        drama_info["details"] = {}
        all_details = details.find_all("li")

        for i in all_details:
            # get each li from <ul>
            _title = i.find("b").get_text().strip()

            # append each to sub object
            drama_info["details"][
                _title.replace(":", "").replace(" ", "_").lower()
            ] = (
                i.get_text().replace(_title + " ", "").strip()
            )  # remove leading and trailing white spaces

    except Exception:
        # do nothing, if there was a problem
        pass

    # get other info
    others = soup.find("div", class_="show-detailsxss").find(
        "ul", class_="list m-a-0"
    )

    try:
        drama_info["others"] = {}
        all_others = others.find_all("li")
        for i in all_others:
            # get each li from <ul>
            _title = i.find("b").get_text().strip()
            drama_info["others"][
                _title.replace(":", "").replace(" ", "_").lower()
            ] = (
                i.get_text().replace(_title + " ", "").replace("(Vote or add tags)","").strip()
            )  # remove leading and trailing white spaces

    except Exception:
        # there was a problem while trying to parse
        # the :> other info section
        pass


    # get upcoming episode data
    try:
        release = soup.find(string=re.compile("nextEpisodeAiring")).replace(";","").replace("var","").replace("nextEpisodeAiring = ","").strip()
        drama_info["airing_time"] = json.loads(release)["released_at"]
        drama_info["duration"] = json.loads(release)["duration"]
    except AttributeError:
        print("Air time has passed.")
        pass
    except TypeError:
        print("Air time has not yet been declared.")
        pass

    # finally, add input slug as drama url for id purposes
    drama_info["url"] = slug

    drama_json = {"data": drama_info}

    return drama_json

