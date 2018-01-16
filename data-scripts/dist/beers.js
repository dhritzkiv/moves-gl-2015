"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const assert = require("assert");
const minimist = require("minimist");
const moment = require("moment");
const simple_statistics_1 = require("simple-statistics");
const utils_1 = require("./utils");
class Checkin {
}
Checkin.from = (input) => {
    const checkin = new Checkin();
    checkin.beer_name = input.beer_name;
    checkin.brewery_name = input.brewery_name;
    checkin.brewery_country = input.brewery_country;
    checkin.brewery_city = input.brewery_city;
    checkin.brewery_state = input.brewery_state;
    checkin.beer_type = input.beer_type;
    checkin.venue_name = input.venue_name;
    checkin.venue_city = input.venue_city;
    checkin.venue_state = input.venue_state;
    checkin.venue_country = input.venue_country;
    checkin.purchase_venue = input.purchase_venue;
    checkin.checkin_url = input.checkin_url;
    checkin.serving_type = input.serving_type;
    checkin.beer_abv = parseFloat(input.beer_abv);
    checkin.beer_ibu = parseFloat(input.beer_ibu);
    checkin.venue_lat = parseFloat(input.venue_lat);
    checkin.venue_lng = parseFloat(input.venue_lng);
    checkin.rating_score = parseFloat(input.rating_score);
    checkin.created_at = new Date(input.created_at);
    if (input.checkin_url) {
        const match = input.checkin_url.match(/([0-9]+)$/);
        checkin.checkin_id = match && match[1];
    }
    if (input.beer_url) {
        const match = input.beer_url.match(/([0-9]+)$/);
        checkin.beer_id = match && match[1];
    }
    if (input.brewery_url) {
        const match = input.brewery_url.match(/([0-9]+)$/);
        checkin.brewery_id = match && match[1];
    }
    return checkin;
};
const args = minimist(process.argv.slice(2));
const { _: [inFile], year } = args;
assert.ok(inFile, "Missing input file argument. Pass JSON history from Untappd as input file");
const src = fs.readFileSync(inFile, "utf8");
const data = JSON.parse(src);
const checkins = data.map(raw => Checkin.from(raw));
const startYear = year || checkins[0].created_at.getFullYear();
const endYear = (year && year || checkins[checkins.length - 1].created_at.getFullYear()) + 1;
const startTime = new Date(startYear, 0, 1, 5, 0, 0);
const endTime = new Date(endYear, 0, 1, 5, 0, 0);
const daysInYear = ((endTime.getTime() - startTime.getTime()) / 1000 / 60 / 60 / 24);
const dayOfWeekMap = new utils_1.IncrementalMap();
const beersPerDayOfWeekMap = new utils_1.IncrementalMap();
const daysMap = new utils_1.IncrementalMap();
const weeksMap = new utils_1.IncrementalMap();
const monthsMap = new utils_1.IncrementalMap();
const brewMap = new utils_1.IncrementalMap();
const breweryMap = new utils_1.IncrementalMap();
const breweryCityMap = new utils_1.IncrementalMap();
const breweryStateMap = new utils_1.IncrementalMap();
const breweryCountryMap = new utils_1.IncrementalMap();
const breweryCityByBreweryMap = new utils_1.IncrementalMap();
const breweryStateByBreweryMap = new utils_1.IncrementalMap();
const breweryCountryByBreweryMap = new utils_1.IncrementalMap();
const styleMap = new utils_1.IncrementalMap();
const majorStyleMap = new utils_1.IncrementalMap();
const venueMap = new utils_1.IncrementalMap();
const venueCityMap = new utils_1.IncrementalMap();
const venueStateMap = new utils_1.IncrementalMap();
const venueCountryMap = new utils_1.IncrementalMap();
const purchaseVenueMap = new utils_1.IncrementalMap();
const servingTypeMap = new utils_1.IncrementalMap();
checkins
    .filter(({ created_at }) => created_at > startTime && created_at < endTime)
    .forEach(({ created_at, brewery_name, brewery_city, brewery_state, brewery_country, beer_name, beer_id, beer_type, venue_name, venue_city, venue_state, venue_country, purchase_venue, serving_type }) => {
    const dayOfWeekKey = moment(created_at).format("dddd");
    const dateKey = created_at.toISOString().slice(0, 10);
    const weekKey = moment(created_at).format("YYYY-w");
    const monthKey = new Date(created_at).getMonth();
    const brewKey = `${beer_name}|${beer_id}`;
    const majorStyleKey = beer_type.split(" - ")[0];
    beersPerDayOfWeekMap.increment(dayOfWeekKey);
    daysMap.increment(dateKey);
    weeksMap.increment(weekKey);
    monthsMap.increment(monthKey);
    brewMap.increment(brewKey);
    breweryMap.increment(brewery_name);
    breweryCityMap.increment(`${brewery_city}, ${brewery_state}`);
    if (breweryMap.get(brewery_name) === 1) {
        if (brewery_city) {
            breweryCityByBreweryMap.increment(`${brewery_city}, ${brewery_state}`);
        }
        if (brewery_state) {
            breweryStateByBreweryMap.increment(brewery_state);
        }
        if (brewery_country) {
            breweryCountryByBreweryMap.increment(brewery_country);
        }
    }
    if (brewery_state) {
        breweryStateMap.increment(brewery_state);
    }
    breweryCountryMap.increment(brewery_country);
    styleMap.increment(beer_type);
    majorStyleMap.increment(majorStyleKey);
    if (purchase_venue) {
        purchaseVenueMap.increment(purchase_venue);
    }
    if (serving_type) {
        servingTypeMap.increment(serving_type);
    }
    if (venue_name &&
        venue_name !== "Matter and Form" &&
        venue_name !== "WayHome") {
        venueMap.increment(`${venue_name}`);
        if (venue_city) {
            venueCityMap.increment(`${venue_city}, ${venue_state}`);
        }
        if (venue_state) {
            venueStateMap.increment(venue_state);
        }
        if (venue_country) {
            venueCountryMap.increment(venue_country);
        }
    }
});
const sortTotalDesc = ([, a], [, b]) => b - a;
const colonJoiner = arr => arr.join(": ");
const logEachInOrderedList = (item, index) => console.log(`${index + 1}. ${item.join(": ")}`);
const weeksSorted = Array.from(weeksMap).sort(sortTotalDesc);
const [greatestDay] = Array.from(daysMap).sort(sortTotalDesc);
const [greatestWeek] = weeksSorted;
const dryestWeek = weeksSorted[weeksSorted.length - 1];
const [greatestMonth, ...otherMonths] = Array.from(monthsMap).sort(sortTotalDesc);
const dryestMonth = otherMonths[otherMonths.length - 1];
console.log("\n");
console.log("Top 60 Beers");
Array.from(brewMap)
    .sort(sortTotalDesc)
    .slice(0, 60)
    .map(([name, val]) => [name.split("|")[0], val])
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 30 Breweries");
Array.from(breweryMap)
    .sort(sortTotalDesc)
    .slice(0, 30)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 30 Brewery Cities by Checkins");
