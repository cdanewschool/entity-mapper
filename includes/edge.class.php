<?php
include_once "includes/db_object.class.php";

class Edge extends DBObject
{
	const TABLE = "edges";
	
	function __construct( $id = null, $db = null ) 
	{
		parent::__construct( self::TABLE, array( "source_id","target_id","dataset_id" ), $id, $db );
	}
	
	function load()
	{
		$success = parent::load();

		return $success;
	}

	function save()
	{
		$success = parent::save();
		
		return $success;
	}
}
?>