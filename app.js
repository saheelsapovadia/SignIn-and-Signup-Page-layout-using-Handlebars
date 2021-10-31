const express = require("express");
const exhbs = require("express-handlebars");
const http = require("http");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const app = express();

//database
var User = require("./model/User");

app.engine(
  "hbs",
  exhbs({
    defaultLayout: "main", //main handlebar should be displayed when first my   website will be loaded
    extname: ".hbs", //we can change extension using extname flags..so here  we'll write .hbs extension which we r going to use
  })
);

app.set("view engine", "hbs");

app.use(helmet());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  session({
    key: "user_id",
    secret: "RandomSecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000,
    },
  })
);

var sessionChecker = (req, res, next) => {
  //this function is used to check whether user is logged in or not
  if (req.session.user && req.cookies.user_id) {
    //if user is logged in and cookie is set
    res.redirect("/dashboard"); //if user is logged in then redirect to dashboard
  } else {
    next(); //if user is not logged in then go to next function
  }
};

//routes
app.get("/", sessionChecker, (req, res) => {
  res.redirect("/login");
});

app
  .route("/login")
  .get(sessionChecker, (req, res) => {
    res.render("login", { title: "Login Page" });
  })
  .post(async (req, res) => {
    var username = req.body.username,
      password = req.body.password;

    try {
      var user = await User.findOne({ username: username }).exec();
      if (!user) {
        res.redirect("/login");
      } else {
        user.comparePassword(password, (error, match) => {
          if (!match) {
            res.redirect("/login");
          }
        });
        req.session.user = user;
        res.redirect("/dashboard");
      }
    } catch (error) {
      console.log(error);
    }
  });

app
  .route("/signup")
  .get(sessionChecker, (req, res) => {
    res.render("signup", { title: "Signup Page" });
  })
  .post(sessionChecker, (req, res) => {
    var user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });
    user.save((err, doc) => {
      if (err) {
        console.log(error);
        res.redirect("/signup");
      } else {
        req.session.user = doc;
        res.redirect("/dashboard");
      }
    });
  });

app.get("/dashboard", function (req, res) {
  if (req.session.user && req.cookies.user_id) {
    res.render("dashboard", { title: "Dashboard" });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  if (req.session.user && req.cookies.user_id) {
    res.clearCookie("user_id");
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.use(function (req, res, next) {
  res.status(404).send("Sorry cant find the resources you want!");
});

app.get("/*", (req, res) => {
  res.writeHead(404);
  res.end();
});

//create server
const server = http.createServer(app);

//listen on port
server.listen(80, () => {
  console.log("server is listening on port 80");
});
