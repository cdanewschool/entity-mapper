<?php
include_once "db.class.php";

class FileImport
{
	public $filepath;
	public $dataset;

	public $defaultColors;

	function FileImport( $dataset )
	{
		$this->db = new Database();
		$this->defaultColors = array("E3EF20","6B7983","6CBEA2","FF4180","333333","666666");

		$this->dataset = $dataset;
		
		if( $this->dataset->id )
		{
			$this->dataset->clear();
		}
	}

	public function import()
	{
		return "";
	}
}
?>