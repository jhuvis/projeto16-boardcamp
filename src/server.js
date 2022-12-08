import express from "express";
import pg from "pg";
import joi from "joi";

const gamesSchema = joi.object({
  name: joi.string().required(),
  image: joi.string().required(),
  stockTotal: joi.number().min(1),
  categoryId: joi.number().min(1),
  pricePerDay: joi.number().min(1),
});

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

app.post("/games", async (req, res) => 
{
  const { name, image, stockTotal, categoryId, pricePerDay} = req.body;

  const validation = gamesSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) 
  {
    console.log(validation.error.details);
    res.sendStatus(422);
    return;
  }
  try {
    const categories = await connection.query("SELECT * FROM categories");
    const games = await connection.query("SELECT * FROM games");
    if(!categories.rows.find( n => n.id === categoryId)) 
    {
      return res.sendStatus(400);
    }
    if(games.rows.find( n => n.name === name))
    {
      return res.sendStatus(409);
    }
    else
    {
      await connection.query(
        'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)',
        [name, image, stockTotal, categoryId, pricePerDay]
      );
      return res.sendStatus(201);
    }

  } catch (error) {
    console.error(error)
    return res.send(500)
  }
});

app.get("/games", async (req, res) => 
{
  let games = await connection.query("SELECT * FROM games");
  let c = [];
  const { name } =  req.query;
  if(name)
  {
    for(let i = 0; i < games.rows.length; i++)
    {
      let arr = games.rows[i].name.toLowerCase().split("");
      if(name.toLowerCase() === arr.splice(0, name.length).join(""))
      {
        console.log(games.rows[i].name.toLowerCase());
        c.push(games.rows[i]);
      }
    }
    return res.send(c);
  }
  return res.send(games.rows);
});

app.get("/customers", async (req, res) => 
{
  let customers = await connection.query('SELECT * FROM customers');
  let c = [];
  const { cpf } =  req.query;
  if(cpf)
  {
    for(let i = 0; i < customers.rows.length; i++)
    {
      let arr = customers.rows[i].cpf.split("");
      if(cpf === arr.splice(0, cpf.length).join(""))
      {
        console.log(customers.rows[i].name.toLowerCase());
        c.push(customers.rows[i]);
      }
    }
    return res.send(c);
  }
  res.send(customers.rows);
});



app.get("/customers/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.sendStatus(400);
  }

  const customers = await connection.query("SELECT * FROM customers WHERE id=$1", [
    id,
  ]);

  if(customers.rows.length === 0)
  {
    return res.sendStatus(404);
  }

  return res.status(200).send(customers.rows[0]);
});



app.listen(4000, () => {
  console.log("Server listening on port 4000.");
});