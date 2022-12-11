import express from "express";
import DateExtension from '@joi/date';
import JoiImport from 'joi';
import connection from './database/database.js';

const joi = JoiImport.extend(DateExtension);

const gamesSchema = joi.object({
  name: joi.string().required(),
  image: joi.string().required(),
  stockTotal: joi.number().min(1),
  categoryId: joi.number().min(1),
  pricePerDay: joi.number().min(1),
});

const customersSchema = joi.object({
  name: joi.string().required(),
  phone: joi.string().regex(/^\d+$/).min(10).max(11).required(),
  cpf: joi.string().regex(/^\d+$/).min(11).max(11).required(),
  birthday: joi.date().format('YYYY-MM-DD'),
});

const rentalsSchema = joi.object({
  customerId: joi.number().min(1),
  gameId: joi.number().min(1),
  daysRented: joi.number().min(1),
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
  let games = await connection.query(`SELECT games.*, categories.name AS "categoryName" 
  FROM games JOIN categories ON games."categoryId" = categories.id`);
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

  const customers = await connection.query("SELECT * FROM customers WHERE id=$1", 
  [id]);

  if(customers.rows.length === 0)
  {
    return res.sendStatus(404);
  }

  return res.status(200).send(customers.rows[0]);
});

app.post("/customers", async (req, res) => 
{
  const { name, phone, cpf, birthday} = req.body;

  const validation = customersSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) 
  {
    console.log(validation.error.details);
    res.sendStatus(422);
    return;
  }
  try {
    const customers = await connection.query("SELECT * FROM customers");
    if(customers.rows.find( n => n.cpf === cpf)) 
    {
      return res.sendStatus(409);
    }
    const data = new Date(Date.now());
    const aniversario = new Date(birthday);
    if(aniversario.getTime() > data.getTime())
    {
      return res.sendStatus(400);
    }
    else
    {
      await connection.query(
        'INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)',
        [name, phone, cpf, birthday]
      );
      return res.sendStatus(201);
    }

  } catch (error) {
    console.error(error)
    return res.send(500)
  }
});

app.put("/customers/:id", async (req, res) => 
{
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.sendStatus(400);
  }

  const customers = await connection.query("SELECT * FROM customers WHERE id=$1", 
  [id]);

  if(customers.rows.length === 0)
  {
    return res.sendStatus(404);
  }
  

  const { name, phone, cpf, birthday} = req.body;

  const validation = customersSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) 
  {
    console.log(validation.error.details);
    res.sendStatus(422);
    return;
  }
  try {
    const customers = await connection.query("SELECT * FROM customers WHERE id != $1", [id]);
    if(customers.rows.find( n => n.cpf === cpf)) 
    {
      return res.sendStatus(409);
    }
    const data = new Date(Date.now());
    const aniversario = new Date(birthday);
    if(aniversario.getTime() > data.getTime())
    {
      return res.sendStatus(400);
    }
    else
    {
      await connection.query(
        'UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5',
        [name, phone, cpf, birthday, id]
      );
      return res.sendStatus(201);
    }

  } catch (error) {
    console.error(error)
    return res.send(500)
  }
});

