<?php 
set_include_path("../");
include_once "config/db.php";
include_once "includes/db.class.php";

define("DEBUG",false);

if( DEBUG )
{
	echo "<pre>";
	print_r($_GET);
	print_r($_POST);
	print_r($_FILES);
	print_r($_SESSION);
}

session_start();

$resource = isset($_GET['resource'])?$_GET['resource']:null;
$resourceId = isset($_GET['resourceId'])?$_GET['resourceId']:null;
$modifier = isset($_GET['modifier'])?$_GET['modifier']:null;

$response = (object)array("success"=>1);

$db = new Database();
$items = array();

switch( $resource )
{
	case "login":
		
		include_once "includes/user.class.php";
		
		switch( $_SERVER['REQUEST_METHOD'] )
		{
			case "POST":
		
				if( !isset($_POST['username']) || !isset($_POST['password']) )
				{
					$response->success = 0;
					$response->error = "Insufficient information provided";
				}
				
				if( $response->success )
				{
					$sql =  "SELECT u.id,u.username,u.password,u.role_id,ur.can_upload,ur.is_admin FROM " . User::TABLE . " AS u ";
					$sql .= "LEFT JOIN user_roles AS ur ON ur.id = u.role_id ";
					$sql .= "WHERE u.username='" . $db->real_escape_string($_POST['username']) . "' AND u.password='" . md5($db->real_escape_string($_POST['password'])) . "'";
					
					$result = $db->query( $sql );
					
					if( $result->num_rows == 0 )
					{
						$response->success = 0;
						$response->error = "No user found";
					}
					else
					{
						$row = $result->fetch_assoc();
						$items = array( array("id"=>$row['id'],"username"=>$row['username'],"password"=>$row['password'],"role_id"=>$row['role_id']) );
						
						$_SESSION['user_id'] = $row['id'];
						$_SESSION['is_admin'] = $row['is_admin'];
						$_SESSION['can_upload'] = $row['can_upload'];
					}
				}
				
				break;
		}
		
		break;
	
		case "logout":
			
			include_once "includes/user.class.php";
			
			switch( $_SERVER['REQUEST_METHOD'] )
			{
				case "POST":
					
					if( !isset($_SESSION['user_id']) )
					{
						$response->success = 0;
						$response->error = "No user to logout";
					}
					
					if( $_SESSION['user_id'] != $_POST['user_id'] )
					{
						$response->success = 0;
						$response->error = "Not authorized to logout this user";
					}
					
					if( $response->success )
					{
						unset($_SESSION['user_id']);
					}
						
					break;
			}
			
		break;

	case "session":
	
		include_once "includes/user.class.php";
		
		switch( $_SERVER['REQUEST_METHOD'] )
		{
			case "GET":
	
				if( !isset($_SESSION['user_id']) )
				{
					$response->success = 0;
					$response->error = "No user found";
				}
	
				if( $response->success )
				{
					$sql = "SELECT id,username,password,role_id FROM " . User::TABLE . " WHERE id='" . $_SESSION['user_id'] . "'";
						
					$result = $db->query( $sql );
	
					if( $result->num_rows == 0 )
					{
						$response->success = 0;
						$response->error = "No user found";
					}
					else
					{
						$row = $result->fetch_assoc();
						$items = array( array("id"=>$row['id'],"username"=>$row['username'],"password"=>$row['password'],"role_id"=>$row['role_id']) );
					}
				}
	
				break;
		}

		break;
		
	case "user":
		
		include_once "includes/user.class.php";
		
		switch( $_SERVER['REQUEST_METHOD'] )
		{
			case "GET":
				
				if( !isset($_SESSION['is_admin']) || !$_SESSION['is_admin'] )
				{
					$response->success = 0;
					$response->error = "Invalid permissions";
				}
				
				if( $response->success )
				{
					$sql = "SELECT id,username,role_id FROM " . User::TABLE;
					
					$result = $db->query( $sql );
					
					while( $row = $result->fetch_assoc() )
					{
						$item = array("id"=>$row['id'],"username"=>$row['username'],"role_id"=>$row['role_id']);
						
						$items[] = $item;
					}
				}
				
				break;
				
			case "POST":
				
				if( $resourceId )
				{
					$user = new User($resourceId);
					
					if( isset($_POST['role_id']) )
						$user->setField("role_id",$db->real_escape_string($_POST['role_id']));
					
					if( isset($_POST['password']) )
						$user->setField("password",md5($db->real_escape_string($_POST['password'])));

					$success = $user->save();
					
					if( !$success )
					{
						$response->success = 0;
						$response->error = "There was a problem updating this user.";
					}
					
					$items[] = array("id"=>$user->id,"username"=>$user->getField('username'),"password"=>$user->getField('password'),"role_id"=>$user->getField('role_id'));
				}
				else
				{
					if( !isset($_POST['username']) || !isset($_POST['password']) )
					{
						$response->success = 0;
						$response->error = "There was a problem creating this user.";
					}
					
					if( $response->success )
					{
						$username = $_POST['username'];
						$password = $_POST['password'];
						
						$sql = "SELECT id FROM " . User::TABLE . " WHERE username='" . $db->real_escape_string($_POST['username']) . "' AND password='" . md5($db->real_escape_string($_POST['password'])) . "'";
						
						$result = $db->query( $sql );
					}
					
					if( $result->num_rows )
					{
						$response->success = 0;
						$response->error = "A user with this username already exists!";
					}
					
					if( $response->success )
					{
						$user = new User();
						$user->setField("username",$db->real_escape_string($_POST['username']));
						$user->setField("password",md5($db->real_escape_string($_POST['password'])));
						$success = $user->save();
							
						if( !$success )
						{
							$response->success = 0;
							$response->error = "There was a problem creating this user.";
						}
					}
				}
				
				break;
		}
		
		break;
	
	case "user_roles":
		
			switch( $_SERVER['REQUEST_METHOD'] )
			{
				case "GET":
						
					$sql = "SELECT id,title,can_upload,is_admin FROM user_roles";
		
					$result = $db->query( $sql );
					
					while( $row = $result->fetch_assoc() )
					{
						$item = array( 'id'=>$row['id'], 'title'=>$row['title'], 'can_upload'=>$row['can_upload'], 'is_admin'=>$row['is_admin'] );
						
						$items[] = $item;
					}
					
					break;
			}
			
			break;
					
	case "dataset":
		
		include_once "includes/dataset.class.php";
		include_once "includes/user.class.php";
		include_once "includes/importtype.class.php";
		
		switch( $_SERVER['REQUEST_METHOD'] )
		{
			case "GET":
				
				$sql = "SELECT id FROM " . Dataset::TABLE . " WHERE is_public = '1' OR user_id = '" . $_SESSION['user_id'] . "'";
				
				if( !is_null($resourceId) ) $sql .= " WHERE id=" . $resourceId;
				
				$result = $db->query( $sql );
				
				while( $row = $result->fetch_assoc() )
				{
					$dataset = new Dataset( $row['id'] );
					$user = new User( $dataset->getField('user_id') );
					$type = new ImportType( $dataset->getField('type_id') );
					
					$item = array( 'id'=>$dataset->id, 'name'=>$dataset->getField('name'), 'updated'=>$dataset->getField('last_updated'), 'user_id'=>$dataset->getField('user_id'), 'user'=>$user->getField('username'), 'node_radius'=>$dataset->getField('node_radius'), 'link_distance'=>$dataset->getField('link_distance'), 'type_id'=>$dataset->getField('type_id'), 'type'=>$type->getField('name'), 'is_default'=>$dataset->getField('is_default')=="1", 'is_public'=>$dataset->getField('is_public')=="1", 'entityTypes'=>array(), 'fields'=>array(), 'cached'=>$dataset->isCached() );
					
					if( count($dataset->customFields) )
						foreach($dataset->customFields as $customField)
							array_push( $item['fields'], (object)array( "id"=>$customField->id, "name"=>$customField->getField('name') ) );
					
					if( count($dataset->entityTypes) )
						foreach($dataset->entityTypes as $entityType)
							array_push( $item['entityTypes'], (object)array( "id"=>$entityType->id, "color"=>$entityType->getField('color'), "name"=>$entityType->getField('name'), "enabled"=>$entityType->getField('enabled')=='1', "pack"=>$entityType->getField('pack')=='1', "visible"=>$entityType->getField('visible')=='1' ) );
					
					$items[] = $item;
				}
				
				$response->cachable = is_writable(Dataset::CACHE_ROOT);
				
				break;
				
			case "POST":
				
				$dataset = new Dataset( $resourceId );
				$dataset->setField( "user_id", $_POST['user_id'] );
				$dataset->setField( "name", $_POST['name'] );
				$dataset->setField( "is_public", $_POST['is_public'] );
				$dataset->setField( "node_radius", $_POST['node_radius'] );
				$dataset->setField( "link_distance", $_POST['link_distance'] );
				
				$output = array();
				
				foreach($dataset->entityTypes as $entityType)
				{
					$entityId = $entityType->id;
					
					if( isset($_POST["color_" . $entityId]) )
						$entityType->setField("color",$_POST["color_" . $entityId]);
					
					if( isset($_POST["enabled_" . $entityId]) )
						$entityType->setField("enabled",$_POST["enabled_" . $entityId]=='true'?1:0);
					
					if( isset($_POST["visible_" . $entityId]) )
						$entityType->setField("visible",$_POST["visible_" . $entityId]=='true'?1:0);
					
					if( isset($_POST["pack_" . $entityId]) )
						$entityType->setField("pack",$_POST["pack_" . $entityId]=='true'?1:0);
				}
				
				if ( isset($_FILES['file']) 
					&& $_FILES['file']['error'] == UPLOAD_ERR_OK
					&& is_uploaded_file($_FILES['file']['tmp_name']) )
				{
					include_once "includes/importtype.class.php";
					
					$importTypes = ImportType::getAll();
					
					foreach($importTypes as $importType)
						include_once "includes/importers/" . $importType->getField("file_name") . ".class.php";
					
					$mimeType = $_FILES['file']['type'];
				
					$importer = null;
				
					foreach($importTypes as $importType)
						if( $importType->id == $_POST['type_id'] )
							$importer = $importType;
					
					if( is_null($importer) )
						die( json_encode( (object)array('success'=>0,'error'=>"An importer couldn't be found") ) );
					if( $importer->getField("mime_type") != $mimeType )
						die( json_encode( (object)array('success'=>0,'error'=>"Please browse for a file of type " . $importer->getField("mime_type")) ) );
				
					//	do the import
					$className = $importType->getField("class_name");
					
					$dataset->setField( "type_id", $importType->id );
					
					$i = new $className( $dataset );
					$i->filepath = $_FILES['file']['tmp_name'];
					
					$output = $i->import();
					
					$response->data = $output;
				}
				
				$dataset->save();
				
				break;
				
			case "DELETE":
				
				if( is_null($resourceId) )
				{
					$response->success = 0;
					$response->error = "Invalid resource identifier";
				}
				
				$dataset = new Dataset( $resourceId );
				
				if( !isset($dataset->id) )
				{
					$response->success = 0;
					$response->error = "Invalid resource identifier";
				}
				
				$dataset->delete();
				
				break;
		}
		
		break;
		
	case "graph":
	
		include_once "includes/dataset.class.php";
	
		switch( $_SERVER['REQUEST_METHOD'] )
		{
			case "GET":
				
				$dataset = new Dataset( $resourceId );
				
				if ( !is_null($resourceId)
					&& $dataset->isCached() )
				{
					$response->data = json_decode(file_get_contents($dataset->cachePath()), true);
					$response->data['cached'] = true;
				}
				else
				{
					include_once "includes/edge.class.php";
					include_once "includes/entity.class.php";
					include_once "includes/entitytype.class.php";
					
					//	get params
					$additionalNodeFields = isset($_GET['additionalNodeFields']) ? explode(',',$_GET['additionalNodeFields']) : null;
					$entityTypes = isset($_GET['entityTypes']) ? explode(',',$_GET['entityTypes']) : null;
					$labelField = isset($_GET['labelField']) ? $_GET['labelField'] : null;
					
					$nodes = array();
					$entitiesIndexed = array();
					
					$links = array();
					$nodesFlat = array();
					$fields = array();
					$entityTypes = array();
					
					$entityTypesIndexed = array();
					
					function getNode( $entity, $isChild = false )
					{
						global $entitiesIndexed,$nodesFlat,$nodes,$db;
					
						$node = (object)array( "id"=>$entity->id, "_index"=>count($nodesFlat), "value"=>1 );
							
						$entityType = isset($entityTypesIndexed[$entity->getField('entity_type_id')]) ? $entityTypesIndexed[$entity->getField('entity_type_id')] : new EntityType( $entity->getField('entity_type_id'), $db );
							
						if( !is_null($entityType) )
							$node->color = $entityType->getField('color');
							
						if( !isset($entitiesIndexed[$entity->id]) )
						{
							$entitiesIndexed[$entity->id] = $node;
							$nodesFlat[] = $node;
						}
							
						foreach($entity->fields as $field=>$value)
						{
							$node->$field = $value;
						}
							
						if( !$isChild )
							$nodes[]= $node;
							
						$title = '<span class="tooltip_header">' . $node->name . '</span>';
						if( !is_null($entityType) ) $title .= '<span class="tooltip_subheader">(' . $entityType->getField('name') . ')</span>';
							
						$node->title = $title;
						$node->pack = $entityType->getField('pack') == 1;
						$node->visible = $entityType->getField('visible') == 1;
					
						if( count($entity->children) )
						{
							$children = array();
							$tooltip = array();
					
							foreach($entity->children as $child)
							{
								$tooltip[] = $child->getField('name');
								$children[] = getNode( $child, true );
							}
					
							$node->children = $children;
						}
							
						$node->fields = array();
							
						foreach($entity->dataFields as $field=>$value)
						{
							$node->fields[$field] = $value;
						}
							
						return $node;
					}
					
					function findParent($nodes,$child)
					{
						foreach($nodes as $node)
						{
							if( $node->id == $child->parent_id )
							{
								if( !is_null($node->parent_id) )
									return findParent($nodes,$node);
									
								return $node;
							}
						}
							
						return $child;
					}
					
					function flatten($array)
					{
						$return = array();
					
						array_walk_recursive($array, function($a) use (&$return) { $return[] = $a; });
						return $return;
					}
					
					//	get nodes
					$sql = "SELECT id FROM " . Entity::TABLE . " WHERE dataset_id='" . $resourceId . "' AND parent_id is NULL";
					$result = $db->query( $sql );
					
					while( $row = $result->fetch_assoc() )
					{
						$entity = new Entity( $row['id'], $db );
						$node = getNode( $entity );
					
						foreach($node->fields as $field=>$value)
						{
							if( !isset($fields[$field]) ) $fields[$field] = array();
							if( !isset($fields[$field][$value]) ) $fields[$field][$value] = array();
					
							$fields[$field][$value][] = $node;
						}
					}
					
					foreach($fields as $field=>$values)
					{
						foreach($values as $value=>$matches)
						{
							if( !is_null($additionalNodeFields)
							&& array_search( $field, $additionalNodeFields ) > -1
							&& count($matches) > 0 )
							{
								$node = (object)array( "_index"=>count($nodesFlat), "name"=>$value, "type"=>"field", "value"=>1 );
								$nodes[] = $node;
								$nodesFlat[] = $node;
					
								if( $field == "color" ) $node->color = $value;
					
								foreach($matches as $match)
								{
									$link = array('target'=>$node->id,'source'=>$match->id,'type'=>'field','value'=>1);
									$links[] = (object)$link;
								}
							}
					
							foreach($matches as $match)
							{
								if( $field == "color" ) $match->color = $value;
							}
						}
					}
					
					//	create links between parent<>child nodes
					foreach($nodes as $node)
					{
						if( !is_null($node->parent_id) )
						{
							$parent = findParent($nodes,$node);
					
							if( $parent && !$parent->pack )
							{
								$link = array('target'=>$node->id,'source'=>$parent->id,'type'=>'entity','value'=>1);
								$links[] = (object)$link;
							}
						}
					}
					
					//	get manual links
					$sql = "SELECT * FROM " . Edge::TABLE . " WHERE dataset_id='" . $resourceId . "'";
					$result = $db->query( $sql );
					
					while( $row = $result->fetch_assoc() )
					{
						$source = $entitiesIndexed[ $row['source_id'] ];
						$target = $entitiesIndexed[ $row['target_id'] ];
						
						if( !is_null($source) && !is_null($target) )
						{
							$link = array('target'=>$target->id,'source'=>$source->id,'type'=>'manual','value'=>1);
							$links[] = (object)$link;
						}
					}
					
					$sql = "SELECT id FROM " . EntityType::TABLE . " WHERE dataset_id='" . $resourceId . "' ORDER BY name";
					$result = $db->query( $sql );
					
					while( $row = $result->fetch_assoc() )
					{
						$entityType = new EntityType( $row['id'], $db );
					
						$entityTypes[] = (object)array( "id"=>$entityType->id, "color"=>$entityType->getField('color'), "name"=>$entityType->getField('name'), "pack"=>$entityType->getField('pack')=='1', "visible"=>$entityType->getField('visible')=='1' );
					}
					
					$response->data = array('nodes'=>$nodes,'links'=>$links,'entity_types'=>$entityTypes,'cached'=>false);
					
					if( is_writable(Dataset::CACHE_ROOT) )
					{
						file_put_contents($dataset->cachePath(), json_encode($response->data));
						
						$dataset->setField("cached_date", time());
						$dataset->save();
					}
				}
				
				break;
		}
		
		break;
		
	case "importtype":
	
		include_once "includes/importtype.class.php";
	
		switch( $_SERVER['REQUEST_METHOD'] )
		{
			case "GET":

				$sql = "SELECT id FROM " . ImportType::TABLE . "";
				$result = $db->query( $sql );

				while( $row = $result->fetch_assoc() )
				{
					$item = new ImportType( $row['id'] );
					$items[] = array( 'id'=>$item->id, 'label'=>$item->getField('name'), 'is_default'=>$item->getField('is_default')=="1" );
				}

				break;
		}

		break;
}

if( isset($items) && count($items) )
	$response->results = $items;

if( DEBUG )
{
	print_r($response);
	echo "</pre>";
}

echo json_encode($response);
?>