Array.from(breweryCityMap)
    .sort(sortTotalDesc)
    .slice(0, 30)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 30 Brewery Cities by Brewery");
Array.from(breweryCityByBreweryMap)
    .sort(sortTotalDesc)
    .slice(0, 30)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 30 Brewery Regions by Checkins");
Array.from(breweryStateMap)
    .sort(sortTotalDesc)
    .slice(0, 30)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 30 Brewery Regions by Brewery");
Array.from(breweryStateByBreweryMap)
    .sort(sortTotalDesc)
    .slice(0, 30)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 20 Brewery Countries by Checkins");
Array.from(breweryCountryMap)
    .sort(sortTotalDesc)
    .slice(0, 20)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 20 Brewery Countries by Brewery");
Array.from(breweryCountryByBreweryMap)
    .sort(sortTotalDesc)
    .slice(0, 20)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 30 Styles");
Array.from(styleMap)
    .sort(sortTotalDesc)
    .slice(0, 30)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 20 Main Styles");
Array.from(majorStyleMap)
    .sort(sortTotalDesc)
    .slice(0, 20)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 20 Purchase Venues by Checkins");
Array.from(purchaseVenueMap)
    .sort(sortTotalDesc)
    .slice(0, 20)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 20 Venues by Checkins");
Array.from(venueMap)
    .sort(sortTotalDesc)
    .slice(0, 20)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 20 Serving Types by Checkins");
