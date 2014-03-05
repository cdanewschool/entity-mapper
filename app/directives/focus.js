app.directive
(
	'focus',
	function()
	{
		return {
			
			restrict: "A",
			link:function(scope,element,attrs)
			{
				$(element).focus();
			}
		};
	}
);