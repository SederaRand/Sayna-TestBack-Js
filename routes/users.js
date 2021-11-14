/**
 * Configure JWT
 */
 var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
 var bcrypt = require('bcryptjs');
 var config = require('../config'); // get config file
 var User = require('../model/user');
 var mongoose = require('mongoose');

 // Type of Role users
 const Role = {
    Admin: "Admin",
    Guest: "Guest"
}

 // index
 function index(req,res){
    res.send('Bienvenue sur l API NODE JS');
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
         else if (!user || user == null) return res.status(404).send('Utilisateur introuvable');
         else if (!user || user == null) return res.status(404).send('Utilisateur introuvable');
         // check if the password is valid
         var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
         if (!passwordIsValid) return res.status(401).send({ auth: false, token: null, message: "Email ou Mot de passe invalide" });

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
                    return res.status(200).send({ auth: true, user: response, message: "Utilisateur avec un rôle Admin connecté" });
                 })
             } else if(user.role === Role.Guest) {
                 User.findOne({'identifiant._id': user._id}).exec((err, user) => {
                     if(err) res.send(err);
                     response.user_info = {                         
                        _id: user._id,
                        firstname: user.firstname,
                        lastname: user.lastname
                    }
                    return res.status(200).send({ auth: true, user: response, message: "Utilisateur avec un rôle Visiteur connecté" });

                 })
             } else if(user.role === Role.Admin) {
                return res.status(200).send({ auth: true, user: response, message: "Utilisateur avec un rôle Admin connecté" });
             } else {
                return res.status(401).send({error: 'Access refusé'});
             }
         } else {
            return res.status(401).send({error: 'Access refusé'});
         }
     });
 }
 
 //logout 
 function logout(req, res) {
    return res.status(200).send({ auth: true, token: null, message:"L utilisateur a été déconnecté avec succes" });
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
                    return res.status(401).send({error: 'Access denied'})
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
            return res.status(401).send({error: 'Access denied'})
    } else {
        return res.status(401).send({error: 'Access denied'})
    }
 }

 // Get by TOKEN a user
function getUser(req, res){   
    let userId = req.params.token;
    User.findOne({ id: userId._id }, (err, user) => {
        if (err) {
            return res.send(err) 
        }
        else if(user == null){
            return res.status(200).send({error: 'Utilisateur introuvable'});
        }
        res.json(user);
    })}

// Put informations of user expected Password
function putUser(req, res){
    let token = req.params.token;
    let userNew = req.body;
    const decoded = jwt.verify(token, config.secret);  
    var userId = decoded.id;

    if (userNew.password != null){
        return res.status(500).send("Veuillez utilisez un autre endpoint pour modifier le mot de passe de l'utilisateur");
    }
    else{
        User.findByIdAndUpdate(userId, userNew, function (err, user) {
            if(user == null){
                return res.status(200).send({error: 'Utilisateur introuvable'});
            }
            else{
                return res.status(200).send("Utilisateur modifié avec succes.");
            }
        });
    }    
}

// Put Password of users
function putPasswordUser(req, res){
    let token = req.params.token;
    let userNewPassword = req.body;
    var hashedPassword = bcrypt.hashSync(userNewPassword.password, 8);
    userNewPassword.password = hashedPassword;
    const decoded = jwt.verify(token, config.secret);  
    var userId = decoded.id;

    User.findByIdAndUpdate(userId, userNewPassword, function (err, user) {
        if(user == null){
            return res.status(200).send({error: 'Utilisateur introuvable'});
        }
        else{
            return res.status(200).send("Mot de passe modifié avec succes.");
        }
    });  
}

// Delete a user
function deleteUser(req, res){
    let token = req.params.token;
    const decoded = jwt.verify(token, config.secret);  
    var userId = decoded.id;

    User.findByIdAndRemove(userId, function (err, user) {
        if (err){
            return res.status(500).send("Utilisateur introuvable");
        }
        else if(user == null){
            return res.status(200).send({error: 'Utilisateur introuvable'});
        }
        else{
            return res.status(200).send("Utilisateur supprimé.");
        }
    });
}
 
 module.exports = {
    index,
    doRegister,
    doLogin,
    logout,
    verifyToken,
    getUser,
    putUser,
    putPasswordUser,
    deleteUser,
     Role
 };
 