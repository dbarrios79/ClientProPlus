const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // Importar mongoose

const app = express();

// Servir archivos estáticos de la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal para servir el archivo 'index.html'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Conectar a MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/clientproplus', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB', err));

// Definir el esquema y modelo de usuario
const userSchema = new mongoose.Schema({
  name: String,
  email: String
});

const UserModel = mongoose.model('User', userSchema);

// Ruta para probar la base de datos
app.get('/test-db', async (req, res) => {
  try {
    const users = await UserModel.find(); // Obtener todos los usuarios
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});