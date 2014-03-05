<?php
include_once "includes/db.class.php";

class DBObject
{
	public $id;
	public $fields;

	protected $allowedFields;
	protected $db;
	protected $table;
	
	function __construct( $table, $allowedFields = null, $id = null, $db = null ) 
	{
		$this->allowedFields = $allowedFields;
		$this->db = !is_null($db) ? $db : new Database();
		$this->fields = array();
		$this->table = $table;
		
		if( !is_null($id) )
		{
			$this->id = $id;
			$this->load();
		}
	}

	public function load()
	{
		if( !is_null($this->id) )
		{
			$sql = "SELECT * FROM " . $this->table . " WHERE id='" . $this->id . "'";
			
			$result = $this->db->query($sql);

			if( $this->db->affected_rows > 0 )
			{
				$row = $result->fetch_assoc();
				
				foreach($row as $field=>$value)
				{
					$this->setField($field,$value);
				}
			}
			else
			{
				$this->id = null;
				$result = null;
			}
			
			return $result;
		}
		
		return false;
	}

	public function save()
	{
		if( is_null($this->id) )
		{
			$where = array();

			foreach($this->fields as $field=>$value)
			{
				$where[] = $field . "='" . $value . "'";
			}
			
			$sql = "SELECT id FROM " . $this->table . " WHERE " . implode(" AND ",$where);
			$result = $this->db->query($sql);
			
			if( $this->db->affected_rows > 0 )
			{
				$row = $result->fetch_assoc();
				$this->id = $row['id'];

				return $this->save();
			}
			
			$this->beforeInsert();
			
			$fieldNames = array();
			$fieldValues = array();
			
			foreach($this->fields as $field=>$value)
			{
				$fieldNames[] = $field;
				$fieldValues[] = !is_null($value) ? "'" . $this->db->real_escape_string($value) . "'" : 'NULL';
			}
			
			$sql = "INSERT INTO `" . $this->table . "` (" . implode(",",$fieldNames) . ") VALUES (" . implode(",",$fieldValues) . ")";
			$result = $this->db->query($sql);

			if( $result )
			{
				$this->id = $this->db->insert_id;
			}
			
			return !is_null($result);
		}
		else
		{
			$updates = array();

			foreach($this->fields as $field=>$value)
			{
				$updates[] = $field . "='" . $this->db->real_escape_string($value) . "'";
			}
			
			$sql = "UPDATE `" . $this->table . "` SET " . implode(",",$updates) . " WHERE id='" . $this->id . "'";

			return $this->db->query($sql);
		}

		return false;
	}
	
	public function delete()
	{
		if( !is_null($this->id) )
		{
			$sql = "DELETE FROM `" . $this->table . "` WHERE id='" . $this->id . "'";
			
			return $this->db->query($sql);
		}
		
		return false;
	}
	
	public function getField( $name )
	{
		if( isset( $this->fields[ $name] ) )
			return $this->fields[ $name];

		return null;
	}

	public function setField( $name, $value )
	{
		if( array_search( $name, $this->allowedFields ) > -1 )
			$this->fields[ $name ] = $value;
	}

	public function beforeInsert(){}
}
?>