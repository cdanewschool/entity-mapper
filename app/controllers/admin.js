app.controller
(
	'AdminCtrl',
	[
	 	'$scope','$location','model','adminModel','userModel','UserService','DatasetService','DEBUG',
	 	function($scope,$location,model,adminModel,userModel,userService,dataService,DEBUG)
	 	{
	 		$scope.location = $location;
	 		
	 		$scope.adminModel = adminModel;
	 		$scope.userModel = userModel;
	 		
	 		$scope.userService = userService;
	 		$scope.dataService = dataService;
	 		
	 		adminModel.status = null;
	 		adminModel.selectedDatasetId = undefined;
	 		adminModel.selectedDataset = undefined;
	 		adminModel.selectedUserId = undefined;
	 		
	 		$scope.$watch
	 		(
	 			'adminModel.formData.upload.file',
	 			function(newVal,oldVal)
	 			{
	 				if( newVal != oldVal 
	 					&& newVal != null
	 					&& !adminModel.formData.upload.name )
	 				{
	 					adminModel.formData.upload.name = newVal.name.substr(0,newVal.name.lastIndexOf(".")).replace(/_/ig,' ');
	 				}
	 			}
	 		);
	 		
	 		$scope.$watch
	 		(
	 			'adminModel.selectedDatasetId',
	 			function(newVal,oldVal)
	 			{
	 				if( newVal != oldVal )
	 				{
	 					adminModel.formData.upload = {};
	 					
	 					for(var d in $scope.model.datasets)
	 						if( $scope.model.datasets[d].id == newVal )
	 							adminModel.formData.upload = angular.copy( $scope.model.datasets[d] );
	 				}
	 			}
	 		);
	 		
	 		$scope.$watch
	 		(
	 			'adminModel.selectedUserId',
	 			function(newVal,oldVal)
	 			{
	 				if( newVal != oldVal )
	 				{
	 					adminModel.formData.user = {};
	 					
	 					for(var d in $scope.userModel.users)
	 						if( $scope.userModel.users[d].id == newVal )
	 							adminModel.formData.user = angular.copy( $scope.userModel.users[d] );
	 					
	 					$scope.safeApply();
	 				}
	 			}
	 		);
	 		
	 		$scope.uploadDataset = function()
	 		{
	 			adminModel.status = null;
	 			
	 			if( !userService.isLoggedIn() )
	 				adminModel.status = "Misc error";
	 			else if( adminModel.formData.upload.name == undefined || adminModel.formData.upload.name == "" )
	 				adminModel.status = "Please enter a name for the dataset";
	 			else if( !adminModel.formData.upload.type_id || isNaN(parseInt(adminModel.formData.upload.type_id)) )
	 				adminModel.status = "Please specify an import type";
	 			else if( adminModel.formData.upload.id == null && adminModel.formData.upload.file == undefined )
	 				adminModel.status = "Please browse for a file";
	 			
	 			if( adminModel.status != null )
	 			{
	 				return false;
	 			}
	 			
	 			var data = new FormData();
	 			data.append('user_id',userModel.currentUser.id);
	 			data.append('id',adminModel.formData.upload.id);
	 			data.append('name',adminModel.formData.upload.name);
	 			data.append('file',adminModel.formData.upload.file);
	 			data.append('type_id',adminModel.formData.upload.type_id);
	 			data.append('node_radius',adminModel.formData.upload.node_radius?adminModel.formData.upload.node_radius:3);
	 			data.append('link_distance',adminModel.formData.upload.link_distance?adminModel.formData.upload.link_distance:50);
	 			data.append('is_public',adminModel.formData.upload.is_public==1 ? 1 : 0);
	 			
	 			for(var e in adminModel.formData.upload.entityTypes)
	 			{
	 				var entityType = adminModel.formData.upload.entityTypes[e];
	 				var id = entityType.id;
	 				
	 				data.append('color_'+id,entityType.color);
	 				data.append('enabled_'+id,entityType.enabled==true?'true':'false');
	 				data.append('pack_'+id,entityType.pack==true?'true':'false');
	 				data.append('visible_'+id,entityType.visible==true?'true':'false');
	 			}
	 			
	 			model.loading = true;
	 			
	 			$scope.dataService.updateDataset
	 			(
	 				adminModel.formData.upload.id,
	 				data,
	 				function(data,status,headers,config)
	 				{
	 					model.loading = false;
	 					
	 					if( data.success )
	 					{
	 						adminModel.status = "Data edited";
	 						adminModel.output = "<pre>" + data.data + "</pre>";
	 						adminModel.selectedDatasetId = undefined;
	 						adminModel.formData.upload = {};
	 						
	 						$scope.getDatasets();
	 					}
	 					else
	 					{
	 						adminModel.status = "Error uploading data";
	 					}
	 					
	 					$scope.safeApply();
	 				}
	 			);
	 		};
	 		
	 		$scope.deleteDataset = function(confirmState)
	 		{
	 			adminModel.status = null;
	 			adminModel.confirmState = confirmState || 1;
	 			
	 			if( !adminModel.selectedDatasetId )
	 			{
	 				adminModel.status = "Please select a dataset to delete";
	 				adminModel.confirmState = 0;
	 				return;
	 			}
	 			
	 			var data = {id:adminModel.selectedDatasetId};
	 			
	 			if( adminModel.confirmState < 2 ) 
	 				return;
	 			
	 			model.loading = true;
	 			
	 			$scope.dataService.deleteDataset
	 			(
	 				data,
	 				function(data,status,headers,config)
	 				{
	 					model.loading = false;
	 					
	 					if( data.success )
	 					{
	 						adminModel.status = "Dataset deleted";
	 						adminModel.selectedDatasetId = undefined;
	 						adminModel.confirmState = 0;
	 						
	 						$scope.getDatasets();
	 					}
	 					else
	 					{
	 						adminModel.status = "Error deleting dataset";
	 					}
	 					
	 					$scope.safeApply();
	 				}
	 			);
	 		};
	 		
	 		$scope.saveUser = function()
	 		{
	 			adminModel.status = null;
	 			
	 			var adminIds = [];
	 			for(var u in userModel.users)
	 				if( userService.isAdmin(userModel.users[u]) )
	 					adminIds.push(userModel.users[u].id);
	 			
	 			if( !userService.isLoggedIn() || !userService.isAdmin() )
	 				adminModel.status = "Misc error";
	 			else if( adminModel.formData.user.password != "" && adminModel.formData.user.password != adminModel.formData.user.passwordConfirm )
	 				adminModel.status = "Passwords don't match!";
	 			else if( adminIds.length <= 1 && !userService.isAdmin({role_id:adminModel.formData.user.role_id}) && adminIds.indexOf(adminModel.formData.user.id) > -1 )
	 				adminModel.status = "There must be at least one admin!";
	 			
	 			if( adminModel.status != null )
	 			{
	 				return false;
	 			}
	 			
	 			var data = {id:adminModel.formData.user.id,role_id:adminModel.formData.user.role_id};
	 			
	 			if( adminModel.formData.user.password != "" )
	 				data.password = adminModel.formData.user.password;
	 			
	 			model.loading = true;
	 			
	 			$scope.userService.saveUser
	 			(
	 				adminModel.formData.user.id,
	 				data
	 			).then
	 			(
 					function(data,status,headers,config)
	 				{
 						var data = data.data;
 						
 						if( DEBUG ) console.log( 'user save', data );
	 					
	 					model.loading = false;
	 					
	 					if( data.success )
	 					{
	 						adminModel.status = "User saved";
	 						adminModel.selectedUserId = undefined;
	 						adminModel.formData.user = {};
	 						
	 						userService.getUsers();
	 						
	 						if( data.results 
	 							&& data.results.length
	 							&& data.results[0].id == userModel.currentUser.id 
	 							&& data.results[0].password != userModel.currentUser.password )
	 						{
	 							userModel.status = "Please login";
	 							userService.logout();
	 						}
	 					}
	 					else
	 					{
	 						adminModel.status = "Error uploading data";
	 					}
	 					
	 					$scope.safeApply();
	 				}
	 			);
	 		};
	 		
	 		$scope.editableDatasets = function(item)
	 		{
	 			return item.user_id == undefined || (userModel.currentUser && item.user_id == userModel.currentUser.id);
	 		};
	 		
	 		$scope.setLocation = function(path)
            {
	 			$location.path(path);
	 			$scope.safeApply();
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