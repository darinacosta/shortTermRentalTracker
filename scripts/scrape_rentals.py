#!/usr/bin/python
import datetime
import sys
import rental_scraper as scraper

log = open('log.txt', 'w') 
timestamp = datetime.datetime.utcnow()

rs = scraper.RentalScraper()

try:
  rs.write_geojson_to_file()
  log.write(str(timestamp) + '\n SUCCESS')
except:
  e = sys.exc_info()[0]
  log.write(str(timestamp) + '\n' + str(e))



 

