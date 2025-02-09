var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var {engine}=require('express-handlebars')
var fileUpload=require('express-fileupload')
const db = require("./config/connection");
var session =require('express-session')
const helpers = require('handlebars-helpers')(); // Automatically load all helpers



var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();

// Register helpers
// const helpers = handlebarsHelpers;


// View engine setup
app.set('views', path.join(__dirname, 'views'));

// Set up the Handlebars engine with custom settings using `engine`
app.engine('hbs', engine({
  extname: 'hbs', 
  defaultLayout: 'layout', 
  layoutsDir: path.join(__dirname, 'views/layout'), 
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: helpers 
}));

app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload()) 

app.use(session({
  secret: "key",
  resave: false,               // Do not save the session if it wasn't modified
  saveUninitialized: false,    // Do not save an uninitialized session
  cookie: { maxAge: 1000000 }   // Set session expiration in milliseconds
}));

db.connect((err) => {
    if (err) {
        console.error("Connection error:", err);
    } else {
        console.log("Database connected successfully.");
    }
});

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
