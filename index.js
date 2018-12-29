const express = require("express");
const app = express();
const db = require("./db.js");

const ca = require("chalk-animation");

///////////////////////////do not touch/////////////////////////////////
//takes the file we sent, gives it a name, and puts it in the uploads directory
//multer takes the sent file and puts it in the upload folder
var multer = require("multer");
var uidSafe = require("uid-safe");
var path = require("path");

const s3 = require("./s3.js");

const bodyParser = require("body-parser");

const config = require("./config.json");

var diskStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function(req, file, callback) {
        //generates an unique name for all files
        uidSafe(24).then(function(uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    }
});

var uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152
    }
});
////////////////////////////////end of do not touch/////////////////////////////////

app.use(bodyParser.json());
app.use(express.static("./public"));
app.use(express.static("./uploads"));


/////////////GET ALL IMAGES FROM THE DB//////////////
app.get("/get-images", (req, res) => {
    db.getImages()
        .then(function(response) {
            res.json(response.rows);
        })
        .catch(function(err) {
            console.log(err);
        });
});

///////////GET MORE IMAGES BY CLICK ON THE MORE BUTTON//////////
app.get("/get-more-images/:id", (req, res) => {
    let lastID = req.params.id;
    db.getMoreImages(lastID).then(resp => {
        res.json(resp.rows);
    });
});

///////////GET A SPECIFIC IMAGE//////////////////
app.get("/images/:id", function(req, res) {
    db.getImageById(req.params.id)
        .then(function(data) {
            res.json(data.rows[0]);
        })
        .catch(function(err) {
            console.log(err);
        });
});

///////GET COMMENTS FOR A SPECIFIC IMAGE//////////
app.get("/comments/:id", (req, res) => {
    db.getAllComments(req.params.id)
        .then(function(data) {
            res.json(data.rows);
        })
        .catch(function(err) {
            console.log(err);
        });
});

///////GET REPLIES FOR A SPECIFIC IMAGE//////////
app.get("/replies/:id", (req, res) => {
    db.getAllReplies(req.params.id)
        .then(function(data) {
            res.json(data.rows);
        })
        .catch(function(err) {
            console.log(err);
        });
});

////////////UPLOADING A NEW PICTURE////////////////
app.post("/upload", uploader.single("file"), s3.uploadToAmazon, function(
    req,
    res
) {
    if (req.file) {
        db.insertImage(
            config.s3Url + req.file.filename,
            req.body.username,
            req.body.title,
            req.body.description
        ).then(function(data) {
            res.json(data.rows[0]);
        });
    } else {
        res.json({
            success: false
        });
    }
});

///////ADDING A COMMENT
app.post("/add-comment", (req, res) => {
    db.addComment(req.body.comment, req.body.username, req.body.image_id)
        .then(function(data) {
            res.json(data.rows[0]);
        })
        .catch(function(err) {
            console.log(err);
        });
});

/////ADDING A REPLY
app.post("/add-reply", (req, res) => {
    db.addReply(
        req.body.reply,
        req.body.username,
        req.body.image_id,
        req.body.comment_id
    )
        .then(function(data) {
            res.json(data.rows[0]);
        })
        .catch(function(err) {
            console.log(err);
        });
});

app.listen(8080, () => ca.rainbow("Big Brother is listening!"));
