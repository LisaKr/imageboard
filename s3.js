const knox = require("knox");
let secrets;
if (process.env.NODE_ENV == "production") {
    secrets = process.env; // in prod the secrets are environment variables
} else {
    secrets = require("./secrets"); // secrets.json is in .gitignore
}

const client = knox.createClient({
    key: secrets.AWS_KEY,
    secret: secrets.AWS_SECRET,
    bucket: "spicedling"
});

const fs = require("fs");

//uploading our pictures to amazon
exports.uploadToAmazon = function(req, res, next) {
    if (!req.file) {
        return res.sendStatus(500);
    }
    //configuring request to amazon
    const s3Request = client.put(req.file.filename, {
        "Content-Type": req.file.mimetype,
        "Content-Length": req.file.size,
        "x-amz-acl": "public-read"
    });
    //sending a request to amazon
    const readStream = fs.createReadStream(req.file.path);
    readStream.pipe(s3Request);

    //listen to response from amazon
    s3Request.on("response", s3Response => {
        console.log("status code of the response: ", s3Response.statusCode);
        const wasSuccessful = s3Response.statusCode == 200;
        if (wasSuccessful) {
            next();
        } else {
            res.sendStatus(500);
        }
    });
};
