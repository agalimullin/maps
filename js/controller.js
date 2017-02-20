'use strict';

var mapsApp = angular.module('mapsApp', []);

mapsApp.controller('switchMaps', ['$scope', '$http', '$compile', function ($scope, $http, $compile) {
    var maps = {}; // общий объект, содержащий все объекты-карты

    // Google maps
    var googleMaps = function (x, y, container, i) {
        var gmapContainer = document.createElement('div');
        gmapContainer.className = 'mapCon';
        gmapContainer.id = "googleMapContainer" + i;
        // gmapContainer.style.display = 'none';
        angular.element(container).append(gmapContainer);
        $('#googleMapContainer' + i).siblings().not('ul').hide();

        var mapOptions = {
            center: new google.maps.LatLng(x, y),
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true
        };

        // maps['googleMap' + i] = window['googleMap' + i];
        maps['googleMap' + i] = new google.maps.Map(gmapContainer, mapOptions);


        var marker = new google.maps.Marker({
            position: {lat: x, lng: y},
            map: maps['googleMap' + i]
        });
        marker.setMap(maps['googleMap' + i]);
    };

    // Yandex maps
    var yandexMaps = function (x, y, container, i) {
        ymaps.ready(init);
        function init() {
            var ymapContainer = document.createElement('div');
            ymapContainer.className = 'mapCon';
            ymapContainer.id = "yandexMapContainer" + i;
            // ymapContainer.style.display = 'none';

            // ymapContainer.style.position = 'absolute';
            // ymapContainer.style.left = '-100%';
            angular.element(container).append(ymapContainer);
            $('#yandexMapContainer' + i).siblings().not('ul').hide();

            // maps['yandexMap' + i] = window['yandexMap' + i];
            maps['yandexMap' + i] = new ymaps.Map(ymapContainer, {
                center: [x, y],
                zoom: 15,
                controls: ["zoomControl", "fullscreenControl"]
            });


            var placemark = new ymaps.Placemark([x, y]);
            maps['yandexMap' + i].geoObjects.add(placemark);
        }
    };

    // Gis maps
    var gisMaps = function (x, y, container, i) {
        DG.then(init);
        function init() {
            var gismapContainer = document.createElement('div');
            gismapContainer.className = 'mapCon';
            gismapContainer.id = "gisMapContainer" + i;

            // gismapContainer.style.display = 'none';

            // gismapContainer.style.position = 'absolute';
            // gismapContainer.style.left = '-100%';
            angular.element(container).append(gismapContainer);
            $('#gisMapContainer' + i).siblings().not('ul').hide();

            // maps['gisMap' + i] = window['gisMap' + i];
            maps['gisMap' + i] = DG.map(gismapContainer, {
                center: [x, y],
                zoom: 15
            });

            DG.marker([x, y]).addTo(maps['gisMap' + i]);
        }
    };

    // переключение вкладок и отображение карты
    $scope.switchTabs = function (event) {
        angular.element(event.target).siblings().removeClass("active");
        angular.element(event.target).addClass("active");

        var container = event.target.parentNode.parentNode; //контейнер для карты
        var currentID = event.target.parentNode.parentNode.id; //index
        var x = parseInt(event.target.parentNode.parentNode.getAttribute("data-lat")); //координата lat
        var y = parseInt(event.target.parentNode.parentNode.getAttribute("data-lng")); //координата lng

        $("#" + event.target.getAttribute("data-target")).siblings().not('ul').hide();
        $("#" + event.target.getAttribute("data-target")).show();
        //проверяем принадлежность к сервису и вызываем соответствующий метод
        switch (event.target.getAttribute("data-target")) {
            case 'googleMapContainer' + currentID:
                if (maps['googleMap' + currentID]) {
                    google.maps.event.trigger(maps['googleMap' + currentID], 'resize');
                }
                else {
                    googleMaps(x, y, container, currentID);
                }
                break;
            case 'yandexMapContainer' + currentID:
                if (maps['yandexMap' + currentID]){
                    maps['yandexMap' + currentID].container.fitToViewport();
                }
                else {
                    yandexMaps(x, y, container, currentID);
                }
                break;
            case 'gisMapContainer' + currentID:
                if (maps['gisMap' + currentID]){
                    maps['gisMap' + currentID].invalidateSize();
                }
                else {
                    gisMaps(x, y, container, currentID);
                }
                break;
        }

        // $(target).siblings().not('ul').hide();
        // $(target).show();

        // googleMaps(value, container, index);
        // yandexMaps(value, container, index);
        // gisMaps(value, container, index);
    };

    // получаем список объектов и пробегаемся по нему,
    // создаем для каждого объекта контейнер и добавляем в него карты
    $http.get('data.json').then(function (data) {

        angular.forEach(data['data'], function (value, index) {
            //общий контейнер
            var container = document.createElement('div');
            container.setAttribute('data-lat', value.lat);
            container.setAttribute('data-lng', value.lng);
            container.className = 'bundle';
            container.id = index;
            angular.element($('#maps')).append(container);

            //панель с вкладками
            var ulList = document.createElement('ul');
            ulList.className = 'view';
            //вкладки
            var tab = document.createElement('li');
            tab.innerHTML = '<a href="#" onclick="return false;"></a>';
            tab.setAttribute('ng-click', 'switchTabs($event)');
            var liGoogle = tab;
            liGoogle.setAttribute('data-target', 'googleMapContainer' + index);
            liGoogle.className = 'active map-element map-element-google';
            $compile(liGoogle)($scope);
            var liYandex = tab.cloneNode(true);
            liYandex.setAttribute('data-target', 'yandexMapContainer' + index);
            liYandex.className = 'map-element map-element-yandex';
            $compile(liYandex)($scope);
            var liGis = tab.cloneNode(true);
            liGis.setAttribute('data-target', 'gisMapContainer' + index);
            liGis.className = 'map-element map-element-gis';
            $compile(liGis)($scope);

            //добавляем панель с вкладками в общий контейнер
            angular.element(ulList).append(liGoogle, liYandex, liGis);
            angular.element(container).append(ulList);

            // var map = index in maps ? maps[index] : false;

            // добавляем карты в общий контейнер
            // googleMaps(value, container, index);
            // yandexMaps(value, container, index);
            // gisMaps(value, container, index);
        });
    });

}]);