import os
from dotenv import load_dotenv

load_dotenv()

GC_CLIENT_ID = os.getenv('GC_CLIENT_ID')
API_KEY = os.getenv('API_KEY')

print(GC_CLIENT_ID)
print(API_KEY)