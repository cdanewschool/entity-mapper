<?php
include_once "includes/db_object.class.php";

class EntityType extends DBObject
{
	const TABLE = "entity_types";

	function __construct( $id = null, $db = null ) 
	{
		parent::__construct( self::TABLE, array( "name","color","enabled","pack","visible","dataset_id" ), $id, $db );
	}

	public function loadByField( $name, $value )
	{
		$sql = "SELECT id FROM " . self::TABLE . " ";
		$sql .= "WHERE " . $name . "='" . $value . "'";

		$result = $this->db->query($sql);
		
		if( $this->db->affected_rows > 0 )
		{
			$row = $result->fetch_assoc();

			$this->id = $row['id'];
			$this->load();
		}
	}
}
?>