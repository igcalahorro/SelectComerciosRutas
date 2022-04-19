define(['dojo/_base/declare', 'jimu/BaseWidget', 
"esri/graphic",
'esri/Color',

"esri/tasks/query",
"esri/tasks/ServiceAreaTask", 
"esri/tasks/ServiceAreaParameters", 
"esri/tasks/RouteTask",
"esri/tasks/RouteParameters",
"esri/tasks/FeatureSet",
"esri/layers/FeatureLayer",
"esri/geometry/geometryEngine",
"esri/geometry/Point",

"esri/renderers/SimpleRenderer",
"esri/symbols/SimpleMarkerSymbol", 
"esri/symbols/SimpleLineSymbol", 
"esri/symbols/SimpleFillSymbol",

'dojo/_base/lang', 
'dojo/_base/array'
],
  function(
    declare, BaseWidget, Graphic, Color, Query,
    ServiceAreaTask, ServiceAreaParameters, RouteTask, RouteParameters, FeatureSet, FeatureLayer, GeometryEngine, Point,
    SimpleRenderer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
    lang, arrayUtils
    ) {
    return declare([BaseWidget], {
      baseClass: 'jimu-widget-customwidget',
      tiendaService: new ServiceAreaTask('https://formacion.esri.es/server/rest/services/RedPFM/NAServer/Service%20Area'),
      routeService: new RouteTask('https://formacion.esri.es/server/rest/services/TFM2022/Redes_TFM3/NAServer/Ruta'),
      symbol: null,
      routeSymbol: null,
      comercios: new Map(),

      postCreate: function() {
        this.symbol = new SimpleMarkerSymbol();
        var marker = this.symbol;
        var line = new SimpleLineSymbol();
        line.setColor(new Color([38, 115, 0, 1]));
        marker.setSize(25);
        marker.setOutline(line);
        marker.setColor(new Color([56, 168, 0, 0.88]));
        marker.setPath("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z");
        marker.setStyle(SimpleMarkerSymbol.STYLE_PATH);

        this.routeSymbol = new SimpleLineSymbol().setColor(new Color([0,0,255,0.5])).setWidth(5);
        console.log(this.routeSymbol);
      },

      routeMode: false,
      fromPoint: null,

      onOpen: function(event1){
        console.log('onOpen');

        this.map.on('click', lang.hitch(this, function(event2) {
          var map = this.map;
          var symbol = this.symbol;
          var comercios = this.comercios;
          var comercioService = this.comercioService;

          if (this.routeMode === true) {
            var toPoint = event2.mapPoint;
            var graphic = new Graphic(toPoint, symbol);

            routeParams = new RouteParameters();
            routeParams.stops = new FeatureSet();
            routeParams.barriers = new FeatureSet();
            routeParams.outSpatialReference = {"wkid":102100};

            routeParams.stops.features.push(this.fromPoint);
            routeParams.stops.features.push(graphic);

            routeSymbol = this.routeSymbol;

            this.routeService.solve(routeParams, function(solveResult){
              console.log(solveResult);
              arrayUtils.forEach(solveResult.routeResults, function(routeResult, i) {

                  map.graphics.add(
                    routeResult.route.setSymbol(this.routeSymbol)
                  );
              });
            });

            this.routeMode = false;
          } else {
            map.graphics.clear();

            var fromPoint = event2.mapPoint;
            var graphic = new Graphic(fromPoint, symbol);
            this.fromPoint = graphic;

            map.graphics.add(graphic);

            params = new ServiceAreaParameters();

            var time = parseFloat(comercios.get('time'));
            var travelMode = parseInt(comercios.get('mode'))
            if (travelMode == 2) {
              time *= 350;
            }
            params.defaultBreaks = [time];
            params.travelMode = travelMode;
            params.outSpatialReference = map.spatialReference;
            params.returnFacilities = false;
            
            var facilities = new FeatureSet();
            facilities.features = [graphic];
            params.facilities = facilities;

            comercioService = this.comercioService;

            this.tiendaService.solve(params, function(solveResult){
              var polygonSymbol = new SimpleFillSymbol(
                "solid",
                new SimpleLineSymbol("solid", new Color([232,104,80]), 2),
                new Color([232,104,80,0.25])
              );

              arrayUtils.forEach(solveResult.serviceAreaPolygons, function(serviceArea){
                serviceArea.setSymbol(polygonSymbol);
                map.graphics.add(serviceArea);
              });
    
            }, function(err){
              console.log(err.message);
            });
          }
        }));
      },

      paramsHandler: function(evt){
        // Check what comercios are checked
        comercios = new Map();
        
        [...evt.srcElement.form.elements].forEach(element => {
          if (element.nodeName === 'INPUT') {
            comercios.set(element.value, element.checked);
          } else if (element.nodeName === 'SELECT') {
            comercios.set(element.name, element.value);
          }
        });
        
        this.comercios = comercios;
      },

      carnes: function(){
        var carne = new FeatureLayer("https://services5.arcgis.com/zZdalPw2d0tQx8G1/ArcGIS/rest/services/Carnicer%c3%ada/FeatureServer/3", {outFields: ["*"]})
        this.map.addLayer(carne)
      },

      congelado: function(){
        var conge = new FeatureLayer("https://services5.arcgis.com/zZdalPw2d0tQx8G1/ArcGIS/rest/services/Congelados/FeatureServer/4", {outFields: ["*"]})
        this.map.addLayer(conge)
      },

      frutas: function(){
        var fruta = new FeatureLayer("https://services5.arcgis.com/zZdalPw2d0tQx8G1/arcgis/rest/services/Fruteria/FeatureServer/1", {outFields: ["*"]})
        this.map.addLayer(fruta)
      },

      secos: function(){
        var fsecos = new FeatureLayer("https://services5.arcgis.com/zZdalPw2d0tQx8G1/ArcGIS/rest/services/Frutos_Secos/FeatureServer/1", {outFields: ["*"]})
        this.map.addLayer(fsecos)
      },

      leche: function(){
        var vaca = new FeatureLayer("https://services5.arcgis.com/zZdalPw2d0tQx8G1/ArcGIS/rest/services/Lecher%c3%ada/FeatureServer/5", {outFields: ["*"]})
        this.map.addLayer(vaca)
      },

      pan: function(){
        var panes = new FeatureLayer("https://services5.arcgis.com/zZdalPw2d0tQx8G1/ArcGIS/rest/services/Panader%c3%ada/FeatureServer/6", {outFields: ["*"]})
        this.map.addLayer(panes)
      },

      pescao: function(){
        var pez = new FeatureLayer("https://services5.arcgis.com/zZdalPw2d0tQx8G1/ArcGIS/rest/services/Pescader%c3%ada/FeatureServer/7", {outFields: ["*"]})
        this.map.addLayer(pez)
      },

      sal: function(){
        var sala = new FeatureLayer("https://services5.arcgis.com/zZdalPw2d0tQx8G1/ArcGIS/rest/services/Salazones/FeatureServer/8", {outFields: ["*"]})
        this.map.addLayer(sala)
      },



      routeHandler: function(evt){
        if (this.fromPoint === null){
          alert('You have to select a point on the map first!');
        } else {
          this.routeMode = true;
        }
      }
    });
  });