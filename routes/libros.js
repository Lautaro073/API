const express = require('express');
const db = require('../database');
const router = express.Router();

// Mostrar los libros
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT Libros.*, Autores.nombre AS nombreAutor FROM Libros INNER JOIN Autores ON Libros.idAutor = Autores.id');
        res.status(200).json(results.map(r => ({id: r.id, nombre: r.nombre, genero: r.genero, nombreAutor: r.nombreAutor, stock: r.stock})));
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

// Mostrar libro por ID
router.get('/:id', async (req, res) => {
    try {
        const [results] = await db.query('SELECT Libros.*, Autores.nombre AS nombreAutor FROM Libros INNER JOIN Autores ON Libros.idAutor = Autores.id WHERE Libros.id = ?', [req.params.id]);
        if (results.length > 0) {
            const libro = {id: results[0].id, nombre: results[0].nombre, genero: results[0].genero, nombreAutor: results[0].nombreAutor, stock: results[0].stock};
            res.status(200).json(libro);
        } else {
            res.status(404).send('Libro no encontrado');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});




// Insertar un libro
router.post('/', async (req, res) => {
    const { nombre, idAutor, genero } = req.body;
    try {
        const [searchAuthorResults] = await db.query('SELECT * FROM Autores WHERE id = ?', [idAutor]);
        if (searchAuthorResults.length === 0) {
            return res.status(400).send('Autor no encontrado.');
        }

        const [searchBookResults] = await db.query('SELECT * FROM Libros WHERE nombre = ?', [nombre]);
        if (searchBookResults.length > 0) {
            await db.query('UPDATE Libros SET stock = stock + 1 WHERE nombre = ?', [nombre]);
            res.status(200).send('Libro existente, stock incrementado.');
        } else {
            const libro = { nombre, idAutor, genero, stock: 1 };
            await db.query('INSERT INTO Libros SET ?', libro);
            res.status(200).send('Libro añadido con éxito.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

// Buscar libro por palabra clave
router.post('/buscar', async (req, res) => {
    try {
        const [results] = await db.query('SELECT Libros.*, Autores.nombre AS nombreAutor FROM Libros INNER JOIN Autores ON Libros.idAutor = Autores.id WHERE Libros.nombre LIKE ?', [`%${req.body.nombre}%`]);
        if (results.length > 0) {
            const libros = results.map(r => ({id: r.id, nombre: r.nombre, genero: r.genero, nombreAutor: r.nombreAutor, stock: r.stock}));
            res.status(200).json(libros);
        } else {
            res.status(404).send('No se encontraron libros que coincidan con tu búsqueda');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

// Actualizar un libro
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const libro = req.body;
    try {
        await db.query('UPDATE Libros SET ? WHERE id = ?', [libro, id]);
        res.status(200).send('Libro actualizado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

// Eliminar un libro
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.query('DELETE FROM Libros WHERE id = ?', [id]);
        res.status(200).send('Libro eliminado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

module.exports = router;
