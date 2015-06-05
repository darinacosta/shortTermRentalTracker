#!/usr/bin/env node
var rs = require('./../modules/rentalScraper.js'),
    listingInfoScraper = require('./../modules/listingInfoScraper.js'),
    userProfileScraper = require('./../modules/userProfileScraper.js'),
    Q = require("q");

rs.fetchListings() /*.then(function(res){
	console.log('All tasks complete.')
})*/