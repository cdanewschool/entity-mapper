app.directive
(
	'colorpicker',
	function($parse)
	{
		return {
			restrict: "A",
			require:"ngModel",
			link: function(scope,element,attrs,ngModel)
			{
				$(element).colorpicker();
				
				$(element).colorpicker().on
				(
					'changeColor', 
					function(e)
					{
						var model = $parse(attrs.ngModel);
						model.assign(scope, e.color.toHex().substr(1));
					}
				);
				
				scope.$watch
				(
					'entityType.color',
					function(newValue,oldValue) 
					{
						if(newValue) 
						{
							$(element).colorpicker('setValue',"#"+newValue);
						}
					}
				); 
			}
		};
	}
);

