import express from "express";
import pg from "pg";

const { Pool } = pg;

const connection = new Pool({
  user: "postgres",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
  password: "1999",
});

const app = express();
app.use(express.json());

app.get("/categories", async (req, res) => {
  const categories = await connection.query("SELECT * FROM categories");
  res.send(categories.rows);
});

app.post("/categories", async (req, res) => {
  const { name } = req.body;
  const categories = await connection.query("SELECT * FROM categories");

  if(categories.rows.find( n => n.name === name))
  {
    return res.sendStatus(409);
  }
  if(!name)
  {
    return res.sendStatus(400);
  }
  else
  {
    await connection.query(
      "INSERT INTO categories (name) VALUES ($1)",
      [name]
    );
  
    return res.sendStatus(201);
  }
  
});

app.get("/api/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.sendStatus(400);
  }

  const product = await connection.query("SELECT * FROM produtos WHERE id=$1", [
    id,
  ]);

  res.status(200).send(product.rows[0]);
});



app.listen(4000, () => {
  console.log("Server listening on port 4000.");
});