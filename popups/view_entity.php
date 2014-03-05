<script type="text/javascript">
$(document).ready
(
	function()
	{
		var entityId = <?php echo $_GET['id']; ?>;
		loadEntity( entityId );
	}
);

function loadEntity( id )
{
	if( id == null ) return;

	var self = this;
	
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
			//$(entity.dataFields).each( function(key,value){ addDataField( value.id, value.field, value.value ); } );
			
			$(this).parent().find( $('.modal-header h3') ).text( entity.name );
			
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
</script>