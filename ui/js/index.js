"use strict"

const app = angular.module("filterUI", ['ui.bootstrap'])

app.controller("mainController", function ($scope, $rootScope, $http, $uibModal) {
	$http.get("http://localhost:9000/db")
	.then((res) => {
		$rootScope.dbs = res.data
	})
	
	$scope.getTopics = function (db) {
		$rootScope.db = db
		
		$http.get("http://localhost:9000/" + db + "/topic")
		.then((res) => {
			$rootScope.topics = res.data
		})
	}
	
	$scope.getFilters = function (db, topic) {
		$rootScope.topic = topic
		
		$http.get("http://localhost:9000/" + db + "/" + topic + "/filter")
		.then((res) => {
			$rootScope.filters = res.data
		})
	}
	
	$scope.addModal = function () {
		let modalInstance = $uibModal.open({
			animation: false,
			templateUrl: 'add.html',
			controller: 'addController',
			size: 'lg',
			resolve: {
				status: function () {
					//
				}
			}
		})
	}
	
	$scope.editModal = function (filter) {
		$rootScope.filter = filter
		
		let modalInstance = $uibModal.open({
			animation: false,
			templateUrl: 'edit.html',
			controller: 'editController',
			size: 'lg',
			resolve: {
				status: function () {
					//
				}
			}
		})
	}
	
	$scope.metricsModal = function () {
		let modalInstance = $uibModal.open({
			animation: false,
			templateUrl: 'metrics.html',
			controller: 'metricsController',
			size: 'lg',
			resolve: {
				status: function () {
					//
				}
			}
		})
	}
})

app.controller('metricsController', ($scope, $interval, $http, $uibModalInstance) => {
	$scope.getKafka = function () {
		$http.get("http://localhost:9001/count")
		.then((res) => {
			$scope.kafka = res.data
		})
	}
	
	$scope.getGroup = function () {
		$http.get("http://localhost:9001/toolsRUs")
		.then((res) => {
			$scope.group = res.data
			delete $scope.group.filtered
		})
	}
	
	$scope.getPM2 = function () {
		$http.get("http://localhost:9002/")
		.then((res) => {
			$scope.pm2 = res.data
		})
	}
	
	$interval(() => {
		$scope.getKafka()
	}, 60000)
	
	$interval(() => {
		$scope.getGroup()
	}, 60000)
	
	$interval(() => {
		$scope.getPM2()
	}, 60000)
	
	$scope.cancel = function () {
		$uibModalInstance.close("cancel")
	}
})

app.controller('addController', ($scope, $window, $interval, $rootScope, $http, $uibModalInstance) => {
	$scope.clone = {
		match: {
			pos: [],
			neg: []
		},
		tags: []
	}
	$scope.saveState = "disabled"
	$scope.toad = "hidden"
	
	$scope.addMatch = function (word) {
		$scope.clone.match.pos.push(word)
		
		$scope.matchWord = null
	}
	
	$scope.remMatch = function (index) {
		$scope.clone.match.pos.splice(index, 1)
	}
	
	$scope.addSkip = function (word) {
		$scope.clone.match.neg.push(word)
		
		$scope.skipWord = null
	}
	
	$scope.remSkip = function (index) {
		$scope.clone.match.neg.splice(index, 1)
	}
	
	$scope.addTag = function (word) {
		$scope.clone.tags.push(word)
		
		$scope.tagWord = null
	}
	
	$scope.remTag = function (index) {
		$scope.clone.tags.splice(index, 1)
	}
	
	$scope.getTopics = function () {
		if(!$rootScope.topics) {
			$http.get("http://localhost:9000/" + $scope.dbClone + "/topic")
			.then((res) => {
				$rootScope.topics = res.data
			})
		}
	}
	
	$scope.validate = function () {
		$scope.clone.timer = 3
		$scope.toad = "show"
		
		$http.post("http://localhost:9000/" + $scope.dbClone + "/" + $scope.topicClone + "/test", $scope.clone)
		.then((res) => {
			$scope.valRes = res.data.messages
			
			if(res.data.valid) {
				$scope.saveState = "enabled"
				$scope.toad = "hidden"
			} else {
				$scope.saveState = "disabled"
				$scope.toad = "hidden"
			}
		})
	}
	
	$scope.save = function () {
		$http.post("http://localhost:9000/" + $scope.dbClone + "/" + $scope.topicClone + "/filter", $scope.clone)
		.then((res) => {
			if(!res.data.valid) {
				// $window.alert($scope.clone)
			}
			
			if($scope.saveState === "enabled") {
				$uibModalInstance.close("save")
			}
		})
	}
		
	$scope.cancel = function () {
		$uibModalInstance.close("cancel")
	}
})

app.controller('editController', ($scope, $rootScope, $http, $uibModalInstance) => {
	$scope.clone = $rootScope.filter
	$scope.saveState = "disabled"
	$scope.toad = "hidden"
	
	$scope.addMatch = function (word) {
		$scope.clone.match.pos.push(word)
		
		$scope.matchWord = null
	}
	
	$scope.remMatch = function (index) {
		$scope.clone.match.pos.splice(index, 1)
	}
	
	$scope.addSkip = function (word) {
		$scope.clone.match.neg.push(word)
		
		$scope.skipWord = null
	}
	
	$scope.remSkip = function (index) {
		$scope.clone.match.neg.splice(index, 1)
	}
	
	$scope.addTag = function (word) {
		$scope.clone.tags.push(word)
		
		$scope.tagWord = null
	}
	
	$scope.remTag = function (index) {
		$scope.clone.tags.splice(index, 1)
	}
	
	$scope.save = function () {
		$http.post("http://localhost:9000/" + $scope.dbClone + "/" + $scope.topicClone + "/filter", $scope.clone)
		.then((res) => {
			if($scope.saveState === "enabled") {
				$uibModalInstance.close("save")
			}
		})
	}
	
	$scope.validate = function () {
		$scope.clone.timer = 3
		$scope.toad = "show"
		
		$http.post("http://localhost:9000/" + $scope.dbClone + "/" + $scope.topicClone + "/test", $scope.clone)
		.then((res) => {
			$scope.valRes = res.data.messages
			
			if(res.data.valid) {
				$scope.saveState = "enabled"
				$scope.toad = "hidden"
			} else {
				$scope.saveState = "disabled"
				$scope.toad = "hidden"
			}
		});
	};
	
	$scope.killswitch = function () {
		$http.delete("http://localhost:9000/" + $scope.dbClone + "/" + $scope.topicClone + "/filter/" + $scope.clone._id)
		.then((res) => {
			$uibModalInstance.close("delete")
		})
	}
	
	$scope.cancel = function () {
		$uibModalInstance.close("cancel")
	}
})