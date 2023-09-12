const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database'); // Este debería ser el mismo
const generateAccessToken = require('../generateAccessToken');
const router = express.Router();


// Endpoint para obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT id, user FROM usuario'); // Evita mostrar la contraseña
        
        if (results.length === 0) {
            res.status(404).send('No hay usuarios registrados');
        } else {
            res.status(200).json(results);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

// Endpoint para obtener los datos de un usuario específico
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const [results] = await db.query('SELECT id, user FROM usuario WHERE id = ?', [id]);
        
        if (results.length === 0) {
            res.status(404).send('Usuario no encontrado');
        } else {
            res.status(200).json(results[0]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});


// Crear un nuevo usuario
router.post('/createUser', async (req, res) => {
    const user = req.body.name;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const sqlSearch = "SELECT * FROM usuario WHERE user = ?";
    const sqlInsert = "INSERT INTO usuario VALUES (0,?,?)";

    const connection = await db.getConnection(); // Obtener conexión de promesa

    try {
        const [searchResult] = await connection.query(sqlSearch, [user]);

        if (searchResult.length !== 0) {
            console.log("------> Usuario ya existe");
            res.sendStatus(409);
        } else {
            const [insertResult] = await connection.query(sqlInsert, [user, hashedPassword]);
            console.log("--------> Nuevo Usuario Creado");
            console.log(insertResult.insertId);
            res.sendStatus(201);
        }
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    } finally {
        connection.release();
    }
});

// Autenticar usuario existente
router.post('/login', async (req, res) => {
    const user = req.body.name;
    const password = req.body.password;

    const sqlSearch = "SELECT * FROM usuario WHERE user = ?";
    const connection = await db.getConnection(); // Obtener conexión de promesa

    try {
        const [searchResult] = await connection.query(sqlSearch, [user]);

        if (searchResult.length === 0) {
            console.log("--------> User does not exist");
            res.sendStatus(404);
        } else {
            const hashedPassword = searchResult[0].password;

            if (await bcrypt.compare(password, hashedPassword)) {
                console.log("--------> Login Successful");
                const token = generateAccessToken({ user: user });
                res.json({ accessToken: token });
            } else {
                res.send("Password incorrect!");
            }
        }
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    } finally {
        connection.release();
    }
});

// Endpoint para modificar un usuario existente
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const usuario = req.body;

        // Si se envía una nueva contraseña, se encripta
        if (usuario.password) {
            usuario.password = await bcrypt.hash(usuario.password, 10);
        }

        await db.query('UPDATE usuario SET ? WHERE id = ?', [usuario, id]);
        
        res.status(200).send('Usuario actualizado con éxito');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});


// Endpoint para eliminar un usuario
router.delete('/usuario/:id', async (req, res) => {
    try {
        // Extraer el ID del usuario de los parámetros de la URL
        const id = req.params.id;
        
        // Eliminar el usuario de la base de datos
        const [results] = await db.query('DELETE FROM usuario WHERE id = ?', [id]);
        
        if (results.affectedRows === 0) {
            return res.status(400).send('No se pudo eliminar el usuario');
        }
        
        res.status(200).send('Usuario eliminado exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});


module.exports = router;
