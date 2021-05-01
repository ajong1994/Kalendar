import tzlocal
import datetime
import pytz
import time

# get local timezone
local_tz = tzlocal.get_localzone().zone

# get naive datetime in UTC and convert it to UTC aware datetime
now_utc = pytz.utc.localize(datetime.datetime.utcnow())

# convert UTC time to current time
now_local = now_utc.astimezone(pytz.timezone(local_tz))

def quarter_now():
    quarter = int(now_local.month / 4) + 1
    return quarter

def year_now():
    return now_local.year

