CREATE TABLE Usuario (
    id INT AUTO_INCREMENT,
    user VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE Autores (
    id INT AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE Libros (
    id INT AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    genero VARCHAR(50) NOT NULL,
    idAutor INT not null,
    stock INT DEFAULT 0,
    PRIMARY KEY (id),
    FOREIGN KEY (idAutor) REFERENCES Autores(id)
);


CREATE TABLE Prestamos (
    id INT AUTO_INCREMENT,
    idUsuario INT,
    idLibro INT,
    fechaPrestamo DATE,
    fechaDevolucion DATE,
    devuelto BOOL DEFAULT 0,
    PRIMARY KEY (id),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(id),
    FOREIGN KEY (idLibro) REFERENCES Libros(id)
);

DELIMITER //
CREATE TRIGGER after_prestamo_insert
AFTER INSERT ON Prestamos
FOR EACH ROW
BEGIN
    DECLARE libro_stock INT;

    SELECT stock INTO libro_stock FROM Libros WHERE id = NEW.idLibro;

    IF libro_stock > 0 THEN
        UPDATE Libros
        SET stock = stock - 1
        WHERE id = NEW.idLibro;
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No hay suficientes libros en stock para realizar este préstamo.';
    END IF;
END; //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE GetPrestamosDeUsuario(IN userId INT)
BEGIN
    SELECT * FROM Prestamos WHERE idUsuario = userId;
END;//
DELIMITER ;