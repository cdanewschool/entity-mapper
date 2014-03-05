<?php
include_once "includes/db_object.class.php";
include_once "includes/fieldvalue.class.php";
include_once "includes/field.class.php";

class Entity extends DBObject
{
	const TABLE = "entities";

	public $children;
	public $dataFields;

	function __construct( $id = null, $db = null ) 
	{
		$this->dataFields = array();
		$this->children = array();
		
		parent::__construct( self::TABLE, array( "name","description","parent_id","entity_type_id","dataset_id" ), $id, $db );
	}
	
	function load()
	{
		$success = parent::load();

		if( $success )
		{
			$fields = array( Field::TABLE.".name", FieldValue::TABLE.".value", FieldValue::TABLE.".field_id" );
			
			$sql  = "SELECT " . implode(',',$fields) . " FROM " . FieldValue::TABLE . " ";
			$sql .= "LEFT JOIN " . Field::TABLE . " ON " . FieldValue::TABLE . ".field_id=" . Field::TABLE . ".id ";
			$sql .= "WHERE entity_id='" . $this->id . "' AND ".Field::TABLE.".dataset_id='" . $this->getField('dataset_id') . "'";

			$result = $this->db->query($sql);
			
			if( $this->db->affected_rows > 0 )
			{
				while( $row = $result->fetch_assoc() )
				{
					$fieldName = $row['name'];
					$fieldValue = $row['value'];
					
					$this->dataFields[$fieldName] = $fieldValue;
				}
			}
			
			$sql = "SELECT id FROM " . self::TABLE . " WHERE parent_id = '" . $this->id . "' AND dataset_id='" . $this->getField('dataset_id') . "' ORDER BY name";
			$result = $this->db->query($sql);
			
			if( $this->db->affected_rows > 0 )
			{
				while( $row = $result->fetch_assoc() )
				{
					$this->children[] = new Entity( $row['id'], $this->db );
				}
			}
		}

		return $success;
	}

	function save()
	{
		$success = parent::save();
		
		if( $success )
		{
			//	TODO: delete existing fields which don't appear in datafields
			
			foreach($this->dataFields as $fieldName=>$fieldValue)
			{
				$values = is_array($fieldValue) ? $fieldValue : array($fieldValue);
				
				foreach($values as $fieldValue)
				{
					if( empty($fieldValue) )
					{
						//	TODO: delete
					}
					else
					{
						$field = new Field(null,$this->db);
						$field->setField('name', $fieldName);
						$field->setField('dataset_id', $this->getField("dataset_id"));
						$field->save();
						
						if( !is_null($field->id) )
						{
							$value = new FieldValue(null,$this->db);
							$value->setField('entity_id', $this->id);
							$value->setField('field_id', $field->id);
							$value->setField('value', $fieldValue);
							$value->setField('dataset_id', $this->getField("dataset_id"));
							$value->save();
						}
					}
				}
			}
			
			foreach($this->children as $child)
			{
				$child->setField('parent_id', $this->id);
				$child->save();
			}
		}

		return $success;
	}

	function loadByFieldValue( $field, $value, $dataset_id )
	{
		$sql = "SELECT " . self::TABLE . ".id FROM " . self::TABLE . " ";
		$sql .= "LEFT JOIN " . FieldValue::TABLE . " ON " . FieldValue::TABLE . ".entity_id=" . self::TABLE . ".id ";
		$sql .= "LEFT JOIN " . Field::TABLE . " ON " . FieldValue::TABLE . ".field_id=" . Field::TABLE . ".id ";
		$sql .= "WHERE " . Field::TABLE . ".name = '" . $field . "' AND " . FieldValue::TABLE . ".value = '" . $value . "' AND " . FieldValue::TABLE . ".dataset_id = '" . $dataset_id . "'";

		$result = $this->db->query($sql);
		
		if( $this->db->affected_rows > 0 )
		{
			$row = $result->fetch_assoc();
			$this->id = $row['id'];
			$this->load();
		}
	}

	function getDataField( $name )
	{
		if( isset( $this->dataFields[ $name] ) )
			return $this->dataFields[ $name];

		return null;
	}

	function setDataField( $name, $value )
	{
		$this->dataFields[ $name ] = $value;
	}
}
?>