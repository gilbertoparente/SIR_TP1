require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const mustacheExpress = require('mustache-express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Mustache as the template engine
app.engine('mustache', mustacheExpress());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API route to fetch artist details, albums, and songwriters
app.get('/search', async (req, res) => {
  const { artist } = req.query;
  if (!artist) {
    return res.status(400).send("Please provide an artist name.");
  }

  try {
    // Fetch artist data from iTunes
    const iTunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=musicArtist&limit=1`;
    const iTunesResponse = await fetch(iTunesUrl);
    const iTunesData = await iTunesResponse.json();
    const artistInfo = iTunesData.results[0];

    if (!artistInfo) {
      return res.status(404).send("Artist not found on iTunes.");
    }

    // Fetch artist image and top albums from Deezer
    const deezerSearchUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artist)}`;
    const deezerSearchResponse = await fetch(deezerSearchUrl);
    const deezerSearchData = await deezerSearchResponse.json();
    const artistId = deezerSearchData.data[0]?.id;

    let topAlbums = [];
    let artistImage = deezerSearchData.data[0]?.picture_medium;
    if (artistId) {
      const deezerArtistUrl = `https://api.deezer.com/artist/${artistId}/albums`;
      const deezerAlbumsResponse = await fetch(deezerArtistUrl);
      const deezerAlbumsData = await deezerAlbumsResponse.json();
      topAlbums = deezerAlbumsData.data.slice(0, 5);  // Limit to top 5 albums
    }

    // Fetch songwriters/related artists from MusicBrainz
    const musicBrainzUrl = `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artist)}&fmt=json`;
    const musicBrainzResponse = await fetch(musicBrainzUrl);
    const musicBrainzData = await musicBrainzResponse.json();
    const songwriters = [];
    const relatedArtists = [];

    // Separate songwriters and related artists
    musicBrainzData.artists.slice(0, 10).forEach((artist) => {
      if (artist.type === "Person") {
        songwriters.push(artist);
      } else {
        relatedArtists.push(artist);
      }
    });

    res.render('result', {
      artistInfo,
      artistImage,
      topAlbums,
      songwriters,
      relatedArtists
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("An error occurred while fetching artist information. Please try again later.");
  }
});

// Star
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
