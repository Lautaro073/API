const express = require('express');
const autoresRouter = require('./routes/autores');
const librosRouter = require('./routes/libros');
const prestamosRouter = require('./routes/prestamos');
const usuarioRouter = require('./routes/usuario');
const bodyParser = require('body-parser');



const app = express();
app.use(express.json());
app.use(bodyParser.json());
// Usar los ruteadores
app.use('/autores', autoresRouter);
app.use('/libros', librosRouter);
app.use('/prestamos', prestamosRouter);
app.use('/usuario', usuarioRouter);

app.listen(3000, () => {
    console.log('Aplicación escuchando en el puerto 3000');
});
