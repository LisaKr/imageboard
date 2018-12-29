const spicedPg = require("spiced-pg");

const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/imageboard"
);

/////////////////////////////////////GETTING ALL IMAGES FROM THE DATABASE///////////////////////////////////////////
exports.getImages = function() {
    return db.query(`
        SELECT *
        FROM images
        ORDER BY created_at DESC
        LIMIT 9`);
};

///////////////////INSERTING AN UPLOADED IMAGE IN THE DATABASE////////////////////////////////////////
exports.insertImage = function(url, username, title, description) {
    return db.query(
        `
        INSERT INTO images (url, username, title, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id, url, username, title, description`,
        [url, username, title, description]
    );
};

//////////////////////GETTING A SINGLE IMAGE////////////////////////////
////////////////////////////////////////////////////////////////////////
exports.getImageById = function(id) {
    return db.query(
        `
        SELECT *, (
            SELECT id FROM images
            WHERE id > $1
            LIMIT 1
        ) AS next_id,
        (
            SELECT id FROM images
            WHERE id < $1
            ORDER BY id DESC
            LIMIT 1
        ) AS prev_id
        FROM images
        WHERE id=$1`,
        [id]
    );
};

// LAG(id) OVER(ORDER BY id) prev_code,
// LEAD(id) OVER(ORDER BY id) next_code

/////////////////////INSERT A COMMENT INTO THE TABLE//////////////
exports.addComment = function(comment, username, imageID) {
    return db.query(
        `
        INSERT INTO comments (comment, username, image_id)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [comment, username, imageID]
    );
};

//////////////////GETTING ALL THE COMMENTS////////////////
exports.getAllComments = function(image_id) {
    return db.query(
        `
        SELECT *
        FROM comments
        WHERE image_id=$1
        ORDER BY created_at DESC`,
        [image_id]
    );
};

/////////////////////GETTING MORE IMAGES//////////////////////
exports.getMoreImages = function(lastID) {
    return db.query(
        `
        SELECT *
        FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 8`,
        [lastID]
    );
};

////////////////////ADDING A REPLY/////////////////////
exports.addReply = function(reply, username, imageID, commentID) {
    return db.query(
        `
        INSERT INTO replies (reply, username, image_id, comment_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [reply, username, imageID, commentID]
    );
};

//////////////GETTING THE REPLIES////////////
exports.getAllReplies = function(image_id) {
    return db.query(
        `
        SELECT *
        FROM replies
        WHERE image_id=$1
        ORDER BY created_at DESC`,
        [image_id]
    );
};

//// ,
//     (SELECT id FROM images
//     AS last_id
//     ORDER BY id ASC
//     LIMIT 1)
