/**
 * Configure JWT
 */
 var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
 var bcrypt = require('bcryptjs');
 var config = require('../config'); // get config file
 var User = require('../model/user');
 
 // Type of Role users
 const Role = {
    Admin: "admin",
    Guest: "guest"
}

 // index
 function index(req,res){
    res.send('Welcome to sayna API NODE JS');
}

 // register (POST)
 function doRegister(req, res) {
    
     var hashedPassword = bcrypt.hashSync(req.body.password, 8);
     let user = new User();
     user.firstname = req.body.firstname;
     user.lastname = req.body.lastname;
     user.email = req.body.email;
     user.password = hashedPassword;
     user.date_naissance = req.body.date_naissance;
     user.sexe = req.body.sexe;
     user.role = req.body.role;
 
    
     console.log("L'utilisateur a bien été crée avec succès");
     console.log(user);
 
     // if user is registered without errors
     // create a token
     var token = jwt.sign({ id: user._id }, config.secret, {
         expiresIn: 86400 // expires in 24 hours
     });
     user.token = token;
     user.save((err) => {        
         if (err) {
            res.status(500).send('L une ou plusieurs données obligatoire sont manquantes.');
         }

         res.json({ message: `${user.firstname} L'utilisateur a bien été crée avec succes!`, auth: true, user:user});
     });
 }

 //login (POST)
 function doLogin(req, res) {
     let userEmail = req.body.email;
     User.findOne({ email: userEmail }, (err, user) => {
         if (err) return res.status(500).send('L une ou plusieurs données obligatoire sont manquantes.');
         else if (!user) return res.status(404).send('No user found.');
         // check if the password is valid
         var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
         if (!passwordIsValid)
         {
            res.send('Nom d utilisateur ou Mot de passe incorrecte');
            return res.status(401).send({ auth: false, token: null });
         }

         // if user is found and password is valid
         // create a token
         var token = jwt.sign({ id: user._id }, config.secret, {
             expiresIn: 86400 // expires in 24 hours
         });
         user.token = token;
         user.password = undefined;
         const response = {
             token: token,
             firstname: user.firstname,
             role: user.role,
             _id: user._id
         }
         if(jwt.verify(user.token, config.secret)) {
             // Get user Info
             if(user.role === Role.Amin) {
                 User.findOne({'identifiant._id': user._id}).exec((err, user) => {
                     if(err) res.send(err);
                     response.user_info = {                         
                         _id: user._id,
                         firstname: user.firstname,
                         lastname: user.lastname
                     }
                     res.status(200).send({ auth: true, user: response});
                 })
             } else if(user.role === Role.Guest) {
                 User.findOne({'identifiant._id': user._id}).exec((err, user) => {
                     if(err) res.send(err);
                     response.user_info = {                         
                        _id: user._id,
                        firstname: user.firstname,
                        lastname: user.lastname
                    }
                    res.send('Compte Visiteur');
                     res.status(200).send({ auth: true, user: response});

                 })
             } else if(user.role === Role.Admin) {
                 res.status(200).send({ auth: true, user: response});
                 res.send('Compte Administrateur');
             } else {
                 res.status(401).send({error: 'Access refusé'});
             }
         } else {
             res.status(401).send({error: 'Access refusé'});
         }
         // return the information including token as JSON
         //res.json(user);
     });
 }
 
 //logout 
 function logout(req, res) {
    res.send('L utilisateur a été déconnecté avec succes');
     res.status(200).send({ auth: true, token: null });
 }
 
 
 function verifyToken(req, res, next) {
     const bearerHeader = req.headers['authorization'];
     if(bearerHeader) {
         const bearerToken = bearerHeader.split(' ')[1];
         req.token = bearerToken;
         if(jwt.verify(bearerToken, config.secret))  {
             const userId = req.headers['userid'];
             User.findOne({'_id': userId}, (err, user) => {
                 if(err) {
                     
                     res.status(401).send({error: 'Access denied'})
                 }
                 req.user = user;      
                 if(user && user.role === Role.Admin) {
                     User.findOne({'identifiant._id': userId}, (err, user) => {
                         req.userId = user._id;
                         next();
                     })
                 } else if(user && user.role === Role.Guest) {
                     User.findOne({'identifiant._id': userId}, (err, user) => {
                         req.userId = user._id;
                         next();
                     })
                 } else {
                     next();
                 }
             });
             // console.log("role", user)
         }
         else
             res.status(401).send({error: 'Access denied'})
     } else {
         res.status(401).send({error: 'Access denied'})
     }
 }

 // Get by TOKEN a user
function getUser(req, res){   
    let userId = req.params.token;
    User.findOne({ id: userId._id }, (err, user) => {
        if (err) {
            // verifyToken(req, res);
            res.send('Le token envoyez n existe pas');
            res.send(err) 
        }
        res.json(user);
    })
}

// Put information of user
function putUser(req, res){

}

// Delete a user
function deleteUser(req, res){
    
}
 
 module.exports = {
    index,
     doRegister,
     doLogin,
     logout,
     verifyToken,
     getUser,
     putUser,
     deleteUser,
     Role
 };
 