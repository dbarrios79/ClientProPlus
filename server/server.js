const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/clientpro', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conexión exitosa a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Definir el esquema y modelo de usuario
const userSchema = new mongoose.Schema({
  nombre: String,
  cedula: String,
  username: String,
  password: String
});

const User = mongoose.model('User', userSchema);

// Configurar body-parser para manejar solicitudes POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ruta para servir los archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Ruta para servir el archivo HTML
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/crear_usuario.html', (req, res) => {
    res.sendFile(__dirname + '/public/crear_usuario.html');
});

// Ruta para manejar la creación de un usuario
app.post('/signup', async (req, res) => {
    const { nombre, cedula, username, password } = req.body;
    try {
        const newUser = new User({ nombre, cedula, username, password });
        await newUser.save();
        console.log(`Usuario creado: ${nombre}, Cédula: ${cedula}, Usuario: ${username}`);
        res.send('Usuario creado correctamente');
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).send('Error al crear el usuario');
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
