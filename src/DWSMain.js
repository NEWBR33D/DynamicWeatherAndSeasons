"use strict";
/*
 * DynamicWeatherAndSeasons v1.0.2
 * MIT License
 * Copyright (c) 2024 PreyToLive
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigTypes_1 = require("@spt/models/enums/ConfigTypes");
const DWSEnumLogger_1 = require("../enums/DWSEnumLogger");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const package_json_1 = __importDefault(require("../package.json"));
class DWSMain {
    logger;
    weatherCallbacks;
    preSptLoad(container) {
        this.logger = container.resolve("WinstonLogger");
        this.weatherCallbacks = container.resolve("WeatherCallbacks");
        const staticRouterModService = container.resolve("StaticRouterModService");
        const modName = `${package_json_1.default.author}-${package_json_1.default.name}-v${package_json_1.default.version}`;
        const profilePath = path.resolve(path.dirname(__filename), "../db/profile.json");
        const configPath = path.resolve(path.dirname(__filename), "../config/config.json");
        const weatherPath = path.resolve(path.dirname(__filename), "../db/weather.json");
        const readJsonFile = (filePath) => {
            try {
                return JSON.parse(fs.readFileSync(filePath, "utf-8"));
            }
            catch (error) {
                this.logger.error(`Failed to read or parse file at ${filePath}: ${error}`);
                return null;
            }
        };
        staticRouterModService.registerStaticRouter(`[${package_json_1.default.name}] /client/items`, [
            {
                url: "/client/items",
                action: (url, info, sessionID, output) => {
                    try {
                        const sptConfigsWeather = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.WEATHER);
                        const dbConfig = readJsonFile(configPath);
                        const dbProfile = readJsonFile(profilePath);
                        const dbWeather = readJsonFile(weatherPath);
                        if (dbConfig.modEnabled) {
                            // START UPDATE PROFILE
                            let profileDay = dbProfile.date.day;
                            let profileMonth = dbProfile.date.month;
                            let profileYear = dbProfile.date.year;
                            let profileSeason = dbProfile.season;
                            const monthDurationInRaids = dbConfig.monthDurationInRaids;
                            const monthIndices = {
                                january: 1,
                                february: 2,
                                march: 3,
                                april: 4,
                                may: 5,
                                june: 6,
                                july: 7,
                                august: 8,
                                september: 9,
                                october: 10,
                                november: 11,
                                december: 12
                            };
                            profileDay++;
                            const monthIndex = monthIndices[profileMonth] || 1;
                            const nextMonthIndex = monthIndex === 12 ? 1 : monthIndex + 1;
                            if (profileDay > monthDurationInRaids) {
                                profileDay = 1;
                                profileMonth = Object.keys(monthIndices).find(key => monthIndices[key] === nextMonthIndex) || "january";
                                if (nextMonthIndex === 1) {
                                    profileYear++;
                                }
                            }
                            if (dbConfig.randomMonthEachRaid) {
                                const randomMonthIndex = Math.floor(Math.random() * 12) + 1;
                                profileMonth = Object.keys(monthIndices).find(key => monthIndices[key] === randomMonthIndex);
                            }
                            profileSeason = dbConfig.months[profileMonth];
                            // START UPDATE WEATHER AND SEASONS
                            const weatherSelections = {};
                            for (const [key, value] of Object.entries(dbConfig.seasons[profileSeason].weather)) {
                                if (Array.isArray(value) && value.length > 0) {
                                    const selectedValue = value[Math.floor(Math.random() * value.length)];
                                    if (typeof selectedValue === "number") {
                                        weatherSelections[key] = selectedValue;
                                    }
                                }
                            }
                            const { clouds, rain, wind, fog, temp, pressure } = weatherSelections;
                            // CLOUDS
                            const cloudsProfileDesc = [
                                "clear sky",
                                "partly cloudy",
                                "mostly cloudy",
                                "overcast with scattered clouds",
                                "completely overcast with thick clouds"
                            ];
                            const cloudsProfile = cloudsProfileDesc[clouds];
                            sptConfigsWeather.weather.clouds = dbWeather.clouds[clouds];
                            // RAIN
                            const rainProfileDesc = [
                                "no rain",
                                "light rain",
                                "moderate rain",
                                "heavy rain",
                                "intense rain"
                            ];
                            let rainProfile;
                            if (clouds === 0) {
                                rainProfile = rainProfileDesc[0];
                                sptConfigsWeather.weather.rain = dbWeather.rain[0];
                                sptConfigsWeather.weather.rainIntensity = dbWeather.rainIntensity[0];
                            }
                            else {
                                rainProfile = rainProfileDesc[rain];
                                sptConfigsWeather.weather.rain = dbWeather.rain[rain];
                                sptConfigsWeather.weather.rainIntensity = dbWeather.rainIntensity[rain];
                            }
                            // WIND
                            const windProfileDesc = [
                                "calm",
                                "gentle breeze",
                                "moderate breeze",
                                "strong wind",
                                "stormy wind"
                            ];
                            const windProfile = windProfileDesc[wind];
                            sptConfigsWeather.weather.windSpeed = dbWeather.windSpeed[wind];
                            sptConfigsWeather.weather.windGustiness = dbWeather.windGustiness[wind];
                            const seasonIndices = {
                                "spring": 1,
                                "summer": 2,
                                "autumn": 3,
                                "winter": 4
                            };
                            const seasonIndex = seasonIndices[profileSeason] || 0;
                            sptConfigsWeather.weather.windDirection = dbWeather.windDirection[seasonIndex];
                            // FOG
                            const fogProfileDesc = [
                                "no fog",
                                "light fog",
                                "moderate fog",
                                "dense fog",
                                "thick fog"
                            ];
                            const fogProfile = fogProfileDesc[fog];
                            sptConfigsWeather.weather.fog = dbWeather.fog[fog];
                            // TEMP
                            const tempProfileDesc = [
                                "very cold",
                                "cold",
                                "mild",
                                "warm",
                                "hot"
                            ];
                            const tempProfile = tempProfileDesc[temp];
                            sptConfigsWeather.weather.temp = dbWeather.temp[temp];
                            // PRESSURE
                            const pressureProfileDesc = [
                                "very low pressure",
                                "low pressure",
                                "normal pressure",
                                "high pressure",
                                "very high pressure"
                            ];
                            const pressureProfile = pressureProfileDesc[pressure];
                            sptConfigsWeather.weather.pressure = dbWeather.pressure[pressure];
                            // SEASON
                            let seasonOverrideValue;
                            if (profileSeason === "spring") {
                                seasonOverrideValue = 3;
                            }
                            else if (profileSeason === "summer") {
                                if (clouds >= 3 && rain >= 3) {
                                    seasonOverrideValue = 4;
                                }
                                else {
                                    seasonOverrideValue = 0;
                                }
                            }
                            else if (profileSeason === "autumn") {
                                seasonOverrideValue = 1;
                            }
                            else if (profileSeason === "winter") {
                                seasonOverrideValue = 2;
                            }
                            else {
                                seasonOverrideValue = Math.floor(Math.random() * 4);
                            }
                            sptConfigsWeather.overrideSeason = seasonOverrideValue;
                            for (const seasonData of sptConfigsWeather.seasonDates) {
                                seasonData.seasonType = seasonOverrideValue;
                                seasonData.startDay = 1;
                                seasonData.startMonth = monthIndex.toString();
                                seasonData.endDay = 31;
                                seasonData.endMonth = 12;
                            }
                            // END UPDATE WEATHER AND SEASONS
                            const newProfileData = {
                                mod: modName,
                                date: {
                                    day: profileDay,
                                    month: profileMonth,
                                    year: profileYear
                                },
                                season: profileSeason,
                                weather: {
                                    clouds: cloudsProfile,
                                    rain: rainProfile,
                                    wind: windProfile,
                                    fog: fogProfile,
                                    temp: tempProfile,
                                    pressure: pressureProfile
                                }
                            };
                            fs.writeFileSync(profilePath, JSON.stringify(newProfileData, null, 4));
                            // END UPDATE PROFILE
                            if (dbConfig.consoleLogs) {
                                this.logger.log(`Mod: ${package_json_1.default.name}: console logs`, DWSEnumLogger_1.LoggerTypes.INFO);
                                this.logger.log(`season: ${profileSeason}`, DWSEnumLogger_1.LoggerTypes.INFO);
                                this.logger.log(`weather: clouds: ${clouds}: ${cloudsProfile}`, DWSEnumLogger_1.LoggerTypes.INFO);
                                this.logger.log(`weather: rain: ${rain}: ${rainProfile}`, DWSEnumLogger_1.LoggerTypes.INFO);
                                this.logger.log(`weather: wind: ${wind}: ${windProfile}`, DWSEnumLogger_1.LoggerTypes.INFO);
                                this.logger.log(`weather: fog: ${fog}: ${fogProfile}`, DWSEnumLogger_1.LoggerTypes.INFO);
                                this.logger.log(`weather: temp: ${temp}: ${tempProfile}`, DWSEnumLogger_1.LoggerTypes.INFO);
                                this.logger.log(`weather: pressure: ${pressure}: ${pressureProfile}`, DWSEnumLogger_1.LoggerTypes.INFO);
                            }
                        }
                    }
                    catch (err) {
                        this.logger.error(`Error in [${package_json_1.default.name}] /client/items: ${err.message}`);
                    }
                    return output;
                }
            }
        ], `[${package_json_1.default.name}] /client/items`);
        staticRouterModService.registerStaticRouter(`[${package_json_1.default.name}] /client/weather`, [
            {
                url: "/client/weather",
                action: (url, info, sessionID) => {
                    //this.logger.log(JSON.stringify(this.weatherCallbacks.getWeather(url, info, sessionID), null, 4), "green");
                    return this.weatherCallbacks.getWeather(url, info, sessionID);
                }
            }
        ], `[${package_json_1.default.name}] /client/weather`);
    }
    postDBLoad(container) {
        const sptConfigsWeather = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.WEATHER);
        for (const seasonData of sptConfigsWeather.seasonDates) {
            seasonData.seasonType = 0;
            seasonData.startDay = 1;
            seasonData.startMonth = 1;
            seasonData.endDay = 31;
            seasonData.endMonth = 12;
        }
        /*
        LIGHT RAIN
            clouds >= -0.699
            wind <= 1.0
            1.0 <= rain <= 3.0
        RAIN
            wind <= 1.0
            rain > 3.0
        CLEAR
            clouds < -0.4
            wind <= 1.0
            rain < 2.0
            fog <= 0.004
        CLEAR WIND
            clouds < -0.4
            wind > 1.0
            rain < 2.0
            fog <= 0.004
        PARTLY CLOUDY
            -0.699 <= clouds <= -0.400
            wind <= 1.0
            rain < 2.0
            fog <= 0.004
        CLEAR FOG
            clouds < -0.4
            0.004 < fog < 0.100
        FOG
            fog >= 0.100
        CLOUD FOG
            -0.400 <= clouds <= 0.699
            fog > 0.004
        MOSTLY CLOUDY
            -0.400 <= clouds <= 0.699
            rain <= 1.0
        FULL CLOUD
            0.699 <= clouds <= 1.000
            rain <= 1.0
        THUNDER CLOUD
            clouds >= 1.0
            rain <= 1.0
        CLOUD WIND
            clouds >= 0.0
            wind >= 2.0
            rain <= 1.0
        CLOUD WIND RAIN
            wind >= 2.0
            rain >= 2.0
        WIND DIRECTION
            East = 1,
            North = 2,
            West = 3,
            South = 4,
            SE = 5,
            SW = 6,
            NW = 7,
            NE = 8,
        */
    }
}
module.exports = { mod: new DWSMain() };
