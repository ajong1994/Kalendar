import os
from dotenv import load_dotenv

load_dotenv()

GC_CLIENT_ID1 = os.getenv('GC_CLIENT_ID1')
GC_CLIENT_ID2 = os.getenv('GC_CLIENT_ID2')
API_KEY = os.getenv('API_KEY')

print(GC_CLIENT_ID1)
print(GC_CLIENT_ID2)
print(API_KEY)