<?php
include_once "includes/db_object.class.php";

class FieldValue extends DBObject
{
	const TABLE = "field_values";

	function __construct( $id = null, $db = null ) 
	{
		parent::__construct( self::TABLE, array( "entity_id","field_id","value","dataset_id" ), $id, $db );
	}
}
?>