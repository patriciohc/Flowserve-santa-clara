'use strict'

// consulta base de datos sqlServer
const EIS = require("./EIS.js");
// lectura de archivos de directorios y archivos de texto
const fs = require('fs');
const util = require('util');
const iconvlite = require('iconv-lite');
// lectura de excel
const XLSX = require('xlsx');
const excel = require('../excel')

//const dirFiles = "E:/datos_txt"
const dirFacturas = "./datos_txt";
const dirFacturasNacionales = "./timbradas";
const dirFacturasTimbradas = "./timbradas";

var io; // websockets
var watch;

// carga informacion del excel en formato json
var jsonExcel = (function(){
    var workbook = XLSX.readFile("./info_excel/Copy_of_BACKLOG-EPO_002.xlsx");
    //return excel.readExcel(workbook);
    var sheets = excel.readExcel(workbook);
    return sheets[0];
})();

// determina si un txt tiene A1 en su nombre
function Isprocessed(fileName) {
    var isProsesada = fileName.split("_");
    isProsesada = isProsesada[isProsesada.length-1];
    if (isProsesada == "A1.txt")
        return true;
    else
        return false;
}

/** esta a la eschucha de nuevos txt en el directorios de faturas */
var txtPendientesParaProcesar = [];
function callBackWatchFs(eventType, filename) {
    if (Isprocessed(filename)) return;
    if (eventType == "rename") {
        if (fs.existsSync(dirFacturas + "/" +filename)) {
            console.log("inicio-> " + filename);
            procesarTxt(filename, dirFacturas)
            .then(function (newFile) {
                console.log("termino-> " + newFile);
                var txt = getNumFacturasTxt(newFile, dirFacturas);
                io.emit('newTxt', txt);
            })
            .catch(function (err) {
                if (err.code == 'EBUSY') {
                    txtPendientesParaProcesar.push(filename + "|" + "1");
                }
            });
        }
    } else {
        var item = txtPendientesParaProcesar.find(item => item.split("|")[0] == filename);
        if (!item) return;
        var indexFile = txtPendientesParaProcesar.indexOf(item);
        var archivo = txtPendientesParaProcesar[indexFile].split("|")[0];
        var stage = txtPendientesParaProcesar[indexFile].split("|")[1];
        if (stage == "1") {
            txtPendientesParaProcesar[indexFile] = archivo + "|" + "2";
        } else if (stage == "2") {
            txtPendientesParaProcesar.splice( indexFile, 1 );
            if (fs.existsSync(dirFacturas + "/" +filename)) {
                procesarTxt(filename, dirFacturas).then( function (newFile){
                    console.log("termino-> " + newFile);
                    var txt = getNumFacturasTxt(newFile, dirFacturas)
                    io.emit('newTxt', txt);
                });
            }
        }
    }
}
/** procesa los txt que se encuentran en el directorio */
function procesarDirectorio() {
    var list = fs.readdirSync(dirFacturas);
    var arrayPromises = [];
    for (var i in list) {
        if (Isprocessed(list[i])) {
            continue;
        } else {
            arrayPromises.push(procesarTxt(list[i], dirFacturas));
        }
    }
    return Promise.all(arrayPromises);
};
// procesar archivos txt en directorio de trabajo y pone a la escuha de nuevos txt
(function() {
    if (watch) {
        watch.close();
        watch = null;
        txtPendientesParaProcesar = [];
    }
    procesarDirectorio().then(() => {
        watch = fs.watch(dirFacturas, {encoding: 'utf8'}, callBackWatchFs);
    }).catch(err => {
        if (err.code == 'EISDIR')
            watch = fs.watch(dirFacturas, {encoding: 'utf8'}, callBackWatchFs);
        else
            console.log(err);
    });
})();
/**
* separa en facturas nacionales y extranjeras, en las facturas extranjeras agrega
* la informacion requerida, las facturas nacionales las guarda en un nuevo txt
* @param {string} nameTxt - nombre completo del archivo txt
* @param {string} dir - directorio
*/
function procesarTxt(nameTxt, dir) {
    var factura = convertTxtToJson(dir + "/" + nameTxt);
    if (!factura) return new Promise((resolv) => resolv());
    if (factura.code) { // error
        return new Promise((resolv, reject) => reject(factura));
    }
    if (!factura.XXXINICIO.ExReceptorLugarRecep || !factura.XXXINICIO.ExReceptorLugarRecep.Pais){
        console.log("no se encontro el pais o el formano no es valido");
        return new Promise((resolv, reject) => resolv("formato valido"));
    }
    if (factura.XXXINICIO.ExReceptorLugarRecep.Pais == "MEXICO") {
        writeFile(factura, nameTxt, dirFacturasNacionales);
        if (fs.existsSync(dirFacturas + "/" + nameTxt)) {
            fs.unlinkSync(dirFacturas + "/" + nameTxt);
        }
        return new Promise((resolv) => resolv("factura nacional"));
    } else {
        return new Promise( function (resolv, reject) {
            var nombreExtranjeras = nameTxt.split(".")[0] + "_A1" + ".txt";
            addInfoFactura(factura);
            writeFile(factura, nombreExtranjeras, dirFacturas);
            if (fs.existsSync(dirFacturas + "/" + nameTxt)) {
                fs.unlinkSync(dirFacturas + "/" + nameTxt);
            }
            console.log("termino -> " + nameTxt);
            resolv("success");
        });
    }
}

