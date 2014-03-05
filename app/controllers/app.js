app.controller
(
	'AppCtrl',
	[
	 	'$scope','$rootScope','$location','$routeParams','$timeout','$http','model','adminModel','graphModel','UserService','DatasetService','APP_TAGLINE','DEBUG',
	 	function($scope,$rootScope,$location,$routeParams,$timeout,$http,model,adminModel,graphModel,userService,datasetService,APP_TAGLINE,DEBUG)
	 	{
	 		var deregisterLogin,degreisterLogout,deregisterDestroy;
	 		
	 		$scope.model = model;
	 		$scope.location = $location;
	 		$scope.adminModel = adminModel;
	 		$scope.dataService = datasetService;
	 		$scope.userService = userService;
	 		$scope.graphModel = graphModel;
	 		$scope.APP_TAGLINE = APP_TAGLINE;
	 		
	 		$scope.$watch
	 		(
	 			'model.selectedDatasetId',
	 			function(newVal,oldVal)
	 			{
	 				if( newVal != oldVal )
	 				{
	 					$scope.model.selectedDataset = null;
	 					
	 					for(var d in $scope.model.datasets)
	 						if( $scope.model.datasets[d].id == newVal )
	 							$scope.model.selectedDataset = $scope.model.datasets[d];
	 				}
	 			}
	 		);
	 		
	 		$scope.$watch
	 		(
	 			'model.datasets',
	 			function(newVal,oldVal)
	 			{
	 				if( newVal != oldVal )
	 				{
	 					$scope.model.selectedDataset = null;
	 					
	 					for(var d in $scope.model.datasets)
	 						if( $scope.model.datasets[d].id == $scope.model.selectedDatasetId )
	 							$scope.model.selectedDataset = $scope.model.datasets[d];
	 				}
	 			}
	 		);
	 		
			$scope.$watch
			(
				'model.selectedDataset.entityTypes',
				function(newVal,oldVal)
				{
					if(	newVal!=oldVal
						&& $scope.model.selectedDataset )
					{
						var enabledTypes = new Array();
						
						for(var id in $scope.model.selectedDataset.entityTypes)
						{
							var entityType = $scope.model.selectedDataset.entityTypes[id];
							
							if( entityType.visible )
							{
								enabledTypes.push( entityType.id );
							}
						}
						
						$scope.setSetting('entityTypes', enabledTypes);
					}
				},true
			);
			
			deregisterDestroy = $scope.$on
		    (
		    	'$destroy', 
		    	function() 
		    	{
		    		deregisterLogin();
		    		deregisterLogout();
		    		deregisterDestroy();
		    	}
		    );
			
			deregisterLogin = 
	 			$rootScope.$on
	 		(
	 			'login',
	 			function()
	 			{
	 				$scope.model.datasets = null;
		 			$scope.model.selectedDatasetId = null;
		 			
 					if( $scope.userService.isLoggedIn() )
 						$scope.getDatasets();
 					
 					if( $scope.userService.canUpload() )
 						$scope.getImportTypes();
 					
 					if( $scope.userService.isAdmin() )
 						$scope.userService.getUsers();
 					
 					if( $scope.model.redirectUrl != null )
 					{
 						$scope.setLocation( $scope.model.redirectUrl );
 						$scope.model.redirectUrl = null;
 					}
 					else
 					{
 						$scope.setLocation( "/view" );
 					}
	 			}
	 		);
	 		
			deregisterLogout = 
				$rootScope.$on
	 		(
	 			'logout',
	 			function()
	 			{
	 				$scope.setLocation("/login");
	 			}
	 		);
	 			
	 		if( $routeParams.datasetId )
            {
	 			model.selectedDatasetId = $routeParams.datasetId;
            }
	 		else
	 		{
	 			model.selectedDatasetId = null;
	 		}
	 		
	 		$scope.init = function()
	 		{
	 			$http.get("includes/faq.json").success
	 			(
	 				function(data, status, headers, config) 
	 				{
	 					model.faqs = data;
	 					
	 					if( DEBUG ) console.log(data);
	 				}
	 			);
	 			
	 			$scope.userService.getRoles().then
	 			(
	 				function()
	 				{
	 					$scope.userService.getSession();
	 				}
	 			);
	 		};
	 		
	 		$scope.setLocation = function(path)
            {
	 			$location.path(path);
	 			$scope.safeApply();
            };
            
	 		$scope.setSetting = function( name, value )
	 		{
	 			$scope.model.settings[name] = value;
	 			
	 			$scope.$broadcast('settingsChange',[name,value]);
	 		};
	 		
	 		$scope.setHighlightedNode = function(node)
	 		{
	 			if( node != null )
	 				model.focusedNode = node;
	 			else
	 			{
	 				if( $scope.unfocusDelay )
	 					$timeout.cancel($scope.unfocusDelay);
	 				
	 				$scope.unfocusDelay = $timeout(function(){model.focusedNode = null;},500);
	 			}
	 		};
	 		
	 		$scope.setSelectedNode = function(node)
	 		{
	 			$scope.model.selectedNode = node;
	 			
	 			if( !node ) 
	 			{
	 				$scope.safeApply();
		 			return;
	 			}
	 			
	 			if( $scope.model.selectedNode )
	 				$scope.model.selectedNodeParent = graphModel.getNodeById(node.parent_id,graphModel.nodesFlat);
	 			
	 			var childrenByType = {};
	 			var relative;
	 			
	 			var links = model.selectedDataset.graph.links;
	 			
	 			for(var l in links)
	 			{
	 				if( links[l].target == node.id )
	 					relative = graphModel.nodesIndexedAll[links[l].source];
	 				else if( links[l].source == node.id )
	 					relative =  graphModel.nodesIndexedAll[links[l].target];
	 				
	 				if( relative
	 					&& relative.id != node.parent_id )
	 				{
	 					if( !childrenByType[relative.entity_type_id] )
		 					childrenByType[relative.entity_type_id] = [];
		 				
	 					if( childrenByType[relative.entity_type_id].indexOf( relative ) == -1 )
	 						childrenByType[relative.entity_type_id].push( relative );
	 				}
	 			}
	 			
	 			var links = graphModel.linksHierarchical;
	 			
	 			for(var l in links)
	 			{
	 				if( links[l].target.id == node.id )
	 					relative = links[l].source;
	 				else if( links[l].source.id == node.id )
	 					relative = links[l].target;
	 				
	 				if( relative
	 					&& relative.id != node.parent_id )
	 				{
	 					if( !childrenByType[relative.entity_type_id] )
		 					childrenByType[relative.entity_type_id] = [];
		 				
	 					if( childrenByType[relative.entity_type_id].indexOf( relative ) == -1 )
	 						childrenByType[relative.entity_type_id].push( relative );
	 				}
	 			}
	 			
	 			for(var c in node.__children)
	 			{
	 				relative = node.__children[c];
	 				
	 				if( !childrenByType[relative.entity_type_id] )
		 				childrenByType[relative.entity_type_id] = [];
	 				
	 				if( childrenByType[relative.entity_type_id].indexOf( relative ) == -1 )
 						childrenByType[relative.entity_type_id].push( relative );
	 			}
	 			
	 			$scope.model.selectedNodeRelatives = childrenByType;
	 			
	 			$scope.safeApply();
	 		};
	 		
	 		$scope.getDatasets = function()
	 		{
	 			var data = {};
	 			
	 			$scope.dataService.getDatasets
	 			(
	 				data,
 					function(data,status,headers,config)
	 				{
	 					datasets = [];
	 					
	 					$(data.results).each
	 					(
	 						function(index,obj)
	 						{
	 							//	index entity types
	 							var entityTypesIndexed = [];
	 							
	 							for(var i=0;i<obj.entityTypes.length;i++)
	 							{
	 								obj.entityTypes[i].name = _.str.titleize(obj.entityTypes[i].name);
	 								entityTypesIndexed[ obj.entityTypes[i].id ] = obj.entityTypes[i];
	 							}
	 							
	 							obj.entityTypesIndexed = entityTypesIndexed;
	 							
	 							datasets.push( obj );
	 						}
	 					);
	 					
	 					$scope.model.datasets = datasets;
	 					$scope.adminModel.datasetOptions = datasets.length ? [{name:"Select",value:null}].concat( datasets ) : null;
	 					$scope.adminModel.cachingEnabled = data.cachable;
	 					
	 					for(var d in $scope.model.datasets)
	 						if( $scope.model.datasets[d].is_default 
	 							&& $scope.model.selectedDatasetId == undefined )
	 							$scope.model.selectedDatasetId = $scope.model.datasets[d].id;
	 					
	 					$scope.safeApply();
	 				}
	 			);
	 		};
	 		
	 		$scope.getImportTypes = function()
	 		{
	 			$scope.dataService.getImportTypes
	 			(
 					function(data,status,headers,config)
	 				{
	 					$scope.adminModel.importTypeOptions = [{label:"Select",value:null}].concat( data.results );
	 					$scope.safeApply();
	 				}
	 			);
	 		};
	 		
	 		$scope.selectDataset = function(id)
	 		{
	 			$scope.model.selectedDatasetId = id;
	 		};
	 		
	 		$scope.setLabel = function(fieldId)
	 		{
	 			for(var id in $scope.model.selectedDataset.fields)
				{
					var field = $scope.model.selectedDataset.fields[id];
					
					if( field.id == fieldId )
					{
						$scope.setSetting('labelField', field);
						
						break;
					}
				}
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