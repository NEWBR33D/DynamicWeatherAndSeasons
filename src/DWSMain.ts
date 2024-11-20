/*
 * DynamicWeatherAndSeasons v1.0.1
 * MIT License
 * Copyright (c) 2024 PreyToLive
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/brace-style */

import { DependencyContainer } from "tsyringe";
import { WeatherCallbacks } from "@spt/callbacks/WeatherCallbacks";
import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { IEmptyRequestData } from "@spt/models/eft/common/IEmptyRequestData";
import { IWeatherConfig } from "@spt/models/spt/config/IWeatherConfig";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import { LoggerTypes } from "../enums/DWSEnumLogger";
import * as path from "path";
import * as fs from "fs";
import pkg from "../package.json";

class DWSMain implements IPostSptLoadMod {
    private logger: ILogger;
    private weatherCallbacks: WeatherCallbacks;

    public preSptLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.weatherCallbacks = container.resolve<WeatherCallbacks>("WeatherCallbacks");

        const preSptModLoader = container.resolve<PreSptModLoader>("PreSptModLoader");
        const staticRouterModService: StaticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
        
        const modName = `${pkg.author}-${pkg.name}-v${pkg.version}`;
        const modPath = preSptModLoader.getModPath(path.basename(path.dirname(__dirname.split('/').pop())));

        // START UPDATE PROFILE
        const dbProfile = require("../db/profile.json");
        
        let profileDay = dbProfile.date.day;
        let profileMonth = dbProfile.date.month;
        let profileYear = dbProfile.date.year;
        let profileSeason = dbProfile.season;

