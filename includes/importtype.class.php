<?php
include_once "includes/db_object.class.php";

class ImportType extends DBObject
{
	const TABLE = "import_types";

	function __construct( $id = null, $db = null ) 
	{
		parent::__construct( self::TABLE, array( "name","class_name", "file_name", "mime_type", "is_default" ), $id, $db );
	}

	public static function getAll( $where = null )
	{
		$db = new Database();

		$sql = "SELECT id FROM " . self::TABLE;
		if( !is_null($where) ) $sql .= " WHERE " . implode(" AND ",$where);

		$result = $db->query($sql);

		$results = array();

		if( $db->affected_rows > 0 )
		{
			$row = $result->fetch_assoc();
			$results[] = new self( $row['id'] );
		}

		return $results;
	}
}
?>