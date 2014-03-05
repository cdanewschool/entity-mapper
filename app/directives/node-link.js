app.factory
(
	"graphModel",
	function($rootScope)
	{
		return {
			
			getNodeById: function( id, nodes )
			{
				if( this.nodesByIdCache[id] ) 
					return this.nodesByIdCache[id];
				
				var node = this.getNodeByProperty('id',id,nodes);
				this.nodesByIdCache[id] = node;
				
				return node;
			},
			
			getNodeByIndex: function( index, nodes )
			{
				if( this.nodesByIndexCache[index] ) 
					return this.nodesByIndexCache[index];
				
				var node = this.getNodeByProperty('_index',index,nodes);
				this.nodesByIndexCache[index] = node;
				
				return node;
			},
			
			getNodeByProperty: function( prop, value, nodes )
			{
				if( value == null ) return null;
				
				for(var i=0;i<nodes.length;i++)
				{
					var n = nodes[i];
					
					if( n[prop] == value ) 
					{
						return n;
					}
				}
				
				return null;
			},
			
			nodes:null,				//	all nodes, organized hierarchically
			nodesFlat:null,			//	all nodes, visible or not, organized in a flat list
			nodeParentsIndexed:{},
			nodesIndexedAll:{},
			
			//	caches
			nodesByIdCache: {},
			nodesByIndexCache: {},
			nodeRadiusCache: {},
			
			linksManual:null,		//	user-created links stored in db
			linksHierarchical:null	//	assumed links based on parent<>child relationships
		};
	}
);

