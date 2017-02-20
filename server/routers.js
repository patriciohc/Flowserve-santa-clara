'use strict'

const express = require('express');
const api = express.Router();
const users = require('./controllers/users');
const middleware = require('./middleware');
const facturas = require('./controllers/facturas');
// middleware.ensureAuthenticated,
// txt
api.get('/facturas/', middleware.ensureAuthenticated, facturas.getFacturas);
//api.get('/testDB/',facturas.testDB);
//api.post('/facturas/', facturas.getFacturas);
api.put('/facturas/', middleware.ensureAuthenticated, facturas.guardarTxt);
api.post('/timbrarFactura/', middleware.ensureAuthenticated, facturas.timbrar);
api.post('/reeditar/', middleware.ensureAuthenticated, facturas.reEditar);
api.get('/actualiarFacturas/', middleware.ensureAuthenticated, facturas.reProcesarTxt);

//api.get('/procesar/', facturas.procesarCarpeta); // temporal

// users
api.post('/user/', middleware.ensureAuthenticated, users.createUser); // crea un usuario
api.put('/user/', middleware.ensureAuthenticated, users.updateUsers); // actualiza un usuario
api.get('/user/', middleware.ensureAuthenticated, users.obtainUsers); // obtiene todos los usuarios
api.get('/user/:id/', middleware.ensureAuthenticated, users.getInfoUsers); // obtiene el usurio especificado en id
api.delete('/user/:id', middleware.ensureAuthenticated, users.deleteUser); // elimina el usuario espedifiaco en id

api.post('/login/', users.login);

module.exports = api;

module.exports = function(sockeIO) {
    facturas.setSocketIO(sockeIO);
    return api;
}
