"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const assert = require("assert");
const minimist = require("minimist");
const moment = require("moment");
const utils_1 = require("./utils");
const simple_statistics_1 = require("simple-statistics");
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
const days = JSON.parse(rawJSON);
const dayOfWeekCountMap = new utils_1.IncrementalMap();
const monthlyStepCountByDaysMap = new Map();
const dayOfWeekStepCountMap = new utils_1.IncrementalMap();
const dailyStepCountMap = new utils_1.IncrementalMap();
const monthlyDistanceCountByDaysMap = new Map();
const dayOfWeekDistanceCountMap = new utils_1.IncrementalMap();
const dailyDistanceCountMap = new utils_1.IncrementalMap();
const monthlyDurationCountByDaysMap = new Map();
const dayOfWeekDurationCountMap = new utils_1.IncrementalMap();
const dailyDurationCountMap = new utils_1.IncrementalMap();
const monthlyCaloriesCountByDaysMap = new Map();
const dayOfWeekCaloriesCountMap = new utils_1.IncrementalMap();
const dailyCaloriesCountMap = new utils_1.IncrementalMap();
const startTime = moment(days[0].date).startOf("day").startOf("year");
const endTime = moment(days[days.length - 1].date).startOf("day").endOf("year");
const daysInYear = 365; //endTime.diff(moment(startTime), "days");
for (let i = 0; i < 365; i++) {
    const day = moment(startTime).add(i, "days");
    const dayOfWeekKey = day.format("dddd");
    dayOfWeekCountMap.increment(dayOfWeekKey);
}
days.forEach(day => {
    const date = moment(day.date);
    const dateKey = date.toISOString();
    const dayOfWeekKey = date.format("dddd");
    const monthKey = date.format("MMMM");
    day.summary.forEach(activity => {
        dailyStepCountMap.increment(dateKey, activity.steps);
        dayOfWeekStepCountMap.increment(dayOfWeekKey, activity.steps);
        dailyDistanceCountMap.increment(dateKey, activity.distance);
        dayOfWeekDistanceCountMap.increment(dayOfWeekKey, activity.distance);
        dailyDurationCountMap.increment(dateKey, activity.duration);
        dayOfWeekDurationCountMap.increment(dayOfWeekKey, activity.duration);
        dailyCaloriesCountMap.increment(dateKey, activity.calories);
        dayOfWeekCaloriesCountMap.increment(dayOfWeekKey, activity.calories);
    });
    const monthDaySteps = monthlyStepCountByDaysMap.get(monthKey) || [];
    const monthDayDistance = monthlyStepCountByDaysMap.get(monthKey) || [];
    const monthDayDuration = monthlyStepCountByDaysMap.get(monthKey) || [];
    const monthDayCalories = monthlyStepCountByDaysMap.get(monthKey) || [];
    monthDaySteps.push(day.summary.map(activity => activity.steps).reduce((a, b) => a + b, 0));
    monthDayDistance.push(day.summary.map(activity => activity.distance).reduce((a, b) => a + b, 0));
    monthDayDuration.push(day.summary.map(activity => activity.duration).reduce((a, b) => a + b, 0));
    monthDayCalories.push(day.summary.map(activity => activity.calories).reduce((a, b) => a + b, 0));
    monthlyStepCountByDaysMap.set(monthKey, monthDaySteps);
    monthlyDistanceCountByDaysMap.set(monthKey, monthDayDistance);
    monthlyDurationCountByDaysMap.set(monthKey, monthDayDuration);
    monthlyCaloriesCountByDaysMap.set(monthKey, monthDayCalories);
});
console.group("Stats");
console.log("Total recorded days: %d", dailyStepCountMap.size);
console.groupEnd();
console.group("Steps");
const daysRecorded = dailyStepCountMap.size;
const dailyStepCountValues = [...dailyStepCountMap.values()];
const averageDailyStepCount = simple_statistics_1.mean(dailyStepCountValues);
const medianDailyStepCount = simple_statistics_1.median(dailyStepCountValues);
console.log("Daily average step count: %d", averageDailyStepCount);
console.log("Estimated total step count: %d", averageDailyStepCount * 365);
console.log("Daily median step count: %d", medianDailyStepCount);
console.log("Daily max step count: %d", simple_statistics_1.max(dailyStepCountValues));
console.log("Days with less than 1000 steps", dailyStepCountValues.filter(v => v < 1000).length / daysRecorded * 365);
console.log("Days with less than 2000 steps", dailyStepCountValues.filter(v => v < 2000).length / daysRecorded * 365);
console.log("Days with less than 3000 steps", dailyStepCountValues.filter(v => v < 3000).length / daysRecorded * 365);
console.log("Days with more than 10000 steps", dailyStepCountValues.filter(v => v >= 10000).length / daysRecorded * 365);
console.groupEnd();
console.group("Distance");
const dailyDistanceCountValues = [...dailyDistanceCountMap.values()];
const averageDailyDistanceCount = simple_statistics_1.mean(dailyDistanceCountValues);
const medianDailyDistanceCount = simple_statistics_1.median(dailyDistanceCountValues);
console.log("Daily average distance: %dkm", averageDailyDistanceCount / 1000);
console.log("Estimated total distance: %dkm", averageDailyDistanceCount * 365 / 1000);
console.log("Daily median distance: %dkm", medianDailyDistanceCount / 1000);
console.log("Daily max distance: %dkm", simple_statistics_1.max(dailyDistanceCountValues) / 1000);
console.groupEnd();
console.group("Duration");
const dailyDurationCountValues = [...dailyDurationCountMap.values()];
const averageDailyDurationCount = simple_statistics_1.mean(dailyDurationCountValues);
const medianDailyDurationCount = simple_statistics_1.median(dailyDurationCountValues);
const secondsToHours = (seconds) => seconds / 60 / 60;
console.log("Daily average duration: %dhrs", secondsToHours(averageDailyDurationCount));
console.log("Estimated total duration: %dhrs", secondsToHours(averageDailyDurationCount) * 365);
console.log("Daily median duration: %dhrs", secondsToHours(medianDailyDurationCount));
console.log("Daily max duration: %dhrs", secondsToHours(simple_statistics_1.max(dailyDurationCountValues)));
console.groupEnd();
console.group("Calories");
const dailyCaloriesCountValues = [...dailyCaloriesCountMap.values()];
const averageDailyCaloriesCount = simple_statistics_1.mean(dailyCaloriesCountValues);
const medianDailyCaloriesCount = simple_statistics_1.median(dailyCaloriesCountValues);
console.log("Daily average calories: %d", averageDailyCaloriesCount);
console.log("Estimated total calories: %d", averageDailyCaloriesCount * 365);
console.log("Daily median calories: %d", medianDailyCaloriesCount);
console.log("Daily max calories: %d", simple_statistics_1.max(dailyCaloriesCountValues));
console.groupEnd();
console.log();
console.group("Average steps by day of week:");
[...dayOfWeekStepCountMap]
    .map(([day, val]) => [day, val / (dayOfWeekCountMap.get(day) || 1)])
    .forEach(([day, val]) => console.log(`${day}: ${val}`));
