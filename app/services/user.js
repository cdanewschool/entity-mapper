app.factory
(
	'UserService',
	[
	 	'$rootScope','$http','AuthenticationService','userModel','DEBUG',
	 	function($rootScope,$http,authenticationService,userModel,DEBUG)
	 	{
	 		return {
	 			
	 			login: function(username,password,success)
	 			{
	 				var data = new FormData();
		 			data.append('username',username);
		 			data.append('password',password);
		 			
		 			var self = this;
		 			
	 				authenticationService.login(data,success).then
		 			(
		 				function(data)
		 				{
		 					if( data.data.success )
		 					{
		 						userModel.currentUser = data.data.results[0];
		 						
		 						if( DEBUG )
		 						{
		 							console.log( "User '" + userModel.currentUser.username + "' logged-in" );
		 							console.log( userModel.currentUser.username + " is a " + userModel.rolesIndexed[ userModel.currentUser.role_id ].title + " with permissions", "admin = " + self.isAdmin(), "can upload = " + self.canUpload() );
		 						}
		 						
		 						if( self.isAdmin() )
		 							self.getUsers();
		 						
		 						$rootScope.$broadcast("login");
		 					}
		 				}
		 			);
	 			},
	 			logout: function()
	 			{
	 				var data = new FormData();
		 			data.append('user_id',userModel.currentUser.id);
		 			
	 				return authenticationService.logout(data).then
		 			(
		 				function(data)
		 				{
		 					if( data.data.success )
		 					{
		 						userModel.currentUser = null;
		 						
		 						$rootScope.$broadcast("logout");
		 					}
		 				}
		 			);
	 			},
	 			getSession: function()
		 		{
		 			var data = {};
		 			var self = this;
		 			
		 			return authenticationService.getSession(data).then
		 			(
		 				function(data)
		 				{
		 					if( data.data.success 
		 						&& data.data.results[0] )
		 					{
		 						userModel.currentUser = data.data.results[0];
		 						
		 						if( DEBUG )
		 						{
		 							console.log( "User '" + userModel.currentUser.username + "' retrieved from session" );
			 						console.log( userModel.currentUser.username + " is a " + userModel.rolesIndexed[ userModel.currentUser.role_id ].title + " with permissions", "admin = " + self.isAdmin(), "can upload = " + self.canUpload() );
		 						}
		 						
		 						$rootScope.$broadcast("login");
		 					}
		 				}
		 			);
		 		},
		 		getRoles: function()
		 		{
		 			var data = {};
		 			var self = this;
		 			
		 			return $http.get("api/user_roles",data).then
		 			(
		 				function(data)
		 				{
		 					if( data.data.success 
			 					&& data.data.results )
			 				{
			 					var roles = data.data.results;
			 					var rolesIndexed = {};
			 					
			 					for(var r in roles)
			 						rolesIndexed[ roles[r].id ] = roles[r];
			 					
			 					userModel.roles = roles;
			 					userModel.rolesIndexed = rolesIndexed;
			 					
			 					if( DEBUG )
			 						console.log( "User roles loaded", userModel.rolesIndexed );
			 				}
		 				}
		 			);
		 		},
		 		getUsers: function()
		 		{
		 			var data = {};
		 			
		 			return $http.get("api/user",data).then
		 			(
		 				function(data)
		 				{
		 					if( data.data.success 
			 					&& data.data.results )
			 				{
			 					var users = data.data.results;
			 					
			 					userModel.users = users;
			 					userModel.userOptions = users.length ? [{name:"Select",value:null}].concat( users ) : null;
			 					
			 					if( DEBUG )
			 						console.log( "Users loaded", userModel.users );
			 				}
		 				}
		 			);
		 		},
		 		saveUser: function(id,data)
		 		{
		 			return $http.post("api/user/"+id,data);
		 		},
		 		getPermission: function(role,user)
		 		{
		 			user = user  || userModel.currentUser;
		 			
		 			if( userModel.rolesIndexed == null ) 
		 				return false;
		 			
		 			return user != null && userModel.rolesIndexed[ user.role_id ][role];
		 		},
		 		isAdmin: function(user)
		 		{
		 			return this.getPermission('is_admin',user)=='1';
		 		},
		 		canUpload: function(user)
		 		{
		 			return this.getPermission('can_upload',user)=='1';
		 		},
		 		isLoggedIn: function()
		 		{
		 			return userModel.currentUser != null;
		 		}
	 		};
	 	}
	 ]
	
);