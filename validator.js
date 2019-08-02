var validator;

S().ready(function(){

	function Validator(){

		var _obj = this;
		this.log = new Logger({'id':'Validator','logging':true});

		// Setup the dnd listeners.
		var dropZone = document.getElementById('drop_zone');
		dropZone.addEventListener('dragover', dropOver, false);
		dropZone.addEventListener('dragout', dragOff, false);

		
		document.getElementById('standard_files').addEventListener('change', function(evt){
			S('#drop_zone .helpertext').css({'display':'none'});
			return _obj.handleFileSelect(evt,'csv');
		}, false);
		
		S('.part input').on('change',function(e){
			el = S(e.currentTarget).parent();
			if(e.currentTarget.value.length > 0) el.addClass('c8-bg').removeClass('b5-bg');
			else el.removeClass('c8-bg').addClass('b5-bg');
		});

		S('form').on('submit',{me:this},function(e){
			e.preventDefault();
			e.stopPropagation();
			
			S('.spinner').css({'display':'block'});
			
			// If we have a URL we get that
			if(S('#url')[0].value) e.data.me.getFromURL(S('#url')[0].value);
			// If we have a file we parse from that
			else if(S('#standard_files')[0].value) e.data.me.parseCSV(e.data.me.csv);
			
			return false;
		});
		
		S('form').on('reset',{me:this},function(e){ e.data.me.reset(); });
		
		return this;
	}

	Validator.prototype.getFromURL = function(url){
		S().ajax(url,{
			'this':this,
			'success':function(result,attr){
				this.parseCSV(result,{'url':attr.url,'CORS':true});
			},
			'error': function(e,attr){
				this.log.error('Unable to load '+attr.url);
				this.parseCSV("",{'url':attr.url,'CORS':false});
			}
		});
		return this;
	}

	Validator.prototype.handleFileSelect = function(evt,typ){

		evt.stopPropagation();
		evt.preventDefault();
		dragOff();

		var files;
		if(evt.dataTransfer && evt.dataTransfer.files) files = evt.dataTransfer.files; // FileList object.
		if(!files && evt.target && evt.target.files) files = evt.target.files;

		var _obj = this;
		if(typ == "csv"){

			// files is a FileList of File objects. List some properties.
			var output = "";
			for (var i = 0, f; i < files.length; i++) {
				f = files[i];

				this.file = f.name;
				// ('+ (f.type || 'n/a')+ ')
				output += '<div id="filedetails">'+ (f.name)+ ' - ' + niceSize(f.size) + '</div>';

				// DEPRECATED as not reliable // Only process csv files.
				//if(!f.type.match('text/csv')) continue;

				var start = 0;
				var stop = f.size - 1; //Math.min(100000, f.size - 1);

				var reader = new FileReader();

				// Closure to capture the file information.
				reader.onloadend = function(evt) {
					if (evt.target.readyState == FileReader.DONE) { // DONE == 2
						if(stop > f.size - 1){
							var l = evt.target.result.regexLastIndexOf(/[\n\r]/);
							result = (l > 0) ? evt.target.result.slice(0,l) : evt.target.result;
						}else result = evt.target.result;
						_obj.csv = result;
					}
				};
				
				// Read in the image file as a data URL.
				//reader.readAsText(f);
				var blob = f.slice(start,stop+1);
				reader.readAsText(blob);
			}
			//document.getElementById('list').innerHTML = '<p>File loaded:</p><ul>' + output.join('') + '</ul>';
			S('#drop_zone').append(output).addClass('loaded');

		}
		return this;
	};

	// Parse the CSV contents
	Validator.prototype.parseCSV = function(data,attr){
		
		if(!attr) attr = {};
		this.csv = data;
		this.messages = [];
		
		if(data){
			// Convert the CSV to a JSON structure
			this.data = CSV2JSON(data,1);
			this.records = this.data.rows.length; 
		}else{
			this.data = {};
			this.records = 0;
		}

		fields = {
			'Property reference number':{'required':false},
			'BA reference number':{'required':false},
			'Ratepayer':{'required':true},
			'Address':{'required':true},
			'Postcode':{'required':true},
			'Latitude':{'required':true,'type':'number'},
			'Longitude':{'required':true,'type':'number'},
			'Occupied':{'required':true},
			'Liability start date':{'required':true,'type':'ISO8601'},
			'Empty from':{'required':true,'type':'ISO8601'},
			'Rateable value':{'required':true,'type':'number'},
			'VOA code':{'required':true},
			'VOA description':{'required':false},
			'Exemptions':{'required':false},
			'Exemptions start date':{'required':false,'type':'ISO8601'},
			'Relief types':{'required':false},
			'Relief total':{'required':false,'type':'number'},
			'Relief mandatory':{'required':false,'type':'number'},
			'Relief discretionary':{'required':false,'type':'number'}
		}
		var format = {};
		var nhead = 0;
		var nreq = 0;
		for(var f in fields){
			
			nhead++;
			req = (fields[f].required||false);
			format[f] = { 'required': req, 'exact':1, 'got':0 };
			format[simpleHeading(f)] = { 'required': req, 'original':f };

			if(req){
				nreq++;
			}
		}
			
		function simpleHeading(heading){
			heading = heading.toLowerCase();
			return heading.replace(/ /g,"").replace(/ $/g,"").replace(/[^A-Za-z0-9\-]/g,"");
		}


		var score = 0;

		code = "CUSTOM";
		LAdata = {};
		LAdata[code] = {'rows':this.records,'okhead':0,'okreq':0,'empties':0,'hosted':0,'cors':false,'notgot':'','dateformats':0,'coordinates':0,'coordformats':0,'currformats':0,'latformats':0,'lonformats':0};

		var collat = -1;
		var collon = -1;
		var colempty = -1;
		var coldate = -1;
		var colcurr = -1;

		if(LAdata[code].rows > 0){

			for(var j = 0; j < validator.data.fields.name.length; j++){
				h = validator.data.fields.name[j];
				hsimple = simpleHeading(h);

				if(format[h] && format[h].required){
					LAdata[code].okhead++;
					if(format[h].exact) format[h].got = 1;
				}
				ok = false;
				if(format[h] && format[h].required) ok = true;
				if(format[hsimple] &&  format[hsimple].required) ok = true;
				if(ok) LAdata[code].okreq++;
				
				// Empties?
				if(h == "Occupied" || hsimple == "occupied"){ colempty = j; }
				if(h == "Latitude" || hsimple == "latitude"){ collat = j; }
				if(h == "Longitude" || hsimple == "longitude"){ collon = j; }
				if(h == "Liability start date" || hsimple == "liabilitystartdate"){ coldate = j; }
				if(h == "Rateable value" || hsimple == "rateablevalue"){ colcurr = j; }			
			}

			for(var h in format){
				if(format[h].required){
					if(format[h].exact && format[h].got == 0){
						if(LAdata[code].notgot) LAdata[code].notgot += ", ";
						LAdata[code].notgot += makeKey(h);
					}
				}
			}

			for(var ii = 0; ii < LAdata[code].rows; ii++){
				rcols = this.data.rows[ii];
				if(coldate >= 0){
					m = rcols[coldate].match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
					if(m && m.length==1) LAdata[code].dateformats++;
				}
				if(colcurr >= 0){
					m = rcols[colcurr].match(/[0-9\.]+/);
					if(m && m.length==1) LAdata[code].currformats++;
				}
				if(collat >= 0){
					m = rcols[collat].match(/[0-9\.\-\+]+/);
					if(m && m.length==1) LAdata[code].latformats++;
				}
				if(collon >= 0){
					m = rcols[collon].match(/[0-9\.\-\+]+/);
					if(m && m.length==1) LAdata[code].lonformats++;
				}
			}
			if(colempty >= 0){ LAdata[code].empties = 1; }
			if(collat >= 0){ LAdata[code].coordinates += 0.5; }
			if(collon >= 0){ LAdata[code].coordinates += 0.5; }
		}else{
			for(var h in format){
				if(format[h].required){
					if(format[h].exact && format[h].got == 0){
						if(LAdata[code].notgot) LAdata[code].notgot += ", ";
						LAdata[code].notgot += makeKey(h);
					}
				}
			}
		}
			
		// Add score for required headings
		if(nreq > 0) score += LAdata[code].okreq/nreq;
		if(nreq > 0) score += LAdata[code].okhead/nreq;

		var addcoords = '';
		var fixdates = '';

		if(LAdata[code].okhead/nreq < 1){
			addcoords = (LAdata[code].notgot.indexOf('Postcode') < 0 && LAdata[code].notgot.indexOf('Latitude') > 0 ? '<br /><a href="https://odileeds.github.io/Postcodes2LatLon/" id="addcoords" class="c14-bg button">Add latitude and longitude</a>' :'');
			this.messages.push(getTrafficLight({'score':LAdata[code].okhead/nreq,'no':'<strong>Valid required headings</strong>: A strict heading match shows that you are missing '+LAdata[code].notgot+'. Adding these headings will improve your score by '+asScore(1-LAdata[code].okhead/nreq)+'.'+addcoords}));
		}
		if(LAdata[code].okreq/nreq < 1) this.messages.push(getTrafficLight({'score':LAdata[code].okreq/nreq,'no':'<strong>Includes required columns</strong>: A looser check of headings (ignoring case, extra things in brackets, and trailing spaces) shows that you are missing '+(nreq - LAdata[code].okreq)+' required heading'+(nreq - LAdata[code].okreq == 1 ? '':'s')+'. Adding them will improve your score by '+asScore((nreq - LAdata[code].okreq)/nreq)+'.'}));

		score += LAdata[code].empties;
		if(LAdata[code].empties < 1) this.messages.push(getTrafficLight({'score':LAdata[code].empties,'no':'<strong>Includes empties</strong>: You don\'t appear to have included an '+makeKey('Occupied')+' column.'}));

		LAdata[code].coordformats = (LAdata[code].latformats+LAdata[code].lonformats);
		tscore = (LAdata[code].rows > 0) ? (LAdata[code].latformats+LAdata[code].lonformats)/(2*LAdata[code].rows) : 0;
		score += tscore;
		if(tscore < 1){
			if(LAdata[code].rows > 0) this.messages.push(getTrafficLight({'score':tscore,'no':'<strong>Valid coords</strong>: You appear to be missing '+((2*LAdata[code].rows) - (LAdata[code].latformats+LAdata[code].lonformats))+' '+makeKey('Latitude')+' and '+makeKey('Longitude')+' values. Adding these will improve your overall score by '+asScore(1-tscore)+'.'}));
			else this.messages.push(getTrafficLight({'score':tscore,'no':'<strong>Valid coords</strong>: We couldn\'t find any coordinates!'}))
		}

		tscore = (LAdata[code].rows > 0) ? LAdata[code].dateformats/LAdata[code].rows : 0;
		score += tscore;
		if(tscore < 1){
			fixdates = (tscore < 1 && LAdata[code].notgot.indexOf('Liability start date') < 0) ? '<br /><a href="https://odileeds.github.io/CSVCleaner/" id="fixdates" class="c14-bg button">Fix dates</a>' : '';
			if(LAdata[code].rows > 0) this.messages.push(getTrafficLight({'score':tscore,'no':'<strong>Valid dates</strong>: You appear to be missing '+(LAdata[code].rows - LAdata[code].dateformats)+' dates in the '+makeKey('Liability start date')+' column. Adding these will improve your overall score by '+asScore(1-tscore)+'.'+fixdates}));
			else this.messages.push(getTrafficLight({'score':tscore,'no':'<strong>Valid dates</strong>: We couldn\'t find any dates!'}));
		}

		tscore = (LAdata[code].rows > 0) ? LAdata[code].currformats/LAdata[code].rows : 0;
		score += tscore;
		if(tscore < 1){
			if(LAdata[code].rows > 0) this.messages.push(getTrafficLight({'score':tscore,'no':'<strong>Valid currency values</strong>: You appear to be missing '+(LAdata[code].rows - LAdata[code].currformats)+' '+makeKey('Rateable value')+' amounts. Adding these will improve your overall score by '+asScore(1-tscore)+'.'}));
			else this.messages.push(getTrafficLight({'score':tscore,'no':'<strong>Valid currency values</strong>: We couldn\'t find any currency values!'}));
		}
		
		// 7. Is it hosted?
		if(attr.url){
			LAdata[code].hosted = 1;
			score++;
		}else{
			this.messages.push(getTrafficLight({'score':0,'no':'<strong>Hosted</strong>: Hosting the file on an accessible webserver will improve your score by '+asScore(2)+'.'}));
		}
		
		// 8. Check CORS
		if(attr.CORS){
			LAdata[code].cors = true;
			score++;
		}else{
			this.messages.push(getTrafficLight(0,'','','','<strong>CORS</strong>: Unable to get the file. Is CORS enabled? Because we couldn\'t get the file, we can\'t calculate the rest of your score.',''));
		}

		score *= 100/8;

	
		tr = '<tr><td>-</td><td class="LA-name">'
		if(attr.url) tr += '<a href="'+attr.url+'">'+getLA(attr.url)+'</a>';
		else tr += this.file;
		tr += '</td><td></td><td>'+this.records+'</td><td>'+(score).toFixed(2)+'</td>';
		tr += '<td>'+getTrafficLight({'score':LAdata[code].okhead/nreq,'yes':LAdata[code].okhead+'/'+nreq,'no':LAdata[code].okhead+'/'+nreq,'na':'-','link':'status.html#headings','title':(LAdata[code].notgot ? "Missing: "+LAdata[code].notgot.replace(/<span class="req">.*?<\/span>/g,"").replace(/<[^\>]*>/g,"") : "Got everything!")})+'</td>';
		tr += '<td>'+getTrafficLight({'score':LAdata[code].okreq/nreq,'yes':LAdata[code].okreq+'/'+nreq,'no':LAdata[code].okreq+'/'+nreq,'na':'-','link':'status.html#required'})+'</td>';
		tr += '<td>'+getTrafficLight({'score':LAdata[code].empties,'yes':"Yes",'no':"No",'na':"-",'link':"status.html#empties"})+'</td>';
		tr += '<td>'+getTrafficLight({'score':(LAdata[code].coordformats)/(2*(LAdata[code].rows == 0 ? 1 : LAdata[code].rows)),'yes':(LAdata[code].coordformats),'no':(LAdata[code].coordformats),'na':"-",'link':"status.html#coordinates"})+'</td>';
		tr += '<td>'+getTrafficLight({'score':LAdata[code].dateformats/(LAdata[code].rows==0 ? 1 : LAdata[code].rows),'yes':LAdata[code].dateformats,'no':LAdata[code].dateformats,'na':"-",'link':"status.html#dateformats"})+'</td>';
		tr += '<td>'+getTrafficLight({'score':LAdata[code].currformats/(LAdata[code].rows==0 ? 1 : LAdata[code].rows),'yes':LAdata[code].currformats,'no':LAdata[code].currformats,'na':"-",'link':"status.html#currencyformats"})+'</td>';
		tr += '<td>'+getTrafficLight({'score':LAdata[code].hosted,'yes':"Yes",'no':"No",'na':"-",'link':"status.html#hosted"})+'</td>';
		tr += '<td>'+getTrafficLight({'score':LAdata[code].cors,'yes':"Yes",'no':"No",'na':"-",'link':"status.html#CORS"})+'</td>';

		S('.spinner').css({'display':''});

		S('table.odi').append(tr);

		S('#results').css({'display':'block'});
		
		this.LAdata = LAdata;


		var str = "";
		for(var i = 0; i < this.messages.length; i++) str += '<li>'+this.messages[i]+'</li>';
		if(str) S('#messages').html('<div class="b5-bg doublepadded"><h2>Notes</h2><ol>'+str+'</ol></div>');
		else S('#messages').html('');


		if(addcoords){
			S('#addcoords').on('click',{me:this},function(e){
				e.preventDefault();
				e.stopPropagation();
				// Open in Postcodes2LatLon
				var win = window.open("https://odileeds.github.io/Postcodes2LatLon/", "Postcodes", "");
				var csv = e.data.me.csv;
				setTimeout(function(){
					console.log('postMessage')
					win.postMessage({ "referer": "BusinessRates", "csv": csv }, "https://odileeds.github.io");
				},1000);
			});
		}
		if(fixdates){
			S('#fixdates').on('click',{me:this},function(e){
				e.preventDefault();
				e.stopPropagation();
				// Open in CSVCleaner
				var win = window.open("https://odileeds.github.io/CSVCleaner/", "CSVCleaner", "");
				var csv = e.data.me.csv;
				setTimeout(function(){
					console.log('postMessage');
					win.postMessage({ "referer": "BusinessRates", "csv": csv }, "https://odileeds.github.io");
				},1000);
			});
		}

		// Scroll to results
		var el = S('#results')[0];
		window.scroll({
			'top': el.offsetParent.offsetTop + el.offsetTop - 16,
			'left': 0,
			'behavior': 'smooth'
		})
		function getLA(url){
			if(url.indexOf(".gov.uk") >= 0){
				url.replace(/([a-zA-Z]*)\.gov\.uk/,function(m,p1){ url = p1; });
				url = url[0].toUpperCase() + url.slice(1);
			}
			return url;
		}
		function asScore(s){ return (s*100/8).toFixed(2).replace(/0$/,'').replace(/\.0$/,''); }
		function makeKey(key){
			return '<code class="key">'+key+'</code>'+(fields[key].required ? '<span class="req">Required</span>':'');
		}
		function getTrafficLight(attr){
			if(!attr) attr = {};
			var cls = "";
			var txt = "";
			if(attr.score == 1){ cls = 'green-light'; txt = attr.yes; }
			else if(attr.score < 1 && attr.score > 0){ cls = 'amber-light'; txt = attr.no; }
			else if(attr.score == 0){ cls = 'red-light'; txt = attr.no; }
			else if(attr.score < 0){ return attr.na; }
			if(attr['link'] && txt) txt = '<a href="'+attr['link']+'">'+txt+'</a>';
			
			return '<span class="'+cls+'"'+(attr.title ? ' title="'+attr.title+'"':'')+'></span>'+txt; 
		}

		return this;
	}

	Validator.prototype.reset = function(){
		S('#drop_zone').removeClass('loaded');
		S('#drop_zone .helpertext').css({'display':''});
		S('#results').css({'display':''});
		S('#filedetails').remove();
		S('#messages').html('');
		tr = S('table.odi tr');
		if(tr.length > 1){
			for(var i = 1; i < tr.length; i++){
				S(tr[i]).remove();
			}
		}
		S('.part').removeClass('c8-bg').addClass('b5-bg');
		delete this.csv;
		delete this.data;
		delete this.url;
		delete this.file;
		delete this.records;
		
		return this;
	}


	validator = new Validator();


	/**
	 * CSVToArray parses any String of Data including '\r' '\n' characters,
	 * and returns an array with the rows of data.
	 * @param {String} CSV_string - the CSV string you need to parse
	 * @param {String} delimiter - the delimeter used to separate fields of data
	 * @returns {Array} rows - rows of CSV where first row are column headers
	 */
	function CSVToArray (CSV_string, delimiter) {
		delimiter = (delimiter || ","); // user-supplied delimeter or default comma

		var pattern = new RegExp( // regular expression to parse the CSV values.
			( // Delimiters:
				"(\\" + delimiter + "|\\r?\\n|\\r|^)" +
				// Quoted fields.
				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
				// Standard fields.
				"([^\"\\" + delimiter + "\\r\\n]*))"
			), "gi"
		);

		var rows = [[]];  // array to hold our data. First row is column headers.
		// array to hold our individual pattern matching groups:
		var matches = false; // false if we don't find any matches
		// Loop until we no longer find a regular expression match
		while (matches = pattern.exec( CSV_string )) {
			var matched_delimiter = matches[1]; // Get the matched delimiter
			// Check if the delimiter has a length (and is not the start of string)
			// and if it matches field delimiter. If not, it is a row delimiter.
			if (matched_delimiter.length && matched_delimiter !== delimiter) {
				// Since this is a new row of data, add an empty row to the array.
				rows.push( [] );
			}
			var matched_value;
			// Once we have eliminated the delimiter, check to see
			// what kind of value was captured (quoted or unquoted):
			if (matches[2]) { // found quoted value. unescape any double quotes.
				matched_value = matches[2].replace(
					new RegExp( "\"\"", "g" ), "\""
				);
			} else { // found a non-quoted value
				matched_value = matches[3];
			}
			// Now that we have our value string, let's add
			// it to the data array.
			rows[rows.length - 1].push(matched_value);
		}
		return rows; // Return the parsed data Array
	}

	// Function to parse a CSV file and return a JSON structure
	// Guesses the format of each column based on the data in it.
	function CSV2JSON(data,start,end){

		// If we haven't sent a start row value we assume there is a header row
		if(typeof start!=="number") start = 1;
		// Split by the end of line characters
		if(typeof data==="string") data = CSVToArray(data);
		// The last row to parse
		if(typeof end!=="number") end = data.length;

		if(end > data.length){
			// Cut down to the maximum length
			end = data.length;
		}


		var line,datum,header,types;
		var newdata = new Array();
		var formats = new Array();
		var req = new Array();

		for(var i = 0, rows = 0 ; i < end; i++){

			// If there is no content on this line we skip it
			if(data[i] == "") continue;

			line = data[i];

			datum = new Array(line.length);
			types = new Array(line.length);

			// Loop over each column in the line
			for(var j=0; j < line.length; j++){

				// Remove any quotes around the column value
				datum[j] = (line[j][0]=='"' && line[j][line[j].length-1]=='"') ? line[j].substring(1,line[j].length-1) : line[j];

				// If the value parses as a float
				if(typeof parseFloat(datum[j])==="number" && parseFloat(datum[j]) == datum[j]){
					types[j] = "float";
					// Check if it is actually an integer
					if(typeof parseInt(datum[j])==="number" && parseInt(datum[j])+"" == datum[j]){
						types[j] = "integer";
						// If it is an integer and in the range 1700-2100 we'll guess it is a year
						if(datum[j] >= 1700 && datum[j] < 2100) types[j] = "year";
					}
				}else if(datum[j].search(/^(true|false)$/i) >= 0){
					// The format is boolean
					types[j] = "boolean";
				}else if(datum[j].search(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/) >= 0){
					// The value looks like a URL
					types[j] = "URL";
				}else if(!isNaN(Date.parse(datum[j]))){
					// The value parses as a date
					types[j] = "datetime";
				}else{
					// Default to a string
					types[j] = "string";
					// If the string value looks like a time we set it as that
					if(datum[j].search(/^[0-2]?[0-9]\:[0-5][0-9]$/) >= 0) types[j] = "time";
				}
			}

			if(i == 0 && start > 0) header = datum;
			if(i >= start){
				newdata[rows] = datum;
				formats[rows] = types;
				rows++;
			}
		}
		
		// Now, for each column, we sum the different formats we've found
		var format = new Array(header.length);
		for(var j = 0; j < header.length; j++){
			var count = {};
			var empty = 0;
			for(var i = 0; i < newdata.length; i++){
				if(!newdata[i][j]) empty++;
			}
			for(var i = 0 ; i < formats.length; i++){
				if(!count[formats[i][j]]) count[formats[i][j]] = 0;
				count[formats[i][j]]++;
			}
			var mx = 0;
			var best = "";
			for(var k in count){
				if(count[k] > mx){
					mx = count[k];
					best = k;
				}
			}
			// Default
			format[j] = "string";

			// If more than 80% (arbitrary) of the values are a specific format we assume that
			if(mx > 0.8*newdata.length) format[j] = best;

			// If we have a few floats in with our integers, we change the format to float
			if(format[j] == "integer" && count['float'] > 0.1*newdata.length) format[j] = "float";

			req.push(header[j] ? true : false);

		}

		// Return the structured data
		return { 'fields': {'name':header,'title':clone(header),'format':format,'required':req }, 'rows': newdata };
	}


	function Logger(inp){
		if(!inp) inp = {};
		this.logging = (inp.logging||false);
		this.logtime = (inp.logtime||false);
		this.id = (inp.id||"JS");
		this.metrics = {};
		return this;
	}
	Logger.prototype.error = function(){ this.log('ERROR',arguments); };
	Logger.prototype.warning = function(){ this.log('WARNING',arguments); };
	Logger.prototype.info = function(){ this.log('INFO',arguments); };
	Logger.prototype.message = function(){ this.log('MESSAGE',arguments); }
	Logger.prototype.log = function(){
		if(this.logging || arguments[0]=="ERROR" || arguments[0]=="WARNING" || arguments[0]=="INFO"){
			var args,args2,bold;
			args = Array.prototype.slice.call(arguments[1], 0);
			args2 = (args.length > 1 ? args.splice(1):"");
			bold = 'font-weight:bold;';
			if(console && typeof console.log==="function"){
				if(arguments[0] == "ERROR") console.error('%c'+this.id+'%c: '+args[0],bold,'',args2);
				else if(arguments[0] == "WARNING") console.warn('%c'+this.id+'%c: '+args[0],bold,'',args2);
				else if(arguments[0] == "INFO") console.info('%c'+this.id+'%c: '+args[0],bold,'',args2);
				else console.log('%c'+this.id+'%c: '+args[0],bold,'',args2);
			}
		}
		return this;
	}
	Logger.prototype.time = function(key){
		if(!this.metrics[key]) this.metrics[key] = {'times':[],'start':''};
		if(!this.metrics[key].start) this.metrics[key].start = new Date();
		else{
			var t,w,v,tot,l,i,ts;
			t = ((new Date())-this.metrics[key].start);
			ts = this.metrics[key].times;
			// Define the weights for each time in the array
			w = [1,0.75,0.55,0.4,0.28,0.18,0.1,0.05,0.002];
			// Add this time to the start of the array
			ts.unshift(t);
			// Remove old times from the end
			if(ts.length > w.length-1) ts = ts.slice(0,w.length);
			// Work out the weighted average
			l = ts.length;
			this.metrics[key].av = 0;
			if(l > 0){
				for(i = 0, v = 0, tot = 0 ; i < l ; i++){
					v += ts[i]*w[i];
					tot += w[i];
				}
				this.metrics[key].av = v/tot;
			}
			this.metrics[key].times = ts.splice(0);
			if(this.logtime) this.info(key+' '+t+'ms ('+this.metrics[key].av.toFixed(1)+'ms av)');
			delete this.metrics[key].start;
		}
		return this;
	};

	function dropOver(evt){
		evt.stopPropagation();
		evt.preventDefault();
		S(this).addClass('drop');
	}

	function dragOff(){ S('.drop').removeClass('drop'); }

	function niceSize(b){
		if(b > 1e12) return (b/1e12).toFixed(2)+" TB";
		if(b > 1e9) return (b/1e9).toFixed(2)+" GB";
		if(b > 1e6) return (b/1e6).toFixed(2)+" MB";
		if(b > 1e3) return (b/1e3).toFixed(2)+" kB";
		return (b)+" bytes";
	}
	// Function to clone a hash otherwise we end up using the same one
	function clone(hash) {
		var json = JSON.stringify(hash);
		var object = JSON.parse(json);
		return object;
	}

});