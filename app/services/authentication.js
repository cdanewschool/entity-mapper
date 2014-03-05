app.factory
(
	'AuthenticationService',
	[
	 	'$http',
	 	function($http)
	 	{
	 		return {
	 			getSession: function(data,success,error)
		 		{
	 				success = success || function(){};
	 				error = error || function(){};
	 				
		 			return $http.get("api/session",data).success(success).error(error);
		 		},
		 		signup: function(data,success,error)
		 		{
		 			success = success || function(){};
		 			error = error || function(){};
		 			
		 			return $http.post("api/user",data,{headers: {'Content-Type': undefined}, transformRequest: angular.identity}).success(success).error(error);
		 		},
		 		login: function(data,success,error)
		 		{
		 			success = success || function(){};
		 			error = error || function(){};
		 			
		 			return $http.post("api/login",data,{headers: {'Content-Type': undefined}, transformRequest: angular.identity}).success(success).error(error);
		 		},
		 		logout: function(data,success,error)
		 		{
		 			success = success || function(){};
		 			error = error || function(){};
		 			
		 			return $http.post("api/logout",data,{headers: {'Content-Type': undefined}, transformRequest: angular.identity}).success(success).error(error);
		 		}
	 		};
	 	}
	 ]
	
);