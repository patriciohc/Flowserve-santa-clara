
var sqlite = {
    dialect: 'sqlite',
    storage: './database.sqlite'
}

var sqlServer = {
    userName: 'TLXUser',
    password: 'Flowserve1*',
    server: 'kaldb5131',
    options: {
        port: 54187,
        database: "EISystem"
    },
    // If you're on Windows Azure, you will need this:
    //options: {encrypt: true}
};


module.exports = {
    sqlServer,
    sqlite
}
