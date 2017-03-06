'use strict';

var mapsApp = angular.module('mapsApp', []);

mapsApp.controller('switchMaps', ['$scope', '$http', '$compile', function ($scope, $http, $compile) {

    var maps = {}; // общий объект, содержащий все объекты-карты
    var mapTypes = ['yandex', 'google', 'gis'];

    // Yandex maps
    var yandexMaps = function (x, y, container, i) {
        ymaps.ready(init);
        function init() {
            var ymapContainer = document.createElement('div');
            ymapContainer.className = 'mapCon';
            ymapContainer.id = "yandexMapContainer" + i;
            angular.element(container).append(ymapContainer);
            $('#yandexMapContainer' + i).siblings().not('ul').hide();

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
        var gmapContainer = document.createElement('div');
        gmapContainer.className = 'mapCon';
        gmapContainer.id = "googleMapContainer" + i;
        angular.element(container).append(gmapContainer);
        $('#googleMapContainer' + i).siblings().not('ul').hide();

        var mapOptions = {
            center: new google.maps.LatLng(x, y),
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true
        };

        maps['googleMap' + i] = new google.maps.Map(gmapContainer, mapOptions);

        var marker = new google.maps.Marker({
            position: {lat: x, lng: y},
            map: maps['googleMap' + i]
        });
        marker.setMap(maps['googleMap' + i]);

        localStorage[i] = 'google';
    };

    // Gis maps
    var gisMaps = function (x, y, container, i) {
        DG.then(init);
        function init() {
            var gismapContainer = document.createElement('div');
            gismapContainer.className = 'mapCon';
            gismapContainer.id = "gisMapContainer" + i;
            angular.element(container).append(gismapContainer);
            $('#gisMapContainer' + i).siblings().not('ul').hide();

            maps['gisMap' + i] = DG.map(gismapContainer, {
                center: [x, y],
                zoom: 15
            });

            DG.marker([x, y]).addTo(maps['gisMap' + i]);

            localStorage[i] = 'gis';
        }
    };


    $scope.show = function () {
        // получаем список объектов и пробегаемся по нему,
        // создаем для каждого объекта контейнер и добавляем в него карты
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

                //вкладки
                mapTypes.forEach(function (elem) {
                    var tab = document.createElement('li');
                    tab.innerHTML = '<a href="#" onclick="return false;"></a>';
                    tab.setAttribute('ng-click', 'switchTabs($event)');
                    tab.setAttribute('data-target', elem + 'MapContainer' + index);
                    localStorage[index] == elem
                        ? tab.className = 'active map-element map-element-' + elem
                        : tab.className = 'map-element map-element-' + elem;
                    $compile(tab)($scope);
                    angular.element(ulList).append(tab); //кладём вкладку в созданный выше UL list
                });

                //кладём панель с вкладками в общий контейнер
                angular.element(container).append(ulList);

                //добавляем последнюю открытую карту в каждый контейнер,
                //если таковых нет, везде яндекс
                if (window.localStorage.length != 0) {
                    mapTypes.forEach(function (elem) {
                        if (elem == localStorage[index]) {
                            eval(elem + 'Maps')(value.latitude, value.longitude, container, index)
                        }
                    });
                }
                else {
                    yandexMaps(value.latitude, value.longitude, container, index);
                }
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
        var x = $(event.target).parents('.bundle')[0].getAttribute('data-latitude'); //координата latitude
        var y = $(event.target).parents('.bundle')[0].getAttribute('data-longitude'); //координата longitude

        //скрываем контейнеры других карт и отображаем текущий
        var serviceContainer = $("#" + event.target.getAttribute("data-target"));
        serviceContainer.siblings().not('ul').hide();
        serviceContainer.show();

        //проверяем принадлежность к сервису и вызываем соответствующий метод
        switch (event.target.getAttribute("data-target").replace('MapContainer' + currentID, '')) {
            case 'yandex':
                maps['yandexMap' + currentID]
                    ? maps['yandexMap' + currentID].container.fitToViewport()
                    : yandexMaps(x, y, container, currentID);
                localStorage[currentID] = 'yandex';
                break;
            case 'google':
                maps['googleMap' + currentID]
                    ? google.maps.event.trigger(maps['googleMap' + currentID], 'resize')
                    : googleMaps(x, y, container, currentID);
                localStorage[currentID] = 'google';
                break;
            case 'gis':
                maps['gisMap' + currentID]
                    ? maps['gisMap' + currentID].invalidateSize()
                    : gisMaps(x, y, container, currentID);
                localStorage[currentID] = 'gis';
                break;
        }
    };

}]);