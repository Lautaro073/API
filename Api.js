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
// Insertar un autor
app.post('/autores', (req, res) => {
    const autor = req.body;
    const query = 'INSERT INTO Autores SET ?';
    db.query(query, autor, (error, result) => {
        if (error) throw error;
        res.status(201).send('Autor creado');
    });
});

// Insertar un libro
app.post('/libros', (req, res) => {
    const { nombre, idAutor } = req.body;

    // Primero, verificamos si el idAutor existe
    const searchAuthorQuery = 'SELECT * FROM Autores WHERE id = ?';
    db.query(searchAuthorQuery, [idAutor], (searchAuthorErr, searchAuthorResults) => {
        if (searchAuthorErr) throw searchAuthorErr;
            
        if (searchAuthorResults.length == 0) {
            res.status(400).send('Autor no encontrado.');
        } else {
            // Luego, buscamos si ya existe un libro con este nombre
            const searchBookQuery = 'SELECT * FROM Libros WHERE nombre = ?';
            db.query(searchBookQuery, [nombre], (searchBookErr, searchBookResults) => {
                if (searchBookErr) throw searchBookErr;

                if (searchBookResults.length > 0) {
                    // Si el libro ya existe, incrementamos el stock
                    const updateStockQuery = 'UPDATE Libros SET stock = stock + 1 WHERE nombre = ?';
                    db.query(updateStockQuery, [nombre], (updateErr, updateResults) => {
                        if (updateErr) throw updateErr;
                        res.status(200).send(`Libro existente, stock incrementado.`);
                    });
                } else {
                    // Si el libro no existe, lo añadimos a la base de datos con un stock de 1
                    const libro = { nombre, idAutor, stock: 1 };
                    const insertBookQuery = 'INSERT INTO Libros SET ?';
                    db.query(insertBookQuery, libro, (insertErr, insertResults) => {
                        if (insertErr) throw insertErr;
                        res.status(200).send(`Libro añadido con éxito.`);
                    });
                }
            });
        }
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
//PRESTAMO DE UN LIBRO
app.post('/prestamos', (req, res) => {
    const prestamo = req.body;
    db.getConnection((err, connection) => {
        if (err) throw err;
        // Verificar la disponibilidad del libro
        connection.query('SELECT stock FROM Libros WHERE id = ?', [prestamo.idLibro], (error, results) => {
            if (error) {
                connection.release();
                throw error;
            }
            if (results[0].stock <= 0) {
                // Si no hay stock, enviar un mensaje y finalizar la conexión
                res.status(200).send('El libro no está en stock');
                connection.release();
            } else {
                // Si hay stock, continuar con la transacción
                connection.beginTransaction(error => {
                    if (error) {
                        connection.release();
                        throw error;
                    }
                    connection.query('INSERT INTO Prestamos SET ?', prestamo, (error, result) => {
                        if (error) {
                            return connection.rollback(() => {
                                connection.release();
                                throw error;
                            });
                        } else {
                            connection.commit(error => {
                                if (error) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        throw error;
                                    });
                                } else {
                                    connection.release();
                                    res.status(201).send('Préstamo creado');
                                }
                            });
                        }
                    });
                });
            }
        });
    });
});

//LLAMAR A LOS PRESTAMOS
app.get('/usuario/:id/prestamos', (req, res) => {
    db.query('CALL GetPrestamosDeUsuario(?)', [req.params.id], (error, results) => {
        if (error) throw error;
        if(results[0].length === 0){
            res.status(200).send('Este usuario no solicitó préstamo de ningún libro.');
        } else {
            res.status(200).json(results[0]);
        }
    });
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


app.listen(3000, () => {
    console.log('Aplicación escuchando en el puerto 3000');
});