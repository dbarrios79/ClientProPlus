const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const User = require('./models/user.js');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión
app.use(session({
  secret: 'mi_secreto', // Cambia esto a una cadena secreta y segura
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Cambia a true si usas HTTPS
}));

// Conexión a MongoDB
mongoose.connect('mongodb://localhost/ClientProPlus')
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('No se pudo conectar a MongoDB:', err));

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'register.html'));
});

app.post('/register_user', async (req, res) => {
  try {
    const { nombre, cedula, correo, username, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.send(`
        <script>
          alert('El nombre de usuario ya está registrado. Por favor, elige otro.');
          window.history.back();
        </script>
      `);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear un nuevo usuario y guardarlo en la base de datos
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // Redirigir a la página principal para iniciar sesión
    res.send(`
      <script>
        alert('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
        window.location.href = '/ClientProPlus';
      </script>
    `);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).send('Error al crear usuario');
  }
});

app.get('/information', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'informacion_adicional.html'));
});

app.post('/guardar_informacion_adicional', (req, res) => {
  console.log(req.body);
  res.send('Información adicional guardada correctamente');
});

app.get('/menu_principal', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'menu_principal.html'));
});

app.get('/crear_cliente', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'crear_cliente.html'));
});

app.get('/crear_usuario', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'crear_usuario.html'));
});

app.get('/interfaz_programa', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/'); // Redirigir a la página de inicio si el usuario no está autenticado
  }
  
  try {
    // Obtener el nombre del usuario
    const user = await User.findOne({ username: req.session.user });
    if (!user) {
      return res.redirect('/'); // Redirigir si no se encuentra el usuario
    }
    res.sendFile(path.join(__dirname, '../public', 'interfaz_programa.html'));
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).send('Error al obtener el usuario');
  }
});

app.get('/ClientProPlus', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'ClientProPlus.html'));
});

// Ruta para manejar el inicio de sesión
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('Usuario o contraseña no proporcionados');
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    // Buscar el usuario en la base de datos
    const user = await User.findOne({ username });
    if (!user) {
      console.log('Usuario no encontrado:', username);
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Contraseña incorrecta para usuario:', username);
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Guardar el usuario en la sesión
    req.session.user = user.username;

    // Redirigir al usuario a la página 'interfaz_programa.html'
    res.json({ redirectTo: '/interfaz_programa' });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

// Ruta para manejar el registro de usuarios desde ClientProPlus.html
app.post('/signup', async (req, res) => {
  try {
    const { 'new-username': username, 'new-password': password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear un nuevo usuario y guardarlo en la base de datos
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // Enviar un mensaje de éxito y redirigir a la página de crear usuario
    res.json({ message: 'Usuario registrado correctamente', redirectTo: '/crear_usuario' });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// Ruta para obtener el nombre del usuario
app.get('/api/username', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user });
  } else {
    res.status(401).json({ message: 'No autenticado' });
  }
});

// Ruta para obtener la lista de usuarios
app.get('/admin/lista-usuarios', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  try {
    const users = await User.find({}, 'username email cedula'); // Ajusta los campos según tu modelo
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Ruta para eliminar un usuario
app.delete('/admin/eliminar-usuario/:id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    res.send('Usuario eliminado exitosamente');
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).send('Error al eliminar usuario');
  }
});

// Nueva ruta para servir la página de administración de usuarios
app.get('/admin_usuarios', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/'); // Redirigir a la página de inicio si el usuario no está autenticado
  }
  res.sendFile(path.join(__dirname, '../public', 'admin_usuarios.html'));
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error al cerrar sesión');
    }
    res.redirect('/ClientProPlus'); // Redirigir a la página de inicio de sesión
  });
});