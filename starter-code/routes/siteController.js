/* jshint esversion:6 */
const express = require("express");
const siteController = express.Router();
const checkBoss  = checkRoles('BOSS');
const User           = require("../models/user");
const bcrypt         = require("bcrypt");
const bcryptSalt     = 10;
const passport = require("passport");
const ensureLogin = require("connect-ensure-login");

function checkRoles(role) {
  return function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    } else {
      res.redirect('/login');
    }
  };
}

siteController.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

siteController.post("/signup", (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;

  if (username === "" || password === "") {
    res.render("auth/signup", { message: "Indicate username and password" });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", { message: "The username already exists" });
      return;
    }

    var salt     = bcrypt.genSaltSync(bcryptSalt);
    var hashPass = bcrypt.hashSync(password, salt);

    var newUser = User({
      username,
      password: hashPass
    });

    newUser.save((err) => {
      if (err) {
        res.render("auth/signup", { message: "The username already exists" });
      } else {
        res.redirect("/login");
      }
    });
  });
});

siteController.get("/login", (req, res, next) => {
  res.render("auth/login", { "message": req.flash("error") });
});

siteController.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
  failureFlash: true,
  passReqToCallback: true
}));

siteController.get("/private-page", ensureLogin.ensureLoggedIn(), (req, res) => {
  res.render("private", { user: req.user });
});

siteController.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});

siteController.get("/", (req, res, next) => {
  res.render("index");
});

//Admin

siteController.get('/admin', (req, res, next) => {
  let UserId = req.params.id;

  User.find({},(err, users) => {
    if (err) { return next(err); }
    res.render('admin', { users });
  });
});

siteController.post('/admin', (req, res, next) => {
  const UserId = req.params.id;
  const updates = {
      username: req.body.username,
      password: req.body.password,
      role: req.body.role,

  };

  User.findOneAndUpdate({}, updates, (err, user) => {
    if (err){ return next(err); }
    return res.redirect('/admin');
  });
});

//

siteController.get('/posts', checkBoss, (req, res) => {
  res.render('private', {user: req.user});
});



module.exports = siteController;
