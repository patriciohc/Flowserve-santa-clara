'use strict'

const express = require('express');
const api = express.Router();
const users = require('./controllers/users');
const middleware = require('./middleware');
const facturas = require('./controllers/facturas');
// middleware.ensureAuthenticated,
// txt
api.get('/listText/', middleware.ensureAuthenticated, facturas.getListTxt);
//api.get('/testDB/',facturas.testDB);
api.post('/facturas/', facturas.getFacturas);
api.put('/facturas/', middleware.ensureAuthenticated, facturas.guardarTxt);
api.post('/timbrarFactura/', middleware.ensureAuthenticated, facturas.timbrar);
api.post('/reeditar/', middleware.ensureAuthenticated, facturas.reEditar);
api.get('/procesar/', facturas.procesarCarpeta); // temporal

// users
api.post('/registroUsuarios/', users.createUser);
api.post('/login/', users.login);
api.get('/obtainUsers', users.obtainUsers);
api.post('/getInfoUsers/', users.getInfoUsers);

//api.get('/user/:id', controllers.getUser);
//api.get('/cat-atributo/:id', catProductoCtrl.getCatProducto);

module.exports = api;

module.exports = function(sockeIO) {
    facturas.setSocketIO(sockeIO);
    return api;
}
