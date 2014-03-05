<?php
include_once "includes/fileimport.class.php";

class AtlasTI extends FileImport
{
	function AtlasTI( $dataset )
	{
		parent::FileImport( $dataset );
	}

	function import()
	{
		$this->dataset->save();

		$output = parent::import();

		$progress = array();

		$fields = array();

		$idFieldName = "Name (Short)";

		$data = simplexml_load_file( $this->filepath );

		if( count($data->primDocs->primDoc) )
		{
			$typeDocument = new EntityType(null,$this->db);
			$typeDocument->setField("name","document");
			$typeDocument->setField("color",$this->defaultColors[0]);
			$typeDocument->setField("dataset_id",$this->dataset->id);
			$typeDocument->save();
			
			$typeQuote = new EntityType(null,$this->db);
			$typeQuote->setField("name","quote");
			$typeQuote->setField("color",$this->defaultColors[1]);
			$typeQuote->setField("dataset_id",$this->dataset->id);
			$typeQuote->save();
			
			//	save primary documents and quotes
			foreach($data->primDocs->primDoc as $documentNode)
			{
				$document = $this->entityFromXML($documentNode);
				$document->setField("entity_type_id", $typeDocument->id );
				$success = $document->save();
					
				$progress[] = "Document " . $document->getField("name") . " " . ($success ? "saved" : "not saved") . "...<br/>";
			
				foreach($documentNode->quotations->q as $quotationNode)
				{
					$description = array();
					
					if( isset($quotationNode->content) )
						foreach($quotationNode->content->p as $pNode)
							$description[] = "<p>" . $pNode . "</p>";
					
					$quote = $this->entityFromXML($quotationNode);
					$quote->setField( 'entity_type_id', $typeQuote->id );
					$quote->setField( 'parent_id', $document->id );
					$quote->setField( 'description', implode("",$description) );
					$success = $quote->save();
					
					$progress[] = "Quote " . $quote->getField("name") . " " . ($success ? "saved" : "not saved") . "...<br/>";
				}
			}
		}

		if( count($data->codes->code) )
		{
			$typeCode = new EntityType(null,$this->db);
			$typeCode->setField("name","code");
			$typeCode->setField("color",$this->defaultColors[2]);
			$typeCode->setField("dataset_id",$this->dataset->id);
			$typeCode->save();
			
			//	save codes
			foreach($data->codes->code as $codeNode)
			{
				$code = $this->entityFromXML($codeNode);
				$code->setField('entity_type_id',$typeCode->id);
				$success = $code->save();
			
				$progress[] = "Code " . $code->getField("name") . " " . ($success ? "saved" : "not saved") . "...<br/>";
			}
		}

		if( count($data->families->children()) )
		{
			foreach($data->families->children() as $family)
			{
				if( count($family->children()) )
				{
					$familyName = $family->getName();
					$familyName = preg_replace("/([A-Z])/",' {{$1}}',$familyName);
					$familyName = preg_replace("/{{([a-z])}}/",'$1',strtolower($familyName));
					
					$familyType = new EntityType(null,$this->db);
					$familyType->setField("name",$familyName);
					$familyType->setField("color",$this->defaultColors[3]);
					$familyType->setField("dataset_id",$this->dataset->id);
					$familyType->save();
					
					$links = array();
					
					//	save families
					foreach($family->children() as $familyItemNode)
					{
						$familyItem = $this->entityFromXML($familyItemNode);
						$familyItem->setField('entity_type_id',$familyType->id);
						$success = $familyItem->save();
							
						$progress[] = $familyType->getField("name") . " " . $familyItem->getField("name") . " " . ($success ? "saved" : "not saved") . "...<br/>";
							
						foreach($familyItemNode->item as $familyItemMemberNode)
						{
							$itemId = $familyItemMemberNode['id'];
					
							if( !isset($links[ "$itemId" ]) )
								$links[ "$itemId" ] = array();
								
							$links[ "$itemId" ][] = $familyItem->id;
						}
					}
						
					//	register codes with code family
					foreach($links as $itemId=>$familyItemIds)
					{
						$source = new Entity(null,$this->db);
						$source->loadByFieldValue( "id", $itemId, $this->dataset->id );
					
						//	create links if item belongs to mroe than one family
						if( count($familyItemIds) > 1 )
						{
							foreach($familyItemIds as $familyItemId)
							{
								$target = new Entity(null,$this->db);
								$target->loadByFieldValue( "id", $familyItemId, $this->dataset->id );
					
								$edge = new Edge(null,$this->db);
								$edge->setField("source_id", $source->id);
								$edge->setField("target_id", $familyItemId);
								$edge->setField("dataset_id",$this->dataset->id);
									
								$success = $edge->save();
					
								$progress[] = "Edge for " . $target->getField('name') . " family " . $familyItemId . "<>" . $source->id . " " . ($success ? "saved" : "not saved") . "...<br/>";
							}
						}
					
						//	otherwise set it's parent_id to the code family's
						else if( count($familyItemIds) == 1 )
						{
							$source->setField( 'parent_id', $familyItemIds[0] );
					
							if( $source->save() )
							{
								$progress[] = "Code " . $source->id . " parent set to " . $familyItem->id . "...<br/>";
							}
						}
					}
				}
			}
		}
		
		//	memos
		if( count($data->memos->memo) )
		{
			$typeMemo = new EntityType(null,$this->db);
			$typeMemo->setField("name","memo");
			$typeMemo->setField("color",$this->defaultColors[4]);
			$typeMemo->setField("dataset_id",$this->dataset->id);
			$typeMemo->save();
			
			$typeComment = new EntityType(null,$this->db);
			$typeComment->setField("name","comment");
			$typeComment->setField("color",$this->defaultColors[5]);
			$typeComment->setField("dataset_id",$this->dataset->id);
			$typeComment->save();
			
			//	save code families
			foreach($data->memos->memo as $memoNode)
			{
				$memo = $this->entityFromXML($memoNode);
				$memo->setField('entity_type_id',$typeMemo->id);
				$success = $memo->save();
				
				$progress[] = "Memo " . $memo->getField("name") . " " . ($success ? "saved" : "not saved") . "...<br/>";
				
				foreach($memoNode->comment as $commentNode)
				{
					$description = array();
					if( isset($commentNode->content) )
						foreach($commentNode->content->p as $pNode)
							$description[] = "<p>" . $pNode . "</p>";
						
					$memoId = $memoNode['id'];
					
					$comment = $this->entityFromXML($commentNode);
					$comment->setField( 'name', "" );
					$comment->setField( 'entity_type_id', $typeComment->id);
					$comment->setField( 'parent_id', $memo->id );
					$comment->setField( 'description', implode("",$description) );
					$success = $comment->save();
				}
			}
		}
		
		//	import links
		$linkGroups = array('codings','memoings');
		
		foreach($linkGroups as $linkGroupName)
		{
			foreach($data->links->objectSegmentLinks->$linkGroupName as $linkGroup)
			{
				foreach($linkGroup->iLink as $linkNode)
				{
					$source = new Entity(null,$this->db);
					$source->loadByFieldValue( 'id', $linkNode['obj'], $this->dataset->id );
			
					$target = new Entity(null,$this->db);
					$target->loadByFieldValue( 'id', $linkNode['qRef'], $this->dataset->id );
			
					if( is_null($source->id) || is_null($target->id) ) continue;
			
					$edge = new Edge(null,$this->db);
					$edge->setField("source_id", $source->id);
					$edge->setField("target_id", $target->id);
					$edge->setField("dataset_id",$this->dataset->id);
			
					$success = $edge->save();
			
					$progress[] = "Edge " . $source->id . "<>" . $target->id . " (" . $linkGroupName . ") " . ($success ? "saved" : "not saved") . "...<br/>";
				}
			}
		}
		
		
		return $output . implode( "\n", $progress );
	}

	function entityFromXML($xml)
	{
		$entity = new Entity(null,$this->db);
		$entity->setField("dataset_id",$this->dataset->id);

		foreach($xml->attributes() as $name=>$value)
		{
			if( strtolower($name) == 'name' )
			{
				$entity->setField( 'name', (string)$value );
			}
			else
			{
				$entity->setDataField( $name, (string)$value );
			}
		}
		
		return $entity;
	}
}

?>