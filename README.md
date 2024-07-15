# **PreyToLive-DynamicWeatherAndSeasons v1.0.1**

Developed by: [NEWBR33D](https://github.com/NEWBR33D) (aka [PreyToLive](https://hub.sp-tarkov.com/user/24548-preytolive/))

[DynamicWeatherAndSeasons](https://github.com/NEWBR33D/DynamicWeatherAndSeasons/) is a mod that allows control over the weather and seasons for SPTarkov.

#### ***If you would like to support me and my work you can donate to me [here](https://ko-fi.com/preytolive). Thank you!***

## **Installation Instructions:**
1. Begin by downloading the "PreyToLive-DynamicWeatherAndSeasons-v1.0.1.zip" file from the provided link or the Github repository.
2. Extract the contents of the downloaded archive. You should now have a folder named "PreyToLive-DynamicWeatherAndSeasons" containing the mod files.
3. Navigate to the location of your SPTarkov folder on your computer.
4. Inside the SPTarkov folder, find the "user/mods/" directory.
5. Place the extracted folder containing the mod files into the 'mods' folder within your SPTarkov folder.

## **Setup Guide:**
1. Start by opening the config file located in the mods config folder.
2. Set a value for "monthDurationInRaids". Each raid counts as one day in a month.
3. Set a season (summer, autumn, winter, spring) for each month. Example given below.
```
    "randomMonthEachRaid": false,
    "monthDurationInRaids": 15,
    "months": {
        "january": "winter",
        "february": "spring",
        "march": "spring",
        "april": "spring",
        "may": "summer",
        "june": "summer",
        "july": "summer",
        "august": "summer",
        "september": "autumn",
        "october": "autumn",
        "november": "winter",
        "december": "winter"
    },

    e.g. Lets say your profile starts in July. The season generated in-raid will be Summer. To transition from Summer to Autumn you will need to have had a total of 30 raids to get through all of July (15) and August (15). Your 31st raid will transition to Autumn. To get to Winter you will need another 30 raids total and then another 45 after that to get to Spring.
```
4. Setting the "randomMonthEachRaid" to true will randomly select a season from the "months: {}". For a balanced probability of each season to be picked leave them as (3) spring, (3) summer, (3) autumn, and (3) winter. The probability of each season being randomly selected can be off-balanced too. Example given below.
```
    "randomMonthEachRaid": true,
    "monthDurationInRaids": 15,
    "months": {
        "january": "spring",
        "february": "spring",
        "march": "spring",
        "april": "spring",
        "may": "summer",
        "june": "summer",
        "july": "summer",
        "august": "summer",
        "september": "autumn",
        "october": "autumn",
        "november": "winter",
        "december": "winter"
    },

    e.g. Having (4) spring, (4) summer, (2) autumn, and (2) winter will increase the likeliness of spring/summer being randomly selected each raid.
```
5. Set the weather type for each season. Weather weights and min/max values can be found in "db/weather.json". (Do NOT edit or change the weather.json unless you know what you are doing.)
6. All DynamicWeatherAndSeasons profile information generated before each raid (for reference) can be found in the "db/profile.json". (Do NOT edit or change the profile.json unless you know what you are doing.)