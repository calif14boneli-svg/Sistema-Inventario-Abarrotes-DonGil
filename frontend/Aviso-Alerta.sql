/*<<<<<<<<<<<base de datos<<<<<<<<<<<<<<<*/
DROP DATABASE IF EXISTS abarrotes_db; 
CREATE DATABASE abarrotes_db; 
USE abarrotes_db;

/*CREAR TABLA ROLES*/
create table roles (
id int primary key auto_increment,
nombre varchar(50) not null);

/*CREAR TABLA USUARIOS*/
create table usuarios (
id INT AUTO_INCREMENT PRIMARY KEY,
rut VARCHAR(12) NOT NULL UNIQUE,
usuario VARCHAR(100) NOT NULL UNIQUE,           /* USUARIO ÚNICO*/
correo VARCHAR(100) NOT NULL, 
password VARCHAR(255) NOT NULL,

rol_id INT NOT NULL,

estado BOOLEAN DEFAULT TRUE,

fecha_creacion TIMESTAMP DEFAULT current_timestamp,

foreign key (rol_id)
references roles(id)
ON UPDATE CASCADE
ON DELETE RESTRICT
);

/*CREAR TABLA CATEGORIAS*/
create table categorias (
id int primary key auto_increment,
nombre varchar(100) not null,
descripcion VARCHAR(255)
);



/*CREAR TABLA PROVEEDORES*/
create table proveedores (
id int primary key auto_increment,
nombre varchar(100) not null,
telefono varchar(50),
email varchar(100),
direccion varchar(100),
estado BOOLEAN DEFAULT TRUE
);



/*CREAR TABLA PRODUCTOS*/
create table productos (
id int primary key auto_increment,
nombre varchar(100) not null,
descripcion text,
categoria_id int,
proveedor_id int,
fecha_elaboracion date,
fecha_vencimiento date,
cantidad int default 0,
stock_actual int default 0,
stock_minimo int default 0,
codigo_barras varchar (100) UNIQUE,
marca varchar (100),
sku varchar (100),
numero_documento varchar (100),
precio_costo INT default 0,
precio_venta INT default 0,
estado BOOLEAN DEFAULT TRUE,
fecha_registro timestamp
DEFAULT CURRENT_TIMESTAMP,

foreign key (categoria_id)
references categorias(id)
ON UPDATE CASCADE
ON DELETE RESTRICT,

foreign key (proveedor_id)
references proveedores(id)
ON UPDATE CASCADE
ON DELETE RESTRICT
);

/*CREAR TABLA ENTRADAS INVENTARIO*/
create table entradas_inventario (
id int primary key auto_increment,
producto_id int not null,
cantidad int not null,
fecha_entrada date NOT NULL,
fecha_vencimiento date,
numero_documento varchar(100),
proveedor_id int,
usuario_id int,

foreign key (producto_id)
references productos(id)
ON UPDATE CASCADE
ON DELETE RESTRICT,

foreign key (proveedor_id)
references proveedores(id)
ON UPDATE CASCADE
ON DELETE RESTRICT,

foreign key (usuario_id)
references usuarios(id)
ON UPDATE CASCADE
ON DELETE RESTRICT
);

/*CREAR TABLA SALIDAS INVENTARIO*/
create table salidas_inventario(
id int primary key auto_increment,
producto_id int not null,
cantidad int not null,
motivo varchar(255),
fecha_salida date NOT NULL,
usuario_id int,
foreign key (producto_id)
references productos(id)
ON UPDATE CASCADE
ON DELETE RESTRICT,

foreign key (usuario_id)
references usuarios(id)
ON UPDATE CASCADE
ON DELETE RESTRICT
);

/*CREAR TABLA ALERTAS*/
create table alertas (
id int primary key auto_increment,
producto_id int,
mensaje text,
fecha timestamp default current_timestamp,
estado ENUM('PENDIENTE','ATENDIDA')
DEFAULT 'Pendiente',                      /*Para saber si la alerta ya fue atendida*/
foreign key (producto_id)
references productos(id)
ON UPDATE CASCADE
ON DELETE RESTRICT
);

/*CREAR TABLA MOVIMIENTOS*/
create table movimientos (
id int primary key auto_increment,
usuario_id INT,
producto_id INT,
tipo ENUM('ENTRADA','SALIDA'),   /*PARA SÓLO PERMINTIR ELEGIR ENTRADA/SALIDA*/
cantidad int,
fecha timestamp default current_timestamp,

foreign key (usuario_id)        /*Para saber quien realizó el movimiento*/
references usuarios(id)
ON UPDATE CASCADE
ON DELETE RESTRICT,

foreign key (producto_id)
references productos(id)
ON UPDATE CASCADE
ON DELETE RESTRICT
);


