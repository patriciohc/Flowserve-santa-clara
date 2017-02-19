// cotiene los datos del txt seleccionado de las lista de archivos pendientes
var listaTxt = {
    //nameTxt: null, // nombre del txt
    facturas: null, // facturas en json
    indexSelected: null, // factura seleccionada
};
// informacion de los usuario actualmente registrados
var usuariosRegistrados;

$('.login-input').on('focus', function() {
  $('.login').addClass('focused');
});

$('.login').on('submit', function(e) {
  e.preventDefault();
  $('.login').removeClass('focused').addClass('loading');
});

$(document).ready(function() {
    General.init();
    var infoUser = localStorage.getItem("infoUser");
    if (infoUser) {
        infoUser = JSON.parse(infoUser);
        $("#labelUser").html(infoUser.user.name);
        if (infoUser.user.rolUser == "admin")
            $("#idbtnReguser").show();
        else
            $("#idbtnReguser").show();
        $("body").css("background", "#F4F2F0");
        document.getElementById("idloguin").style.display = "none";
        document.getElementById("divPrincipal").style.display = "block";
        cargarFacturas();
    }
    $( "#loguinbtn" ).click(function() {
        logueo();
    });

     $( "#idbtnhideForms" ).click(function() {
        hideForms();
    });

    $("#idbtnSalir").click(function(){
        confirm();
    });

    $('#idSwitchHab').change(function() {
        swichForms();
    });

    // $('#idbtnReguser').click(function(){
    //    cargarUsuariosExis();
    // });
    cargarUsuariosExis();

    $('#idselectUsers').change(function(){
       infoUserSelect();
    });

    $('#btnDeletuser').click(function(){
       deleteUser();
    });

    $("#switchPasschange").change(function(){
       var chkPass = document.getElementById("switchPasschange");
        if(chkPass.checked)
            {
                $("#pwd").prop("disabled", false);
            }else{
                $("#pwd").prop("disabled", true);
                $("#pwd").val("");
            }
    });

    $("#idbtnAddUser").click(function(){
        saveuserNew();
    });

    $("#idbtnUpdateuser").click(function(){
        updateuser();
    });

    $.datepicker.regional['es'] = {
        closeText: 'Cerrar',
        prevText: '< Ant',
        nextText: 'Sig >',
        currentText: 'Hoy',
        monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        monthNamesShort: ['Ene','Feb','Mar','Abr', 'May','Jun','Jul','Ago','Sep', 'Oct','Nov','Dic'],
        dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        dayNamesShort: ['Dom','Lun','Mar','Mié','Juv','Vie','Sáb'],
        dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','Sá'],
        weekHeader: 'Sm',
        dateFormat: 'dd/mm/yy',
        firstDay: 1,
        isRTL: false,
        showMonthAfterYear: false,
        yearSuffix: ''
     };
    $.datepicker.setDefaults($.datepicker.regional['es']);

     $("#from").datepicker({
         dateFormat: 'dd-mm-yy',
         onClose: function (selectedDate) {
             $("#to").datepicker("option", "minDate", selectedDate);
        }
    });

    $("#to").datepicker({
        dateFormat: 'dd-mm-yy',
        onClose: function (selectedDate) {
            $("#from").datepicker("option", "maxDate", selectedDate);
        }
    })
    .on("change", function (e) {
        //console.log("Date changed: ", e.target.value);
        onchangeDate();
    });

    var urlServer = "http://localhost:8880";
    var socket = io.connect( urlServer, {"forceNew": true});
    socket.on('newTxt', agregarElementoListaTxt);

    $("#panelListaTxtPendientes").height($(window).height() - 110);
    $("#divListaTxt").height($("#panelListaTxtPendientes").height() - 100);

    $("#panelTablaFacturas").height($(window).height() - 110);
    $("#divTablaFacturas").height($("#panelTablaFacturas").height() - 100);

}); // fin ready

function salir(){
    localStorage.clear();
    $("body").css("background", "#333")
    $("#userid").val("");
    $("#passid").val("");
    document.getElementById("idloguin").style.display = "block";
    document.getElementById("divPrincipal").style.display = "none";
}

