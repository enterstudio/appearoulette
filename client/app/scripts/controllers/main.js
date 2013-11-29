'use strict';

angular.module('clientApp')
    .controller('MainCtrl', function ($scope, $http, socket) {
        $scope.clientCount = 0;

        var onRoomReceived = function (data) {
            console.log(data.roomName);
        }

        var onConnected = function (data) {
        }

        var onNexted = function (data) {
            $scope.status = 'nexted';
            $scope.roomName = '';
        }

        var onPaired = function (data) {
            console.log('paired!');
            console.log(data);
            $scope.status = 'found a match!';
            $scope.roomName = data.roomName;
            // socket.emit('getRoom');
        }

        var onClientCountUpdated = function (data) {
            console.log(data);
            $scope.clientCount = data.clientCount;
        }

        socket.on('connected', onConnected);
        socket.on('room', onRoomReceived);
        socket.on('clientCountUpdated', onClientCountUpdated);
        socket.on('paired', onPaired);
        socket.on('nexted', onNexted);

        $scope.randomize = function () {
            socket.emit('getPairing');
            $scope.status = 'searching';
            $scope.roomName = '';
        }

    });