Array.from(servingTypeMap)
    .sort(sortTotalDesc)
    .slice(0, 20)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 10 Venue Cities by Checkins");
Array.from(venueCityMap)
    .sort(sortTotalDesc)
    .slice(0, 10)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 10 Venue Regions by Checkins");
Array.from(venueStateMap)
    .sort(sortTotalDesc)
    .slice(0, 10)
    .forEach(logEachInOrderedList);
console.log("\n");
console.log("Top 10 Venue Countries by Checkins");
Array.from(venueCountryMap)
    .sort(sortTotalDesc)
    .slice(0, 10)
    .forEach(logEachInOrderedList);
const weekToDate = (week) => moment(week, "YYYY-w").toDate();
console.log("\n");
console.log("Greatest Day: %s (%d)", ...greatestDay);
console.log("Greatest Week: %s (%d)", weekToDate(greatestWeek[0]).toDateString(), greatestWeek[1]); //todo: also implement as a rolling week
console.log("Dryest Week: %s (%d)", weekToDate(dryestWeek[0]).toDateString(), dryestWeek[1]);
console.log("Greatest Month: %s (%d)", moment().month(greatestMonth[0]).format("MMMM"), greatestMonth[1]);
console.log("Dryest Month: %s (%d)", moment().month(dryestMonth[0]).format("MMMM"), dryestMonth[1]);
const monthlyTotals = [];
for (let d = new Date(startTime); d <= endTime; d.setMonth(d.getMonth() + 1)) {
    const monthKey = d.getMonth();
    const value = monthsMap.get(monthKey) || 0;
    monthlyTotals.push(value);
}
const weeklyTotals = [];
for (let y = startYear; y <= endYear; y++) {
    for (let i = 1; i <= 53; i++) {
        weeklyTotals.push(weeksMap.get(`${y - i}`) || 0);
    }
}
const dailyTotals = [];
let streakDays = 0;
let streakBeers = 0;
let maxStreakBeers = 0;
let maxStreakDays = 0;
let drought = 0;
let maxDrought = 0;
for (let d = new Date(startTime); d <= endTime; d.setDate(d.getDate() + 1)) {
    if (d > new Date()) {
        break;
    }
    const dayOfWeekKey = moment(d).format("dddd");
    dayOfWeekMap.increment(dayOfWeekKey);
    const dateKey = d.toISOString().slice(0, 10);
    const value = daysMap.get(dateKey) || 0;
    if (!value) {
        streakBeers = 0;
        streakDays = 0;
        drought++;
    }
    else {
        drought = 0;
    }
    streakBeers += value;
    streakDays++;
    maxStreakBeers = Math.max(maxStreakBeers, streakBeers);
    maxStreakDays = Math.max(maxStreakDays, streakDays);
    maxDrought = Math.max(maxDrought, drought);
    dailyTotals.push(value);
}
console.log(JSON.stringify(dailyTotals));
console.log("\n");
console.log("Beers by Month");
Array.from(monthsMap)
    .forEach(entry => console.log(entry.join(": ")));
console.log("\n");
console.log("Beers by Day of Week");
Array.from(beersPerDayOfWeekMap)
    .sort(sortTotalDesc)
    .forEach(entry => console.log(entry.join(": ")));
