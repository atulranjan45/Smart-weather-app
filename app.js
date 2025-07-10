const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Let robot understand form words
app.use(express.urlencoded({ extended: true }));

// Let robot serve the form
app.use(express.static('public'));

// Show the form first
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/autocomplete', async (req, res) => {
  const query = req.query.q;
  const key = process.env.WEATHER_API_KEY;

  try {
    const result = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${key}`);
    const cities = result.data.map(c => ({
      name: c.name,
      country: c.country
    }));

    res.json(cities);
  } catch (err) {
    console.error('Autocomplete error:', err.message);
    res.json([]);
  }
});


// When you submit the city
app.post('/weather', async (req, res) => {
  const city = req.body.city;
  const key = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=metric`;

  try {
    const response = await axios.get(url);
    const weather = response.data;

    // 🧠 Mood-Based Advice Logic
let moodAdvice = '';
const temp = weather.main.temp;
const condition = weather.weather[0].main.toLowerCase();

let weatherClass = 'default';

if (condition.includes('clear')) {
  weatherClass = 'clear';
} else if (condition.includes('rain')) {
  weatherClass = 'rain';
} else if (condition.includes('cloud')) {
  weatherClass = 'clouds';
} else if (condition.includes('snow')) {
  weatherClass = 'snow';
} else if (condition.includes('mist') || condition.includes('fog')) {
  weatherClass = 'fog';
}

if (temp > 32) {
  moodAdvice = "☀️ It's quite hot! Stay indoors and drink lots of water.";
} else if (temp > 20 && temp <= 32 && condition.includes('clear')) {
  moodAdvice = "🌤️ Perfect weather for a walk or a hangout!";
} else if (condition.includes('rain')) {
  moodAdvice = "🌧️ Cozy up with a book and a cup of tea – it's rainy!";
} else if (temp < 15) {
  moodAdvice = "❄️ Brrr! It's cold – wear something warm!";
} else {
  moodAdvice = "😊 Great day ahead! Make the most of it!";
}


    res.send(`
  <html>
  <head>
    <title>Weather Result</title>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body class="${weatherClass}">

    <div class="container">
      <h2>🌤️ Weather in ${weather.name}, ${weather.sys.country}</h2>
      <p>🌡️ Temperature: ${weather.main.temp} °C</p>
      <p>💧 Humidity: ${weather.main.humidity}%</p>
      <p>☁️ Condition: ${weather.weather[0].description}</p>
      <p>💬 Mood Advice: <strong>${moodAdvice}</strong></p>
      <img src="http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png" alt="icon" />
      <br/><br/>
      <a href="/" style="color:white;">🔁 Try another city</a>
    </div>
  </body>
  </html>
`);


  } catch {
    res.send(`<h2>🚫 City not found!</h2><a href="/">🔁 Try again</a>`);
  }
});

app.listen(PORT, () => {
  console.log(`Robot is running on http://localhost:${PORT}`);
});
