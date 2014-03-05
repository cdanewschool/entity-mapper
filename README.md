Entity Mapper
=============
The Entity Mapper is a tool for visualizing qualitative data as an interactive node-link diagram. The tool's main focus is on the visual interpretation of [grounded theory](http://en.wikipedia.org/wiki/Grounded_theory) data, but supports any data exported from [Atlas.ti](http://www.atlasti.com). The project was funded through the [Telemedicine and Advanced Technology Research Center (TATRC)](http://www.tatrc.org/).

Features
--------
- Customize the color and visibility of each entity type in the visualization, including the ability to pack it's children
- Toggle entity types, collapse/expand all descentants and zoom in/out of the visualization via quick controls
- Hide datasets by making them private
- Three user roles:
  - *user*: can view all public datasets, cannot upload (default for new users)
  - *contributor*: can view all public datasets and datasets they've uploaded, can upload
  - *admin*: can view all public datasets and datasets they've uploaded, can upload and administer users

Dependencies
------------
###PHP/MySQL###
Because the Entity Mapper uses PHP and MySQL for data storage and retrieval, a basic [**LAMP**](http://en.wikipedia.org/wiki/LAMP_\(software_bundle\)) stack is required.

###mod_rewrite###
Apache's [`mod_rewrite`](http://httpd.apache.org/docs/current/mod/mod_rewrite.html) module is used to route REST-formatted urls to a common API handler and must be enabled on the server.

Installation
------------
After cloning this repository, `cd` to the directory and execute the following:

- Edit database connection information
  - `vi config/db.php` and enter the databse host and database name
  - For db.php's `DB_USER` and `DB_PASS` constants, either set them directly or create an `.htaccess` file at the document root with the following lines:
    - `SetEnv HTTP_DB_USER "myuser"`
	- `SetEnv HTTP_DB_PASS "mypassword"`
- Import MySQL structure and data
  - `mysql --user=mymysqlusername --password=mymysqlpassword`
  - `mysql> source config/schema/structure.sql`
  - `mysql> source config/schema/data.sql`
- Enable caching
  - Create a group-writable `/cache` directory
    - `mkdir -m 777 cache`

Once installed, create an account or login to the admin account with `admin/admin`. Note that it's highly recommend that you change the default admin password before using your installation.