/**
* agrega la informacion requerida para facturas extranjeras
* @param {Array} - array de facturas
* @return {Promise} promises
*/
function addInfoFactura(factura) {
    //var promises = []
    addSeccionManual(factura);
    if (!factura.XXXINICIO.Detalle) {
        return new Promise((resolv, reject) => resolv("formato no valido"));
    }
    complementarInfoPrductos(factura.XXXINICIO.Detalle);
    //return Promise.all(promises);
}
/**
* procesa el txt y regresa un json con las facturas que contiene
* @param {string} nameFile - nombre completo de archivo
*/
function convertTxtToJson(nameFile) {
    var secctionToJson = function(texto) {
        var bloques = texto.split("\r\n\r\n")
        .map( item => {
            var elementos = item.split("\r\n");
            var dic = {};
            for (var i = 0; i < elementos.length; i++) {
                var item = elementos[i].trim();
                if (item == "") continue;
                var key = item.split(" ")[0];
                var value = item.substring(key.length, item.length).trim();
                if (value == "Detalle") {
                    i++;
                    var infoHead = procesarHead(elementos[i].trim());
                    var rows = [];
                    while(++i < elementos.length)
                        rows.push(procesarRow(elementos[i], infoHead));
                    dic.Detalle =  { head: infoHead, rows: rows } ;
                } else {
                    dic[key] = value;
                }
            }
            return dic;
        });

        var seccionProcesada = {};
        for (var i in bloques) {
            var bloque = bloques[i];
            var seccion = bloque["================"];
            if (seccion) {
                seccionProcesada[seccion] = bloque;
            } else {
                if (bloque.Detalle) {
                    seccionProcesada.Detalle = bloque.Detalle;
                }
            }
        }
        return seccionProcesada;
    };

    if(!fs.existsSync(nameFile)) return [];
    try {
        var texto = fs.readFileSync(nameFile);
        texto = iconvlite.decode(texto, ' ISO-8859-1');
    } catch(err) {
        return err;
    }
    if (!texto) return [];

    var facturas = texto.split("XXXINICIO");
    facturas = facturas.filter(item => item.trim() != "");
    var secciones = facturas[0].split("XXXFINDETA");
    if (secciones.length != 2) { // estructura no valida
        return {code: 'no valid'};
    }
    var factura = {
         XXXINICIO: secctionToJson(secciones[0]),
         XXXFINDETA: secctionToJson(secciones[1]),
    }
    return factura;
}
/**
* agrega las claves para la informacion que se agregara manualmente
* @param {json} factura - factura
*/
function addSeccionManual(factura){
    var nuevosDatos = {
        "================" : "cce",
        cceNExpConfiable: "",
        cceCertOrig: "",
        cceNCertOrig: "",
        cceVersion: "1.1",
        cceTipoOp: "Exportacion",
        cceClavePed: "A1",
    }
    // busca si ya fueron agregados los nuevos datos
    if (!factura.XXXINICIO.cce)
        factura.XXXINICIO.cce = nuevosDatos;
}
/**
* dentro de cada factura hay un aparatado donde se encuetran los productos con
* con su descripcion en forma de columnas, esta funcion procesa el nombre de
* las columnas
* @param {string} linea - linea de texto
* @return {json} array de json { nombre: nombre de la columna,
* posicion: numero de columna en la que se encuentra dentro del txt  }
*/
function procesarHead(linea){
    var head = [];
    var array = linea.split(" ")

    array = array.filter((a,b,c) =>{return c.indexOf(a,b+1)<0});
    array = array.filter( item => item != "");
    for (var i in array) {
        var item = array[i];
        var indexTmp = array[i].indexOf("|");
        if (indexTmp != -1)
            item = item.substring(0, indexTmp);
        var itemHead = {
            nombre: array[i],
            posicion: linea.search(item)
        }
        head.push(itemHead);
    }
    return head;
}
/**
* dentro de cada factura hay un aparatado donde se encuetran los productos con
* con su descripcion en forma de columnas, esta funcion procesa cada producto
* @param {string} linea - linea de texto
* @return {json}
*/
function procesarRow(linea, head){
    var row = {};
    for (var i = 0; i < head.length - 1; i++){
        var inicio = head[i].posicion;
        var fin = head[i + 1].posicion;
        row[head[i].nombre] = linea.substring(inicio, fin).trim();
    }
    row[head[head.length-1].nombre] = linea.substring(head[head.length-1].posicion, linea.length).trim();
    return row;
}
/**
* guarda el texto en un archivo
* @param {string} facturas - facturas en json
* @param {string} nombreTxt - nmbre del archivo
* @param {string} directorio - directorio donde se guardara
*/
function writeFile(factura, nombreTxt, directorio) {
    var white = "                                                                                                                        ";
    var texto = "";
    if (!factura) {
        return new Promise( (resolve, reject) => resolve("noData"));
    }
    var seccionToTxt = function (seccion) {
        var texto = "";
        for (var key in seccion) {
            var value = seccion[key];
            texto += key
                + white.substring(0, 17 - key.length)
                + seccion[key] + "\r\n";
        }
        return texto += "\r\n";
    }
    var mainSeccionToTxt = function (seccion) {
        var texto = "";
        for(var key in seccion) {
            var subSeccion = seccion[key];
            switch (key) {
                case "Totales":
                    //texto += "\r\n\r\n\r\n";
                    texto += seccionToTxt(subSeccion);
                    break;
                case "Detalle":
                    texto += "================"
                        + white.substring(0, 17 - "================".length)
                        + "Detalle" + "\r\n";
                    texto += convertProductosJsonToTxt(subSeccion) + "\r\n";
                    break;
                default:
                    texto += seccionToTxt(subSeccion);
            }
        }
        return texto;
    }

    texto += "\r\nXXXINICIO\r\n";
    texto += mainSeccionToTxt(factura.XXXINICIO);
    texto += "\r\n\r\nXXXFINDETA\r\n";
    texto += mainSeccionToTxt(factura.XXXFINDETA);

    texto = iconvlite.encode(texto, ' ISO-8859-1');
    fs.writeFileSync(directorio + "/" + nombreTxt, texto);
}
/**
* convierte lo productos que se encuentran en formato json a texto para ser escritos
* en el text
* @param {json} productos - productos
*/
function convertProductosJsonToTxt(productos) {
    var white = "                                                                                                                                                                                                                                                                                          ";
    var texto = "";
    for (var i = 0; i < productos.head.length-1; i++) {
        var espcioDisponible = productos.head[i+1].posicion - productos.head[i].posicion;
        texto += productos.head[i].nombre
            + white.substring(0, espcioDisponible - productos.head[i].nombre.length);
    }
    texto += productos.head[productos.head.length-1].nombre;
    texto += "\r\n";
    for (var i = 0; i < productos.rows.length; i++) {
        var row = productos.rows[i];
        for (var j = 0; j < productos.head.length-1; j++) {
            var keys = Object.keys(row)
            var espcioDisponible = productos.head[j+1].posicion - productos.head[j].posicion;
           // var value = row[keys[j]].toString();
              var value = "";
            if (row[keys[j]])
                value = row[keys[j]].toString();
            texto += value + white.substring(0, espcioDisponible - value.length);
        }
        texto += row[keys[keys.length-1]];
        texto += "\r\n";
    }
    return texto;
}
/**
* complementa la informacion que se requiere para cada producto
* @param {json} producto - producto
* @param {json} head - descripcion de las columnas
*/
function complementarInfoPrducto(producto, head) {

    var codigo = producto.VlrCodigo

    var infoExcel = jsonExcel.data.find(elemento => elemento.ODV_Num.trim() == codigo.trim())
    || { DESCRIPCION_EN_ESPAnOL: "", DESCRIPCION_EN_INGLES: "", FRACCION: "" };
    var match = {cceDescES: "Descripcion_Espanol", cceFraccion: "FRACCION_ARANCELARIA"};
    var comentarios;
    var checkItemExcel = function(key, esPirmero) {
        var tmp = head.find( item => item.nombre == key );
        if (!tmp && esPirmero) {
            comentarios = head.pop();
            head.push({ nombre: key, posicion: head[head.length - 1].posicion + 60 });
        } else if (!tmp) {
            head.push({ nombre: key, posicion: head[head.length - 1].posicion + 100 });
        }
        if (!producto.hasOwnProperty(key))
            producto[key] = infoExcel[match[key]];
    }

    var checkItemVacio = function(key) {
        var tmp = head.find( item => item.nombre == key );
        if (!tmp) {
            head.push({ nombre: key, posicion: head[head.length - 1].posicion + 60 })
        }
        if (!producto.hasOwnProperty(key))
            producto[key] = ""
    }
    // datos excel
    checkItemExcel("cceDescES", true);// descripcion español
    //checkItemExcel("cceDescEN");// descripcion ingles
    checkItemExcel("cceFraccion");// fraccion
    // campos vacios
    checkItemVacio("cceMarca");
    checkItemVacio("cceModelo");
    checkItemVacio("cceSerie");

    if (comentarios)
        head.push({ nombre: comentarios.nombre, posicion: head[head.length - 1].posicion + 50 });
}
/**
* complementa la informacion para los productos recibidos
* @param {json} productos - array de productos
* @param {Array} arrayPromises - debido a que se ejecutan consultas sqlServer
* asincronas, es necesario para determinar el momento en que se han ejecutado todas
*/
function complementarInfoPrductos(productos){
    for (var i in productos.rows) {
        var p = productos.rows[i];
        complementarInfoPrducto(p, productos.head);
        //var promise = EIS.getDatos(p.VlrCodigo1).then(function(datos){
        //    p.cceMarca = datos.marca;
        //    p.cceModelo = datos.modelo;
        //});
        //arrayPromises.push(promise);
    }
}

