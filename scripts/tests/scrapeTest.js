cheerio = require("cheerio")
rs = require('../modules/rentalScraper.js')
var feature = {properties:{user:"test",url:"http://www.homeaway.com/vacation-rental/p569754vb", provider:"hma3454v"}}
rs._scrapeListing(feature, function(){console.log(feature)})