app.post("/rentals", async (req, res) => 
{
  const { customerId, gameId, daysRented} = req.body;

  const validation = rentalsSchema.validate(req.body, {
    abortEarly: false,
  });
  if (validation.error) 
  {
    console.log(validation.error.details);
    res.sendStatus(422);
    return;
  }
  try {
    const game = await connection.query(`SELECT games.*, categories.name as "categoryName" 
    FROM games JOIN categories ON games."categoryId" = categories.id WHERE games.id=$1`, [gameId]);
    if(!game.rows[0])
    {
      return res.sendStatus(400);
    }
    if(game.rows[0].stockTotal < 1)
    {
      return res.status(403).send('jogo esgotado!!!');          
    }
    const customer = await connection.query(`SELECT id, name FROM customers WHERE id=$1`, [customerId]);
    if(!customer.rows[0]) 
    {
      return res.sendStatus(400);
    }

    const data = new Date(Date.now());
    const originalPrice = daysRented*game.rows[0].pricePerDay;
    const returnDate = null;
    const delayFee = null;
    const d = (data.getFullYear() + "-" + ((data.getMonth() + 1)) + "-" + (data.getDate()));

    await connection.query(
    `INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [customerId, gameId, d, daysRented, returnDate, originalPrice, delayFee]
    );
    
    await connection.query(
      `UPDATE games SET "stockTotal"= $1 WHERE id = $2`,
          [(game.rows[0].stockTotal - 1), gameId]
    );

    return res.sendStatus(201);
    

  } catch (error) {
    console.error(error)
    return res.send(500)
  }
});

app.post("/rentals/:id/return", async (req, res) => 
{
  const id = parseInt(req.params.id);

  try {
    const rental = await connection.query(`SELECT * FROM rentals WHERE id=$1`, [id]); 
    if(!rental.rows[0])
    {
      return res.sendStatus(404);
    }
    
    if(rental.rows[0].returnDate) 
    {
      return res.sendStatus(400);
    }

    const game = await connection.query(`SELECT * FROM games WHERE id=$1`, [rental.rows[0].gameId]);
    const data = new Date(Date.now());
    const rentDate = new Date(rental.rows[0].rentDate);
    let delayFee = 0;

    if((data.getTime() > (rentDate.getTime() + (rental.rows[0].daysRented*86400000))))
    {
      delayFee = Math.floor((data.getTime() - (rentDate.getTime() + (rental.rows[0].daysRented*86400000)))/86400000);
      delayFee =  delayFee * game.rows[0].pricePerDay;
    }
  
    await connection.query(
      `UPDATE rentals SET "returnDate"= $1, "delayFee"= $2 WHERE id = $3`,
          [data, delayFee, id]
      );

    await connection.query(
      `UPDATE games SET "stockTotal"= $1 WHERE id = $2`,
          [(game.rows[0].stockTotal + 1), rental.rows[0].gameId]
      );

    return res.sendStatus(200);
    

  } catch (error) {
    console.error(error)
    return res.send(500)
  }
});

app.get("/rentals", async (req, res) => 
{
  const { customerId } =  req.query;
  const { gameId } =  req.query;

  
  try {
  if(customerId)
  {
    const rentals = await connection.query(`SELECT * FROM rentals WHERE "customerId" = $1`, [customerId]);
    if(rentals.rows.length === 0)
    {
      return res.sendStatus(404);
    }
    const customers = await connection.query(`SELECT id, name FROM customers WHERE id = $1`, [customerId]);
    let tudo = [];
    for(let i = 0; i < rentals.rows.length; i++) 
    {
      const games = await connection.query(`SELECT games.id, games.name, games."categoryId", categories.name as "categoryName" 
      FROM games JOIN categories ON games."categoryId" = categories.id WHERE games.id=$1`, [rentals.rows[i].gameId]);
      tudo[i] = {
        id: rentals.rows[i].id,
        customerId: rentals.rows[i].customerId,
        gameId: rentals.rows[i].gameId,
        rentDate: rentals.rows[i].rentDate,
        daysRented: rentals.rows[i].daysRented,
        returnDate: rentals.rows[i].returnDate, 
        originalPrice: rentals.rows[i].originalPrice,
        delayFee: rentals.rows[i].delayFee,
        customer: customers.rows[0],
        game: games.rows[0],
      };
    }
      
    return res.send(tudo);
    
  }

  if(gameId)
  {
    const rentals = await connection.query(`SELECT * FROM rentals WHERE "gameId" = $1`, [gameId]);
    if(rentals.rows.length === 0)
    {
      return res.sendStatus(404);
    }
    
    const games = await connection.query(`SELECT games.id, games.name, games."categoryId", categories.name as "categoryName" 
      FROM games JOIN categories ON games."categoryId" = categories.id WHERE games.id=$1`, [gameId]);
    let tudo = [];
    for(let i = 0; i < rentals.rows.length; i++) 
    {
      const customers = await connection.query(`SELECT id, name FROM customers WHERE id = $1`, [rentals.rows[i].customerId]);
      tudo[i] = {
        id: rentals.rows[i].id,
        customerId: rentals.rows[i].customerId,
        gameId: rentals.rows[i].gameId,
        rentDate: rentals.rows[i].rentDate,
        daysRented: rentals.rows[i].daysRented,
        returnDate: rentals.rows[i].returnDate, 
        originalPrice: rentals.rows[i].originalPrice,
        delayFee: rentals.rows[i].delayFee,
        customer: customers.rows[0],
        game: games.rows[0],
      };
    }
      
    return res.send(tudo);
    
  }

  const rentals = await connection.query(`SELECT * FROM rentals`);
    
  let tudo = [];
    for(let i = 0; i < rentals.rows.length; i++) 
    {
      const customers = await connection.query(`SELECT id, name FROM customers WHERE id = $1`, [rentals.rows[i].customerId]);
      const games = await connection.query(`SELECT games.id, games.name, games."categoryId", categories.name as "categoryName" 
      FROM games JOIN categories ON games."categoryId" = categories.id WHERE games.id=$1`, [rentals.rows[i].gameId]);
      tudo[i] = {
        id: rentals.rows[i].id,
        customerId: rentals.rows[i].customerId,
        gameId: rentals.rows[i].gameId,
        rentDate: rentals.rows[i].rentDate,
        daysRented: rentals.rows[i].daysRented,
        returnDate: rentals.rows[i].returnDate, 
        originalPrice: rentals.rows[i].originalPrice,
        delayFee: rentals.rows[i].delayFee,
        customer: customers.rows[0],
        game: games.rows[0],
      };
    }
      
    return res.send(tudo);

  } catch (error) {
    console.error(error)
   return res.send(500)
  }
});

app.delete("/rentals/:id", async (req, res) => 
{
  const id = parseInt(req.params.id);

  try {
    const rental = await connection.query(`SELECT * FROM rentals WHERE id=$1`, [id]); 
    if(!rental.rows[0])
    {
      return res.sendStatus(404);
    }
    
    if(!rental.rows[0].returnDate) 
    {
      return res.sendStatus(400);
    }

    await connection.query(`DELETE FROM rentals WHERE id=$1`, [id]);

    return res.sendStatus(200);
    

  } catch (error) {
    console.error(error)
    return res.send(500)
  }
});


app.listen(4000, () => {
  console.log("Server listening on port 4000.");
});