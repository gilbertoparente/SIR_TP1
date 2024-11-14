require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const mustacheExpress = require('mustache-express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const LAST_FM_API_KEY = process.env.LAST_FM_API_KEY;

// Configure Mustache as the template engine
app.engine('mustache', mustacheExpress());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes for fetching artist details
app.get('/search', async (req, res) => {
  const { artist } = req.query;
  if (!artist) {
    return res.status(400).send("Please provide an artist name.");
  }

  try {
    // Fetch artist data from Last.fm
    const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artist)}&api_key=${LAST_FM_API_KEY}&format=json`;
    const lastFmResponse = await fetch(lastFmUrl);
    const lastFmData = await lastFmResponse.json();

    // Fetch top albums from Deezer
    const deezerUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artist)}`;
    const deezerResponse = await fetch(deezerUrl);
    const deezerData = await deezerResponse.json();

    // Fetch similar artists from MusicBrainz
    const musicBrainzUrl = `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artist)}&fmt=json`;
    const musicBrainzResponse = await fetch(musicBrainzUrl);
    const musicBrainzData = await musicBrainzResponse.json();

    res.render('result', {
      artistInfo: lastFmData.artist,
      topAlbums: deezerData.data,
      similarArtists: musicBrainzData.artists.slice(0, 5)
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
