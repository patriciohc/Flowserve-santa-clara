'use strict'

const sha1 = require('sha1');
// configuaraciones de las base de datos
const configDB = require('../configDB');
// modelos de la base de datos sequelize
const models = require('../models');
const services = require('../services');

function createUser(req, res) {

    var user = {
        name: req.body.name,
        userName: req.body.userName,
        area: req.body.area,
        password: sha1(req.body.password),
        rolUser: req.body.rolUser
    }

    models.User.create(user).then(function(user) {
        delete user.password;
        var token = services.createToken(user);
        return res.status(200).send({token: token, user: user});
    });
}

function login(req, res) {
    var pass = sha1(req.body.password);
    var user = req.body.userName;

    models.User.findOne({
        attributes: ['name', 'userName', 'area'],
        where: { userName: user, password: pass }
    })
    .then(function(user) {
        if (!user) return res.status(404).send({message: "no existe el usuario"});
        var token = services.createToken(user);
        return res.status(200).send({token: token, user: user});
    })
    .catch(function(err){
        console.log(err);
        return res.status(500).send({message: err});
    });
}

function obtainUsers(req, res){
    models.User.findAll({attributes:["id","name","userName","area","rolUser"]}).then(function(users) { 
        return res.status(200).send(users);
    });
}

function getInfoUsers(req, res){
    var id = req.body.id;
    models.User.findOne({
        attributes: ['name', 'userName', 'area', 'password', 'rolUser'],
        where: {id: id}
    })
    .then(function(user){
        if(!user) return res.status(404).send({message: "Error al intentar buscar"});
        return res.status(200).send({user});
    })
}

module.exports = {
    createUser,
    login,
    obtainUsers,
    getInfoUsers
};