        staticRouterModService.registerStaticRouter(
            `[${pkg.name}] /client/items`, 
            [
                {
                    url: "/client/items",
                    action: (url: string, info: any, sessionID: string, output: string): any => {
                        try {
                            const sptConfigsWeather: IWeatherConfig = container.resolve<ConfigServer>("ConfigServer").getConfig<IWeatherConfig>(ConfigTypes.WEATHER);

                            const dbConfig = require("../config/config.json");
                            const dbWeather = require("../db/weather.json");

                            if (dbConfig.modEnabled) {
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
                                }
                                
                                profileDay++;
                                if (profileDay > monthDurationInRaids) {
                                    const monthIndex = monthIndices[profileMonth] || 1;
                                    const nextMonthIndex = monthIndex === 12 ? 1 : monthIndex + 1;

                                    profileDay = 1;
                                    profileMonth = Object.keys(monthIndices).find(key => monthIndices[key] === nextMonthIndex) || "january";
                                    
                                    if (nextMonthIndex === 1) {
                                        profileYear++;
                                    }
                                }
                                if (dbConfig.randomMonthEachRaid) {
                                    const randomMonthIndex = Math.floor(Math.random() * 12) + 1
                                    profileMonth = Object.keys(monthIndices).find(key => monthIndices[key] === randomMonthIndex);
                                }
                                profileSeason = dbConfig.months[profileMonth];

                                // START UPDATE WEATHER AND SEASONS

                                const weatherSelections: Record<string, number> = {};
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
                                const cloudsProfileDesc: string[] = [
                                    "clear sky",
                                    "partly cloudy",
                                    "mostly cloudy",
                                    "overcast with scattered clouds",
                                    "completely overcast with thick clouds"
                                ];
                                const cloudsProfile = cloudsProfileDesc[clouds];
                                sptConfigsWeather.weather.clouds = dbWeather.clouds[clouds];

                                // RAIN
                                const rainProfileDesc: string[] = [
                                    "no rain",
                                    "light rain",
                                    "moderate rain",
                                    "heavy rain",
                                    "intense rain"
                                ];
                                let rainProfile: string;
                                if (clouds === 0) {
                                    rainProfile = rainProfileDesc[0];
                                    sptConfigsWeather.weather.rain = dbWeather.rain[0];
                                    sptConfigsWeather.weather.rainIntensity = dbWeather.rainIntensity[0];
                                } else {
                                    rainProfile = rainProfileDesc[rain];
                                    sptConfigsWeather.weather.rain = dbWeather.rain[rain];
                                    sptConfigsWeather.weather.rainIntensity = dbWeather.rainIntensity[rain];
                                }

                                // WIND
                                const windProfileDesc: string[] = [
                                    "calm",
                                    "gentle breeze",
                                    "moderate breeze",
                                    "strong wind",
                                    "stormy wind"
                                ];
                                const windProfile = windProfileDesc[wind];
                                sptConfigsWeather.weather.windSpeed = dbWeather.windSpeed[wind];
                                sptConfigsWeather.weather.windGustiness = dbWeather.windGustiness[wind];

                                const seasonIndices: Record<string, number> = {
                                    "spring": 1,
                                    "summer": 2,
                                    "autumn": 3,
                                    "winter": 4
                                };
                                const seasonIndex = seasonIndices[profileSeason] || 0;
                                sptConfigsWeather.weather.windDirection = dbWeather.windDirection[seasonIndex];

                                // FOG
                                const fogProfileDesc: string[] = [
                                    "no fog",
                                    "light fog",
                                    "moderate fog",
                                    "dense fog",
                                    "thick fog"
                                ];
                                const fogProfile = fogProfileDesc[fog];
                                sptConfigsWeather.weather.fog = dbWeather.fog[fog];

                                // TEMP
                                const tempProfileDesc: string[] = [
                                    "very cold",
                                    "cold",
                                    "mild",
                                    "warm",
                                    "hot"
                                ];
                                const tempProfile = tempProfileDesc[temp];
                                sptConfigsWeather.weather.temp = dbWeather.temp[temp];

                                // PRESSURE
                                const pressureProfileDesc: string[] = [
                                    "very low pressure",
                                    "low pressure",
                                    "normal pressure",
                                    "high pressure",
                                    "very high pressure"
                                ];
                                const pressureProfile = pressureProfileDesc[pressure];
                                sptConfigsWeather.weather.pressure = dbWeather.pressure[pressure];

                                // SEASON
                                let seasonOverrideValue: number;
                                if (profileSeason === "spring") {
                                    seasonOverrideValue = 3;
                                } else if (profileSeason === "summer") {
                                    if (clouds >= 3 && rain >= 3 ) {
                                        seasonOverrideValue = 4;
                                    } else {
                                        seasonOverrideValue = 0;
                                    }
                                } else if (profileSeason === "autumn") {
                                    seasonOverrideValue = 1;
                                } else if (profileSeason === "winter") {
                                    seasonOverrideValue = 2;
                                } else {
                                    seasonOverrideValue =  Math.floor(Math.random() * 4);
                                }
                                sptConfigsWeather.overrideSeason = seasonOverrideValue;

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
                                }

                                const profilePath = path.join(modPath, "db/profile.json");
                                fs.writeFileSync(profilePath, JSON.stringify(newProfileData, null, 4));

                                // END UPDATE PROFILE

                                if (dbConfig.consoleLogs) {
                                    this.logger.log(`Mod: ${pkg.name}: console logs`, LoggerTypes.INFO);
                                    this.logger.log(`season: ${profileSeason}`, LoggerTypes.INFO);
                                    this.logger.log(`weather: clouds: ${clouds}: ${cloudsProfile}`, LoggerTypes.INFO);
                                    this.logger.log(`weather: rain: ${rain}: ${rainProfile}`, LoggerTypes.INFO);
                                    this.logger.log(`weather: wind: ${wind}: ${windProfile}`, LoggerTypes.INFO);
                                    this.logger.log(`weather: fog: ${fog}: ${fogProfile}`, LoggerTypes.INFO);
                                    this.logger.log(`weather: temp: ${temp}: ${tempProfile}`, LoggerTypes.INFO);
                                    this.logger.log(`weather: pressure: ${pressure}: ${pressureProfile}`, LoggerTypes.INFO);
                                }
                            }
                        } catch (err) {
                            this.logger.error(`Error in [${pkg.name}] /client/items: ${err.message}`);
                        }
                        return output;
                    }
                }
            ],
            `[${pkg.name}] /client/items`
        );

        staticRouterModService.registerStaticRouter(
            `[${pkg.name}] /client/weather`, 
            [
                {
                    url: "/client/weather",
                    action: (url: string, info: IEmptyRequestData, sessionID: string): any => {
                        //this.logger.log(JSON.stringify(this.weatherCallbacks.getWeather(url, info, sessionID), null, 4), "green");
                        return this.weatherCallbacks.getWeather(url, info, sessionID);
                    }
                }
            ],
            `[${pkg.name}] /client/weather`
        );
    }

    public postSptLoad(container: DependencyContainer): void {
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