//funcion encargada de logueo
function logueo() {
    var usuario = $("#userid").val();
    var contraseña = $("#passid").val();
    var ObjPriData = {
        "userName":usuario,
        "password": contraseña
    };

    if ( usuario == "" || contraseña == "") {
        //alert("Debe completar los datos requeridos.");
        alertErrorLogin();
    }else{
    General.post("/api/login", ObjPriData)
    .then( result => {
        if (!result) {
            //alert('Error, verifique sus datos.');
            return;
        }
        $("#labelUser").html(result.user.name);
        if (result.user.rolUser == "admin")
            $("#idbtnReguser").show();
        else
            $("#idbtnReguser").hide();
        localStorage.setItem("infoUser", JSON.stringify(result));
        $("body").css("background", "#F4F2F0");
        document.getElementById("idloguin").style.display = "none";
        document.getElementById("divPrincipal").style.display = "block";
        cargarTxt();
    })
    .catch(err => {
         alertErrorLogin();
        //alert('Error, verifique sus datos.');
        // console.log(result.responseText);
        //window.location.href = 'index.html';
    });
   }
}

// agrega un nuevo elemento a la lista de txt
function agregarElementoListaTxt(txt) {
        var tableTxt = document.getElementById("ul-txt");
        var li = document.createElement("li")
        li.className="list-group-item item-list-txt";
        li.id = txt.nombre;
        li.style.cursor = "pointer";
        //li.style.height = "50px";
        li.onclick = onClickCargarFacturas;
        li.innerHTML = `<span>${txt.nombre}</span><span class='badge' id='badge_${txt.nombre}'>${txt.cantidad}</span>`;
        tableTxt.appendChild(li);
}
//funcion encargada de obtener txt a cargar en la lista de archivo pendientes
function cargarFacturas() {
    hideForms();
    // var getClassRow = function(factura) {
    //     var datosFaltantes = validarFactura(factura);
    //     if (datosFaltantes.length == 0) {
    //         return "bg-success";
    //     } else if (datosFaltantes.length < 7 ) {
    //         return "bg-warning";
    //     } else {
    //         return "bg-danger";
    //     }
    // }
    General.get("/api/facturas?directorio=pendientes&page=0&imteXPage=10")
    .then(function(result){
        var cuerpoTableFacturas = document.getElementById("idtbodyfac");
        cuerpoTableFacturas.innerHTML = "";
        if (result && result.length > 0) {
            listaTxt.facturas = result;
            for (i=0; i<result.length;i++) {
                var tr = document.createElement("tr");
                //tr.className = getClassRow(result[i]);
                tr.style.cursor = "pointer";
                tr.onclick = formularioData;
                tr.IndexData = i;

                var td = document.createElement("td");
                td.innerHTML=result[i].nameTxt;
                tr.appendChild(td);

                td = document.createElement("td");
                td.innerHTML=result[i].data.XXXINICIO.IdDoc.Serie;
                tr.appendChild(td);

                td = document.createElement("td");
                td.innerHTML=result[i].data.XXXINICIO.IdDoc.Folio;
                tr.appendChild(td);

                td = document.createElement("td");
                td.innerHTML=result[i].data.XXXINICIO.IdDoc.FechaEmis;
                tr.appendChild(td);
                cuerpoTableFacturas.appendChild(tr);
            }

        } else {
            $.alert({
                title: 'Alerta!',
                content: 'No hay archivos pendientes.!',
            });
        }
    })
    .catch(function (err){
        console.log(err);
        errorAlert();
    });
}

//funcion que carga las facturas del txt elegido en la tabla
function onClickCargarFacturas(){
    $(".item-list-txt").removeClass("active");
    $(this).addClass("active");
    txtSelected.nameTxt = this.id;
    cargarFacturas();
}

function actualiarFacturas() {
    General.get("/api/actualiarFacturas").then(result => {
        alertMensaje("se actualizo correctamente");
        $(".item-list-txt").removeClass("active");
        var cuerpoTableFacturas = document.getElementById("idtbodyfac");
        cuerpoTableFacturas.innerHTML = "";
        txtSelected = {
            nameTxt: null, // nombre del txt
            facturas: null, // facturas en json
            indexSelected: null, // factura seleccionada
        };
    }).catch(err =>{

        console.log(err);
    });
}

