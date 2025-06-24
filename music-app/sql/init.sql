CREATE DATABASE IF NOT EXISTS music_app;
USE music_app;

-- Xóa bảng cũ để tránh lỗi
DROP TABLE IF EXISTS Songs, Albums, Artists, Genres, Users;

CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Genres (
    genre_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Artists (
    artist_id INT PRIMARY KEY AUTO_INCREMENT,
    stage_name VARCHAR(100) NOT NULL UNIQUE,
    popularity INT,
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Albums (
    album_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    release_date DATE,
    img VARCHAR(255),
    artist_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES Artists(artist_id)
);

CREATE TABLE Songs (
    song_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    duration INT NOT NULL,
    release_date DATE,
    audio_file_url VARCHAR(255) NOT NULL,
    img VARCHAR(255), -- URL ảnh bài hát, có thể NULL
    artist_id INT NOT NULL, -- Ca sĩ chính
    feat_artist_ids VARCHAR(255), -- Danh sách ca sĩ feat (JSON string), có thể NULL
    genre_id INT NOT NULL, -- Một thể loại
    album_id INT, -- Liên kết đến album, có thể NULL cho single
    is_downloadable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES Artists(artist_id),
    FOREIGN KEY (genre_id) REFERENCES Genres(genre_id),
    FOREIGN KEY (album_id) REFERENCES Albums(album_id),
    CONSTRAINT check_feat_artist_ids CHECK (
        feat_artist_ids IS NULL OR
        JSON_VALID(feat_artist_ids) AND
        JSON_CONTAINS(feat_artist_ids, CAST(artist_id AS JSON)) = 0
    )
);