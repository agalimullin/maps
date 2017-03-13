'use strict';

var mapsApp = angular.module('mapsApp', []);

mapsApp.controller('switchMaps', ['$scope', '$http', '$compile', function ($scope, $http, $compile) {

    // общий объект, содержащий все объекты-карты
    var maps = {
        init: function (mapService, x, y, container, currentID) {
            eval(mapService)(x, y, container, currentID);
        },
        update : function(map, mapService) {
            switch (mapService){
                case 'yandex': map.container.fitToViewport(); break;
                case 'google':  google.maps.event.trigger(map, 'resize'); break;
                case 'gis': map.invalidateSize(); break;
            }
        }
    };
    var mapTypes = ['yandex', 'google', 'gis'];

    var updateMap = function (mapService, map) {
      switch (mapService){
          case 'yandex': map.container.fitToViewport(); break;
          case 'google':  google.maps.event.trigger(map, 'resize'); break;
          case 'gis': map.invalidateSize(); break;
      }
    };

    var getMapContainer = function (mapService, i, mainContainer) {
        var container = document.createElement('div');
        container.className = 'mapCon';
        container.id = mapService + "MapContainer" + i;
        angular.element(mainContainer).append(container);
        $('#' + mapService + 'MapContainer' + i).siblings().not('ul').hide();
        return container;
    };

    // Yandex maps
    var yandexMaps = function (x, y, container, i) {
        ymaps.ready(init);
        function init() {
            var ymapContainer = getMapContainer('yandex', i, container);
            maps['yandexMap' + i] = new ymaps.Map(ymapContainer, {
                center: [x, y],
                zoom: 15,
                controls: ["zoomControl", "fullscreenControl"]
            });
            var placemark = new ymaps.Placemark([x, y]);
            maps['yandexMap' + i].geoObjects.add(placemark);
            localStorage[i] = 'yandex';
        }
    };

    // Google maps
    var googleMaps = function (x, y, container, i) {
        var gmapContainer = getMapContainer('google', i, container);
        var mapOptions = {
            center: new google.maps.LatLng(x, y),
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true
        };
        maps['googleMap' + i] = new google.maps.Map(gmapContainer, mapOptions);
        var marker = new google.maps.Marker({
            position: {lat: x, lng: y}, map: maps['googleMap' + i]
        });
        marker.setMap(maps['googleMap' + i]);
        localStorage[i] = 'google';
    };

    // Gis maps
    var gisMaps = function (x, y, container, i) {
        DG.then(init);
        function init() {
            var gismapContainer = getMapContainer('gis', i, container);
            maps['gisMap' + i] = DG.map(gismapContainer, {
                center: [x, y], zoom: 15
            });
            DG.marker([x, y]).addTo(maps['gisMap' + i]);
            localStorage[i] = 'gis';
        }
    };

    $scope.show = function () {
        // получаем список объектов, пробегаемся, создаем для каждого контейнер и добавляем в него карты
        $http.get('data.json').then(function (data) {
            angular.forEach(data['data'], function (value, index) {
                //общий контейнер
                var container = document.createElement('div');
                container.setAttribute('data-latitude', value.latitude);
                container.setAttribute('data-longitude', value.longitude);
                container.className = 'bundle';
                container.id = index;
                angular.element($('#maps')).append(container);

                //панель с вкладками
                var ulList = document.createElement('ul');
                ulList.className = 'view';

                mapTypes.forEach(function (elem, j) {
                    //вкладки
                    var tab = document.createElement('li');
                    tab.innerHTML = '<a href="#" onclick="return false;"></a>';
                    tab.setAttribute('ng-click', 'switchTabs($event)');
                    tab.setAttribute('data-target', elem + 'MapContainer' + index);
                    localStorage[index] == elem
                        ? tab.className = 'active map-element map-element-' + elem
                        : tab.className = 'map-element map-element-' + elem;
                    $compile(tab)($scope);
                    angular.element(ulList).append(tab); //кладём вкладку в созданный выше UL list

                    //добавление последней открытой карты в каждый контейнер (если таковой нет, добавляем яндекс)
                    if ((window.localStorage.length != 0) && (elem == localStorage[index])) {
                        eval(elem + 'Maps')(value.latitude, value.longitude, container, index);
                    }
                    else if ((j == 2) && (window.localStorage.length == 0)) {
                        yandexMaps(value.latitude, value.longitude, container, index)
                    }
                });

                //кладём панель с вкладками в общий контейнер
                container.insertBefore(ulList, container.childNodes[0]);
            });
            $('#showBtn').hide(); //скрываем кнопку
        });
    };

    // переключение вкладок и отображение карты
    $scope.switchTabs = function (event) {
        angular.element(event.target).siblings().removeClass("active");
        angular.element(event.target).addClass("active");

        var container = $(event.target).parents('.bundle')[0]; //контейнер для карты
        var currentID = $(event.target).parents('.bundle')[0].id; //index
        var x = parseFloat($(event.target).parents('.bundle')[0].getAttribute('data-latitude')); //координата latitude
        var y = parseFloat($(event.target).parents('.bundle')[0].getAttribute('data-longitude')); //координата longitude

        //скрываем контейнеры других карт и отображаем текущий
        var serviceContainer = $("#" + event.target.getAttribute("data-target"));
        serviceContainer.siblings().not('ul').hide();
        serviceContainer.show();

        //проверяем принадлежность к сервису и вызываем соответствующий метод
        var mapService = event.target.getAttribute("data-target").replace('MapContainer' + currentID, '');
        // maps[mapService + 'Map' + currentID]
        //     ? updateMap(mapService, maps[mapService + 'Map' + currentID])
        //     : eval(mapService + 'Maps')(x, y, container, currentID);
        maps[mapService + 'Map' + currentID]
            ? maps.update(mapService, maps[mapService + 'Map' + currentID])
            : maps.init(mapService + 'Maps')(x, y, container, currentID);
    };

}]);