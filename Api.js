const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt= require('bcrypt')
// Creación de la aplicación Express
const app = express();

// Parsear JSON
app.use(express.json());

// Conexión a MySQL
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'libreria'
  });

  db.getConnection((err, connection) => {
    if(err) throw err;
    console.log("Conexión a la base de datos establecida");
  });
  //Mostrar Los libros
app.get('/libros', (req, res) => {
    db.query('SELECT * FROM libros', (error, results) => {
        if (error) throw error;
        res.status(200).json(results);
    });
});
  //Mostrar Los libros por id
  app.get('/libros/:id', (req, res) => {
    db.query('SELECT * FROM libros where id = ?',[req.params.id], (error, results) => {
        if (error) throw error;
        res.status(200).json(results);
    });
});
// Insertar un libro
app.post('/libros', (req, res) => {
    const libro = req.body;
    const query = 'INSERT INTO libros SET ?';
    db.query(query, libro, (error, result) => {
        if (error) throw error;
        res.status(201).send('Libro creado');
    });
});

// Actualizar un libro
app.put('/libros/:id', (req, res) => {
    const id = req.params.id;
    const libro = req.body;
    const query = 'UPDATE libros SET ? WHERE id = ?';
    db.query(query, [libro, id], (error, result) => {
        if (error) throw error;
        res.status(200).send('Libro actualizado');
    });
});

// Eliminar un libro
app.delete('/libros/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM libros WHERE id = ?';
    db.query(query, id, (error, result) => {
        if (error) throw error;
        res.status(200).send('Libro eliminado');
    });
});

app.listen(3000, () => {
    console.log('Aplicación escuchando en el puerto 3000');
});
//CREATE USER
app.post("/createUser", async (req, res) => {
    const user = req.body.name;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    db.getConnection(async (err, connection) => {
        if (err) throw (err)
        const sqlSearch = "SELECT * FROM usuario WHERE user = ?"
        const search_query = mysql.format(sqlSearch, [user])
        const sqlInsert = "INSERT INTO usuario VALUES (0,?,?)"
        const insert_query = mysql.format(sqlInsert, [user, hashedPassword])

        await connection.query(search_query, async (err, result) => {
            if (err) throw (err)
            console.log("------> Buscando Resultados")
            console.log(result.length)
            if (result.length != 0) {
                connection.release()
                console.log("------> Usuario ya existe")
                res.sendStatus(409)
            }
            else {
                await connection.query(insert_query, (err, result) => {
                    connection.release()
                    if (err) throw (err)
                    console.log("--------> Nuevo Usuario Creado")
                    console.log(result.insertId)
                    res.sendStatus(201)
                })
            }
        }) 
    }) 
}) 


// LOGIN (AUTHENTICATE USER)

const generateAccessToken = require("./generateAccessToken")
app.post("/login", (req, res) => {
    const user = req.body.name
    const password = req.body.password
    db.getConnection(async (err, connection) => {
        if (err) throw (err)
        const sqlSearch = "Select * from usuario where user = ?"
        const search_query = mysql.format(sqlSearch, [user])
        await connection.query(search_query, async (err, result) => {
            connection.release()

            if (err) throw (err)
            if (result.length == 0) {
                console.log("--------> User does not exist")
                res.sendStatus(404)
            }
            else {
                const hashedPassword = result[0].password

                if (await bcrypt.compare(password, hashedPassword)) {
                    console.log("---------> Login Successful")
                    console.log("---------> Generating accessToken")
                    const token = generateAccessToken({ user: user })
                    console.log(token)
                    res.json({ accessToken: token })
                } else {
                    res.send("Password incorrect!")
                }
            }
        })
    })
}) 

