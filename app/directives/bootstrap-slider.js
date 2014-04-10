app.directive
(
	'bootstrapSlider',
	function($parse)
	{
		return {
			restrict:"A",

			link:function(scope,element,attrs)
			{
				var model = $parse(attrs.ngModel);
				
				angular.element(element).slider
				(
					{
						handle:'square',
						min:1,
						max:attrs.bootstrapSlider,
						tooltip:'hide',
						value:model(scope)
					}
				);
				
				angular.element(element).on
				(
					'slideStop', 
					function (e) 
					{
						var model = $parse(attrs.ngModel);
						model.assign(scope, e.value);
						
						scope.$apply();
					}
				);
				
				scope.$watch
				(
					model,
					function(newVal,oldVal)
					{
						$(element).slider('setValue', model(scope));
					}
				);
			}
		};
	}
);