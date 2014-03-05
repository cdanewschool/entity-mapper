app.directive
(
	'bootstrapSwitch',
	function($parse)
	{
		return {
			restrict:"A",

			link:function(scope,element,attrs)
			{
				angular.element(element).bootstrapSwitch();
				
				var model = $parse(attrs.ngModel);
				angular.element(element).bootstrapSwitch('state', model(scope));
				
				angular.element(element).on
				(
					'switchChange', 
					function (e, data) 
					{
						var model = $parse(attrs.ngModel);
						
						if( model(scope) == data.value ) return;
						
						scope.$apply
						(
							function()
							{
								model.assign(scope, data.value);
							}
						);
					}
				);
				
				scope.$watch
				(
					model,
					function(newVal,oldVal)
					{
						$(element).bootstrapSwitch('state', model(scope));
					}
				);
			}
		};
	}
);