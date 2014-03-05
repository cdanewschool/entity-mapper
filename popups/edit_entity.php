<script type="text/javascript">
$(document).ready
(
	function()
	{
		$("#form").hide();

		$("#form").ajaxForm( { target: '#success'} );
		
		loadEntities();
	}
);

function loadEntities()
{
	$.ajax
	(
		{
			dataType: "json", url: "api/get/entities.json"
		}
	)
	.done
	(
		function(data)
		{
			$(data).each
			(
				function(index,obj)
				{
					$("#entity-select").append( "<option value='" + obj.id + "'>" + obj.label + "</option>" );
					$("#entity-parent").append( "<option value='" + obj.id + "'>" + obj.label + "</option>" );
				}
			);
		}
	);
}

function loadEntity( id )
{
	if( id == null ) return;

	$("#dataFields").empty();
	$("#form").hide();
	
	$.ajax
	(
		{
			dataType: "json", url: "api/get/entity.json?id=" + id
		}
	)
	.done
	(
		function(entity)
		{
			$(entity.dataFields).each( function(key,value){ addDataField( value.id, value.field, value.value ); } );
			
			$("#entity-name").val( entity.name );
			$("#entity-parent").val( entity.parent_id );
		    
			$("#form").show();
		}
	);
}

function addDataField( id, name, value )
{
	var fieldId = 'data-field-' + id;
	var containerId = fieldId + '-container';

	if( $("#" + fieldId ).length == 0 ) 
	{
		var field = '';
		
		field += '<div id="' + containerId + '" class="control-group">';
		field += '<label class="control-label" for="' + fieldId + '">' + name + '</label>';
		field += '<div class="controls"><input type="text" id="' + fieldId + '" name="dataField' + id + '" placeholder="' + name + '"></div>';
		field += '</div>';
		
		$("#dataFields").append( field );
	}

	$("#" + fieldId ).val( value );
}

function removeDataField( id )
{
	var fieldId = 'data-field-' + id;
	var containerId = id + '-container';
	
	$('#' + containerId).remove();
}
</script>

<div class="modal fade" id="popup_edit_entity">
	
	<div class="modal-header">
		<a class="close" data-dismiss="modal">&times;</a>
		<h3>Edit Entity</h3>
	</div>
	
	<div class="modal-body">
		
		<select id="entity-select" onchange="loadEntity( $('#entity-select').val() )">
			<option id="-1">Select</option>
		</select>
    	
    	<div id="success"></div>
    	
		<form id="form" class="form-horizontal" action="api/put/save_entity.php" method="post">
			
			<input type="hidden" name="dataFieldNames[]">
			
			<div class="control-group">
    			<label class="control-label" for="entity-parent">Member of</label>
    			<div class="controls">
     				<select id="entity-parent" name="parent_id">
						<option id="-1">Select</option>
					</select>
    			</div>
    		</div>
			
			<div class="control-group">
    			<label class="control-label" for="entity-name">Name</label>
    			<div class="controls">
     				<input type="text" id="entity-name" name="name" placeholder="Name">
    			</div>
    		</div>
    		
			<div id="dataFields"></div>
			
		</form>
		
	</div>
	
	<div class="modal-footer">
		<a href="#" class="btn" data-dismiss="modal">Close</a>
		<a href="#" class="btn btn-primary" onclick="$('#form').submit();">Save Changes</a>
	</div>
	
</div>