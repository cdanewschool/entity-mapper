<?php
include_once "includes/db_object.class.php";

include_once "includes/edge.class.php";
include_once "includes/entity.class.php";
include_once "includes/entitytype.class.php";
include_once "includes/field.class.php";
include_once "includes/fieldvalue.class.php";

class Dataset extends DBObject
{
	const TABLE = "datasets";
	const CACHE_ROOT = "../cache";
	
	public $entityTypes;
	public $customFields;
	
	function __construct( $id = null, $db = null ) 
	{
		$this->entityTypes = array();
		$this->customFields = array();
		
		parent::__construct( self::TABLE, array( "user_id", "type_id", "name", "node_radius", "link_distance", "is_default", "is_public", "last_updated", "cached_date" ), $id, $db );
	}
	
	public function save()
	{
		$this->setField("last_updated", time());
		
		$success = parent::save();
		
		if( $success )
		{
			foreach($this->entityTypes as $entityType)
			{
				$entityType->save();	
			}
		}
		
		return $success;
	}
	
	public function load()
	{
		$success = parent::load();
		
		if( !is_null($this->id) )
		{
			$sql = "SELECT id FROM " . Field::TABLE . " WHERE dataset_id='" . $this->id . "' ORDER BY name";
			$result = $this->db->query( $sql );
			
			$fields = array();
			
			while( $row = $result->fetch_assoc() )
			{
				$field = new Field( $row['id'] );
				$fields[] = $field;
			}
			
			$this->customFields = $fields;
			
			$sql = "SELECT id FROM " . EntityType::TABLE . " WHERE dataset_id='" . $this->id . "' ORDER BY name";
			$result = $this->db->query( $sql );
			
			while( $row = $result->fetch_assoc() )
			{
				$entityType = new EntityType( $row['id'], $this->db );
				$entityTypes[] = $entityType;
			}
			
			$this->entityTypes = $entityTypes;
		}
		
		return $success;
	}
	
	public function delete()
	{
		$success = parent::delete();
		
		if( $success )
			$this->clear();
		
		return $success;
	}
	
	public function clear()
	{
		$this->db->query( "DELETE FROM " . Edge::TABLE . " WHERE dataset_id='" . $this->id . "'" );
		$this->db->query( "DELETE FROM " . Entity::TABLE . " WHERE dataset_id='" . $this->id . "'" );
		$this->db->query( "DELETE FROM " . EntityType::TABLE . " WHERE dataset_id='" . $this->id . "'" );
		$this->db->query( "DELETE FROM " . Field::TABLE . " WHERE dataset_id='" . $this->id . "'" );
		$this->db->query( "DELETE FROM " . FieldValue::TABLE . " WHERE dataset_id='" . $this->id . "'" );
	}
	
	public function cachePath()
	{
		return self::CACHE_ROOT . "/".$this->id.".json";
	}
	
	public function isCached()
	{
		return file_exists($this->cachePath() ) && $this->getField('last_updated')<=$this->getField('cached_date');
	}
}
?>