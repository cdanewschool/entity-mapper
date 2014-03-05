app.factory
(
	'DatasetService',
	[
	 	'$http','model',
	 	function($http,model)
	 	{
	 		return {
	 			//	 DELETE
	 			deleteDataset: function(data,success)
		 		{
		 			$http.delete("api/dataset/"+data.id,data).success(success);
		 		},
		 		
		 		//	GET
		 		getDatasets: function(data,success)
		 		{
		 			$http.get("api/dataset",data).success(success);
		 		},
		 		getImportTypes: function(success)
		 		{
		 			$http.get("api/importtype").success(success);
		 		},
		 		
		 		//	POST
		 		updateDataset: function(id,data,success)
		 		{
		 			var url = "api/dataset" + (id?"/"+id:"");
		 			
		 			$http.post(url,data,{headers: {'Content-Type': undefined}, transformRequest: angular.identity}).success(success);
		 		}
	 		};
	 	}
	 ]
	
);