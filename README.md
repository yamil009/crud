# Sistema de Gestión de Estudiantes

API RESTful para gestionar estudiantes con operaciones CRUD, desarrollada con Node.js, Express y MariaDB.

## Requisitos Previos

- Node.js (v14 o superior)
- MariaDB (v10.3 o superior)
- npm (incluido con Node.js)
- PM2 (opcional, para producción)

## Configuración Inicial

1. Clona este repositorio o descarga los archivos.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura la base de datos:
   - Asegúrate de que MariaDB esté en ejecución
   - Crea una base de datos llamada `escuela` o ajusta el nombre en `.env`
   - Importa el archivo `database.sql` o ejecuta las sentencias SQL manualmente

4. Configura las variables de entorno en el archivo `.env` según tu configuración de MariaDB.

## Estructura de la Base de Datos

La tabla `estudiantes` tiene los siguientes campos:
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `nombre` (VARCHAR)
- `cu` (VARCHAR) - Carnet Universitario
- `grupo` (VARCHAR)
- `celular` (VARCHAR)
- `gmail` (VARCHAR, UNIQUE)

## Endpoints de la API

### Crear un estudiante
- **Método:** POST
- **URL:** `/estudiantes`
- **Cuerpo (JSON):**
  ```json
  {
    "nombre": "Nombre del Estudiante",
    "cu": "2023001",
    "grupo": "A1",
    "celular": "12345678",
    "gmail": "correo@example.com"
  }
  ```

### Obtener todos los estudiantes
- **Método:** GET
- **URL:** `/estudiantes`

### Actualizar un estudiante
- **Método:** PUT
- **URL:** `/estudiantes/:id`
- **Cuerpo (JSON):** Igual que crear, con los campos a actualizar

### Eliminar un estudiante
- **Método:** DELETE
- **URL:** `/estudiantes/:id`

## Ejecución

### Modo desarrollo
```bash
npm start
```

### Modo producción con PM2
```bash
# Instalar PM2 globalmente (si no está instalado)
npm install -g pm2

# Iniciar la aplicación
pm2 start app.js --name="api-estudiantes"

# Ver logs
pm2 logs api-estudiantes

# Detener la aplicación
pm2 stop api-estudiantes
```

## Pruebas

Puedes probar la API usando herramientas como Postman, cURL o cualquier cliente HTTP.

### Ejemplo con cURL:

```bash
# Obtener todos los estudiantes
curl http://localhost:3000/estudiantes

# Crear un estudiante
curl -X POST -H "Content-Type: application/json" -d '{"nombre":"Nuevo Estudiante","cu":"2023004","grupo":"B2","celular":"87654321","gmail":"nuevo@example.com"}' http://localhost:3000/estudiantes

# Actualizar un estudiante (ejemplo ID=1)
curl -X PUT -H "Content-Type: application/json" -d '{"nombre":"Nombre Actualizado"}' http://localhost:3000/estudiantes/1

# Eliminar un estudiante (ejemplo ID=1)
curl -X DELETE http://localhost:3000/estudiantes/1
```

## Manejo de Errores

La API devuelve códigos de estado HTTP apropiados y mensajes de error en formato JSON cuando ocurre algún problema.

## Contribución

Siéntete libre de hacer un fork y enviar pull requests con mejoras o correcciones.

## Licencia

Este proyecto está bajo la Licencia MIT.
