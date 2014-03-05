app.directive
(
	'helpTip',
	function($parse)
	{
		return {
			
			restrict: "A",
			
			link:function(scope,element,attrs)
			{
				element.attr('data-placement','auto');
				element.attr('data-container','body');
				element.attr("data-trigger",'manual');
				
				var update = function()
				{
					var helpEnabled = $parse(attrs.helpTip)(scope);
					
					if( helpEnabled 
						&& element.is(':visible') )
					{
						element.tooltip("show");
					}
					else
					{
						element.tooltip("hide");
					}
				};
				
				scope.$watch
				(
					function() 
					{ 
						return element.is(':visible');
					}, 
					update
				);
				
				scope.$watch
				(
					attrs.helpTip,
					function(newVal,oldVal)
					{
						if( newVal != oldVal )
						{
							update();
						}
					}
				);
			}
		};
	}
);