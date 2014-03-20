var app = angular.module
(
	"app",
	["ngRoute","ngSanitize"],
	
	//	see http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/
	function($httpProvider)
	{
		$httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
		 
		// Override $http service's default transformRequest
		$httpProvider.defaults.transformRequest = [function(data)
		{
			/**
		     * The workhorse; converts an object to x-www-form-urlencoded serialization.
		     * @param {Object} obj
		     * @return {String}
		     */ 
			var param = function(obj)
		    {
				var query = '';
				var name, value, fullSubName, subName, subValue, innerObj, i;
		      
				for(name in obj)
				{
					value = obj[name];
		        
					if(value instanceof Array)
					{
						for(i=0; i<value.length; ++i)
						{
				            subValue = value[i];
				            fullSubName = name + '[' + i + ']';
				            innerObj = {};
				            innerObj[fullSubName] = subValue;
				            query += param(innerObj) + '&';
						}
					}
					else if(value instanceof Object)
					{
						for(subName in value)
						{
				            subValue = value[subName];
				            fullSubName = name + '[' + subName + ']';
				            innerObj = {};
				            innerObj[fullSubName] = subValue;
				            query += param(innerObj) + '&';
						}
					}
			        else if(value !== undefined && value !== null)
			        {
			        	query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
			        }
				}
				
				return query.length ? query.substr(0, query.length - 1) : query;
		    };
		    
		    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
		}];
	}
);

app.config
(
	[
	 	'$routeProvider','$locationProvider',
		function($routeProvider, $locationProvider) 
		{
			$locationProvider.hashPrefix('!');
	        
			$routeProvider
				.when('/', { templateUrl: 'partials/login.html', controller: 'AppCtrl' })
				.when('/login', { templateUrl: 'partials/login.html', controller: 'UserCtrl' })
				.when('/signup', { templateUrl: 'partials/signup.html', controller: 'UserCtrl' })
				.when('/view', { templateUrl: 'partials/main.html', controller: 'AppCtrl' })
				.when('/view/:datasetId', { templateUrl: 'partials/visualization.html', controller: 'AppCtrl' })
				.when('/about', { templateUrl: 'partials/about.html', controller: 'AppCtrl' })
				
	 			.when('/admin/delete', {templateUrl: 'partials/admin/delete.html',controller:'AdminCtrl'})
	 			.when('/admin/upload', {templateUrl: 'partials/admin/upload.html',controller:'AdminCtrl'})
	 			.when('/admin/edit', {templateUrl: 'partials/admin/edit.html',controller:'AdminCtrl'})
	 			.when('/admin/users', {templateUrl: 'partials/admin/users.html',controller:'AdminCtrl'})
	 			.otherwise({ redirectTo: '/view' });
	    }
	]
);

app.factory
(
	'model',
	function()
	{
		return {
			adminMode: false,
			adminNavigation:
				[
				 	{label:"Upload a Dataset",path:"/admin/upload"},
				 	{label:"Edit a Dataset",path:"/admin/edit"},
				 	{label:"Delete a Dataset",path:"/admin/delete"}
				 ],
				 
			datasets:null,
			help:false,
			focusedNode:null,
			redirectUrl:null,
			selectedDatasetId:null,
			selectedDataset:null,
			selectedNode:null,
			settings: {
				additionalNodeFields:null,
				descendantsMaximized:true,
				entityTypes:null,
				labelField:null,
				linkDistance:50,
				nodeRadius:3
			}
		};
	}
);

app.factory
(
	'adminModel',
	function()
	{
		return {
			confirmState:null,
			datasetOptions:null,
			formData:
				{
					upload:{},
					user:{}
				},
			importTypeOptions:null,
			selectedDatasetId:null,
			selectedDataset:null,
			selectedUserId:null,
			status:null
		};
	}
);

//	http://arthur.gonigberg.com/2013/06/29/angularjs-role-based-auth/
app.run
(
	function($rootScope,$location,model,UserService,DEBUG)
	{
		var routesThatDontRequireAuth = ['/login','/signup'];
		
		var routeClean = function (route) 
		{
			return _.find(routesThatDontRequireAuth,
				function (noAuthRoute) 
				{
					return _.str.startsWith(route, noAuthRoute);
      			}
			);
  		};
		
  		var last = "/login";
  		
		$rootScope.$on
		(
			'$routeChangeStart',
			function(event,next,current)
			{
				if( !routeClean($location.url()) )
				{
					if( !UserService.isLoggedIn() )
					{
						if( DEBUG )
							console.log("No login privileges, redirecting to /login")
						
						if( $location.url() != "" 
							&& $location.url() != "/" )
							model.redirectUrl = $location.url();
						
						$location.path('/login');
					}
					else if( $location.path().indexOf("/admin") > -1
						&& !UserService.canUpload() )
					{
						if( DEBUG )
							console.log("No upload privileges, redirecting to " + last)
						
						$location.path(last);
					}
				}
				
				model.adminMode = $location.path().indexOf('/admin') > -1;
				
				last = $location.path();
			}
		);
	}
);
