"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const assert = require("assert");
const minimist = require("minimist");
const moment = require("moment");
const utils_1 = require("./utils");
const calculateStreaksForData = (data) => {
    let streakDays = 0;
    let streakActivities = 0;
    let drySpell = 0;
    let maxStreakDays = 0;
    let maxStreakActivities = 0;
    let maxDrySpell = 0;
    data
        .forEach(value => {
        if (value !== 0) {
            drySpell = 0;
            streakDays++;
            streakActivities += value;
        }
        else {
            drySpell++;
            streakDays = 0;
            streakActivities = 0;
        }
        maxStreakDays = Math.max(maxStreakDays, streakDays);
        maxStreakActivities = Math.max(maxStreakActivities, streakActivities);
        maxDrySpell = Math.max(maxDrySpell, drySpell);
    });
    return {
        maxStreakDays,
        maxStreakActivities,
        maxDrySpell
    };
};
const { _: [inFile] } = minimist(process.argv.slice(2));
assert(inFile, "input file not specified");
const rawJSON = fs.readFileSync(inFile, "utf8");
const checkins = JSON.parse(rawJSON, (key, val) => {
    if (key === "date") {
        val = new Date(val);
    }
    return val;
});
const dailyCheckinCountsMap = new utils_1.IncrementalMap();
const dayOfWeekCountMap = new utils_1.IncrementalMap();
const monthCountMap = new utils_1.IncrementalMap();
const startTime = moment(checkins[0].date).startOf("day").startOf("year");
const endTime = moment(checkins[checkins.length - 1].date).startOf("day").endOf("year");
const daysInYear = 365; //endTime.diff(moment(startTime), "days");
for (let i = 0; i < 365; i++) {
    const day = moment(startTime).add(i, "days");
    const dayOfWeekKey = day.format("dddd");
    dayOfWeekCountMap.increment(dayOfWeekKey);
    dailyCheckinCountsMap.set(i + 1, 0);
}
const venuesMap = new utils_1.IncrementalMap();
const countriesCheckinsMap = new utils_1.IncrementalMap();
const countriesPlacesSet = new Set();
const citiesCheckinsMap = new utils_1.IncrementalMap();
const citiesPlacesSet = new Set();
const categoriesMap = new utils_1.IncrementalMap();
const coffeeShopsMap = new utils_1.IncrementalMap();
const burgerJointsMap = new utils_1.IncrementalMap();
const airportsMap = new utils_1.IncrementalMap();
const mexicanRestaurantsMap = new utils_1.IncrementalMap();
const sandwichPlacesMap = new utils_1.IncrementalMap();
const categoryUniquePlacesSet = new Set();
const categoryUniquePlacesByCitySet = new Set();
checkins.forEach(checkin => {
    const venueKey = `${checkin.venue_name} - ${checkin.venue_id}`;
    const dayOfYear = moment(checkin.date).dayOfYear();
    const monthKey = moment(checkin.date).format("MMMM");
    const cityKey = [checkin.venue_city, checkin.venue_state, checkin.venue_cc].filter(p => p).join(", ");
    const categories = checkin.venue_categories.map(cat => cat.toLowerCase());
    monthCountMap.increment(monthKey);
    dailyCheckinCountsMap.increment(dayOfYear);
    venuesMap.increment(venueKey);
    countriesCheckinsMap.increment(checkin.venue_cc);
    countriesPlacesSet.add(`${checkin.venue_cc}|${checkin.venue_name}`);
    if (checkin.venue_city) {
        citiesCheckinsMap.increment(cityKey);
        citiesPlacesSet.add(`${cityKey}|${checkin.venue_name}`);
        categories.forEach(category => categoryUniquePlacesByCitySet.add(`${category}|${cityKey}|${venueKey}`));
    }
    categories.forEach(category => categoriesMap.increment(category));
    categories.forEach(category => categoryUniquePlacesSet.add(`${category}|${venueKey}`));
    //Coffee
    const coffeeShopCategories = ["coffee shop", "café"];
    if (coffeeShopCategories.some(c => categories.includes(c))) {
        coffeeShopsMap.increment(venueKey);
    }
    else if (categories.includes("burger joint")) {
        burgerJointsMap.increment(venueKey);
    }
    else if (categories.includes("airport")) {
        airportsMap.increment(venueKey);
    }
    else if (categories.includes("mexican restaurant")) {
        mexicanRestaurantsMap.increment(venueKey);
    }
    else if (categories.includes("sandwich place")) {
        sandwichPlacesMap.increment(venueKey);
    }
});
const getCheckinsByDayOfWeek = (data) => {
    //create a new Map for holding values for each day of the week; fill it with empty data
    const days = new utils_1.IncrementalMap();
    data
        .map(({ date, venue_id }) => ({ day: date.getUTCDay(), venue_id }))
        .forEach(({ day }) => days.increment(day));
    return [...days];
};
const checkinsByDayOfWeekSorted = getCheckinsByDayOfWeek(checkins)
    .map(([day, value]) => [moment().day(day).format("dddd"), value])
    .sort(([, a], [, b]) => b - a);
