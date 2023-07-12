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
    quarter = int(now_local.month / 3 ) + (now_local.month % 3 > 0)
    return quarter

def year_now():
    return now_local.year

def quarter_next1():
    current_quarter = quarter_now()
    if ((current_quarter + 1) > 4):
        quarter1 = 1
    else: 
        quarter1 = current_quarter + 1
    return quarter1
 

def quarter_next2():
    current_quarter = quarter_now()
    if ((current_quarter + 2) > 4):
        quarter2 = (current_quarter + 2) % 4
    else: 
        quarter2 = current_quarter + 2
    return quarter2

def quarter_prev1():
    current_quarter = quarter_now()
    if ((current_quarter - 1) < 1):
        quarter1 = 4
    else: 
        quarter1 = quarter_now() - 1 
    return quarter1
 

def quarter_prev2():
    current_quarter = quarter_now()
    if ((current_quarter - 2) < 1):
        quarter2 = (current_quarter - 2) + 4
    else: 
        quarter2 = quarter_now() - 2
    return quarter2

def year_next():
    return int(now_local.year + 1)

def year_prev():
    return int(now_local.year - 1)

