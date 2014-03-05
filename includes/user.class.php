<?php
include_once "includes/db_object.class.php";

class User extends DBObject
{
	const TABLE = "users";

	function __construct( $id = null, $db = null ) 
	{
		parent::__construct( self::TABLE, array( "username","password","role_id" ), $id, $db );
	}
}
?>