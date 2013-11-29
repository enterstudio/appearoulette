'use strict';

angular.module('clientApp')
    .controller('MainCtrl', function ($scope, $http, socket) {
        $scope.clientCount = 0;

        var onConnected = function (data) {
        }

        var onNexted = function (data) {
            $scope.status = 'nexted';
            $scope.roomName = '';
        }

        var onPaired = function (data) {
            $scope.status = 'found a match!';
            $scope.roomName = data.roomName;
        }

        var onClientCountUpdated = function (data) {
            console.log(data);
            $scope.clientCount = data.clientCount;
        }

        $scope.randomize = function () {
            socket.emit('getPairing');
            $scope.status = 'searching';
            $scope.roomName = '';
        }

        socket.on('connected', onConnected);
        socket.on('clientCountUpdated', onClientCountUpdated);
        socket.on('paired', onPaired);
        socket.on('nexted', onNexted);
    });