/*CREAR TABLA HISTORIAL*/
create table historial (
id int primary key auto_increment,
usuario_id int,
accion VARCHAR(255),
fecha timestamp default current_timestamp,
ip varchar(50),
modulo varchar(100),
foreign key (usuario_id)
references usuarios(id)
ON UPDATE CASCADE
ON DELETE RESTRICT
);


/*CREAR ÍNDICES*/
CREATE INDEX idx_producto
ON productos(nombre);

CREATE INDEX idx_categoria
ON productos(categoria_id);

CREATE INDEX idx_proveedor
ON productos(proveedor_id);

CREATE INDEX idx_fecha
ON productos(fecha_vencimiento);


/*DATOS INICIALES*/
/*ROLES*/
insert into roles (nombre)
values ('administrador'), ('bodeguero'), ('supervisor');

/*USUARIO ADMIN*/
insert into usuarios 
(rut, usuario, correo, password, rol_id)
values 
('11.111.111-1', 'admin', 'admin@abarrotes.cl', 'Admin123#', 1),
('22.222.222-2', 'bodeguero', 'bodegua@abarrotes.cl', 'Bodega123#', 2),
('33.333.333-3', 'supervisor', 'supervisor@abarrotes.cl', 'Super123#', 3);

/* CATEGORIAS */ 
INSERT INTO categorias (nombre) 
VALUES 
('Abarrotes'), 
('Aceites y Grasas'), 
('Azúcares y Endulzantes'), 
('Bebidas'), 
('Conservas'), 
('Galletas, Snacks y Dulces'), 
('Granos y Cereales'), 
('Lácteos'), 
('Legumbres'), 
('Pastas y Harinas'), 
('Productos Congelados'), 
('Salsas, Aderezos y Condimentos'), 
('Artículos de Limpieza');

/*PROVEEDORES*/
INSERT INTO proveedores
(nombre, direccion, telefono, email)
values
('Distribuidora Central','Quirihue','912345678','proveedor@correo.cl');

/*VERIFICACIONES*/
show tables;
select * from roles;
SELECT * FROM usuarios; 
SELECT * FROM categorias; 
SELECT * FROM proveedores; 
SELECT * FROM productos;
SELECT * FROM entradas_inventario;
SELECT * FROM salidas_inventario;
SELECT * FROM alertas;
SELECT * FROM movimientos;
SELECT * FROM historial;

/*===============================*/

/* Productos con su categoría y proveedor */
SELECT
    p.id,
    p.nombre,
    c.nombre AS categoria,
    pr.nombre AS proveedor,
    p.stock_actual,
    p.stock_minimo,
    p.fecha_vencimiento
FROM productos p
INNER JOIN categorias c
    ON p.categoria_id = c.id
INNER JOIN proveedores pr
    ON p.proveedor_id = pr.id;

/* Entradas de inventario */
SELECT
    ei.id,
    p.nombre AS producto,
    ei.cantidad,
    ei.fecha_entrada,
    pr.nombre AS proveedor,
    u.usuario
FROM entradas_inventario ei
INNER JOIN productos p
    ON ei.producto_id = p.id
INNER JOIN proveedores pr
    ON ei.proveedor_id = pr.id
INNER JOIN usuarios u
    ON ei.usuario_id = u.id;

/* Salidas de inventario */
SELECT
    si.id,
    p.nombre AS producto,
    si.cantidad,
    si.motivo,
    si.fecha_salida,
    u.usuario
FROM salidas_inventario si
INNER JOIN productos p
    ON si.producto_id = p.id
INNER JOIN usuarios u
    ON si.usuario_id = u.id;

/* Alertas registradas */
SELECT
    a.id,
    p.nombre AS producto,
    a.mensaje,
    a.fecha
FROM alertas a
INNER JOIN productos p
    ON a.producto_id = p.id;


/*===============================================================
  TABLA NUEVA: mensajes_contacto
  Justificación: almacena los mensajes enviados desde el
  formulario público de la página Contacto del sitio web.
  No existe una tabla equivalente (usuarios = cuentas internas,
  historial = auditoría del sistema), por lo que se crea esta.
  Es independiente: no requiere llaves foráneas obligatorias.
  La aplicación también la crea automáticamente (CREATE IF NOT EXISTS).
 ===============================================================*/
CREATE TABLE IF NOT EXISTS mensajes_contacto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    telefono VARCHAR(50),
    asunto VARCHAR(150),
    mensaje TEXT NOT NULL,
    estado ENUM('NUEVO','LEIDO','RESPONDIDO') DEFAULT 'NUEVO',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
