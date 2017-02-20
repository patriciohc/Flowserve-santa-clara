// middleware.js
var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('./config');

exports.ensureAuthenticated = function(req, res, next) {
    if(!req.headers.authorization) {
        return res.status(403).send({message: "Tu petición no tiene cabecera de autorización"});
    }

    var token = req.headers.authorization.split(" ")[1];
    if (!token)
        return res.status(401).send({message: "token no valido"});

    try {
        var payload = jwt.decode(token, config.TOKEN_SECRET);
    } catch(err){
        return res.status(401).send({message: "token no valido"});
    }

    if (!payload.exp)
        return res.status(401).send({message: "token no valido"});

    if(payload.exp <= moment().unix()) {
        return res.status(401).send({message: "El token ha expirado"});
    }

    req.rolUser = payload.sub;
    next();
}
