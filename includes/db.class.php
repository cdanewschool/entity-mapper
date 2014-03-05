<?php
include_once "config/db.php";

class Database
{
	public $connection;
	
	function Database()
	{
	}
	
	function connect()
	{
		$this->connection = new mysqli( DB_HOST, DB_USER, DB_PASS );
		$this->connection->select_db( DB_NAME );
	}
	
	function query( $string )
	{
		if( is_null($this->connection) )
			$this->connect();
		
		return $this->connection->query( $string );
	}
	
	public function __get($property) 
	{
		if (property_exists($this->connection, $property)) 
		{
			return $this->connection->$property;
		}
	}
	
	function real_escape_string( $string )
	{
		if( is_null($this->connection) )
			$this->connect();
		
		return $this->connection->real_escape_string( $string );
	}
}

?>