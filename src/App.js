import { useEffect, useState } from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

async function getWeather(location) {
  console.log("working");
  try {
    // 1) Getting location (geocoding)
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
    );
    const geoData = await geoRes.json();
    console.log(geoData);

    if (!geoData.results) throw new Error("Location not found");

    const { latitude, longitude, timezone, name, country_code } =
      geoData.results.at(0);
    console.log(`${name} ${convertToFlag(country_code)}`);

    // 2) Getting actual weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
    );
    const weatherData = await weatherRes.json();
    console.log(weatherData.daily);
  } catch (err) {
    console.error(err);
  }
}
// getWeather("london");
export default function App() {
  const [query, setQuery] = useState("");
  const [countryName, setCountryName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weatherData, setWeatherData] = useState([]);
  useEffect(
    function () {
      const controller = new AbortController();
      async function getWeather(location) {
        try {
          // 1) Getting location (geocoding)
          setLoading(true);
          let geoRes;
          try {
            geoRes = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
              { signal: controller.signal }
            );
          } catch (err) {
            if (!geoRes || !geoRes.ok)
              throw new Error("Connect to the internet");
          }
          const geoData = await geoRes.json();
          console.log(geoData);

          if (!geoData.results) throw new Error("Location not found");

          const { latitude, longitude, timezone, name, country_code } =
            geoData.results.at(0);
          setCountryName(name);
          setCountryCode(country_code);
          console.log(`${name} ${convertToFlag(country_code)}`);

          // 2) Getting actual weather
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
          );
          const weatherData = await weatherRes.json();
          setWeatherData(weatherData.daily);
          setLoading(false);
          setError("");
          console.log(weatherData.daily);
        } catch (err) {
          setError(err.message);
          setLoading(false);
          console.error(err);
        } finally {
        }
      }
      if (query.length < 2) {
        setWeatherData(null);
        setError("");
        return;
      }
      getWeather(query);
      return () => controller.abort();
    },
    [query]
  );
  return (
    <div className="app">
      <Logo /> <Search query={query} setQuery={setQuery} />
      {query && loading && <p className="loader">Loading...</p>}
      {query && !loading && weatherData && (
        <>
          {" "}
          <h2>
            Weather for {countryName} {convertToFlag(countryCode)}
          </h2>
          {weatherData && <Data weatherData={weatherData} />}
        </>
      )}
      {error && (
        <p className="loader" style={{ color: "red" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function Logo() {
  return <h1>CLASSY WEATHER</h1>;
}
function Search({ query, setQuery }) {
  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="SEARCH FOR LOCATION"
      ></input>
    </>
  );
}

function Data({ weatherData }) {
  const {
    temperature_2m_max: maxTempArr,
    temperature_2m_min: minTempArr,
    time: timeArr,
    weathercode: wcArr,
  } = weatherData;
  console.log(maxTempArr, minTempArr, timeArr, wcArr, weatherData);
  return (
    <div className="weather">
      {maxTempArr?.map((_, i) => (
        <Day
          key={i}
          minTemp={minTempArr[i]}
          maxTemp={maxTempArr[i]}
          time={timeArr[i]}
          weathercode={wcArr[i]}
        />
      ))}
    </div>
  );
}

function Day({ minTemp, maxTemp, time, weathercode }) {
  return (
    <div className="day">
      <span>{getWeatherIcon(weathercode)}</span>
      <h5>
        {formatDay(new Date()) === formatDay(time) ? "TODAY" : formatDay(time)}
      </h5>
      <h6>
        {minTemp.toFixed(0)}&deg; &mdash;
        <em> {maxTemp.toFixed(0)}&deg; </em>
      </h6>{" "}
    </div>
  );
}
