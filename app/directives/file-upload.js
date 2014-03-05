app.directive
(
	'fileUpload',
	function($parse)
	{
		return {
			
			restrict: "A",
			require: "ngModel",
			link:function(scope,element,attrs,ngModel)
			{
				$(element).bind
				(
					'change',
					function(e)
					{
						if( e.target.files 
							&& e.target.files.length 
							&& (typeof e.target.files[0] == "object") )
						{
							ngModel.$setViewValue( e.target.files[0] );
							scope.$apply();
						}
					}
				);
			}
		};
	}
);