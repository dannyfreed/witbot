//npm install mysql

var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'jamesben.cryprkoscuk1.us-west-2.rds.amazonaws.com',
  user     : 'jamesBen',
  password : 'jamesBen',
  database : 'jamesBen'
});

 /*TO DO 
	Didnt know if actually wanted code to add a DB, since mostly I believe we will just need to query 
	the db and not make new tables or change schema etc...  Thoughts??
 */

function connectDB() {
	connection.connect();

	//Get DB Name 
	console.log("Database name", connection['config']['database'])
	
	// Get Tables of DB 
 	connection.query('show tables', function(err, rows, fields) {
	 	console.log("Tables in Database are:", rows)
	});

	// Get Schema of DB
	connection.query('SHOW COLUMNS FROM data;', function(err, rows, fields) {
		console.log("Schema is", rows);
	});

	connection.end();
}

connectDB();