// comprueba si el nombre de archivo es valido
function testNameTxt(nameTxt) {
    var partsTxt = nameTxt.split("_");
    if (partsTxt.length != 3 && partsTxt.length != 4) {
        return false;
    } else {
        return true;
    }
}

/**
* regresa las facturas en el txt
*/
function getFacturas(req, res) {
    console.log("getFacturas");
    var itemXPage = parseInt(req.query.imteXPage);
    var page = parseInt(req.query.page);
    if (isNaN(itemXPage) || isNaN(page))
        return res.status(404).send({message: "datos no validos"});

    var dir = "";
    if (req.query.directorio == "pendientes")
        dir = dirFacturas;
    else if (req.query.directorio == "timbradas")
        dir = dirFacturasTimbradas;
    else
        return res.status(404).send({message:"directorio no valido"});

    var list = fs.readdirSync(dirFacturas);
    var listStat = [];
    for (var i = 0; i < list.length; i++) {

        if (!testNameTxt(list[i])) continue;

        var stat = fs.statSync(dirFacturas + "/" + list[i]);
        if (!stat.isFile()) continue;
        var info = util.inspect(stat);
        listStat.push({
            nameTxt: list[i],
            birthtime: info.birthtime,
        });
    }

    if (itemXPage*page > listStat.length)
        return res.status(200).send([]);

    listStat.sort((a,b) => {
        if (a.birthtime.getTime() < a.birthtime.getTime() ) return -1;
        else if (a.birthtime.getTime() > a.birthtime.getTime() ) return 1;
        else return 0;
    });

    var facturas = [];
    var inicio = itemXPage*page;
    for (var i = inicio; i < listStat.length; i++) {
        if (Isprocessed(listStat[i].nameTxt)) {
            var factura = convertTxtToJson(dir + "/" + listStat[i].nameTxt);
            if (!factura || factura.code || factura.length == 0) continue;
            facturas.push({
                nameTxt: listStat[i].nameTxt,
                data: factura
            });
        }
    }

    res.status(200).send(facturas);
}
/**
* regresa las facturas en el txt
*/
function reProcesarTxt(req, res) {
    console.log("reProcesarTxt");
    jsonExcel = cargaDeExcel();
    if (watch) {
        watch.close();
        watch = null;
        txtPendientesParaProcesar = [];
    }
    var list = fs.readdirSync(dirFacturas);
    var arrayPromises = [];
    for (var i in list) {
        if (!Isprocessed(list[i])) {
            continue;
        } else {
            var tmp = list[i].split(".")[0];
            tmp = tmp.split("_");
            tmp.splice(tmp.length-1, 1);
            var name = tmp.join("_") + ".txt";
            fs.renameSync(dirFacturas + "/" + list[i], dirFacturas + "/" + name);
        }
    }

    procesarDirectorio().then(() => {
        watch = fs.watch(dirFacturas, {encoding: 'utf8'}, callBackWatchFs);
        return res.status(200).send({message: "success"});
    }).catch(err => {
        console.log(err);
        return res.status(500).send(err);
    });
}
/**
* guardas las facturas en el txt
*/
function guardarTxt(req, res){
    var facturas = req.body.data;
    var nameTxt = req.body.nameTxt;
    console.log("Guardar -> " + nameTxt);
    if (!facturas)
        res.status(200).send({message: "no hay facturas por guardar"});

    writeFile(facturas, nameTxt, dirFacturas)
    res.status(200).send({message: "success"});
}
/**
* turnar
*/
function timbrar(req, res) {
    var nameTxt = req.body.nameTxt;
    console.log("timbrar -> " + nameTxt);
    fs.renameSync(dirFacturas + "/" + nameTxt, dirFacturasTimbradas + "/" + nameTxt);
    return res.status(200).send({message:"success"});
}
/**
* reeditar, regresa de facturas timbradas a facturas pendientes
* @param {string} nameTxt - nombre del txt timbrado
*/
function reEditar(req, res) {
    var nameTxts = req.body.nameTxts;
    console.log("reEditar: ");
    console.log(nameTxts);
    for (var i = 0; i < nameTxts.length; i++) {
        var nameTxt = dirFacturasTimbradas + "/" + nameTxts[i]
        if(fs.existsSync(nameTxt)){
            console.log("nameTxt -> " + nameTxt);
            fs.renameSync(nameTxt, dirFacturas + "/" + nameTxts[i]);
        }
    }
    return res.status(200).send({message:"success"});
}

function procesarCarpeta(req, res){
    procesarDirectorio();
    res.status(200).send();
}

function setSocketIO (socketIO) {
    io = socketIO;
}

module.exports = {
        reEditar,
        getFacturas,
        guardarTxt,
        timbrar,
        //tmp
        procesarCarpeta,
        setSocketIO,
        reProcesarTxt
}