function validarFactura(factura) {
    var faltantes = [];
    if (factura.cce.cceVersion == "") faltantes.push("Version");
    if (factura.cce.cceTipoOp == "") faltantes.push("Tipo operación")
    if (factura.cce.cceClavePed == "") faltantes.push("Clave pediemento");
    if (factura.cce.cceNExpConfiable == "") faltantes.push("No. exportador confiable");
    if (factura.cce.cceCertOrig == "") faltantes.push("Certificado de origen");
    if (factura.cce.cceNCertOrig == "") faltantes.push("No. de certificador de origen");

    var bloque = factura.receptor.find( item => item.hasOwnProperty("productos"));
    var rows = [];
    if (bloque)
        rows = bloque.productos.rows;
    if (rows){
        var ban = false;
        var keys = ["cceDescES", "cceDescEN", "cceFraccion", "cceMarca", "cceModelo", "cceSerie"];
        for (var i = 0; i < rows.length; i++) {
            var item = rows[i];
            for (var j in keys){
                var clave = keys[j];
                if (item[clave].trim() == ""){
                    ban = true;
                    faltantes.push("Datos en productos");
                    break;
                }
            }
            if (ban) break;
        }
    }
    return faltantes;
}

//mostrar formularios
function formularioData(){
    listaTxt.indexSelected = this.IndexData
    var datos = listaTxt.facturas[listaTxt.indexSelected].data.XXXINICIO;
    // datos encabezado
    $("#txtEncNumInter").val(datos.IdDoc.NumeroInterno);
    $("#txtEncNumApro").val(datos.IdDoc.NroAprob);
    $("#txtEncAñoAprobacion").val(datos.IdDoc.AnoAprob);
    $("#txtEncTipo").val(datos.IdDoc.Tipo);
    $("#txtEncSerie").val(datos.IdDoc.Serie);
    $("#txtEncFolio").val(datos.IdDoc.Folio);
    $("#txtEncFechaEmision").val(datos.IdDoc.FechaEmis);
    $("#txtEncFormaPago").val(datos.IdDoc.FormaPago);
    $("#txtEncCondicionesPago").val(datos.IdDoc.CondPago);
    $("#txtEncTerminoPago").val(datos.IdDoc.TermPagoDias);
    $("#txtEncFechaVencimiento").val(datos.IdDoc.FechaVenc);

    // datos emisor col 1
    $("#txtEmiRFC").val(datos.ExEmisor.RFCEmisor);
    $("#txtEmiNombreEmisor").val(datos.ExEmisor.NmbEmisor);
    $("#txtEmiTipoCod").val(datos.ExEmisor.TpoCdgIntEmisor1);
    $("#txtEmiCod").val(datos.ExEmisor.CdgIntEmisor1);
    $("#txtEmiSucursal").val(datos.ExEmisor.Sucursal);
    //CdgVendedor
    // col 2
    $("#txtEmiD1Calle").val(datos.ExEmisorDomFiscal.Calle);
    $("#txtEmiD1NumExt").val(datos.ExEmisorDomFiscal.NroExterior);
    $("#txtEmiD1NumInt").val(datos.ExEmisorDomFiscal.NroInterior);
    $("#txtEmiD1Colonia").val(datos.ExEmisorDomFiscal.Colonia);
    $("#txtEmiD1Municipio").val(datos.ExEmisorDomFiscal.Municipio);
    $("#txtEmiD1Estado").val(datos.ExEmisorDomFiscal.Estado);
    $("#txtEmiD1Pais").val(datos.ExEmisorDomFiscal.Pais);
    $("#txtEmiD1CP").val(datos.ExEmisorDomFiscal.CodigoPostal);
    // col 3
    $("#txtEmiD2Calle").val(datos.ExEmisorLugarExped.Calle);
    $("#txtEmiD2NumExt").val(datos.ExEmisorLugarExped.NroExterior);
    $("#txtEmiD2NumInt").val(datos.ExEmisorLugarExped.NroInterior);
    $("#txtEmiD2Colonia").val(datos.ExEmisorLugarExped.Colonia);
    $("#txtEmiD2Municipo").val(datos.ExEmisorLugarExped.Municipio);
    $("#txtEmiD2Estado").val(datos.ExEmisorLugarExped.Estado);
    $("#txtEmiD2Pais").val(datos.ExEmisorLugarExped.Pais);
    $("#txtEmiD2CP").val(datos.ExEmisorLugarExped.CodigoPostal);

    //datos receptor
    $("#txtRecepRFC").val(datos.ExReceptor.RFCRecep);
    $("#txtRecepNombre").val(datos.ExReceptor.NmbRecep);
    $("#txtRecepCodGLN").val(datos.ExReceptor.CdgGLNRecep);
    $("#txtRecepTipoCod").val(datos.ExReceptor.TpoCdgIntRecep1);
    $("#txtRecepCodInter").val(datos.ExReceptor.CdgIntRecep1);
    $("#txtRecepCodCliente").val(datos.ExReceptor.CdgCliente);
    // col 2
    $("#txtRecepD1Calle").val(datos.ExReceptorDomFiscal.Calle);
    $("#txtRecepD1NumExt").val(datos.ExReceptorDomFiscal.NroExterior);
    $("#txtRecepD1NumInt").val(datos.ExReceptorDomFiscal.NroInterior);
    $("#txtRecepD1Colonia").val(datos.ExReceptorDomFiscal.Colonia);
    $("#txtRecepD1Localidad").val(datos.ExReceptorDomFiscal.Localidad);
    $("#txtRecepD1Referencia").val(datos.ExReceptorDomFiscal.Referencia);
    $("#txtRecepD1Municipio").val(datos.ExReceptorDomFiscal.Municipio);
    $("#txtRecepD1Estado").val(datos.ExReceptorDomFiscal.Estado);
    $("#txtRecepD1Pais").val(datos.ExReceptorDomFiscal.Pais);
    $("#txtRecepD1CP").val(datos.ExReceptorDomFiscal.CodigoPostal);
    // col 3
    $("#txtRecepD2Calle").val(datos.ExReceptorLugarRecep.Calle);
    $("#txtRecepD2NumExt").val(datos.ExReceptorLugarRecep.NroExterior);
    $("#txtRecepD2NumInt").val(datos.ExReceptorLugarRecep.NroInterior);
    $("#txtRecepD2Colonia").val(datos.ExReceptorLugarRecep.Colonia);
    $("#txtRecepD2Localidad").val(datos.ExReceptorLugarRecep.Localidad);
    $("#txtRecepD2Referencia").val(datos.ExReceptorLugarRecep.Referencia);
    $("#txtRecepD2Municipio").val(datos.ExReceptorLugarRecep.Municipio);
    $("#txtRecepD2Estado").val(datos.ExReceptorLugarRecep.Estado);
    $("#txtRecepD2Pais").val(datos.ExReceptorLugarRecep.Pais);
    $("#txtRecepD2CP").val(datos.ExReceptorLugarRecep.CodigoPostal);
    $("#txtRecepD2NumPago").val(datos.ExReceptorLugarRecep.NumCtaPago);
    $("#txtRecepD2MetodoPago").val(datos.ExReceptorLugarRecep.methodoDePago);
    //$("#txtRecepD2NumPago").val(dato.ExReceptorLugarRecep.);

    $("#txt_cceVersion").val(datos.cce.cceVersion);
    $("#txt_cceTipoOp").val(datos.cce.cceTipoOp);
    $("#txt_cceClavePed").val(datos.cce.cceClavePed);
    $("#txt_cceNExpConfiable").val(datos.cce.cceNExpConfiable);
    $("#txt_cceCertOrig").val(datos.cce.cceCertOrig);
    $("#txt_cceNCertOrig").val(datos.cce.cceNCertOrig);

    // datos productos
    var productos = datos.Detalle;
    var tb = document.getElementById("tbSku");
    tb.innerHTML = "";
    if (!productos) return; // no hay apartado de productos
    for (var i in productos.rows) {
        var p = productos.rows[i];
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.innerHTML = p.VlrCodigo;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceDescES;
        tr.appendChild(td);
        // td = document.createElement("td");
        // td.innerHTML = p.cceDescEN;
        // tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceFraccion;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceMarca;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceModelo;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceSerie;
        td.setAttribute("contenteditable", "true");
        tr.appendChild(td);

        tb.appendChild(tr);
    }

    $("#idcontenedorestxt").css("display", "none");
    $("#idformulario").css("display", "");
}

