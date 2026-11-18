# DataVis_5 – Hospitalised Road Traffic Injuries in Australia (2011–2021)

COS30045 Data Visualisation, Group 5. An interactive data story built with D3.js (v7).

## Folder structure
```
index.html              Page structure and story text
css/style.css           All styles (light theme)
js/utils.js             Shared helpers: number formats, colours, tooltip, toggles
js/q1-trend.js          Q1 – national trend (annotated line chart)
js/q2-road-users.js     Q2 – change by road user (diverging bars, count/share toggle)
js/q3-states.js         Q3 – states and territories (small multiples)
js/q4-age-sex.js        Q4 – age and sex (population pyramid, year switch)
js/q5-first-nations.js  Q5 – First Nations Peoples (line chart and share bars)
js/main.js              Loads the CSV files and draws every chart
data/                   Processed CSV files exported from KNIME
design/                 Wireframe and storyboard
```

## Data files
| File | Columns | Used by |
|---|---|---|
| q1_national_trend.csv | year, hospitalisations, count_of_cases, died_cases | Q1 |
| q2_road_users.csv | year, road_user, hospitalisations, share_percent | Q2 |
| q3_states.csv | year, state, hospitalisations | Q3 |
| q4_age_sex.csv | year, age_group, sex, hospitalisations | Q4 |
| q5_first_nations_trend.csv | year, hospitalisations | Q5 |
| q5_road_user_shares.csv | year, group, road_user, hospitalisations, share_percent, not_published | Q5 |

Source: BITRE Hospitalised Injury, September 2023 release (raw worksheets), filtered to road vehicle traffic accidents and aggregated in KNIME.

## Run locally
Open the project folder in VS Code, right-click `index.html` and choose **Open with Live Server**.
The CSV files only load through a server, so opening `index.html` directly will not show the charts.

## Deploy
Static site: import the GitHub repository into Vercel with the framework preset **Other**. No build step is needed.
