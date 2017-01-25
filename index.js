#!/usr/bin/env nodejs

/* Oto Brglez - <otobrglez@gmail.com> - January 2017 */

let express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    morgan = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    _ = require('lodash');

const exphbs  = require('express-handlebars');

let index = require('./routes/index');

let app = express();

// app.set('view engine', 'haml');
// app.engine('.haml', require('hamljs').renderFile);
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// app.set('views', path.join(__dirname, 'views'));
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('node-sass-middleware')({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true,
    sourceMap: true
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(index);

app.use((req, res, next) =>{
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.json({'error': err.message});
});

const port = _.parseInt(process.env.PORT || '8877',10);
app.listen(port, ()=> console.log(`ivo is up on ${port}.`));

module.exports = app;
