var explorer;

S(document).ready(function(){
	
	function BusinessRatesExplorer(attr){
		this.areas = {};
		this.dir = "data/";
		this.colours = {
			'selected':{'bg':getStyle(S('li.selected a')[0],'background-color'),'text':getStyle(S('li.selected a')[0],'color')},
			'occupied':{'bg':'#EF3AAB','text':'#000000'},
			'mixed':{'bg':'#722EA5','text':'#ffffff'},
			'empty':{'bg':'#000000','text':'#ffffff'},
			'Commercial':{'cls':'c11-bg'},
			'Industrial':{'cls':'c1-bg'},
			'Miscellaneous':{'cls':'c5-bg'},
			'Educational, training & cultural':{'cls':'c14-bg'},
			'Leisure':{'cls':'c13-bg'},
			'Utilities':{'cls':'c3-bg'},
			'Unspecified': {'cls':'b5-bg'}
		};
		this.svg = {
			'logo': '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 763.2 466.6" class="animated-logo"><path style="fill:none;fill-rule:evenodd;stroke:#189CD8;stroke-width:10px;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" d="m 3.6228,460.56 562.7372,0 0,-219.78 90.57,0 0,94.19 13.29,0 0,-43.47 88.15,38.64 0,130.42 -172.69,0 172.53,-130.42 -170.11,128.01 0,-255.31 15.25,-0.24 0,-54.81 0,54.35 36.68,0 -184.77,258.42 0,-404.542 130.42,404.542 -130.42,-404.542 14.49,0 0,-51.9269 0,50.7189 22.95,0 0,31.398 9.66,0 0,41.062 8.45,0 0,39.85 18.12,0 0,293.44 -195.63,-291.03 82.11,290.88 0,-353.67 -392.466,352.61 0,-143.7 38.643,0 41.063,144.76 95.4,-216.01 -26.57,0 0,-55.55 0,55.55 -39.85,0 82.11,216.16 0,-236.69 34.42,-34.41 0,-97.214 74.27,0 0,368.014 -217.37,-180.84 0,180.99 -12.075,0 0,-131.48 -89.3622,0 z" /></svg>',
			'download': '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 28.7 23.8"><polyline style="stroke:#169BD5;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" points="21,9.4 14.4,16 7.7,9.4 "/><polyline style="stroke:#169BD5;stroke-width:1.7381;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" points="0.9,14.1 0.9,22.9 27.9,22.9 27.9,12.9 "/><line style="stroke:#169BD5;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" x1="14.4" y1="16" x2="14.4" y2="1"/></svg>',
			'left': '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 38.09322 38.09322" width="38.09322" height="38.09322"><path style="opacity:1;fill:#000000;fill-opacity:1;stroke:none;stroke-opacity:1" d="M 19.046875,0 A 19.04661,19.04661 0 0 1 38.09375,19.046875 19.04661,19.04661 0 0 1 19.046875,38.09375 19.04661,19.04661 0 0 1 0,19.046875 19.04661,19.04661 0 0 1 19.046875,0 Z m 5.308594,7.6386719 A 0.78622445,0.78622445 0 0 0 23.792969,7.875 L 13.179688,18.488281 a 0.78622445,0.78622445 0 0 0 0,1.111328 l 10.613281,10.613282 a 0.78622445,0.78622445 0 1 0 1.111328,-1.111329 L 14.845703,19.044922 24.904297,8.9882812 A 0.78622445,0.78622445 0 0 0 24.355469,7.6386719 Z" /></svg>',
			'right': '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38.09322 38.09322" width="38.09322" height="38.09322"><path style="opacity:1;fill:#000000;fill-opacity:1;stroke:none;stroke-opacity:1" d="M 19.046875 0 A 19.04661 19.04661 0 0 0 0 19.046875 A 19.04661 19.04661 0 0 0 19.046875 38.09375 A 19.04661 19.04661 0 0 0 38.09375 19.046875 A 19.04661 19.04661 0 0 0 19.046875 0 z M 13.738281 7.6386719 A 0.78622445 0.78622445 0 0 1 14.300781 7.875 L 24.914062 18.488281 A 0.78622445 0.78622445 0 0 1 24.914062 19.599609 L 14.300781 30.212891 A 0.78622445 0.78622445 0 1 1 13.189453 29.101562 L 23.248047 19.044922 L 13.189453 8.9882812 A 0.78622445 0.78622445 0 0 1 13.738281 7.6386719 z " /></svg>'
		}
		this.logging = true;
		this.log = new Logger({'id':'BusinessRatesExplorer','logging':this.logging});
		this.attr = (attr||{});
		if(!this.attr.el) this.attr.el = '#output';
		S().ajax("index.csv",{
			"dataType": "text",
			"this": this,
			"success": function(data,attr){
				data = CSV2JSON(data);
				for(var i = 0; i < data.length; i++) this.areas[data[i]['ONS code']] = data[i];
				this.init();
			},
			"error": function(d,attr){
				this.log.error('Unable to open '+attr.url);
			}
		});
		return this;
	}
	
	var db = [];
	var beneficiary = {};
	var loaded = new Array();
	var cols = new Array();
	var totals = new Array();
	var urls = {};
	var activeseries = {};
	var chart;
	var barselect = -1;

	BusinessRatesExplorer.prototype.init = function(){
		if(!this.el) this.el = S(this.attr.el);
		
		if(this.el.find('#map').length==0) this.el.append('<div id="map" class="padded panel on"><div class="holder"><div class="panel-inner b6-bg doublepadded"><div id="map-holder"></div></div></div></div>');
		if(this.el.find('#categories').length==0) this.el.append('<div id="categories" class="padded panel off"><div class="holder"><div class="b6-bg panel-inner doublepadded"></div></div></div>');
		if(this.el.find('#rates').length==0) this.el.append('<div id="rates" class="padded panel off"><div class="holder"><div class="b6-bg panel-inner doublepadded"><ul class="grid compact"><li><a href="#rateablevalue" class="c8-bg"><span class="number businesses"></span><span class="title">Businesses</span></a></li><li><a href="#empty" class="c8-bg"><span class="number empty"></span><span class="title">Empty</span></a></li><li><a href="#empty" class="c8-bg"><span class="number emptyvalue"></span><span class="title">Rateable value of empties</span></a></li></ul><h2 id="rateablevalue">Rateable values</h2><p>A breakdown of the rateable values</p><div id="rates-barchart"></div><h2 id="empty">Empty</h2><p>A breakdown of the percent of businesses which are empty in each band.</p><div id="empty-barchart"></div></div></div></div>');
		if(this.el.find('#fsa').length==0) this.el.append('<div id="fsa" class="padded panel off"><div class="holder"><div class="b6-bg panel-inner doublepadded"><h2>Scores on the doors</h2><h3>Totals by category</h3><p>We have attempted to match businesses with those in the <a href="http://ratings.food.gov.uk/default/en-GB">Food Standard\'s Agency dataset</a> using postcode and then breaking the name into parts to do a loose match. This first bar chart gives you the totals for each rating in the FSA dataset.</p><div id="fsa-barchart"></div><h3>Percent matched</h3><p>Here is a breakdown of the percent of businesses we matched, by rating, between the two datasets.</p><div id="fsa-barchart-pc"></div></div></div>');

		
		S('ul.smalltabs li a').on('click',{me:this},function(e){
			e.preventDefault();
			// Update tabs
			S('ul.smalltabs li a').removeClass('b5-bg').addClass('b4-bg');
			S(e.currentTarget).addClass('b5-bg').removeClass('b4-bg');
			// Update panels
			S('.panel.on').addClass('off').removeClass('on');
			S(e.currentTarget.getAttribute('href')).removeClass('off').addClass('on');
		});

		_obj = this;
		function setArea(e){
			el = S(e);
			code = el.find('a').attr('code');
			title = el.find('img').attr('title');
			name = title.replace(/ /g,"_").toLowerCase();
			if(_obj.areas[code]['Local Authority']) name = _obj.areas[code]['Local Authority'].replace(/ /g,"_").toLowerCase();

			_obj.areas[code].tidyname = name;
			_obj.areas[code].name = title;
			_obj.areas[code].img = el.find('img').attr('src');
			_obj.areas[code].files = {'rates':_obj.areas[code].URL, 'fsa':_obj.areas[code].FSA,'geo':_obj.areas[code].GeoJSON };
			_obj.areas[code].data = {};
			_obj.areas[code].lastupdate = _obj.areas[code]['Last updated'];
			_obj.areas[code].ratesoriginal = el.find('a').attr('href');
			_obj.areas[code].include = el.hasClass('selected')||false;
			return name;
		}
		var councils = S('.councils li');
		for(var i = 0; i < councils.length; i++) setArea(councils[i]);
		
		S('.councils li').on('click',{me:this},function(e){
			e.preventDefault();
			e.stopPropagation();
			S(e.currentTarget).toggleClass('selected');
			var el = S(e.currentTarget);
			var code = el.find('a').attr('code');
			if(code){
				e.data.me.areas[code].include = el.hasClass('selected');
				e.data.me.loadCity(code);
			}
		});

		S().ajax(this.dir+'pdcde.csv',{
			'dataType': 'text',
			'cache': false,
			'this': this,
			'complete': function(data,attr){
				if(typeof data==="string"){
					data = CSV2JSON(data);
					this.codes = {};
					for(var i = 0; i < data.length; i++){
						key = data[i]['Primary Description Code'];
						if(key) this.codes[key] = data[i];
					}
				}
			},
			'error': function(e,attr){
				S('#totals').html('<div style="display:table;width: 100%;height:300px;"><div style="text-align:center;vertical-align:middle;display:table-cell;"><h2>Oh noes!</h2><p>Summat went wrong while loading the data.</p></div></div>');
				this.log.error('Unable to load '+attr.url,e);
			}
		});

		var str = "";
		for(var a in this.areas){
			if(this.areas[a] && this.areas[a].files){
				if(this.areas[a].files.rates) str += '<li><a href="'+this.areas[a].files.rates+'">'+this.areas[a].name+' Business Rates</a> '+this.areas[a].lastupdate+' / <a href="'+this.areas[a].ratesoriginal+'">'+this.areas[a].name+'</a> / OGL v3</li>'
				if(this.areas[a].files.fsa) str += '<li><a href="'+this.areas[a].files.fsa+'">'+this.areas[a].name+' Food Hygiene Ratings</a> / <a href="http://ratings.food.gov.uk/open-data/en-GB">Food Standards Agency</a> / OGL v3</li>'
				if(this.areas[a].files.fsa) str += '<li><a href="'+this.areas[a].files.geo+'">'+this.areas[a].name+' Boundaries</a> / <a href="https://geoportal.statistics.gov.uk/datasets/local-authority-districts-april-2019-boundaries-uk-bgc">National Statistics data and OS data &copy; Crown copyright and database right 2019</a> / <a href="https://www.ons.gov.uk/methodology/geography/licences">OGL v3</a></li>'
			}
		}
		if(str){
			S('#download').html('<ul>'+str+'</ul>');
		}
		
		return this;
	}

	BusinessRatesExplorer.prototype.loadCity = function(a){
		this.log.message('loadCity',a,this.areas[a]);
		
		if(this.areas[a].files.rates && !this.areas[a].data.rates && this.areas[a].include){
			this.log.message('loading rates file')
			S().ajax(this.areas[a].files.rates,{
				'dataType': 'text',
				'cache': false,
				'area': a,
				'this': this,
				'success': function(data,attr){
					console.log(attr)
					if(typeof data==="string"){

						// Cludgy fix for Leeds
						data = data.replace(/ \([^\)]\)/g,"");

						data = CSV2JSON(data,{
							'BA ReferenceNumber':{'format':'string','name':'ID'},
							'Ratepayer':{'format':'string'},
							'VOA code':{'format':'string'},
							'VOA description':{'format':'string'},
							'Latitude':{'format':'number'},
							'Longitude':{'format':'number'},
							'Address':{'format':'string'},
							'Postcode':{'format':'string'},
							'Occupied':{'format':'boolean'},
							'Rateable value':{'format':'number'},
							'Liability start date':{'format':'date'},
							'Empty from':{'format':'date'},
							'Relief mandatory':{'format':'number'},
							'Relief discretionary':{'format':'number'},
							'Relief small business':{'format':'number'},
							'Relief transitional':{'format':'number'}
						});
					}
					this.areas[attr.area].data.rates = data;
					this.areas[attr.area].markers = [];
					if(!this.areas[attr.area].files.fsa || (this.areas[attr.area].files.fsa && this.areas[attr.area].data.fsa)){
						this.build(attr.area);
					}
					S('#progress .msg-'+attr.area+'').html('');
				},
				'progress': function(e,attr){
					if(e.total > 0){
						if(S('#progress').find('.msg-'+attr.area).length == 0) S('#progress').append('<div class="msg-'+attr.area+'"></div>')
						S('#progress .msg-'+attr.area).html(this.areas[attr.area].name+' business rates '+Math.round(100*e.loaded/e.total)+'% loaded');
					}
				},
				'error': function(e,attr){
					S('#totals').html('<div style="display:table;width: 100%;height:300px;"><div style="text-align:center;vertical-align:middle;display:table-cell;"><h2>Oh noes!</h2><p>Summat went wrong while loading the data.</p></div></div>');
					this.log.error('Unable to load '+attr.url,e);
				}
			});
		}else{
			this.build();
		}

		if(this.areas[a].files.fsa && !this.areas[a].data.fsa && this.areas[a].include){
			this.log.message('loading fsa file for '+a)
			S().ajax(this.areas[a].files.fsa,{
				'dataType': 'text',
				'cache': false,
				'area': a,
				'this': this,
				'success': function(data,attr){
					if(typeof data==="string"){
						// Fix wrong date formats
						data = data.replace(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})/g,function(ma,d,m,y){ return y+'-'+m+'-'+d; });
						data = CSV2JSON(data,{
							'Latitude':{'format':'number'},
							'Longitude':{'format':'number'},
							'RatingDate':{'format':'date'}
						});

						this.areas[attr.area].data.fsa = data;
						this.log.message('Got areas',this.areas)
						if(this.areas[attr.area].data.rates) this.build();
						S('#progress .msg-'+attr.area+'-fsa').html('');
					}
				},
				'progress': function(e,attr){
					if(e.total > 0){
						if(S('#progress').find('.msg-'+attr.area+'-fsa').length == 0) S('#progress').append('<div class="msg-'+attr.area+'-fsa"></div>')
						S('#progress .msg-'+attr.area+'-fsa').html(this.areas[attr.area].name+' food hygiene ratings '+Math.round(100*e.loaded/e.total)+'% loaded');
					}
				},
				'error': function(e,attr){
					S('#totals').html('<div style="display:table;width: 100%;height:300px;"><div style="text-align:center;vertical-align:middle;display:table-cell;"><h2>Oh noes!</h2><p>Summat went wrong while loading the data.</p></div></div>');
					this.log.error('Unable to load '+attr.url,e);
					this.areas[attr.area].data.fsa = [];
					if(this.areas[attr.area].data.rates) this.build();
				}
			});
		}

		if(this.areas[a].files.geo && !this.areas[a].data.geojson && this.areas[a].include){
			this.log.message('loading geo file')
			S().ajax(this.areas[a].files.geo,{
				'dataType': 'json',
				'cache': false,
				'area': a,
				'this': this,
				'complete': function(data,attr){
					this.areas[attr.area].data.geojson = data;
					S('#progress .msg-'+attr.area+'-geo').html('');
				},
				'progress': function(e,attr){
					if(e.total > 0){
						if(S('#progress').find('.msg-'+attr.area+'-geo').length == 0) S('#progress').append('<div class="msg-'+attr.area+'-geo"></div>')
						S('#progress .msg-'+attr.area+'-geo').html(this.areas[attr.area].name+' geography '+Math.round(100*e.loaded/e.total)+'% loaded');
					}
				},
				'error': function(e){
					S('#totals').html('<div style="display:table;width: 100%;height:300px;"><div style="text-align:center;vertical-align:middle;display:table-cell;"><h2>Oh noes!</h2><p>Summat went wrong while loading the data.</p></div></div>');
					this.log.error(e);
				}
			});
		}
		return this;
	}
	BusinessRatesExplorer.prototype.logTime = function(key){

		this.logtime = true;
		if(!this.metrics) this.metrics = {};
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
			if(this.logtime) this.log.message(key+' '+t+'ms ('+this.metrics[key].av.toFixed(1)+'ms av)');
			delete this.metrics[key].start;
		}
		return this;
	};

	BusinessRatesExplorer.prototype.build = function(){

		var icon = L.Icon.extend({
			options: {
				shadowUrl: 'images/marker-shadow.png',
				iconSize:     [25, 41], // size of the icon
				shadowSize:   [41, 41], // size of the shadow
				iconAnchor:   [12.5, 41], // point of the icon which will correspond to marker's location
				shadowAnchor: [12.5, 41],  // the same for the shadow
				popupAnchor:  [0, -41] // point from which the popup should open relative to the iconAnchor
			}
		});
		
		var icons = {
			'black': new icon({iconUrl: '/resources/images/marker.svg'}),
			'c-1': new icon({iconUrl: '/resources/images/marker-1.svg'}),
			'c-2': new icon({iconUrl: '/resources/images/marker-2.svg'}),
			'c-3': new icon({iconUrl: '/resources/images/marker-3.svg'}),
			'c-4': new icon({iconUrl: '/resources/images/marker-4.svg'}),
			'c-5': new icon({iconUrl: '/resources/images/marker-5.svg'}),
			'c-6': new icon({iconUrl: '/resources/images/marker-6.svg'}),
			'c-7': new icon({iconUrl: '/resources/images/marker-7.svg'}),
			'c-8': new icon({iconUrl: '/resources/images/marker-8.svg'}),
			'c-9': new icon({iconUrl: '/resources/images/marker-9.svg'}),
			'c-10': new icon({iconUrl: '/resources/images/marker-10.svg'}),
			'c-11': new icon({iconUrl: '/resources/images/marker-11.svg'}),
			'c-12': new icon({iconUrl: '/resources/images/marker-12.svg'}),
			'c-13': new icon({iconUrl: '/resources/images/marker-13.svg'}),
			'c-14': new icon({iconUrl: '/resources/images/marker-14.svg'}),
			's-1': new icon({iconUrl: '/resources/images/marker-s1.svg'}),
			's-2': new icon({iconUrl: '/resources/images/marker-s2.svg'}),
			's-3': new icon({iconUrl: '/resources/images/marker-s3.svg'}),
			'seasonal': new icon({iconUrl: 'images/marker-seasonal.svg'}),
			'occupied': makeMarker(this.colours.occupied.bg),
			'empty': makeMarker(this.colours.empty.bg)
		}

		if(!this.baseMaps){
			this.baseMaps = {};
			this.baseMaps['Default'] = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
				attribution: 'Tiles: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
				subdomains: 'abcd',
				maxZoom: 19
			})
		}

		if(!this.map){

			// Build map
			this.map = L.map('map-holder',{'layers':[this.baseMaps['Default']],'scrollWheelZoom':true});
			//this.map.setView([53.5, -1.5], 9);

			var info = L.control({position: 'bottomleft'});
			info.onAdd = function(map){
				this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
				this.update();
				return this._div;
			}
			// method that we will use to update the control based on feature properties passed
			info.update = function(props){
				this._div.innerHTML = (props ? '' + props.name : '');
			};
			info.addTo(this.map);
		}


		colour = this.colours.selected;

		// Remove any existing marker list
		if(this.markers && this.markerLayer){
			this.logTime('removeMarkers');
			this.markerLayer.clearLayers();
			this.markerLayer.remove();
			this.logTime('removeMarkers');
		}

		// Build marker list
		this.markers = [];
		havedata = false;
		n = 0;
		var a,f,i,j,r,d,data,idx;
		var bounds = {'ne':{'lat':-90,'lng':-180},'sw':{'lat':90,'lng':180}};
		var ratebins = [
			{'min':0,'max':2000,'key':'0','total':{}},
			{'min':2000,'max':4000,'key':'2k','total':{}},
			{'min':4000,'max':6000,'key':'4k','total':{}},
			{'min':6000,'max':8000,'key':'6k','total':{}},
			{'min':8000,'max':10000,'key':'8k','total':{}},	
			{'min':10000,'max':12000,'key':'10k','total':{}},
			{'min':12000,'max':14000,'key':'12k','total':{}},
			{'min':14000,'max':16000,'key':'14k','total':{}},
			{'min':16000,'max':18000,'key':'16k','total':{}},
			{'min':18000,'max':20000,'key':'18k','total':{}},
			{'min':20000,'max':25000,'key':'20k','total':{}},
			{'min':25000,'max':30000,'key':'25k','total':{}},
			{'min':30000,'max':35000,'key':'30k','total':{}},
			{'min':35000,'max':40000,'key':'35k','total':{}},
			{'min':40000,'max':45000,'key':'40k','total':{}},
			{'min':45000,'max':50000,'key':'45k','total':{}},
			{'min':50000,'max':60000,'key':'50k','total':{}},
			{'min':60000,'max':70000,'key':'60k','total':{}},
			{'min':70000,'max':80000,'key':'70k','total':{}},
			{'min':80000,'max':90000,'key':'80k','total':{}},
			{'min':90000,'max':100000,'key':'90k','total':{}},
			{'min':100000,'max':1e12,'key':'100k+','total':{}}
		];
		
		totals = {'voa':{},'hmrc':{},'fsa':{},'nofsa':{},'empty':0,'n':0,'emptyvalue':0};
		
		found = 0;

		for(a in this.areas){
			_obj = this;
			if(!this.areas[a].markers) this.areas[a].markers = [];
			
			if(this.areas[a].include){
				if(this.areas[a].data.rates) S('#progress .msg-'+a).html('');

				havedata = true;
				if(this.areas[a].data.rates){
					// Try to match with FSA data
					postcodes = {};
					
					if(this.areas[a].data.fsa && this.areas[a].data.fsa.length > 0 && !this.areas[a].matched){
						matched = 0;
						this.logTime('Matching against FSA');
						// Sanitise names
						for(f = 0; f < this.areas[a].data.fsa.length; f++){
							if(!this.areas[a].data.fsa[f].name){
								name = "";
								if(this.areas[a].data.fsa[f].BusinessName) name = this.areas[a].data.fsa[f].BusinessName;
								if(this.areas[a].data.fsa[f].Name) name = this.areas[a].data.fsa[f].Name;
								this.areas[a].data.fsa[f].name = name.toUpperCase().replace(/[^A-Za-z0-9]/," ").replace(/\s+/," ");
							}
						}
						for(r = 0; r < this.areas[a].data.rates.length; r++){
							if(!this.areas[a].data.rates[r].name && this.areas[a].data.rates[r].Ratepayer) this.areas[a].data.rates[r].name = this.areas[a].data.rates[r].Ratepayer.toUpperCase().replace(/[^A-Za-z0-9]/," ").replace(/\s+/," ");
						}

						// Loop over rates postcodes grouping them
						for(r = 0; r < this.areas[a].data.rates.length; r++){
							if(!postcodes[this.areas[a].data.rates[r].Postcode]) postcodes[this.areas[a].data.rates[r].Postcode] = [r];
							else postcodes[this.areas[a].data.rates[r].Postcode].push(r);
						}

						// Loop over FSA data
						for(f = 0; f < this.areas[a].data.fsa.length; f++){

							matches = [];
							pc = "";
							if(this.areas[a].data.fsa[f].PostCode) pc = this.areas[a].data.fsa[f].PostCode;
							if(this.areas[a].data.fsa[f].Postcode) pc = this.areas[a].data.fsa[f].Postcode;
							if(postcodes[pc]){
								for(var i = 0; i < postcodes[pc].length; i++){
									matches.push({'r':postcodes[pc][i],'match':0});
								}
							}

							// Find the words in the FSA name
							words = this.areas[a].data.fsa[f].name.split(/ /);
							max = 0;
							best = "";
							
							// Loop over all the matched rates data entries
							for(i = 0; i < matches.length; i++){
								r = matches[i].r;
								// See how many words match
								for(j = 0; j < words.length; j++){
									if(words[j] && this.areas[a].data.rates[r].name){
										idx = this.areas[a].data.rates[r].name.indexOf(words[j]);
										if(idx >= 0){
											matches[i].match++;
											if(matches[i].match > max){
												max = matches[i].match;
												best = r;
											}
										}
									}
								}
							}
							if(best && max > 0){
								matched++;
								this.areas[a].data.rates[best]._fsa = this.areas[a].data.fsa[f];
								this.areas[a].data.fsa[f]._matched = true;
							}
						}
						this.areas[a].matched = matched;
						this.logTime('Matching against FSA');
					}
					found += this.areas[a].matched;

					// Build markers
					this.logTime('BuildMarkers');
					for(i = 0; i < this.areas[a].data.rates.length; i++){
						d = this.areas[a].data.rates[i];
						totals.n++;

						ratekey = 0;
						if(typeof d['Rateable value']==="number"){
							for(r = 0; r < ratebins.length; r++){
								if(d['Rateable value'] >= ratebins[r].min){
									ratekey = r;
								}else continue;
							}
						}
						if(typeof ratebins[ratekey].total.total==="undefined") ratebins[ratekey].total.total = 0;
						ratebins[ratekey].total.total++;


						if(typeof ratebins[ratekey].total.empty==="undefined") ratebins[ratekey].total.empty = 0;
						if(!d['Occupied']){
							ratebins[ratekey].total.empty++;
							totals.emptyvalue += (d['Rateable value']||0);
							totals.empty++;
						}

						if(d.Latitude && d.Longitude){
							rating = "";
							if(d._fsa){
								if(d._fsa.RatingValue) rating = d._fsa.RatingValue;
								if(d._fsa.Rating) rating = d._fsa.Rating;
							}
							if(!this.areas[a].markersbuilt){
								marker = L.marker([d.Latitude,d.Longitude],{icon:(d['Occupied'] ? icons.occupied:icons.empty),'occupied':d['Occupied']});
								dates = {'empty':'','liability':''};
								if(d['Liability start date'] && typeof d['Liability start date']==="object"){
									try {
										dates.liability = d['Liability start date'].toISOString().substr(0,10);
									}catch(err){
										this.log.warning('Unable to process Liability start date '+d['Liability start date']);
									}
								}
								if(d['Empty from'] && typeof d['Empty from']==="object"){
									try {
										dates.empty = '<br /><strong>Empty from</strong>: '+d['Empty from'].toISOString().substr(0,10);
									}catch(err){
										this.log.warning('Unable to process Empty from date '+d['Empty from']);
									}
								}
								marker.bindPopup('<h3>'+d.Ratepayer+'</h3><p>'+(d.ID ? '<strong>ID</strong>: '+d.ID+'<br/>':'')+'<strong>Address</strong>: '+d.Address+'<br /><strong>Postcode</strong>: '+d.Postcode+'<br /><strong>Rateable value</strong>: &pound;'+d['Rateable value']+(d['Occupied'] ? '':'<br /><strong>Status</strong>: EMPTY')+'<br /><strong>Liability start date</strong>: '+dates.liability+dates.empty+(rating ? '<br /><strong>FSA</strong>: '+rating:'')+'</p>');
								this.areas[a].markers.push(marker);
							}
							if(d._fsa){
								if(!totals.fsa[rating]) totals.fsa[rating] = 0;
								totals.fsa[rating]++;
							}
							n++;
						}
						if(!d['VOA code']){
							d['VOA code'] = 'Unspecified';
							this.codes[d['VOA code']] = {'PROPTYPE2 Description':'Unknown'};
						}
						if(typeof totals.voa[d['VOA code']]!=="number") totals.voa[d['VOA code']] = 0;
						totals.voa[d['VOA code']]++;
						if(this.codes[d['VOA code']]){
							code = this.codes[d['VOA code']]['PROPTYPE2 Description'];
							if(code){
								if(typeof totals.hmrc[code]!=="number") totals.hmrc[code] = 0;
								totals.hmrc[code]++;
							}
						}
//		console.log('here',this.areas[a].data.rates.length)
					}
					this.log.message(totals);
					for(var i = 0; i < this.areas[a].markers.length; i++){
						latlng = this.areas[a].markers[i]._latlng;
						if(latlng.lat < bounds.sw.lat) bounds.sw.lat = latlng.lat;
						if(latlng.lat > bounds.ne.lat) bounds.ne.lat = latlng.lat;
						if(latlng.lng < bounds.sw.lng) bounds.sw.lng = latlng.lng;
						if(latlng.lng > bounds.ne.lng) bounds.ne.lng = latlng.lng;
						this.markers.push(this.areas[a].markers[i]);
					}
					this.logTime('BuildMarkers');
					this.areas[a].markersbuilt = true;
					if(this.areas[a].data.fsa){
						for(f = 0; f < this.areas[a].data.fsa.length; f++){
							d = this.areas[a].data.fsa[f];
							if(!d._matched){
								rating = "";
								if(d.RatingValue) rating = d.RatingValue;
								if(d.Rating) rating = d.Rating;
								if(!totals.nofsa[rating]) totals.nofsa[rating] = 0;
								totals.nofsa[rating]++;
							}
						}
					}

				}

			}else{
				//if(this.areas[a].markers.length > 0) this.markerLayer.removeLayers(this.areas[a].markers);
			}
		}
		this.logTime('BuildTables');

		var desc,i,prehtml;
		html = '<table class="odi"><tr><th>Category</th><th>Specific category</th><th>Number</th></tr>';
		order = getSortedKeys(totals.voa);
		totals.voacat = {};
		for(i = 0; i < order.length; i++){
			if(totals.voa[order[i]] && this.codes[order[i]]){
				desc = (this.codes[order[i]]['PROPTYPE1 Broad Description']||"Unspecified");
				html += '<tr><td>'+desc+'</td><td>'+this.codes[order[i]]['Default Description']+'</td><td>'+totals.voa[order[i]]+'</td></tr>';
				if(!totals.voacat[desc]) totals.voacat[desc] = 0;
				totals.voacat[desc] += totals.voa[order[i]];
			}
		}
		html += '</table>';
		prehtml = '<ul class="grid compact">';
		order = getSortedKeys(totals.voacat);
		for(i = 0; i < order.length; i++){
			desc = order[i];
			prehtml += '<li><div class="'+this.colours[desc].cls+'"><span class="number" data="'+totals.voacat[desc]+'">0</span><span class="title">'+desc+'</span></div></li>';
		}
		prehtml += '</ul>';

		this.log.message('Totals',totals)

		var properties = '<h3>HMRC classifications</h3><table class="odi"><tr><th>Description</th><th>Number</th></tr>';
		order = getSortedKeys(totals.hmrc);
		for(var i = 0; i < order.length; i++){
			if(totals.hmrc[order[i]]){
				properties += '<tr><td>'+order[i]+'</td><td>'+totals.hmrc[order[i]]+'</td></tr>';
			}
		}
		properties += '</table>';
		S('#categories .panel-inner').html(prehtml+html+properties);


		var li = S('#categories .grid li');
		for(var i = 0; i < li.length; i++){
			el = S(li[i]).find('.number');
			animateNumber(el,parseInt(el.attr('data')),1000,"");
		}

		this.logTime('BuildTables');

				
		//#####################
		// Build the barcharts
		this.logTime('Build barchart');
		// Define the data
		data = [];
		datapc = [];
		datarates = [];
		dataempty = [];
		var rating;
		for(rating in totals.fsa){
			if(totals.fsa[rating]){
				data.push([rating,[(totals.nofsa[rating]||0),(totals.fsa[rating]||0)]]);
				datapc.push([rating,[100*(totals.fsa[rating]||0)/(totals.fsa[rating]+totals.nofsa[rating])]]);
			}
		}
		for(r = 0; r < ratebins.length; r++){
			datarates.push([ratebins[r].key,(ratebins[r].total.total||0)]);
		}
		for(r = 0; r < ratebins.length; r++){
			dataempty.push([ratebins[r].key,100*(ratebins[r].total.empty||0)/(ratebins[r].total.total||1)]);
		}

		if(!this.charts){
			this.charts = {};
			
			// Build chart showing raw numbers in each rating
			this.charts.fsa = new S.barchart('#fsa-barchart', {
				'formatBar':function(key,val,series){ return (typeof series==="number" ? "series-"+series : ""); }
			});
			// Add events
			this.charts.fsa.on('barover', function (e) {
				// Get the bin
				var b = S(e.event.currentTarget).attr('data-index');
				var s = S(e.event.currentTarget).attr('data-index-series');

				// Remove any existing information balloon
				S('.balloon').remove();
				// Add a new information balloon
				S(S(e.event.currentTarget).find('.bar')[0]).append('<div class="balloon"><span class="rating">' + this.bins[b].key[0] + '</span>'+this.bins[b].values[1]+' matched<br />' + (this.bins[b].values[0]) + ' not matched</div>')
			});

			
			// Build chart for FSA percent matched
			this.charts.fsapc = new S.barchart('#fsa-barchart-pc', {
				'formatBar':function(key,val,series){ return (typeof series==="number" ? "series-"+series : ""); },
				'formatY': function(val){ return val+'%'; }
			});
			// Add events
			this.charts.fsapc.on('barover', function (e) {
				// Get the bin
				var b = S(e.event.currentTarget).attr('data-index');
				var s = S(e.event.currentTarget).attr('data-index-series');

				// Remove any existing information balloon
				S('.balloon').remove();
				// Add a new information balloon
				S(S(e.event.currentTarget).find('.bar')[0]).append('<div class="balloon"><span class="rating">' + this.bins[b].key[0] + '</span>' + (this.bins[b].values[0]).toFixed(1) + '% matched</div>')
			});

			
			// Build chart for rates values
			this.charts.rates = new S.barchart('#rates-barchart', {
				'formatBar':function(key,val,series){ return (typeof series==="number" ? "series-"+series : ""); },
				'formatX': function(val){ return '&pound;'+val; }
			});
			
			// Build chart for occupied percents
			this.charts.empty = new S.barchart('#empty-barchart', {
				'formatBar':function(key,val,series){ return (typeof series==="number" ? "series-"+series : ""); },
				'formatY':function(val){ return val+'%'; },
				'formatX': function(val){ return '&pound;'+val; }
			});
		}
		if(!data || data.length==0) data = [['0',0],['1',0],['2',0],['3',0],['4',0],['5',0]];
		if(!datapc || datapc.length==0) datapc = [['0',0],['1',0],['2',0],['3',0],['4',0],['5',0]];
		//  draw the charts
		this.charts.fsa.setData(data).setBins({'update':true}).draw();
		this.charts.fsapc.setData(datapc).setBins({'update':true}).draw();
		this.charts.rates.setData(datarates).setBins().draw();
		this.charts.empty.setData(dataempty).setBins().draw();
		S('#rates .businesses').html(totals.n.toLocaleString());
		S('#rates .emptyvalue').html('&pound;'+Math.round(totals.emptyvalue).toLocaleString());
		S('#rates .empty').html(((100*totals.empty/totals.n) || 0).toFixed(1)+'%');
		
		
		this.logTime('Build barchart');

		this.updateMap(n,bounds);
		
		return this;
	}

	BusinessRatesExplorer.prototype.updateMap = function(n,bounds){
		
		//===========
		// Build map
		S('#map-holder').css({'display':(havedata ? 'block':'none')});
		if(n > 0){
			var _obj = this;
			// Set the map bounds
			this.map.fitBounds(L.latLngBounds(L.latLng(bounds.sw.lat,bounds.sw.lng),L.latLng(bounds.ne.lat,bounds.ne.lng)),{padding:[20,20]});
			this.markerLayer = L.markerClusterGroup({
				chunkedLoading: true,
				maxClusterRadius: 70,
				iconCreateFunction: function (cluster) {
					var markers = cluster.getAllChildMarkers();
					empty = 0;
					for(var i = 0; i < markers.length; i++){
						if(!markers[i].options.occupied) empty++;
					}
					if(empty==0) col = _obj.colours.occupied;
					else col = _obj.colours[(empty < markers.length ? 'mixed':'empty')];
					return L.divIcon({ html: '<div class="marker-group" style="background-color:'+col.bg+';color:'+col.text+'">'+markers.length+'</div>', className: '',iconSize: L.point(40, 40) });
				},
				// Disable all of the defaults:
				spiderfyOnMaxZoom: true, showCoverageOnHover: false, zoomToBoundsOnClick: true
			});
			// Add marker lists to layer
			this.markerLayer.addLayers(this.markers);
			this.markerLayer.addTo(this.map);
			
			for(a in this.areas){
				if(!this.areas[a].geojsonlayer){
					if(this.areas[a].include){
						this.areas[a].geojsonlayer = L.geoJSON(this.areas[a].data.geojson, {
							style: function (feature) {
								return {color: 'rgba(230, 0, 124,0.2)'};
							}
						}).bindPopup(function (layer) {
							return layer.feature.properties.name;
						});
						this.log.message('add ',a);
						this.areas[a].geojsonlayer.addTo(this.map);
					}
				}else{
					if(!this.areas[a].include){
						this.log.message('remove ',a);
						this.map.removeLayer(this.areas[a].geojsonlayer);
					}
				}
			}
		}

		return this;
	}
	
	// Return array of string values, or NULL if CSV string not well formed.
	function CSVtoArray(text) {
		var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
		var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
		// Return NULL if input string is not well formed CSV string.
		if (!re_valid.test(text)) return null;
		var a = [];					 // Initialize array to receive values.
		text.replace(re_value, // "Walk" the string using replace with callback.
			function(m0, m1, m2, m3) {
				// Remove backslash from \' in single quoted values.
				if	  (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
				// Remove backslash from \" in double quoted values.
				else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
				else if (m3 !== undefined) a.push(m3);
				return ''; // Return empty string.
			});
		// Handle special case of empty last value.
		if (/,\s*$/.test(text)) a.push('');
		return a;
	};

	function CSV2JSON(data,format,start,end){

		if(typeof start!=="number") start = 1;
		var delim = ",";

		if(typeof data==="string"){
			data = data.replace(/\r/,'');
			data = data.split(/[\n]/);
		}
		if(typeof end!=="number") end = data.length;

		if(data[0].indexOf("\t") > 0) delim = /\t/;
		var header = CSVtoArray(data[0]);
		var simpleheader = JSON.parse(JSON.stringify(header));
		var line,datum,key,key2,f,i;
		var newdata = new Array();
		var lookup = {};
		// Work out a simplified (no spaces, all lowercase) version of the 
		// keys for matching against column headings.
		if(format){
			for(i in format){
				key = i.replace(/ /g,"").toLowerCase();
				lookup[key] = i+'';
			}
			for(i = 0; i < simpleheader.length; i++) simpleheader[i] = simpleheader[i].replace(/ /g,"").toLowerCase();
		}
		for(i = start; i < end; i++){
			line = CSVtoArray(data[i]);
			datum = {};
			if(line){
				for(var j=0; j < line.length; j++){
					key = header[j];
					key2 = simpleheader[j];
					if(format && lookup[key2]){
						key = lookup[key2];
						f = format[key];
						if(format[key].name) key = format[key].name;
						if(f.format=="number"){
							if(line[j]!=""){
								if(line[j]=="infinity" || line[j]=="Inf") datum[key] = Number.POSITIVE_INFINITY;
								else datum[key] = parseFloat(line[j]);
							}
						}else if(f.format=="eval"){
							if(line[j]!="") datum[key] = eval(line[j]);
						}else if(f.format=="date"){
							if(line[j]){
								line[j] = line[j].replace(/^"/,"").replace(/"$/,"");
								try {
									datum[key] = new Date(line[j]);
								}catch(err){
									this.log.warning('Invalid date '+line[j]);
									datum[key] = new Date('0001-01-01');
								}
							}else datum[key] = null;
						}else if(f.format=="boolean"){
							if(line[j]=="1" || line[j]=="true" || line[j]=="Y") datum[key] = true;
							else if(line[j]=="0" || line[j]=="false" || line[j]=="N") datum[key] = false;
							else datum[key] = null;
						}else{
							datum[key] = (line[j][0]=='"' && line[j][line[j].length-1]=='"') ? line[j].substring(1,line[j].length-1) : line[j];
						}
					}else{
						datum[key] = (line[j][0]=='"' && line[j][line[j].length-1]=='"') ? line[j].substring(1,line[j].length-1) : line[j];
					}
				}
				newdata.push(datum);
			}
		}
		return newdata;
	}

	// Function to clone a hash otherwise we end up using the same one
	function clone(hash) {
		var json = JSON.stringify(hash);
		var object = JSON.parse(json);
		return object;
	}

	// A non-jQuery dependent function to get a style
	function getStyle(el, styleProp) {
		if (typeof window === 'undefined') return;
		var style;
		if(!el) return style;
		if (el.currentStyle) style = el.currentStyle[styleProp];
		else if (window.getComputedStyle) style = document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
		if (style && style.length === 0) style = null;
		return style;
	}

	function makeMarker(colour){
		return L.divIcon({
			'className': '',
			'html':	'<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="7.0556mm" height="11.571mm" viewBox="0 0 25 41.001" id="svg2" version="1.1"><g id="layer1" transform="translate(1195.4,216.71)"><path style="fill:%COLOUR%;fill-opacity:1;fill-rule:evenodd;stroke:#ffffff;stroke-width:0.1;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;stroke-miterlimit:4;stroke-dasharray:none" d="M 12.5 0.5 A 12 12 0 0 0 0.5 12.5 A 12 12 0 0 0 1.8047 17.939 L 1.8008 17.939 L 12.5 40.998 L 23.199 17.939 L 23.182 17.939 A 12 12 0 0 0 24.5 12.5 A 12 12 0 0 0 12.5 0.5 z " transform="matrix(1,0,0,1,-1195.4,-216.71)" id="path4147" /><ellipse style="opacity:1;fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:1.428;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" id="path4173" cx="-1182.9" cy="-204.47" rx="5.3848" ry="5.0002" /></g></svg>'.replace(/%COLOUR%/,colour||"#000000"),
			iconSize:	 [25, 41], // size of the icon
			shadowSize:	 [41, 41], // size of the shadow
			iconAnchor:	 [12.5, 41], // point of the icon which will correspond to marker's location
			shadowAnchor: [12.5, 41],	// the same for the shadow
			popupAnchor:	[0, -41] // point from which the popup should open relative to the iconAnchor
		});
	}

	function getSortedKeys(obj) {
		var keys = []; for(var key in obj) keys.push(key);
		return keys.sort(function(a,b){return obj[b]-obj[a]});
	}

	// shim layer with setTimeout fallback
	window.requestAnimFrame = (function(){
		return  window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function( callback ){ window.setTimeout(callback, 1000 / 60); };
	})();
	function animateNumber(el,val,duration,units){

		if(typeof val!=="number"){
			val = el.html();
			if(val) val = parseFloat(val);
			el.html('');
		}
		if(!units) units = "";
		var start = new Date();
		var v;
		function frame(){
			var now = new Date();
			// Set the current time in seconds
			var f = (now - start)/duration;
			if(f < 1){
				v = (Math.round(val*f)).toLocaleString();
				el.html(units+v);
				requestAnimFrame(frame);
			}else{
				el.html(units+(val).toLocaleString());
			}
		}

		if(typeof val==="number") frame();
		return;			
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
	explorer = new BusinessRatesExplorer();

});
