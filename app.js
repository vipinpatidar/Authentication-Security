//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate"); // don't need to require the passport-local
const { request } = require("http");

///////////////////////////////////////////////////////////////

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//setUp session
app.use(
  session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

//  passport initialization
app.use(passport.initialize());

// setup passport to manage our session
app.use(passport.session());
//////////////////////////////////////////////////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/userDB");

// Mongoose Schema support for encrypted connection
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});

// set up passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const userModel = new mongoose.model("User", userSchema);

// passport-local configuration

passport.use(userModel.createStrategy());

// passport.serializeUser(userModel.serializeUser());
// passport.deserializeUser(userModel.deserializeUser());

// this serializeUser and deserializeUser will work for all kind of strategies
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

//////////////////////////////////////
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      // console.log(profile);
      userModel.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

// puting route for auth/google google button
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

// auth/google/secrets route so google send user after authenticate them here
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  }
);
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// creating secrets.ejs route for authenticate user
app.get("/secrets", (req, res) => {
  // if (req.isAuthenticated()) {
  //   res.render("secrets");
  // } else {
  //   res.redirect("/login");
  // }

  //allwing all to she secrets (but submit only for login user ) and find all secrets on database and put on page
  userModel.find({ secret: { $ne: null } }, (err, usersWithSecret) => {
    if (err) {
      console.log(err);
    } else {
      if (usersWithSecret) {
        res.render("secrets", { usersWhoHasSecret: usersWithSecret });
      }
    }
  });
});

// setting a route for submit page and chaking user authentication
app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

//  setting up logout route for logout users
app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
//creating a route to catch the user registering data so they can access to secrets file

app.post("/register", (req, res) => {
  // registertion and use in passport to authenticate and save data and passward by hashing and salting

  userModel.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        // authenticate start from here
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

//creating a route to catch the user login data so the can access to secrets file

app.post("/login", (req, res) => {
  const user = new userModel({
    username: req.body.username,
    password: req.body.password,
  });
  //  login methos for chaking login details with database connection
  req.login(user, (err) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      //  puting authenticate
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

// submit page post request when A user submit his secrets this should show on secrets page
app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;
  console.log(req.user.id);
  // finding user who submit on submit page  and  put his secret into his database
  userModel.findById(req.user.id, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(() => {
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.listen("8000", () => {
  console.log("listening on port 8000");
});