// toma los datos de las cajas de texto y los asigna al json de facturas correspondiente
function setDatosFactura(){
    var datos = listaTxt.facturas[listaTxt.indexSelected].data.XXXINICIO;
    // datos encabezado
    datos.IdDoc.NumeroInterno = $("#txtEncNumInter").val()
    datos.IdDoc.NroAprob = $("#txtEncNumApro").val()
    datos.IdDoc.AnoAprob = $("#txtEncAñoAprobacion").val()
    datos.IdDoc.Tipo = $("#txtEncTipo").val()
    datos.IdDoc.Serie = $("#txtEncSerie").val()
    datos.IdDoc.Folio = $("#txtEncFolio").val()
    datos.IdDoc.FechaEmis = $("#txtEncFechaEmision").val()
    datos.IdDoc.FormaPago = $("#txtEncFormaPago").val()
    datos.IdDoc.CondPago = $("#txtEncCondicionesPago").val()
    datos.IdDoc.TermPagoDias = $("#txtEncTerminoPago").val()
    datos.IdDoc.FechaVenc = $("#txtEncFechaVencimiento").val();

    // datos emisor col 1
    datos.ExEmisor.RFCEmisor = $("#txtEmiRFC").val();
    datos.ExEmisor.NmbEmisor = $("#txtEmiNombreEmisor").val();
    datos.ExEmisor.TpoCdgIntEmisor1 = $("#txtEmiTipoCod").val();
    datos.ExEmisor.CdgIntEmisor1 = $("#txtEmiCod").val();
    datos.ExEmisor.Sucursal = $("#txtEmiSucursal").val();
    //CdgVendedor
    // col 2
    datos.ExEmisorDomFiscal.Calle = $("#txtEmiD1Calle").val();
    datos.ExEmisorDomFiscal.NroExterior = $("#txtEmiD1NumExt").val();
    datos.ExEmisorDomFiscal.NroInterior = $("#txtEmiD1NumInt").val();
    datos.ExEmisorDomFiscal.Colonia = $("#txtEmiD1Colonia").val();
    datos.ExEmisorDomFiscal.Municipio = $("#txtEmiD1Municipio").val();
    datos.ExEmisorDomFiscal.Estado = $("#txtEmiD1Estado").val();
    datos.ExEmisorDomFiscal.Pais = $("#txtEmiD1Pais").val();
    datos.ExEmisorDomFiscal.CodigoPostal = $("#txtEmiD1CP").val();
    // col 3
    datos.ExEmisorLugarExped.Calle = $("#txtEmiD2Calle").val();
    datos.ExEmisorLugarExped.NroExterior = $("#txtEmiD2NumExt").val();
    datos.ExEmisorLugarExped.NroInterior = $("#txtEmiD2NumInt").val();
    datos.ExEmisorLugarExped.Colonia = $("#txtEmiD2Colonia").val();
    datos.ExEmisorLugarExped.Municipio = $("#txtEmiD2Municipo").val();
    datos.ExEmisorLugarExped.Estado = $("#txtEmiD2Estado").val();
    datos.ExEmisorLugarExped.Pais = $("#txtEmiD2Pais").val();
    datos.ExEmisorLugarExped.CodigoPostal = $("#txtEmiD2CP").val();

    //datos receptor
    datos.ExReceptor.RFCRecep = $("#txtRecepRFC").val();
    datos.ExReceptor.NmbRecep = $("#txtRecepNombre").val();
    datos.ExReceptor.CdgGLNRecep = $("#txtRecepCodGLN").val();
    datos.ExReceptor.TpoCdgIntRecep1 = $("#txtRecepTipoCod").val();
    datos.ExReceptor.CdgIntRecep1 = $("#txtRecepCodInter").val();
    datos.ExReceptor.CdgCliente = $("#txtRecepCodCliente").val();
    // col 2
    datos.ExReceptorDomFiscal.Calle = $("#txtRecepD1Calle").val();
    datos.ExReceptorDomFiscal.NroExterior = $("#txtRecepD1NumExt").val();
    datos.ExReceptorDomFiscal.NroInterior = $("#txtRecepD1NumInt").val();
    datos.ExReceptorDomFiscal.Colonia = $("#txtRecepD1Colonia").val();
    datos.ExReceptorDomFiscal.Localidad = $("#txtRecepD1Localidad").val();
    datos.ExReceptorDomFiscal.Referencia = $("#txtRecepD1Referencia").val();
    datos.ExReceptorDomFiscal.Municipio = $("#txtRecepD1Municipio").val();
    datos.ExReceptorDomFiscal.Estado = $("#txtRecepD1Estado").val();
    datos.ExReceptorDomFiscal.Pais = $("#txtRecepD1Pais").val();
    datos.ExReceptorDomFiscal.CodigoPostal = $("#txtRecepD1CP").val();
    // col 3
    datos.ExReceptorLugarRecep.Calle = $("#txtRecepD2Calle").val();
    datos.ExReceptorLugarRecep.NroExterior = $("#txtRecepD2NumExt").val();
    datos.ExReceptorLugarRecep.NroInterior = $("#txtRecepD2NumInt").val();
    datos.ExReceptorLugarRecep.Colonia = $("#txtRecepD2Colonia").val();
    datos.ExReceptorLugarRecep.Localidad = $("#txtRecepD2Localidad").val();
    datos.ExReceptorLugarRecep.Referencia = $("#txtRecepD2Referencia").val();
    datos.ExReceptorLugarRecep.Municipio = $("#txtRecepD2Municipio").val();
    datos.ExReceptorLugarRecep.Estado = $("#txtRecepD2Estado").val();
    datos.ExReceptorLugarRecep.Pais = $("#txtRecepD2Pais").val();
    datos.ExReceptorLugarRecep.CodigoPostal = $("#txtRecepD2CP").val();
    datos.ExReceptorLugarRecep.NumCtaPago = $("#txtRecepD2NumPago").val();
    datos.ExReceptorLugarRecep.methodoDePago = $("#txtRecepD2MetodoPago").val();
    //$("#txtRecepD2NumPago").val(dato.ExReceptorLugarRecep.);

    datos.cce.cceVersion = $("#txt_cceVersion").val();
    datos.cce.cceTipoOp = $("#txt_cceTipoOp").val();
    datos.cce.cceClavePed = $("#txt_cceClavePed").val();
    datos.cce.cceNExpConfiable = $("#txt_cceNExpConfiable").val();
    datos.cce.cceCertOrig = $("#txt_cceCertOrig").val();
    datos.cce.cceNCertOrig = $("#txt_cceNCertOrig").val();

    // datos productos
    var rows = [];
    if (!datos || !datos.Detalle && !datos.Detalle.rows)
        return;
    rows = datos.Detalle.rows;
    $("#tablaProductos tbody tr").each(function (index) {
        var p = rows[index];
        $(this).children("td").each(function (index2) {
            switch (index2) {
                case 0: p.VlrCodigo = $(this).text();
                    break;
                case 1: p.cceDescES = $(this).text();
                    break;
                //case 2: p.cceDescEN = $(this).text();
                //    break;
                case 2: p.cceFraccion = $(this).text();
                    break;
                case 3: p.cceMarca = $(this).text();
                    break;
                case 4: p.cceModelo = $(this).text();
                    break;
                case 5: p.cceSerie = $(this).text();
                    break;
            }
        })
    });
}