console.log();
console.group("Stats");
console.log("Total checkins: %d", checkins.length);
console.log("Unique places: %d", venuesMap.size);
//console.log("Median checkins per day");
console.log("Places checked in more than once", [...venuesMap].filter(([name, count]) => count > 1).length);
console.log("Places checked in more than twice", [...venuesMap].filter(([name, count]) => count > 2).length);
console.log("Places checked in more than three times", [...venuesMap].filter(([name, count]) => count > 3).length);
console.log("Places checked in more than five times", [...venuesMap].filter(([name, count]) => count > 5).length);
console.log("Places checked in more than ten times", [...venuesMap].filter(([name, count]) => count > 10).length);
console.groupEnd();
console.log();
console.group("Checkins by day of week");
checkinsByDayOfWeekSorted
    .forEach(([day, val]) => console.log(`${day}: ${val}`));
console.groupEnd();
console.log();
console.group("Average checkins by day of week");
checkinsByDayOfWeekSorted
    .map(([day, val]) => [day, val / (dayOfWeekCountMap.get(day) || 1)])
    .forEach(([day, val]) => console.log(`${day}: ${val}`));
console.groupEnd();
console.log();
console.group("Checkins by month");
[...monthCountMap]
    .forEach(([month, val]) => console.log(`${month}: ${val}`));
console.groupEnd();
const { maxStreakDays, maxStreakActivities, maxDrySpell } = calculateStreaksForData([...dailyCheckinCountsMap.values()]);
console.log();
console.group("Streaks");
console.log("Longest dry spell: %d", maxDrySpell);
console.log("Longest streak: %d (days)", maxStreakDays);
console.log("Longest streak: %d (checkins)", maxStreakActivities);
console.groupEnd();
console.log();
console.log();
console.group("Top venues");
[...venuesMap]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 25)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
console.log();
console.group("Top countries (checkins)");
[...countriesCheckinsMap]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
console.log();
console.group("Top countries (places)");
[...[...countriesPlacesSet]
        .map(name => name.split("|")[0])
        .reduce((map, name) => map.increment(name), new utils_1.IncrementalMap())
]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
console.log();
console.group("Top cities (checkins)");
[...citiesCheckinsMap]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
console.log();
console.group("Top cities (places)");
[...[...citiesPlacesSet]
        .map(name => name.split("|")[0])
        .reduce((map, name) => map.increment(name), new utils_1.IncrementalMap())
]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
console.log();
console.group("Top categories");
[...categoriesMap]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 100)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
console.log();
console.group("Top coffee shops");
[...coffeeShopsMap]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
console.log();
console.group("Top burger places");
[...burgerJointsMap]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
console.log();
console.group("Top airports");
[...airportsMap]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
console.log();
console.group("Top mexican places");
[...mexicanRestaurantsMap]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
console.log();
console.group("Top sandwich places");
[...sandwichPlacesMap]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
const categoryUniquePlacesMap = new utils_1.IncrementalMap();
[...categoryUniquePlacesSet]
    .map(key => (key.match(/^([a-zA-Z0-9\s\-\_]+)|/) || [])[0])
    .filter(category => category)
    .forEach(category => categoryUniquePlacesMap.increment(category));
console.log();
console.group("Top unique categories");
[...categoryUniquePlacesMap]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .forEach(([key, val]) => console.log(`${key}: ${val}`));
console.groupEnd();
const categoryUniquePlacesByCityMap = new utils_1.IncrementalMap();
[...categoryUniquePlacesByCitySet]
    .map(key => key.split("|").slice(0, 2).join("|"))
    .filter(category => category)
    .forEach(category => categoryUniquePlacesByCityMap.increment(category));
console.log();
console.group("Top unique categories by city");
const categoriesByCityMap = [...categoryUniquePlacesByCityMap]
    .map(([tupleString, val]) => [tupleString.split("|"), val])
    .reduce((map, [[category, city], val]) => {
    const arr = map.get(city) || [];
    arr.push([category, val]);
    map.set(city, arr);
    return map;
}, new Map());
[...categoriesByCityMap]
    .sort(([a], [b]) => (citiesCheckinsMap.get(b) || 0) - (citiesCheckinsMap.get(a) || 0))
    .forEach(([city, arr]) => {
    console.group(city);
    arr
        .sort(([, a], [, b]) => b - a)
        .slice(0, 25)
        .forEach(([category, val]) => console.log(`${category}: ${val}`));
    console.groupEnd();
});
console.groupEnd();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm91cnNxdWFyZS1jaGVja2lucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9mb3Vyc3F1YXJlLWNoZWNraW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7QUFHYix5QkFBeUI7QUFDekIsaUNBQWlDO0FBQ2pDLHFDQUFxQztBQUNyQyxpQ0FBaUM7QUFDakMsbUNBQW1GO0FBRW5GLE1BQU0sdUJBQXVCLEdBQUcsQ0FBQyxJQUFjLEVBQUUsRUFBRTtJQUNsRCxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDbkIsSUFBSSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7SUFDekIsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztJQUN0QixJQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUM1QixJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7SUFFcEIsSUFBSTtTQUNILE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNoQixFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQ2IsVUFBVSxFQUFFLENBQUM7WUFDYixnQkFBZ0IsSUFBSSxLQUFLLENBQUM7UUFDM0IsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsUUFBUSxFQUFFLENBQUM7WUFDWCxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLENBQUM7UUFFRCxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDcEQsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3RFLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxRQUFRLENB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