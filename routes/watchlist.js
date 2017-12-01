var config = require('../config');
var express = require('express');
var router = express.Router();
var request = require('request');
var User = require('../models/User.js');

router.get('/add', function(req, res, next) {

    var user = req.user;
    var media_id = req.query.media_id;
    var media_type = req.query.media_type;

    // Check if user is logged in
    if (!user) {
      return res.redirect('/login')
    }

    // Check if a media_id and media type exists
    if (media_id && media_type) {

      // Check if user has already saved this media
      // and then save it here in the media var if they have
      var media;

      if (media_type === "movie") {

        media = user.movies.filter(function(movie) {
          return movie.id === media_id
        })[0]

      } else {

        media = user.tv_shows.filter(function(tv_show) {
          return tv_show.id === media_id
        })[0]

      }

      if (media) {
        // if true then user already has that movie saved,
        // so check if he has it set as a favourite
        if (media.isInWatchlist) {
          // redirect
          return res.redirect('/');
        }

        media.isInWatchlist = true;

        User.findOneAndUpdate({ 'username': req.user.username }, user, function(err, doc) {
          if (err) {
            console.log(err);
          } else {
            console.log("DOC", doc);
          }
        })

      } else {
        // user does not have media saved so get more info about the media
        // from the api as we only have access to the movie id
        var api_options = {
          method: 'GET',
          url: 'https://api.themoviedb.org/3/' + (media_type === "movie" ? "movie/" : "tv/") + media_id,
          qs: { api_key: config.api_key },
          body: '{}' }

        request(api_options, function (error, response, body) {
          if (error) throw new Error(error);

          var media = JSON.parse(body);
          media.isFavourite = false;
          media.isInWatchlist = true;

          // Update the genres wathced by the user
          var genreAlreadyExists = false;
          var genres = media_type === "movie" ?
            user.most_popular_movie_genres :
            user.most_popular_tv_genres;

          media.genres.forEach(function(g) {

            for (var i = 0; i < genres.length; i++) {
              if (genres[i].genre === g.name) {
                console.log("increasing count");
                genres[i].count++;
                genreAlreadyExists = true;
                break;
              }
            }

            if (!genreAlreadyExists) {
              console.log("Adding genre");
              genres.push({genre: g.name, count: 1});
            }

          })


          if (media_type === "movie") {
            user.movies.push(media);
          } else {
            user.tv_shows.push(media);
          }

          // Update db
          User.findOneAndUpdate({ 'username': req.user.username }, user, function(err, doc) {
            if (err) {
              next(err);
            } else {
              console.log("DOC", doc);
              res.redirect('back')
            }
          })


        })

      }

    } else {
      return next(new Error('No media_id or media_type'))
    }
})

router.get('/delete', function(req, res, next) {
  var user = req.user;
  var media_id = req.query.media_id;
  var media_type = req.query.media_type;
  var media;

  if (!user) {
    return res.redirect('/login')
  }

  if (media_type === "movie") {

    for (var i = 0; i < user.movies.length; i++) {
      if (user.movies[i].id === media_id) {
        user.movies.splice(i, 1);
        break;
      }
    }


  } else {

    for (var i = 0; i < user.tv_shows.length; i++) {
      if (tv_shows[i].id === media_id) {
        tv_shows.splice(i, 1);
        break;
      }
    }

  }

  User.findOneAndUpdate({ 'username': req.user.username }, user, function(err, doc) {
    if (err) {
      next(err);
    } else {
      console.log("DOC", doc);
      res.redirect('back')
    }
  })


})

module.exports = router;