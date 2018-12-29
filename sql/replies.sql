DROP TABLE IF EXISTS replies;

CREATE TABLE replies (
    id SERIAL PRIMARY KEY,
    reply TEXT,
    username VARCHAR(255),
    image_id INTEGER NOT NULL,
    comment_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