function guardarTxt() {
    setDatosFactura();
    var factura = listaTxt.facturas[listaTxt.indexSelected];
    if (!factura) {
        console.log("selecciones una fatura");
        return;
    }
    General.put("/api/facturas", factura)
    .then(function (result) {
        cargarFacturas();
        alertSucces();
        console.log(result);
    })
    .catch(function (err) {
        errorAlert();
        console.log(err);
    });
}

function timbrar() {
    setDatosFactura();
    var factura = listaTxt.facturas[listaTxt.indexSelected];
    if (!factura) {
        console.log("selecciones una fatura");
        return;
    }
    General.put("/api/facturas", factura)
    .then(function (result) {
        return General.post("/api/timbrarFactura", {nameTxt: factura.nameTxt});
    })
    .then(function (result) {
        alertSucces();
        cargarFacturas();
    })
    .catch(function (err) {
        errorAlert();
        console.log(err);
    });
}

//ocultar forms
function hideForms(){
    $("#idformulario").hide();
    $("#idcontenedorestxt").show();
    $('#idSwitchHab').bootstrapToggle('off');
}

//confirm
function confirm(){
    $.confirm({
    title: 'Esta seguro que desea salir?',
    content: 'Seleccione cancelar si desea permanecer en la pagina.',
    buttons: {
        confirmar: function () {
           // $.alert('Hasta pronto!');
            salir();
        },
        cancelar: function () {

        },
    }
});
}

