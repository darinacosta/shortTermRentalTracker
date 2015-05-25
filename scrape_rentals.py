import unirest
import json
from pprint import pprint

class GeometryHelper():
  def switch_lat_lng(self, latlng):
    lat = latlng[1]
    lng = latlng[0]
    return [lat, lng]

class RentalScraper():
  def __init__(self):
    self.geometry_helper = GeometryHelper()
    self.photo_page = open('images.html', 'w')
    self.rentals_geojson = open('rentals.json', 'w')
    self.geojson = { "type": "FeatureCollection",
      "features": []
    }

  def get_response_by_page(self, page_number):
    page_number = page_number
    nelatitude = 30.123749
    nelongitude = -89.868164
    swlatitude = 29.881137
    swlongitude = -90.557556
    response = unirest.get("https://zilyo.p.mashape.com/search?isinstantbook=false" + "&nelatitude=" + str(nelatitude) + "&nelongitude=" + str(nelongitude) + "&swlatitude=" + str(swlatitude) + "&swlongitude=" + str(swlongitude) + "&&provider=airbnb%2C+alwaysonvacation%2C+apartmentsapart%2C+bedycasa%2C+bookingpal%2C+citiesreference%2C+edomizil%2C+geronimo%2C+gloveler%2C+holidayvelvet%2C+homeaway%2C+homestay%2C+hostelworld%2C+housetrip%2C+interhome%2C+nflats%2C+roomorama%2C+stopsleepgo%2C+theotherhome%2C+travelmob%2C+vacationrentalpeople%2C+vaycayhero%2C+waytostay%2C+webchalet%2C+zaranga&" + "page=" + str(page_number),
      headers={
        "X-Mashape-Key": "9qRGPp2G8Pmsh63uQFNtIAesIx8cp1ZisvLjsnt2HhMqd6jGu7",
        "Accept": "application/json"
      }
    )
    result = response.body
    return result
  
  def iterate_through_all_pages(self, function):
    i = 1
    escape = 0
    while escape == 0:
      page_result = self.get_response_by_page(i)
      body_result = page_result['result']
      output = []
      print "Scanning page " + str(i) + "..."
      for ii in range(len(body_result)):
        function(body_result[ii])
      if len(page_result['ids']) < 1:
        print "Scan complete."
        escape = 1

  def get_complete_response(self):
    i = 1
    escape = 0
    results = []
    geometry_helper = self.geometry_helper
    while escape == 0:
      page_result = self.get_response_by_page(i)
      body_result = page_result['result']
      print "Scanning page " + str(i)
      for ii in range(len(body_result)):
        coords = geometry_helper.switch_lat_lng(body_result[ii]['latLng'])
        url = body_result[ii]['provider']['url']
        geofeature = self.return_geojson_feature(coords, url)
        results.append(geofeature)
        ii += 1
      i += 1
      if len(page_result['ids']) < 1:
        escape = 1
    return results

  def return_geojson_feature(self, coords, url):
    return {
      "type":"Feature",
      "geometry":{
        "type":"Point",
        "coordinates": coords
      },"properties":{
        "url": url
      }
    }
      
  def scrape_guest_images(self):
    results = self.results
    response = self.response
    photo_string = ''
    for i in range(len(results)):
      result_entries = results[i]['reviews']['entries']
      for ii in range(len(result_entries)):
        if not "defaults" in result_entries[ii]['picture']:
          photo_string += '<img src="' + result_entries[ii]['picture'] + '">'
    self.photo_page.write(photo_string)

  def write_geojson_to_file(self):
    self.geojson['features'] = self.get_complete_response()
    self.rentals_geojson.write(json.dumps(self.geojson))

rs = RentalScraper()
rs.write_geojson_to_file()
  
 

