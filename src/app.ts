import * as express from 'express';
import * as compression from 'compression';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
import * as logger from 'morgan';
import * as lusca from 'lusca';
import * as dotenv from 'dotenv';
import * as mongo from 'connect-mongo';
import * as flash from 'express-flash';
import * as path from 'path';
import * as mongoose from 'mongoose';
import * as passport from 'passport';
import * as expressValidator from 'express-validator';
import * as bluebird from 'bluebird';
import * as exphbs from 'express-handlebars';

const MongoStore = mongo(session);

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: '.env' });

// Controllers (route handlers)
import * as homeController from './controllers/home';
import * as apiController from './controllers/api';

// API keys and Passport configuration
import * as passportConfig from './config/passport';
import { asyncMiddleware } from './services/HelperService';

// Create Express server
const app = express();

// Connect to MongoDB
const mongoUrl = process.env.MONGODB_URI;
(<any>mongoose).Promise = bluebird;

mongoose.connect(mongoUrl, { useMongoClient: true }).then(
  () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch(err => {
  console.log('MongoDB connection error. Please make sure MongoDB is running. ' + err);
  process.exit();
});

// Express configuration
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '../views'));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: mongoUrl,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
    req.path == '/account') {
    req.session.returnTo = req.path;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', asyncMiddleware(homeController.index));

/**
 * API examples routes.
 */
app.post('/api/participate', passportConfig.isAuthenticated, asyncMiddleware(apiController.addParticipantToCompetition));

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});

module.exports = app;