//alert Errorlogin
function alertErrorLogin(){
   $.alert({
    title: '¡Error!',
    content: 'Revisa tus datos de acceso!',
});
    // window.location.href = 'index.html';
    //return;
}

//alert mensaje
function alertMensaje(texto){
   $.alert({
       title: '¡Aviso!',
       content: texto,
   });
}

//alert succes
function alertSucces(){
    $.confirm({
    title: 'Terminado!',
    content: 'Proceso generado con exito.',
    type: 'green',
    typeAnimated: true,
    buttons: {
        tryAgain: {
            text: 'Ok',
            btnClass: 'btn-green',
            action: function(){
            }
        },
    }
});
}

//alert error
function errorAlert(){
     $.confirm({
    title: 'Error!',
    content: 'Hubo un error, intenta de nuevo o notifica al area de sistemas',
    type: 'red',
    typeAnimated: true,
    buttons: {
        tryAgain: {
            text: 'Ok',
            btnClass: 'btn-red',
            action: function(){
            }
        },
       /* close: function () {
        }*/
    }
});
}

//validacion habilitar campos
function swichForms(){
    var valueswHab =  $('#idSwitchHab').prop('checked');
    var inputsForms = $('input.editSwich');
    if(valueswHab) {
        inputsForms.prop('disabled', false);
        //$("#tbSku").find("td").prop("contenteditable", "true");
    } else {
         inputsForms.prop('disabled', true);
         //$("#tbSku").find("td").prop("contenteditable", "false");
     }
}

