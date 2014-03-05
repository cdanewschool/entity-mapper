<?php
include_once "includes/db_object.class.php";

class Field extends DBObject
{
	const TABLE = "fields";

	function __construct( $id = null, $db = null ) 
	{
		parent::__construct( self::TABLE, array( "name","ordering","render","dataset_id" ), $id, $db );
	}

	public function beforeInsert()
	{
		$sql = "SELECT MAX( ordering ) AS `max` FROM  " . self::TABLE;
		$result = $this->db->query($sql);
			
		if( $this->db->affected_rows > 0 )
		{
			$row = $result->fetch_assoc();
			$this->setField('ordering', $row['max'] + 1);
		}
		
		return parent::beforeInsert();
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

	public static function getAll()
	{
		$fields = array();

		$sql = "SELECT id FROM " . self::TABLE . " ORDER BY ordering";
		
		$db = new Database();
		$result = $db->query($sql);

		if( $db->affected_rows > 0 )
		{
			while($row = $result->fetch_assoc() )
			{
				$fields[] = new Field( $row['id'] );
			}
		}
		
		return $fields;
	}
}
?>