console.log("\n");
console.log("Average beers per day of week");
Array.from(dayOfWeekMap)
    .map(([day, number]) => {
    const numberOfBeersForDay = beersPerDayOfWeekMap.get(day) || 0;
    return [day, numberOfBeersForDay / number];
})
    .sort(sortTotalDesc)
    .forEach(entry => console.log(entry.join(": ")));
console.log("\n");
console.log("Average beers per part of week");
Array.from(beersPerDayOfWeekMap)
    .reduce(([weekdays, weekends], [day, number]) => {
    const numberOfBeersForDay = beersPerDayOfWeekMap.get(day) || 0;
    const numberOfDays = dayOfWeekMap.get(day) || 0;
    const arr = ["Saturday", "Sunday"].includes(day) ? weekends : weekdays;
    arr[0] += numberOfBeersForDay;
    arr[1] += numberOfDays;
    return [weekdays, weekends];
}, [[0, 0], [0, 0]])
    .map(([a, b], index) => {
    return [index === 1 ? "Weekend" : "Weekday", a / b];
})
    .sort(sortTotalDesc)
    .forEach(entry => console.log(entry.join(": ")));
const daysWithoutABeer = dailyTotals.filter(total => !total);
const daysWithABeer = dailyTotals.filter(total => total > 0);
console.log("\n");
console.log("Total days recorded", dailyTotals.length);
console.log("Days without a beer:", daysWithoutABeer.length);
console.log("Days with a beer:", daysWithABeer.length);
console.log("Total beers:", simple_statistics_1.sum(daysWithABeer));
console.log("Beers I've had more than once:", [...brewMap.values()].filter(v => v > 1).length);
console.log("Beers I've had more than twice:", [...brewMap.values()].filter(v => v > 2).length);
console.log("Total unique beers:", brewMap.size);
console.log("Total unique breweries:", breweryMap.size);
console.log("Total unique venues:", venueMap.size);
console.log("\n");
console.log("Average daily beers (all days):", simple_statistics_1.sum(dailyTotals) / dailyTotals.length);
console.log("Average daily beers (non-dry days):", simple_statistics_1.sum(daysWithABeer) / daysWithABeer.length);
console.log("Median daily beers (all days):", simple_statistics_1.median(dailyTotals));
console.log("Median daily beers (non-dry days):", simple_statistics_1.median(daysWithABeer));
console.log("Mode daily beers:", simple_statistics_1.modeFast(dailyTotals));
console.log("Days with more beers than usual:", daysWithABeer.filter(total => total > simple_statistics_1.median(dailyTotals)).length);
console.log("Days with less beers than usual:", daysWithABeer.filter(total => total < simple_statistics_1.median(dailyTotals)).length);
console.log("\n");
console.log("Longest streak (beers):", maxStreakBeers);
console.log("Longest streak (days):", maxStreakDays);
console.log("Longest dry spell (days):", maxDrought);
//console.log("daily aggregates", dailyTotals);
//console.log("weekly totals", weeklyTotals);
//console.log("monthly totals", monthlyTotals);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvYmVlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5QkFBeUI7QUFDekIsaUNBQWlDO0FBQ2pDLHFDQUFxQztBQUNyQyxpQ0FBaUM7QUFDakMseURBQXdEO0FBQ3hELG1DQUF1QztBQXNDdkM7O0FBS1EsWUFBSSxHQUFHLENBQUMsS0FBaUIsRUFBVyxFQUFFO0lBQzVDLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7SUFFOUIsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO0lBQ3BDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztJQUMxQyxPQUFPLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDaEQsT0FBTyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0lBQzFDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztJQUM1QyxPQUFPLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7SUFDcEMsT0FBTyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0lBQ3RDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztJQUN0QyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7SUFDeEMsT0FBTyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0lBQzVDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztJQUM5QyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7SUFDeEMsT0FBTyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0lBQzFDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLEtB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