function onClickHistorial(){
    initFechasBusquedaHistorial();
    onchangeDate();
}

function initFechasBusquedaHistorial(){
    var toDay = new Date();
    var fIni = "01-01-" +(toDay.getFullYear() - 1)
    var fFin = toDay.getDate() + "-" + (toDay.getMonth() + 1) + "-" + toDay.getFullYear()
    $("#from").val(fIni);
    $("#to").val(fFin);
}

function onchangeDate() {
    var fIni = $("#from").val().split("-");
    var fFin = $("#to").val().split("-");
    fIni = `${fIni[2]}-${fIni[1]}-${fIni[0]}`
    fFin = `${fFin[2]}-${fFin[1]}-${fFin[0]}`
    var tbHistorial = document.getElementById("tbHistorial");
    tbHistorial.innerHTML = "";
    General.get(`/api/listText?directorio=timbradas&fIni=${fIni}&fFin=${fFin}`)
    .then(function (result) {
        if (!result || result.length == 0){
            alertMensaje("No hay facturas timbradas en el rango seleccionado");
            return;
        }
        for (var i in result) {
            var tr = document.createElement("tr");
            tr.id = "tablaHistorial_" + result[i].nombre;
            var td = document.createElement("td");
            td.innerHTML = result[i].nombre;
            tr.appendChild(td);
            td = document.createElement("td");
            td.innerHTML = `<input type='checkbox' value=${result[i].nombre} class='checkRestaurar'></input>`;
            tr.appendChild(td);
            tbHistorial.appendChild(tr);

        }
    }).catch(function(err){
        console.log(err);
    });
}

function restaurarTxt(){
    var checks = [];
    $(".checkRestaurar").each( function (index){
        if($(this).is(":checked")){
            checks.push($(this).val());
        }
    });
    if (checks.length == 0) {
        alertMensaje("¡Seleccione un elemento!");
        return;
    }
    General.post("/api/reeditar", {nameTxts: checks})
    .then(function (result) {
        //cargarTxt()
        $('#myModalHistorial').modal('hide');
        console.log(result);
    })
    .catch(function (err){
        console.log(err);
    });
}

function cargarUsuariosExis() {
    $("#idselectUsers").children().remove();
    var selectUsers = document.getElementById("idselectUsers");
    var optiondef = document.createElement("option");
    optiondef.textContent = "--Usuario nuevo--";
    optiondef.value=null;
    optiondef.selected = true;
    selectUsers.appendChild(optiondef);
    General.get("/api/user")
    .then(function(result) {
        for(i = 0; i < result.length; i++) {
            usuariosRegistrados = result;
            var option = document.createElement('option');
            // añadir el elemento option y sus valores
            selectUsers.options.add(option, i);
            selectUsers.options[i].value = result[i].id;
            selectUsers.options[i].innerText = result[i].name;
        }
    })
    .catch(function(err){
        console.log(err);
    });
}

