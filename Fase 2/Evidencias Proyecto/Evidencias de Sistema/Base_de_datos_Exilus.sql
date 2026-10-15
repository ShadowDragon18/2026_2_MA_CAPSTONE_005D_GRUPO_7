CREATE TABLE prevision (
	"id_prevision" INTEGER NOT NULL,
	"nombre" TEXT NOT NULL UNIQUE,
	PRIMARY KEY("id_prevision")
);

CREATE TABLE captador (
	"rut_captador" TEXT NOT NULL,
	"primer_nombre" TEXT NOT NULL,
	"segundo_nombre" TEXT,
	"apellido_materno" TEXT,
	"apellido_paterno" TEXT,
	"nombre_optica" TEXT,
	PRIMARY KEY("rut_captador")
);

CREATE TABLE paciente (
	"rut_paciente" TEXT NOT NULL,
	"primer_nombre" TEXT NOT NULL,
	"segundo_nombre" TEXT,
	"apellido_paterno" TEXT,
	"apellido_materno" TEXT,
	"fecha_nacimiento" DATE NOT NULL,
	"fecha_registro" DATE NOT NULL,
	"telefono" TEXT NOT NULL,
	"correo_electronico" TEXT,
	"direccion" TEXT,
	"id_prevision" INTEGER,
	"rut_captador" TEXT,
	PRIMARY KEY("rut_paciente"),
	FOREIGN KEY ("id_prevision") REFERENCES "prevision"("id_prevision")
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY ("rut_captador") REFERENCES "captador"("rut_captador")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE rol (
	"id_rol" INTEGER NOT NULL,
	"nombre" TEXT NOT NULL UNIQUE,
	"descripcion" TEXT,
	PRIMARY KEY("id_rol")
);

CREATE TABLE usuario (
	"id_usuario" INTEGER NOT NULL,
	"nombre_usuario" TEXT NOT NULL UNIQUE,
	"hash_contrasena" TEXT NOT NULL,
	"nombre_completo" TEXT NOT NULL,
	"estado" INTEGER NOT NULL CHECK(estado IN (0, 1)),
	"id_rol" INTEGER NOT NULL,
	PRIMARY KEY("id_usuario"),
	FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE permiso (
	"id_permiso" INTEGER NOT NULL,
	"nombre" TEXT NOT NULL UNIQUE,
	"descripcion" TEXT,
	PRIMARY KEY("id_permiso")
);

CREATE TABLE rol_permiso (
	"id_rol" INTEGER NOT NULL,
	"id_permiso" INTEGER NOT NULL,
	PRIMARY KEY("id_rol", "id_permiso"),
	FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol")
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY ("id_permiso") REFERENCES "permiso"("id_permiso")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE receta (
	"id_receta" INTEGER NOT NULL,
	"fecha" DATE NOT NULL,
	"esf_ojo_izquierdo" REAL,
	"cil_ojo_izquierdo" REAL,
	"eje_ojo_izquierdo" INTEGER,
	"esf_ojo_derecho" REAL,
	"cil_ojo_derecho" REAL,
	"eje_ojo_derecho" INTEGER,
	"dp" REAL,
	"add" REAL,
	"observaciones" TEXT,
	"diagnostico" TEXT,
	"rut_paciente" TEXT NOT NULL,
	"id_usuario" INTEGER NOT NULL,  -- <-- CONEXIÓN AÑADIDA: Une la receta con el usuario que la emitió
	PRIMARY KEY("id_receta"),
	FOREIGN KEY ("rut_paciente") REFERENCES "paciente"("rut_paciente")
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE garantia (
	"id_garantia" INTEGER NOT NULL,
	"id_receta_origen" INTEGER NOT NULL UNIQUE,
	"id_receta_reemplazo" INTEGER UNIQUE,
	"fecha_inicio" DATE NOT NULL,
	"estado" TEXT NOT NULL CHECK(estado IN ('Vigente', 'Usada', 'Caducada')),
	PRIMARY KEY("id_garantia"),
	FOREIGN KEY ("id_receta_origen") REFERENCES "receta"("id_receta")
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY ("id_receta_reemplazo") REFERENCES "receta"("id_receta")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE historial_accion (
	"id_historial" INTEGER NOT NULL,
	"id_usuario" INTEGER NOT NULL,
	"accion" TEXT NOT NULL,
	"fecha_hora" DATETIME NOT NULL,
	"detalle" TEXT,
	PRIMARY KEY("id_historial"),
	FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario")
	ON UPDATE NO ACTION ON DELETE NO ACTION
);