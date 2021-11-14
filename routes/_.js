let mongoose = require('mongoose');

function removeCollection(req, res) {
    const collection = req.body.collection;
    if(collection) {
        mongoose.connection.dropCollection(collection).then(() => {
            console.log(collection, "supprimée!");
        });
    }
}

module.exports = {
    removeCollection
}