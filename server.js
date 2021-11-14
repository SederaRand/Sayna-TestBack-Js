let express = require('express');
let app = express();
let bodyParser = require('body-parser');
var cors = require('cors');

let _ = require('./routes/_');
let user = require('./routes/users');

let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('debug', true);

//mongodb+srv://sa:0UQhnXNx92uLvES9.$n@cluster0.zhjx4.mongodb.net/sayna?retryWrites=true&w=majority
//
const uri = 'mongodb+srv://sa:0UQhnXNx92uLvES9@cluster0.zhjx4.mongodb.net/sayna?retryWrites=true&w=majority';

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
};


mongoose.connect(uri, options)
    .then(() => {
    console.log("Connecté à la base MongoDB assignments dans le cloud !");
    console.log("at URI = " + uri);
    console.log("vérifiez with http://localhost:8010/api/users que cela fonctionne")
  },
    err => {
      console.log('Erreur de connexion: ', err);
    });

// Pour accepter les connexions cross-domain (CORS)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});


// Pour les formulaires
// app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let port = process.env.PORT || 8010;

// les routes
const prefix = '/api';

app.route(prefix + '/index')
  .get(user.index)

app.route(prefix + '/logout')
  .get(user.logout)

app.route(prefix + '/user/:token')
  .get(user.getUser)

app.route(prefix + '/register')
  .post(user.doRegister)

app.route(prefix + '/login')
  .post(user.doLogin)

app.route(prefix + '/user/:token')
  .delete(user.deleteUser)

  app.route(prefix + '/user/:token')
  .put(user.putUser)


// On démarre le serveur
app.listen(port, "0.0.0.0");
console.log('Serveur démarré  sur http://localhost:' + port);

module.exports = app;


