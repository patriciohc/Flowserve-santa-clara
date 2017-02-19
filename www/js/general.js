var General = {

    _spinner: null,

    init: function () {
        // confin loading
        var opts = {
            lines: 10 // The number of lines to draw
            , length: 28 // The length of each line
            , width: 15 // The line thickness
            , radius: 35 // The radius of the inner circle
            , scale: 1 // Scales overall size of the spinner
            , corners: 1 // Corner roundness (0..1)
            , color: '#000' // #rgb or #rrggbb or array of colors
            , opacity: 0.20 // Opacity of the lines
            , rotate: 0 // The rotation offset
            , direction: 1 // 1: clockwise, -1: counterclockwise
            , speed: 2.0 // Rounds per second
            , trail: 60 // Afterglow percentage
            , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
            , zIndex: 2e9 // The z-index (defaults to 2000000000)
            , className: 'spinner' // The CSS class to assign to the spinner
            , top: '50%' // Top position relative to parent
            , left: '50%' // Left position relative to parent
            , shadow: false // Whether to render a shadow
            , hwaccel: false // Whether to use hardware acceleration
            , position: 'absolute' // Element positioning
        }
        General._spinner = new Spinner(opts).spin();
    },

    _getToken: function (){
        var token = "token ";
        var infoUser = localStorage.getItem("infoUser");
        if (infoUser) {
            var infoUser = JSON.parse(infoUser);
            token += infoUser.token;
        }
        return token;
    },

    post: function (url, params) {
        General.showLoading("divPrincipal", true);
        return new Promise(function (resolve, reject) {
            $.ajax({
                headers: { Authorization: General._getToken() },
                type: "post",
                url: url,
                data: params,
                dataType: "json",
                success: function (result) { General.showLoading("divPrincipal", false); resolve(result); },
                error: function (err) { General.showLoading("divPrincipal", false); reject(err); }
            });
       });
   },

   put: function (url, params) {
       General.showLoading("divPrincipal", true);
       return new Promise(function (resolve, reject) {
           $.ajax({
               headers: { Authorization: General._getToken() },
               type: "put",
               url: url,
               data: params,
               dataType: "json",
               success: function (result) { General.showLoading("divPrincipal", false); resolve(result); },
               error: function (err) { General.showLoading("divPrincipal", false); reject(err); }
           });
      });
  },

   get: function (url) {
       General.showLoading("divPrincipal", true);
       return new Promise(function (resolve, reject) {
           $.ajax({
               headers: { Authorization: General._getToken() },
               type: "get",
               url: url,
               dataType: "json",
               success: function (result) {General.showLoading("divPrincipal", false); resolve(result); },
               error: function (err) {General.showLoading("divPrincipal", false); reject(err); }
           });
      });
  },

    delete: function (url) {
        General.showLoading("divPrincipal", true);
        return new Promise(function (resolve, reject) {
            $.ajax({
                headers: { Authorization: General._getToken() },
                type: "delete",
                url: url,
                dataType: "json",
                success: function (result) {General.showLoading("divPrincipal", false); resolve(result); },
                error: function (err) {General.showLoading("divPrincipal", false); reject(err); }
            });
        });
    },

    showLoading: function (idContenedor, show) {
        var target = document.getElementById(idContenedor);
        var has = $(target).find($(General._spinner.el))
        if ( show && !has.length) {
            target.appendChild(General._spinner.el)
        } else if (!show && has.length) {
            target.removeChild(General._spinner.el);
        }
    }

}
