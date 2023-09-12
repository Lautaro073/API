const express = require('express');
const db = require('../database');
const router = express.Router();

// Crear un nuevo préstamo
router.post('/', async (req, res) => {
    const prestamo = req.body;
    let connection;
    
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const fechaPrestamo = new Date();
        prestamo.fechaPrestamo = fechaPrestamo;

        const [result] = await connection.query('INSERT INTO Prestamos SET ?', prestamo);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).send('No se pudo crear el préstamo');
        }

        await connection.commit();
        res.status(201).send('Préstamo creado');
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).send('Error en la base de datos');
    } finally {
        if (connection) connection.release();
    }
});



// Obtener los préstamos de un usuario específico
router.get('/usuario/:id', async (req, res) => {
    try {
        const [results] = await db.query('CALL GetPrestamosDeUsuario(?)', [req.params.id]);
        
        if (results[0].length === 0) {
            res.status(200).send('Este usuario no solicitó préstamo de ningún libro.');
        } else {
            res.status(200).json(results[0]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});

// Actualizar préstamo al devolver libro
router.put('/:id', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM Prestamos WHERE id = ?', [req.params.id]);
        
        const prestamo = results[0];
        
        if (prestamo.devuelto) {
            return res.status(400).send('El libro ya fue devuelto');
        }
        
        const fechaDevolucion = new Date();

        await db.query('UPDATE Libros SET stock = stock + 1 WHERE id = ?', [prestamo.idLibro]);
        await db.query('UPDATE Prestamos SET devuelto = 1, fechaDevolucion = ? WHERE id = ?', [fechaDevolucion, req.params.id]);
        
        res.status(200).send('Libro devuelto');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
});
module.exports = router;
