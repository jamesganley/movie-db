var express = require('express');
var router = express.Router();
var config = require('../config.js')
var request = require("request");
var rp = require('request-promise');


router.get('/', function(req, res, next) {
  console.log(req.user);
  var genres, tvShows;

  rp({
    method: 'GET',
    url: 'https://api.themoviedb.org/3/genre/movie/list',
    qs: {
      language: 'en-US',
      api_key: config.api_key
    },
    body: '{}'})

    .then(function (response) {

      genres = JSON.parse(response).genres;

      return rp({ method: 'GET',
      url: 'https://api.themoviedb.org/3/discover/movie',
      qs: {
        language: 'en-US',
        api_key: config.api_key,
        with_genres: req.query.genre || null,
        sort_by: req.query.sort_by || null
      },
      body: '{}' })
    })

    .then(function (response) {
      var movies = JSON.parse(response).results;

      res.render('pages/movies', {
        activeLink: "movies",
        isLoggedIn: !!req.user,
        requestedGenre: (function() {
          var g = {id: req.query.genre}
          if (genres instanceof Array) {
            var filtered = genres.filter(genre => genre.id == g.id);
            if (filtered.length > 0) {
              g.name = filtered[0].name;
              return g;
            }
          }
          return g;
        }()),
        requestedFilter: (function() {
          var filter = "";

          switch (req.query.sort_by) {
            case "release_date.gte":
              filter = "Latest"
              break;
            case "popularity.desc":
              filter = "Most Popular"
              break;
            case "popularity.asc":
              filter = "Least Popular"
              break;
            default:
          }

          return filter;

        }()),
        genres: genres,
        results: movies
      });
    })

    .catch(function(err) {
      next(err)
    })

});

module.exports = router;