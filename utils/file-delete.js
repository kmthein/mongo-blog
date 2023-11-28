const fs = require("fs");

const fileDelete = (filepath) => {
    fs.unlink(filepath, (err) => {
        if(err) throw err;
        console.log("photo was deleted.");
    })
}

module.exports = fileDelete;