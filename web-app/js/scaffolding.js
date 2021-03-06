
angular.module('dateService', ['$strap.directives']);
angular.module('flashService', []).factory('Flash', function () {
    var flash = {};

    flash.getMessage = function () {
        var value = this.message;
        this.message = undefined;
        return value;
    };

    flash.error = function (text) {
        this.message = {level:'error', text:text};
    };
    flash.success = function (text) {
        this.message = {level:'success', text:text};
    };
    flash.info = function (text) {
        this.message = {level:'info', text:text};
    };
    return flash;
});

angular.module('grailsService', ['ngResource']).factory('Grails', function ($resource) {
    var baseUrl = $('body').data('base-url');
    return $resource(baseUrl + ':action/:id', {id:'@id'}, {
        list:{method:'GET', params:{action:'list'}, isArray:true},
        get:{method:'GET', params:{action:'get'}},
        save:{method:'POST', params:{action:'save'}},
        update:{method:'POST', params:{action:'update'}},
        delete:{method:'POST', params:{action:'delete'}}
    });
});


var scaffoldingModule = angular.module('scaffolding', ['grailsService', 'flashService', 'dateService']);

scaffoldingModule.config([
    '$routeProvider',
    function ($routeProvider) {
        var baseUrl = $('body').data('template-url');
        $routeProvider.
            when('/create', {templateUrl:baseUrl + '/create.html', controller:CreateCtrl}).
            when('/edit/:id', {templateUrl:baseUrl + '/edit.html', controller:EditCtrl}).
            when('/list', {templateUrl:baseUrl + '/list.html', controller:ListCtrl}).
            when('/show/:id', {templateUrl:baseUrl + '/show.html', controller:ShowCtrl}).
            otherwise({redirectTo:'/list'});
    }
]);

scaffoldingModule.directive('alert', function () {
    var baseUrl = $('body').data('common-template-url');
    return {
        restrict:'E',
        transclude:false,
        scope:{
            level:'@level',
            text:'@text'
        },
        templateUrl:baseUrl + '/alert.html',
        replace:true
    }
});


scaffoldingModule.directive('ngDeleteWarn', [ function () {
    return {
        link:function (scope, element, attr) {
            var msg = attr.ngConfirmClick || "Are you sure you want to Delete!";
            var clickAction = attr.confirmedClick;
            element.bind('click', function (event) {
                if (window.confirm(msg)) {
                    scope.$eval(clickAction)
                }
            });
        }
    };
}]);


scaffoldingModule.directive('pagination', function () {
    var baseUrl = $('body').data('common-template-url');
    return {
        restrict:'A',
        transclude:false,
        scope:{
            total:'=total'
        },
        controller:function ($scope, $routeParams) {
            $scope.max = parseInt($routeParams.max) || 10;
            $scope.offset = parseInt($routeParams.offset) || 0;
            $scope.currentPage = Math.ceil($scope.offset / $scope.max);

            $scope.pages = function () {
                var pages = [];
                for (var i = 0; i < Math.ceil($scope.total / $scope.max); i++)
                    pages.push(i);
                return pages;
            };

            $scope.lastPage = function () {
                return $scope.pages().slice(-1)[0];
            };
        },
        templateUrl:baseUrl + '/pagination.html',
        replace:false
    }
});

function toArray(element) {
    return Array.prototype.slice.call(element);
}

Function.prototype.curry = function () {
    if (arguments.length < 1) {
        return this;
    }
    var __method = this;
    var args = toArray(arguments);
    return function () {
        return __method.apply(this, args.concat(toArray(arguments)));
    }
}

function errorHandler($scope, $location, Flash, response) {
    switch (response.status) {
        case 404:
            Flash.error(response.data.message);
            $location.path('/list');
            break;
        case 409:
            $scope.message = {level:'error', text:response.data.message};
            break;
        case 422:
            $scope.errors = response.data.errors;
            break;
        default: // TODO: general error handling
    }
}

function ListCtrl($scope, $routeParams, $location, Grails, Flash) {
    Grails.list($routeParams, function (list, headers) {
        $scope.list = list;
        $scope.total = parseInt(headers('X-Pagination-Total'));
        $scope.message = Flash.getMessage();
    }, errorHandler.curry($scope, $location, Flash));

    $scope.show = function (item) {
        $location.path('/show/' + item.id);
    };

    $scope.edit = function (item) {
        $location.path('/edit/' + item.id);
    };

    $scope.delete = function (item) {
        item.$delete(function (response) {
            window.location.reload();
        }, errorHandler.curry($scope, $location, Flash));
    };

}

function ShowCtrl($scope, $routeParams, $location, Grails, Flash) {
    $scope.message = Flash.getMessage();

    Grails.get({id:$routeParams.id}, function (item) {
        $scope.item = item;
    }, errorHandler.curry($scope, $location, Flash));

    $scope.delete = function (item) {
        item.$delete(function (response) {
            Flash.success(response.message);
            $location.path('/list');
        }, errorHandler.curry($scope, $location, Flash));
    };
}

function CreateCtrl($scope, $location, Grails, Flash) {
    $scope.item = new Grails;
    $scope.coats = [
        {name:'Hairless', value:'Hairless'},
        {name:'Short', value:'Short'},
        {name:'Semi-long', value:'Semi-long' },
        {name:'Long', value:'Long'}
    ];
    $scope.item.coat = $scope.coats[0];
    $scope.item.dateOfArrival = {date: new Date()};
    $scope.save = function (item) {
        item.$save(function (response) {
            Flash.success(response.message);
            $location.path('/show/' + response.id);
        }, errorHandler.curry($scope, $location, Flash));
    };
}

function EditCtrl($scope, $routeParams, $location, Grails, Flash) {
    Grails.get({id:$routeParams.id}, function (item) {
        $scope.item = item;
        $scope.coats = [
            {name:'Hairless', value:'Hairless'},
            {name:'Short', value:'Short'},
            {name:'Semi-long', value:'Semi-long' },
            {name:'Long', value:'Long'}
        ];
        $scope.item.coat = {type:$scope.item.coat};
        $scope.item.dateOfArrival = {date: new Date($scope.item.dateOfArrival)};
    }, errorHandler.curry($scope, $location, Flash));

    $scope.update = function (item) {
        item.$update(function (response) {
            Flash.success(response.message);
            $location.path('/show/' + response.id);
        }, errorHandler.curry($scope, $location, Flash));
    };

    $scope.delete = function (item) {
        item.$delete(function (response) {
            Flash.success(response.message);
            $location.path('/list');
        }, errorHandler.curry($scope, $location, Flash));
    };
}