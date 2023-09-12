const express = require('express');
const db = require('../database');
const router = express.Router();

// Obtener todos los autores
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM Autores');
        res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

// Obtener autor por ID
router.get('/:id', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM Autores WHERE id = ?', [req.params.id]);
        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            res.status(404).send('Autor no encontrado');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

// Insertar un autor
router.post('/', async (req, res) => {
    try {
        const autor = req.body;
        const query = 'INSERT INTO Autores SET ?';
        const [result] = await db.query(query, autor);
        res.status(201).send('Autor creado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

// Actualizar un autor
router.put('/:id', async (req, res) => {
    try {
        const idAutor = req.params.id;
        const nuevoAutor = req.body;
        await db.query('UPDATE Autores SET ? WHERE id = ?', [nuevoAutor, idAutor]);
        res.status(200).send('Autor actualizado correctamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

// Eliminar un autor
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Autores WHERE id = ?', [req.params.id]);
        res.status(200).send('Autor eliminado correctamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

module.exports = router;
