// server.js : GraphQL API  (1. schema  2. resolvers  3. start)
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const pool = require('./db');

// 1. SCHEMA
const typeDefs = `#graphql
  type Author { id: ID! name: String! country: String books: [Book!]! }
  type Genre  { id: ID! name: String! books: [Book!]! }
  type Book   { id: ID! title: String! year: Int author: Author! genres: [Genre!]! }

  type Query {
    authors: [Author!]!
    author(id: ID!): Author
    books: [Book!]!
    genres: [Genre!]!
  }
  type Mutation {
    addBook(title: String!, year: Int, authorId: ID!, genreIds: [ID!]): Book!
    addAuthor(name: String!, country: String): Author!
    addGenre(name: String!): Genre!
    updateBook(id: ID!, title: String!, year: Int, authorId: ID!, genreIds: [ID!]): Book!
    deleteBook(id: ID!): Boolean!
    updateAuthor(id: ID!, name: String!, country: String): Author!
    deleteAuthor(id: ID!): Boolean!
    updateGenre(id: ID!, name: String!): Genre!
    deleteGenre(id: ID!): Boolean!
  }
`;

// small helper: run a query and return the rows
const rows = async (sql, params) => (await pool.query(sql, params))[0];

// 2. RESOLVERS
const resolvers = {
  Query: {
    authors: () => rows('SELECT * FROM authors ORDER BY name'),
    author: async (_p, { id }) => (await rows('SELECT * FROM authors WHERE id = ?', [id]))[0],
    books: () => rows('SELECT * FROM books ORDER BY title'),
    genres: () => rows('SELECT * FROM genres ORDER BY name'),
  },
  Author: {
    books: (a) => rows('SELECT * FROM books WHERE author_id = ?', [a.id]),
  },
  Book: {
    author: async (b) => (await rows('SELECT * FROM authors WHERE id = ?', [b.author_id]))[0],
    genres: (b) => rows(
      'SELECT g.* FROM genres g JOIN book_genres bg ON bg.genre_id = g.id WHERE bg.book_id = ?', [b.id]),
  },
  Genre: {
    books: (g) => rows(
      'SELECT b.* FROM books b JOIN book_genres bg ON bg.book_id = b.id WHERE bg.genre_id = ?', [g.id]),
  },
  Mutation: {
    addBook: async (_p, { title, year, authorId, genreIds }) => {
      const [r] = await pool.query(
        'INSERT INTO books (title, year, author_id) VALUES (?, ?, ?)', [title, year, authorId]);
      if (genreIds && genreIds.length) {
        await pool.query('INSERT INTO book_genres (book_id, genre_id) VALUES ?',
          [genreIds.map((g) => [r.insertId, g])]);
      }
      return (await rows('SELECT * FROM books WHERE id = ?', [r.insertId]))[0];
    },
    addAuthor: async (_p, { name, country }) => {
      const [r] = await pool.query('INSERT INTO authors (name, country) VALUES (?, ?)', [name, country]);
      return (await rows('SELECT * FROM authors WHERE id = ?', [r.insertId]))[0];
    },
    addGenre: async (_p, { name }) => {
      const [r] = await pool.query('INSERT INTO genres (name) VALUES (?)', [name]);
      return (await rows('SELECT * FROM genres WHERE id = ?', [r.insertId]))[0];
    },

    // ---- UPDATE ----
    updateBook: async (_p, { id, title, year, authorId, genreIds }) => {
      await pool.query('UPDATE books SET title = ?, year = ?, author_id = ? WHERE id = ?',
        [title, year, authorId, id]);
      await pool.query('DELETE FROM book_genres WHERE book_id = ?', [id]);   // replace the genre list
      if (genreIds && genreIds.length) {
        await pool.query('INSERT INTO book_genres (book_id, genre_id) VALUES ?',
          [genreIds.map((g) => [id, g])]);
      }
      return (await rows('SELECT * FROM books WHERE id = ?', [id]))[0];
    },
    updateAuthor: async (_p, { id, name, country }) => {
      await pool.query('UPDATE authors SET name = ?, country = ? WHERE id = ?', [name, country, id]);
      return (await rows('SELECT * FROM authors WHERE id = ?', [id]))[0];
    },
    updateGenre: async (_p, { id, name }) => {
      await pool.query('UPDATE genres SET name = ? WHERE id = ?', [name, id]);
      return (await rows('SELECT * FROM genres WHERE id = ?', [id]))[0];
    },

    // ---- DELETE (child rows first, because of the foreign keys) ----
    deleteBook: async (_p, { id }) => {
      await pool.query('DELETE FROM book_genres WHERE book_id = ?', [id]);
      await pool.query('DELETE FROM books WHERE id = ?', [id]);
      return true;
    },
    deleteAuthor: async (_p, { id }) => {
      await pool.query('DELETE FROM book_genres WHERE book_id IN (SELECT id FROM books WHERE author_id = ?)', [id]);
      await pool.query('DELETE FROM books WHERE author_id = ?', [id]);
      await pool.query('DELETE FROM authors WHERE id = ?', [id]);
      return true;
    },
    deleteGenre: async (_p, { id }) => {
      await pool.query('DELETE FROM book_genres WHERE genre_id = ?', [id]);
      await pool.query('DELETE FROM genres WHERE id = ?', [id]);
      return true;
    },
  },
};

// 3. START
async function start() {
  const server = new ApolloServer({ typeDefs, resolvers });
  const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
  console.log(`GraphQL API ready at ${url}`);
}
start();