function infoUserSelect() {
    var valorSelect = $("#idselectUsers" ).val();
    if(valorSelect != "null") {
        var index = $("#idselectUsers").prop('selectedIndex');
        var user = usuariosRegistrados[index];
        $("#inputlg").val(user.name);
        $("#inputdefault").val(user.userName);
        $("#inputsm").val(user.area);
        $("#selectRol" ).val(user.rolUser);
         $('#selectRol').selectpicker('refresh');
        if (user.rolUser == "admin") {
            $("#btnDeletuser").prop("disabled", "disabled");
        } else {
            $("#btnDeletuser").prop("disabled", "");
        }
        $("#idbtnAddUser").hide();
        $("#idbtnUpdateuser").show();
        $("#btnDeletuser").show();
        $("#contentDivsNewpsw").hide();
        $("#passChange").show();
    } else {
        $("#inputlg").val("");
        $("#inputdefault").val("");
        $("#pwd").val("");
        $("#inputsm").val("");
        $("#idbtnAddUser").show();
        $("#idbtnUpdateuser").hide();
        $( "#btnDeletuser" ).hide();
        $("#contentDivsNewpsw").show();
        $("#passChange").hide();
    }

}

function saveuserNew(){
    var camposClass = $('input.ctrl-valVaci');
    for(i=0; i < camposClass.length;i++){
        if(camposClass[i].value == ""){
            alertMensaje("Ingresa todos los campos solicitados!");
            return;
        }
    }
    var pass1 = document.getElementById("pwdnew1").value;
    var pass2 = document.getElementById("pwdnew2").value;
    if(pass1 == pass2){
      var nameCompleto = $("#inputlg").val();
      var userNom  = $("#inputdefault").val();
      var pass = $("#pwdnew1").val();
      var areaUser = $("#inputsm").val();
      var rol = $( "select#selectRol option:checked" ).val();
        General.post("/api/user/", {name: nameCompleto, userName: userNom, area: areaUser, password: pass, rolUser: rol})
        .then(function(result){
            if(result){
                cargarUsuariosExis();
                alertMensaje("Usuario creado con exito!");
                $('#myModal').modal('hide');
                $("#inputlg").val("");
                $("#inputdefault").val("");
                $("#pwdnew1").val("");
                $("#pwdnew2").val("");
                $("#inputsm").val("");
            }
        })
        .catch(function(err){
            if (err.status == 401)
                alertMensaje("¡No tiene permisos para crear usuarios!");
            else
                alertMensaje("Error al actualizar!");
        });
    } else {
        alertMensaje("La contraseñas no coinciden!");
    }
}

function updateuser() {
      var iduser = $("#idselectUsers").val();
      var nameCompletoUp = $("#inputlg").val();
      var userNomUp  = $("#inputdefault").val();
      var passUp = $("#pwd").val();
      var areaUserUp = $("#inputsm").val();
      var rolUp = $( "select#selectRol option:checked" ).val();
      General.put("api/user", {idU: iduser, nameCompletoU: nameCompletoUp, userNomU: userNomUp, passU: passUp, areaUserU: areaUserUp, rolU: rolUp})
      .then(function(result){
          if(result){
              cargarUsuariosExis();
              alertMensaje("Proceso de actualizado terminado!");
              $('#myModal').modal('hide');
          }else
              alertMensaje("Error al actualizar!");
      })
      .catch(function(err){
          if (err.status == 401)
              alertMensaje("¡No tiene permisos para actualizar usuarios!");
          else
              alertMensaje("Error al actualizar!");
      })
}

function deleteUser() {
    var idUser = $("#idselectUsers").val();
    General.delete("api/user/"+idUser)
    .then(function (result) {
        cargarUsuariosExis();
        alertMensaje("¡El usuario se ha eliminado correctamente!");
        $('#myModal').modal('hide');
    })
    .catch(function(err) {
        if (err.status == 200){
            cargarUsuariosExis();
            alertMensaje("¡El usuario se ha eliminado correctamente!");
            $('#myModal').modal('hide');
        } else if (err.status == 401) {
            alertMensaje("¡No tiene permisos para actualizar usuarios!");
        } else {
            alertMensaje("Error al actualizar!");
        }
    });
}

function funcionEnter(evento) {
    //para IE
    if (window.event) {
        if (window.event.keyCode==13) logueo();
    } else {
        //Firefox y otros navegadores
        if (evento) {
            if(evento.which==13) logueo();
        }
    }
}