app.directive
(
	"nodeLink",
	function($rootScope,$parse,$timeout,model,graphModel)
	{
		var w,h,r,x,y,vis;
		var node;		//	dom elements corresponding to node/link data
		var link;
		
		var nodeData = null;
		var hoverNode = null;
		var LINK_OPACITY = .1;
		var LINK_OPACITY_OVER = .8;
		var fixedNodes = [];
		var metaKeyPressed = false;
		
		var linkLog = d3.scale.log().domain([1,5]).range([1,400]);
		
		var linkDistance = function(link,index) { var val = linkLog(model.settings.zoomFactor); return val; };
		
		var updatePositions = function()
		{
			var p = 15;
			
			node.attr
			(
				"transform", 
				function(d) 
				{
					var t = d.parent || d;
					var x = Math.max(p, Math.min(w-p, t.x)) - (d.parent ? nodeRadius(d.parent) : 0);
					var y = Math.max(p, Math.min(h-p, t.y)) - (d.parent ? nodeRadius(d.parent) : 0);
					
					return "translate(" + x + "," + y + ")";
				}
			);
			
			link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; }); 
		};
		
		var nodeRadius = function(d) 
		{
			if( graphModel.nodeRadiusCache[d.id] )
				return graphModel.nodeRadiusCache[d.id];
			
			var r = 0;
			
			if( d.parent && d.parent.pack ) 
				r = d.r;
			else if( d.pack ) 
				r = d.r;
			else
				r = d.value / 5 * model.settings.zoomFactor * 4;
			
			graphModel.nodeRadiusCache[d.id] = r;
			
			return r;
		};
		
		return {
			
			restrict: "AE",
			
			controller: function($scope,$element,$attrs)
			{
				$rootScope.$on
			      (
			    	'$destroy', 
			    	function() 
			    	{
			    		unregisterListener();
			    	}
			    );
				
				/**
				 * Load dataset when model changes (will only be loaded once)
				 */
				$scope.$watch
				(
					'model.selectedDataset',
					function(newVal,oldVal)
					{
						if(newVal)
							load();
					}
				);
				
				/**
				 * Toggle all nodes when model property changes
				 */
				$scope.$watch
				(
					'model.settings.descendantsMaximized',
					function(newVal,oldVal)
					{
						if(newVal!=oldVal)
						{
							toggleAll();
						}
					}
				);
				
				$scope.$watch
				(
					'model.focusedNode',
					function(newVal,oldVal)
					{
						if(newVal!=oldVal)
						{
							highlightNode(newVal);
						}
					}
				);
				
				/**
				 * Update node sizes and link distances when zoom factor changes in model
				 */
				$scope.$watch
				(
					'model.settings.zoomFactor',
					function(newVal,oldVal)
					{
						if(newVal!=oldVal)
						{
							graphModel.nodeRadiusCache = {};	//	clear radii cache
							
							//	update packed node position and size
							//	TODO: fix issue where packed node childern aren't repositioned properly
							for(var i=0;i<nodeDataPack.length;i++)
							{
								if( nodeIsVisible(nodeDataPack[i]) )
								{
									var r = 0;
									for(var c in nodeDataPack[i].children)
										r += (nodeDataPack[i].children[c].value * model.settings.zoomFactor);
									
									var pack = d3.layout.pack().size([r*2,r*2]).padding(3);
									pack.nodes(nodeDataPack[i]);
								}
							}
							
							d3.selectAll('circle.node')
								.attr("r", function(d){ return nodeRadius(d); } )
								.attr("transform", function(d) { return d.parent != null ? "translate(" + d.x + "," + d.y + ")" : null; });
							
							d3.selectAll('circle.border')
								.attr("r", function(d){ return nodeRadius(d); } )
								.attr("transform", function(d) { return d.parent != null ? "translate(" + d.x + "," + d.y + ")" : null; });
							
							d3.selectAll('text')
								.style("display", function(d) { return !d.parent && nodeRadius(d) > 15 ? 'block' : 'none'; } );
							
							d3.selectAll('g.node')
								.attr("transform","translate(" + w + "," + h + ")")
							
							force.linkDistance( function(link,index){ return linkDistance(link,index); } );
							force.start();
						}
					}
				);
				
				unregisterListener = $scope.$on
				(
					'settingsChange',
					function(e,args)
					{
						onSettingChange(args[0],args[1]);
					}
				);
				
				//	event handlers
				angular.element(window).on("keydown", function(e) { metaKeyPressed = e.metaKey; updateCursor(); });
				angular.element(window).on("keyup", function(e) { metaKeyPressed = false; updateCursor(); });
				
				angular.element($element).on("click", function(e){if( $(e.target).is('svg') ) { $scope.setSelectedNode(); }});
				
				var load = function()
				{
					model.loading = true;
					
					if( $scope.model.selectedDataset.graph )
					{
						parse($scope.model.selectedDataset.graph);
						
						return;
					}
					
					var url = "api/graph/" + model.selectedDatasetId;
					var params = [];
					
					url = url + '?' + params.join("&");
					
					d3.json( url, function(error,graph){ onLoad(error,graph); } );
				};
				
				var onLoad = function(error,result)
			  	{
					var data = result.data;
					
					$scope.model.selectedDataset.graph = data;
					parse($scope.model.selectedDataset.graph);
				};
				
				var parse = function(data)
				{
					graphModel.nodesByIdCache = {};
					graphModel.nodesByIndexCache = {};
					graphModel.nodeRadiusCache = {};
					
					graphModel.nodes = angular.copy( data.nodes );
					graphModel.nodesFlat = flatten( graphModel.nodes, false, false );
					
					var nodesIndexedAll = {};
					
					for(var i=0;i<graphModel.nodesFlat.length;i++)
					{
						var n = graphModel.nodesFlat[i];
						nodesIndexedAll[ n.id ] = n;
					}
					
					graphModel.nodesIndexedAll = nodesIndexedAll;
					
					var nodeParentsIndexed = {};
					
					for(var i=0;i<graphModel.nodes.length;i++)
					{
						var n = graphModel.nodes[i];
						n.maximized = n.children != null || n.parent_id != null;
						nodeParentsIndexed[ n.id ] = n;
					}
					
					graphModel.nodeParentsIndexed = nodeParentsIndexed;
					
					var linksManual = [];
					
					for(var i=0;i<data.links.length;i++)
					{
						var link = data.links[i];
						
						var source = graphModel.nodesIndexedAll[ link.source ];
						var target = graphModel.nodesIndexedAll[ link.target ];
						
						if( source != null
							&& target != null 
							&& source != target )
						{
							if( source.parent 
								&& source.parent.pack )
							{
								source = source.parent;
							}
							
							if( target.parent 
								&& target.parent.pack )
							{
								target.value+=1;
								target = target.parent;
							}
							
							linksManual.push( {source:source,target:target,type:link.type} );
						}
					}
					
					graphModel.linksManual = linksManual;
					graphModel.linksHierarchical = d3.layout.tree().links(data.nodes);
					
					update();
				};
				
				var update = function()
				{
					if( model.selectedDataset == null || $scope.model.selectedDataset.graph == null ) return;
					
					force.stop();
					
					$scope.setSelectedNode();
					$scope.setHighlightedNode();
					
					var nodesFlat;
					var nodes = [];		
					var packNodes = [];
					
					//	node tree of nodes to show
					var filteredNodes = filterNodes(graphModel.nodes);
					
					//	split nodes into packed and un-packed
					for(var i=0;i<filteredNodes.length;i++)
					{
						var n = filteredNodes[i];
						
						if( n.pack )
							packNodes.push( n );
						else
							nodes.push( n );
					}
					
					nodeData = nodes;
					nodeDataPack = packNodes;
					
					//	parse children of packed nodes into a bin
					var packNodeChildren = [];
					
					for(var i=0;i<nodeDataPack.length;i++)
					{
						if( nodeIsVisible(nodeDataPack[i]) )
						{
							var pack = d3.layout.pack();
							var children = pack.nodes(nodeDataPack[i]);
							
							packNodeChildren = d3.merge( [packNodeChildren, children] );
						}
					}
					
					var nodes = flatten( nodeData );
					var linksHierarchical = d3.layout.tree().links(nodes);	//	auto-calculated links based on node hierarchy
					var calculatedLinks = [];							//	calculated links
					
					var nodesFlattened = flatten( d3.merge( [nodeData,nodeDataPack] ) );
					
					// update values
					for(var i=0;i<nodesFlattened.length;i++)
						nodesFlattened[i].value = 1;

					nodesFlat = nodes = nodesFlattened;
					
					//	build calculated links based on node visibility
					var nodesAll = flatten( d3.merge( [nodeData,packNodeChildren] ) );
					
					for(var i=0;i<$scope.model.selectedDataset.graph.links.length;i++)
					{
						var l = $scope.model.selectedDataset.graph.links[i];
						
						var source = graphModel.getNodeById( l.source, nodesAll );
						var target = graphModel.getNodeById( l.target, nodesAll );
						
						if( source != null
							&& target != null 
							&& source != target )
						{
							if( source.parent 
								&& source.parent.pack )
							{
								source.value+=1;
								source = source.parent;
							}
							
							if( target.parent 
								&& target.parent.pack )
							{
								target.value+=1;
								target = target.parent;
							}
							
							if( nodeIsVisible(source)
								&& nodeIsVisible(target) )
							{
								calculatedLinks.push( {source:source,target:target,type:link.type} );
							}
						}
					}
					
					var links = d3.merge( [calculatedLinks,linksHierarchical] );
					
					for(var i=0;i<links.length;i++)
					{
						var l = links[i];
						
						var source = graphModel.getNodeById( l.source ? l.source.id : l.source, nodesAll );
						var target = graphModel.getNodeById( l.target ? l.target.id : l.target, nodesAll );
						
						if( source ) source.value+=1;
						if( target ) target.value+=1;
					}
					
					//	now that node values have been calculated, re-init the packed nodes
					for(var i=0;i<nodeDataPack.length;i++)
					{
						if( nodeIsVisible(nodeDataPack[i]) )
						{
							var r = 0;
							for(var c in nodeDataPack[i].children)
								r += (nodeDataPack[i].children[c].value * model.settings.zoomFactor);
							
							var pack = d3.layout.pack().size([r*2,r*2]).padding(3);
							pack.nodes(nodeDataPack[i]);
						}
					}
					
					force.nodes(nodes).links(links).start(.1);
					
					$scope.model.loading = false;
					$scope.safeApply();
					
				  	node = node.data(nodes,function(d){return d.id;});
				  	
				  	//	links
				  	link = link.data(links);
					link.exit().remove();			// exit any old links
				  	link.enter().insert("svg:line")
				  		.attr("class", "edge")
				  		.style("stroke-opacity", function(d) { return linkOpacity(d); } );
				  	
				  	//	nodes
					node.exit().remove();	// exit any old nodes
					
					var g = node.enter().insert("svg:g")
						.attr("id", function(d) { return 'node_'+d.id; })
						.attr("class","node")
						.attr("title", function(d){ return d.title; } )
						.attr("transform","translate(" + w + "," + h + ")")
						.on("click",function(d){ return onNodeClick(d); } )
						.on("mouseover", function(d){ onNodeOver(d); })
						.on("mouseout", function(d){ onNodeOut(d); });
					
					g.insert("svg:circle")
						.attr("class", function(d){ return nodeClass(d); } )
						.attr("filter", function(d) { return nodeFilter(d); })
						.attr("r", function(d){ return nodeRadius(d); } )
						.attr("transform", function(d) { return d.parent != null ? "translate(" + d.x + "," + d.y + ")" : null; })
						.attr("data-toggle", "tooltip" )
						.style("fill", function(d){ return nodeColor(d); } );
					
					g.insert("svg:circle")
						.attr("class", "border" )
						.attr("r", function(d){ return nodeRadius(d); } )
						.attr("transform", function(d) { return d.parent != null ? "translate(" + d.x + "," + d.y + ")" : null; })
						.style("stroke", function(d){ return nodeStrokeColor(d); })
						.style("stroke-width", function(d) { return nodeStrokeWidth(d); });
					
					g.insert("svg:text")
						.attr("class", function(d){ return labelClass(d); } )
						.attr("dx", function(d) { return labelOffsetX(d); })
						.attr("dy", function(d) { return labelOffsetY(d); })
				      	.style("text-anchor", function(d) { return labelTextAnchor(d); })
				      	.style("font-family", "Arial,sans-serif")
				      	.style("display", function(d) { return !d.parent && nodeRadius(d) > 15 ? 'block' : 'none'; } )
				      	.text(function(d) { return nodeName(d); });
					
					g.call(force.drag);
					
					//	update styles (for update nodes)
					d3.selectAll('circle.node')
						.attr("class", function(d){ return nodeClass(d); } );
					
					d3.selectAll('circle.border')
						.style("stroke-width", function(d) { return nodeStrokeWidth(d); });
					
					$('g.node').tooltip( {container: 'body', html: true, placement: 'right', trigger: 'manual'} );
				};
				
				var nodeIsVisible = function(d)
				{
					var visible = ( $scope.model.selectedDataset.entityTypesIndexed[ d.entity_type_id ]
									&& $scope.model.selectedDataset.entityTypesIndexed[ d.entity_type_id ].visible
									&& $scope.model.selectedDataset.entityTypesIndexed[ d.entity_type_id ].enabled );
					
					if( d.parent_id )
						visible = visible && graphModel.nodeParentsIndexed[d.parent_id].maximized && nodeIsVisible(graphModel.nodeParentsIndexed[d.parent_id]); 
					
					return visible;
				};
				
				var onSettingChange = function( name, value )
				{
					if( name == "labelField" )
					{
						vis.selectAll("text").text(function(d) { return nodeName(d); });
					}
					else if (name=="entityTypes")
					{
						if( !$scope.model.selectedDataset.entityTypesIndexed.length ) return;
						
						update();
					}
				};
				
				//	returns a list of all nodes under the root
				var flatten = function(nodes,limitToVisible,limitToMaximized,flattenedNodes) 
				{
					limitToVisible = typeof limitToVisible==undefined ? true : limitToVisible;
					limitToMaximized = typeof limitToMaximized==undefined ? true : limitToMaximized;
					
					flattenedNodes = flattenedNodes || [];
					
					for(var i=0;i<nodes.length;i++)
					{
						var n = nodes[i];
						
						if( !limitToVisible || nodeIsVisible(n) )
						{
							flattenedNodes.push( n );
						}
						
						var children = n.children;
						
						if( children && (!limitToMaximized||n.maximized) )
							flatten(children,limitToVisible,limitToMaximized,flattenedNodes);
					}
					
					return flattenedNodes;
				};

				var highlightNode = function(d)
				{
					d3.selectAll('circle.node').attr("class", function(d){ return nodeClass(d); } );
					d3.selectAll('circle.border').attr("class", "border");
					d3.selectAll('text').style("display", function(d) { return !d.parent && nodeRadius(d) > 15 ? 'block' : 'none'; } );
					
					if( d ) 
					{
						d3.selectAll('circle.node')
								.attr("class", function(d){ return nodeClass(d) + ' unfocused' ; } )
							.filter(function(e,i){return d.id==e.id;})
								.attr("class", function(d){ return nodeClass(d) + ' focused'; } );
						
						d3.selectAll('circle.border')
								.attr("class", "border unfocused" )
							.filter(function(e,i){return d.id==e.id;})
								.attr("class", 'border focused');
						
						d3.selectAll('text')
							.style("display", 'none' )
						.filter(function(e,i){return d.id==e.id;})
							.style("display", 'block' );
					}
				};
				
				/**
				 * Returns a filterd tree of visible nodes
				 */
				var filterNodes = function(nodes,filteredNodes)
				{
					filteredNodes = filteredNodes || [];
					
					for(var i=0;i<nodes.length;i++)
					{
						var n = nodes[i];
						
						if( nodeIsVisible(n) )
						{
							filteredNodes.push(n);
							
							if( n._children )
							{
								if( !n.__children ) n.__children = n._children;
								
								n._children = [];
								
								filterNodes(n.__children,n._children);
							} 
							else if( n.children )
							{
								if( !n.__children ) n.__children = n.children;
								
								n.children = [];
								
								filterNodes(n.__children,n.children);
							}
						}
					}
					
					return filteredNodes;
				};
				
				var nodeClass = function(d)
				{
					var classes = ['node'];
					
					if( d.type == "field" ) classes.push( 'field' );
					if( d.pack ) classes.push( 'packed' );
					
					return classes.join(' ');
				};
				
				var nodeFilter = function(d)
				{
					return 'none';
					return d.fixed == 1 || (!d.parent && d == hoverNode) ? 'url(#glow)' : 'none';	//this is a major performance hit
				};
				
				var nodeColor = function(d)
				{
					return d.color && !d.pack ? '#' + d.color : "#fff";
				};
				
				var onNodeOver = function(d)
				{
					hoverNode = d;
					updateCursor(d);
					
					d3.select('[id=node_'+d.id+'] circle').attr("class", function(d){ return nodeClass(d) + ' over'; } ).attr("filter", function(d) { return nodeFilter(d); } );
					
					if( d.maximized ) d3.selectAll("line.edge").style("stroke-opacity", function(d){ return linkOpacityOver(d); } );
					
					$( "#node_" + d.id ).tooltip( "show" );
				};
				
				var onNodeOut = function(d)
				{
					$("body").css("cursor","default");
					
					hoverNode = null;
					updateCursor(d);
					
					d3.select('[id=node_'+d.id+'] circle').attr("class", function(d){ return nodeClass(d); } ).attr("filter", function(d) { return nodeFilter(d); } );
					
					if( d.maximized ) d3.selectAll("line.edge").style("stroke-opacity", function(d){ return linkOpacity(d); } );
					
					$( "#node_" + d.id ).tooltip( "hide" );
				};
				
				var onNodeClick = function(d) 
				{
					//	if command key is pressed, toggle node as "fixed"
					if( metaKeyPressed )
					{
						//	don't allow packed nodes to be fixed, as they're contained within their parent
						if( d.parent ) return;
						
						d.fixed = d.fixed > 0 ? 0 : 1;
						
						if( d.fixed && fixedNodes[d._index] == null ) 
							fixedNodes[d._index] = d;
						else if( !d.fixed && fixedNodes[d._index] > -1 ) 
							fixedNodes[ d._index ] = null;
						
						d3.select('[id=node_'+d.id+'] circle').attr("filter", function(d) { return nodeFilter(d); });
						
						updateCursor();
						
						return;
					}
					
					if( d.dblclick != null )
					{
						$timeout.cancel( d.dblclick );
						d.dblclick = null;
						
						if( d.__children && !d.pack )
						{
							toggleNode(d,!d.maximized);
							update();
						}
					}
					else
					{
						d.dblclick = $timeout( function(){d.dblclick = null;$scope.setSelectedNode(d);}, 200 );
					}
				};
				
				var toggleNode = function(d,maximized)
				{
					maximized = (typeof maximized != 'undefined') ? maximized : (d.children != null);
					
					if (!maximized)
					{
						d._children = d.__children;
						d._parent_id = d.parent_id;
						d.maximized = false;
						
					    d.children = null;
					    
					    if( d._children )
					    	for(var i=0;i<d._children.length;i++)
					    		toggleNode( d._children[i], maximized );
					} 
					else
					{
						if( !model.settings.descendantsMaximized )
							model.settings.descendantsMaximized = true;
						
						d.children = d.__children;
						d._children = null;
						d.maximized = true;
						
						if( d.children )
					    	for(var i=0;i<d.children.length;i++)
					    		toggleNode( d.children[i], maximized );
					}
				};
				
				var toggleAll = function()
				{
					for(var i=0;i<graphModel.nodesFlat.length;i++)
						toggleNode( graphModel.nodesFlat[i], model.settings.descendantsMaximized );
					
					update();
				};
				
				var nodeStrokeWidth = function(d)
				{
					if(d.pack) return 1; 
					if(!d.maximized && d.__children) return 3;
					
					return 0;
				};
				
				var nodeStrokeColor = function(d)
				{
					return d.color;
				};
				
				var updateCursor = function()
				{
					if( !metaKeyPressed && hoverNode && hoverNode.fixed == 1 ) 
						$("body").css("cursor","move");
					else if( metaKeyPressed && hoverNode != null && hoverNode.fixed != 1 ) 
						$("body").css("cursor","crosshair");
					else 
						$("body").css("cursor","default");
				};
				
				//	TODO: uncouple setting properties
				var nodeName = function(d) { return model.settings.labelField != null && d.fields != null && d.fields[model.settings.labelField.name] ? d.fields[model.settings.labelField.name] : d.name; };
				
				var labelClass = function(d) { return d.type == "field" ? "fieldLabel" : "entityLabel"; };
				var labelOffsetX = function(d) { return d.type == "field" || d.parent ? d.x : nodeRadius(d) + 5; };
				var labelOffsetY = function(d) { return d.type == "field" || d.parent ? d.y : nodeRadius(d) / 2 * .5; };
				var labelTextAnchor = function(d) { return d.type == "field" || d.parent ? "middle" : "right"; };
				
				var linkOpacity = function(d) { return LINK_OPACITY; };
				var linkOpacityOver = function(d) { return (d.source === hoverNode || d.target === hoverNode) ? LINK_OPACITY_OVER : LINK_OPACITY; };
				
				var toggleEntityType = function( id )
				{
					$scope.model.selectedDataset.entityTypesIndexed[id].visible = !$scope.model.selectedDataset.entityTypesIndexed[id].visible;
				};
			},
			
			link: function(scope,element,attrs)
			{
				d3.select("svg").remove();
				
				w = angular.element(element).width();
				h = angular.element(element).height();
				r = 1000;
				x = d3.scale.linear().range([0, r]);
				y = d3.scale.linear().range([0, r]);
				
				vis = d3.select(element[0])
					.append("svg:svg")
					.attr("width", "100%")
					.attr("height", "100%")
					.attr("viewBox", "0 0 " + w + " " + h);
				
				vis.append("svg:g")
					.attr("id", "links")
					.attr("width", "100%")
					.attr("height", "100%");
				
				vis.append("svg:g")
					.attr("id", "nodes")
					.attr("width", "100%")
					.attr("height", "100%");
				
				var filter = vis.append("svg:defs")
					.append("svg:filter")
					.attr("id", "glow")
					.attr("x", "-30%")
					.attr("y", "-30%")
					.attr("width", "140%")
					.attr("height", "140%");
				
				filter.append("svg:feGaussianBlur")
					.attr("stdDeviation", 4)
					.attr("result", "blur");
				
				filter.append("svg:feOffset")
					.attr("in", "blur")
					.attr("dx", "0")
					.attr("dy", "0")
					.attr("result", "offsetBlur");
				
				var mergeNode = filter.append("svg:feMerge");
				mergeNode.append("svg:feMergeNode").attr("in", "offsetBlur");
				mergeNode.append("svg:feMergeNode").attr("in", "SourceGraphic");
				
				link = d3.select("#links").selectAll("line.edge");
				node = d3.select("#nodes").selectAll("g.node");
				
				force = d3.layout.force()
					.charge(-300)	//-30
					.linkStrength(1)	//1
					.size([w, h])
					.theta(.8)		//.8
					.friction(.8)	//.9
					.nodes([])
					.links([])
					.linkDistance( function(link,index){ return linkDistance(link,index); } )
					.on
					(
						"tick", 
						function(e)
						{
							updatePositions();
						}
					);
			}
		};
	}
);
