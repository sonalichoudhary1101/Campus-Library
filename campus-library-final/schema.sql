-- schema.sql : database for "My Bookshelf" (authors, books, genres)
-- WARNING: this recreates the database, so old rows are replaced by sample data.
DROP DATABASE IF EXISTS gqldemo;
CREATE DATABASE gqldemo;
USE gqldemo;

CREATE TABLE authors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country VARCHAR(50)
);
CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  year INT,
  author_id INT NOT NULL,
  FOREIGN KEY (author_id) REFERENCES authors(id)
);
CREATE TABLE genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);
-- join table: a book can have many genres, a genre can have many books
CREATE TABLE book_genres (
  book_id INT NOT NULL,
  genre_id INT NOT NULL,
  PRIMARY KEY (book_id, genre_id),
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (genre_id) REFERENCES genres(id)
);

INSERT INTO authors (name, country) VALUES ('Asha Patel','India'),('Ravi Kumar','India');
INSERT INTO books (title, year, author_id) VALUES
  ('Databases 101',2020,1),('SQL in Practice',2022,1),('Web Services Basics',2023,2);
INSERT INTO genres (name) VALUES
  ('Documentary'),('Drama'),('Comedy'),('Action'),('Horror'),('Romance'),
  ('Thriller'),('Sci-Fi'),('Fantasy'),('Mystery'),('Crime'),('Biography'),
  ('History'),('Western'),('Animation'),('Family'),('Children'),('Sport'),
  ('War'),('Adventure'),('Musical');
INSERT INTO book_genres (book_id, genre_id) VALUES (1,1),(2,1),(3,1);
