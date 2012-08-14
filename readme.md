Whiteboard

This is my hobby project. In this I am using modified version of [wwwsqldesigner(v1.6)](http://code.google.com/p/wwwsqldesigner/) of ondrej.zara.

I have written this application as I wanted to learn and experiment with Node.JS, socket.io and mongodb.

There are many modifications in wwwsqldesigner.js file but notable are as follows:

<table>
<tr>
	<th>
		Function name
	</th>
	<th>
		additions / modifications
	</th>
</tr>
<tr>
	<td>
		`SQL.Designer.prototype.init()`
	</td>
	<td>
		this.tablesToBeSynced = [];
		this.tablesToBeSynced.push = this.toXMLForRealtime;
		this.multiselect = false;
		this.howManyTablesSelected = false;
	</td>
</tr>
</table>


