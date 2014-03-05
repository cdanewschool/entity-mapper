app.factory
(
	'userModel',
	function()
	{
		return {
			currentUser:null,
			formData:
				{
					login:{},
					signup:{}
				},
			roles:null,
			rolesIndexed:null,
			status:null,
			users:null,
			userOptions:null
		};
	}
);

app.controller
(
	'UserCtrl',
	[
	 	'$scope','userModel','UserService','AuthenticationService','DEBUG',
	 	function($scope,userModel,userService,authenticationService,DEBUG)
	 	{
	 		$scope.userModel = userModel;
	 		$scope.authenticationService = authenticationService;
	 		$scope.userService = userService;
	 		
	 		$scope.signup = function()
	 		{
	 			//$scope.setStatus();
	 			
	 			var username = userModel.formData.signup.username;
	 			var password = userModel.formData.signup.password;
	 			var passwordConfirm = userModel.formData.signup.passwordConfirm;
	 			
	 			if( !username )
	 				$scope.setStatus("Please enter an email");
	 			else if( !password )
	 				$scope.setStatus("Please enter a password");
	 			else if( !passwordConfirm )
	 				return $scope.setStatus("Please confirm your password");
	 			else if( password != passwordConfirm )
	 				return $scope.setStatus("Passwords don't match");
	 			
	 			if( $scope.userModel.status )
	 				return;
	 			
	 			var data = new FormData();
	 			data.append('username',username);
	 			data.append('password',password);
	 			
	 			$scope.authenticationService.signup
	 			(
	 				data,
 					function(data,status,headers,config)
	 				{
	 					if( !data.success )
	 					{
	 						$scope.setStatus(data.error);
	 						$scope.safeApply();
	 					}
	 					else
	 					{
	 						$scope.userModel.formData.signup = {};
	 						$scope.userModel.formData.login = {};
	 						
	 						$scope.setStatus("Account created. Please login.");
	 						$scope.setLocation('/login');
	 					}
	 					
	 					$scope.safeApply();
	 				}
	 			);
	 		};
	 		
	 		$scope.login = function()
	 		{
	 			if( DEBUG ) console.log( 'login' );
	 			
	 			$scope.setStatus();
	 			
	 			var username = userModel.formData.login.username;
	 			var password = userModel.formData.login.password;
	 			
	 			if( !username )
	 				$scope.setStatus("Please enter an email");
	 			else if( !password )
	 				$scope.setStatus("Please enter a password");
	 			
	 			if( $scope.userModel.status )
	 				return;
	 			
	 			$scope.userService.login
	 			(
	 				username,password,
 					function(data,status,headers,config)
	 				{
	 					if( !data.success )
	 					{
	 						$scope.setStatus(data.error);
	 						$scope.safeApply();
	 					}
	 					else
	 					{
	 						$scope.userModel.currentUser = data.results[0];
	 						$scope.userModel.formData.login = {};
	 					}
	 				}
	 			);
	 		};
	 		
	 		$scope.logout = function()
	 		{
	 			$scope.userService.logout();
	 		};
	 		
	 		$scope.setStatus = function(status)
	 		{
	 			status = status || null;
	 			
	 			$scope.userModel.status = status;
	 		};
	 		
	 		$scope.safeApply = function()
			{
				var phase = this.$root.$$phase;
				if( phase == "$apply" || phase == "$digest" ) return;
				
				this.$apply();		
			};
	 	}
	 ]
);