console.groupEnd();
const mapMonthDaysAveragesToFullMonths = ([month, days], index) => {
    const averageStepCount = simple_statistics_1.mean(days);
    const daysInMonth = moment().month(index).daysInMonth();
    const totalStepsInMonth = averageStepCount * daysInMonth;
    return [month, totalStepsInMonth];
};
console.log();
console.group("Steps by month:");
[...monthlyStepCountByDaysMap]
    .map(mapMonthDaysAveragesToFullMonths)
    .forEach(([month, val]) => console.log(`${month}: ${val}`));
console.groupEnd();
console.log();
console.group("Distance by month:");
[...monthlyDistanceCountByDaysMap]
    .map(mapMonthDaysAveragesToFullMonths)
    .forEach(([month, val]) => console.log(`${month}: ${val}`));
console.groupEnd();
console.log();
console.group("Duration by month:");
[...monthlyDurationCountByDaysMap]
    .map(mapMonthDaysAveragesToFullMonths)
    .forEach(([month, val]) => console.log(`${month}: ${val}`));
console.groupEnd();
console.log();
console.group("Calories by month:");
[...monthlyCaloriesCountByDaysMap]
    .map(mapMonthDaysAveragesToFullMonths)
    .forEach(([month, val]) => console.log(`${month}: ${val}`));
console.groupEnd();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa2luZy1kYXlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3dhbGtpbmctZGF5cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7O0FBR2IseUJBQXlCO0FBQ3pCLGlDQUFpQztBQUNqQyxxQ0FBcUM7QUFDckMsaUNBQWlDO0FBQ2pDLG1DQUFxRDtBQUNyRCx5REFBNkc7QUFFN0csTUFBTSx1QkFBdUIsR0FBRyxDQUFDLElBQWMsRUFBRSxFQUFFO0lBQ2xELElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztJQUNuQixJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztJQUN6QixJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDakIsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztJQUVwQixJQUFJO1NBQ0gsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2hCLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDYixVQUFVLEVBQUUsQ0FBQztZQUNiLGdCQUFnQixJQUFJLEtBQUssQ0FBQztRQUMzQixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxRQUFRLEVBQUUsQ0FBQztZQUNYLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDZixnQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFDdEIsQ0FBQztRQUVELGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNwRCxtQkFBbUIsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDdEUsV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FB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