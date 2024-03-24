CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at timestamptz,
    uuid UUID UNIQUE NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(255) UNIQUE NOT NULL,
    created_at timestamptz,
    user_email VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    plan VARCHAR(50),
    expired_at timestamptz,
    order_status SMALLINT NOT NULL,
    paied_at timestamptz,
    stripe_session_id VARCHAR(255),
    credits INT NOT NULL,
    currency VARCHAR(50)
);

CREATE TABLE Videos (
    id SERIAL PRIMARY KEY,
    youtube_id TEXT NOT NULL UNIQUE,
    tags JSONB,
    creator_id INTEGER REFERENCES users(id),
    meta_title TEXT,
    title_translations JSONB,
    summary_translations JSONB,
    highlights_translations JSONB,
    timeline_translations JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
