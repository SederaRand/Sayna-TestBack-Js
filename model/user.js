var mongoose = require('mongoose');  

var UserSchema = new mongoose.Schema({  
  firstname: {
    type: String,
    required: true
  }, 
  lastname: {
    type: String,
    required: true
  }, 
  email: {
    type: String,
    required: true
  },    
  password: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date_naissance: {
    type :Date,
    required: true,
  },
  sexe: String,
  role: String,
  token: String,
});
mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');