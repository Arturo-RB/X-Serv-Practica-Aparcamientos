var collection = new Object ();
var collectionUser = new Object ();
var apiKey = 'AIzaSyB5ORxXYKSY7JIUimdTnZ16dEL5pQhX_80';
var googleId = [];
var name = "";
var parks_user = {};

function handleClientLoad() {
	gapi.client.setApiKey(apiKey);
}

function show_profiles(user_id){
	gapi.client.load('plus', 'v1', function() {
		var request = gapi.client.plus.people.get({
			'userId': user_id
		});
		request.execute(function(resp) {
			var heading = document.createElement('h4');
			var image = document.createElement('img');
			image.src = resp.image.url;
			heading.appendChild(image);
			heading.appendChild(document.createTextNode(resp.displayName));

			document.getElementById('perfil').appendChild(heading);
		});
	});

}

// Load the API and make an API call.  Display the results on the screen.
function makeApiCall(user_id, mode) {
	gapi.client.load('plus', 'v1', function() {
		var request = gapi.client.plus.people.get({
			'userId': user_id
		});
		request.execute(function(resp) {
			var heading = document.createElement('h4');
			var image = document.createElement('img');
			image.src = resp.image.url;
			heading.appendChild(image);
			heading.appendChild(document.createTextNode(resp.displayName));

			if (mode == "new"){
				collectionUser[name].push(user_id);
			}

			document.getElementById('profile').appendChild(heading);
		});
	});
}

function google_user(){
	collectionUser[name].forEach(function(n){
		makeApiCall(n,"null");
	});
}

function show_parking(){

	var parking = parkings[$(this).attr('no')];
	var lat = parking.location.latitude;
	var lon = parking.location.longitude;
	var url = parking.relation;	
	name = parking.title;
	var addr = parking.address['street-address'];
	var desc = parking.organization['organization-desc'];	
	var marker = L.marker([lat, lon]).addTo(map)
	var web = '<a href="' + url + '"><u><i>' + name.split(".")[1] + '</i></u></a>';
	var c = marker.bindPopup(web).openPopup();
	if($(this).css("color")=="rgb(0, 128, 0)"){
		map.removeLayer(marker);
		$($(this)).css("color","rgb(51, 51, 51)");
	}else{
		$($(this)).css("color","rgb(0, 128, 0)");
	}
	marker.on("popupclose", function(){
		map.removeLayer(marker);
	})
	map.setView([lat, lon], 15);
	$('#parking_name').html('<a href="' + url + '"><h2><u>' + name + '</h2></u>');
	$('#street').html('<p>'+addr+'</p>');
	$('#desc').html('<p>' + desc + '</p>');
	$('#name_prof').html('<h2>' + name + '</h2>' + '</p>' + desc);
	$('#carousel_park').empty();
	$.ajax({   
	    url: 'https://commons.wikimedia.org/w/api.php?format=json&action=query&'
	    		+'generator=geosearch&ggsprimary=all&ggsnamespace=6&ggsradius=500&'
	    		+'ggscoord='+lat+'|'+lon+'&ggslimit=10&prop=imageinfo&iilimit=1&'
	    		+'iiprop=url&iiurlwidth=200&iiurlheight=200&callback=?',
	    jsonp: "callback",
		dataType: "jsonp",
	    success : function(json) {
	  		var item = json.query.pages;
	  		if(item != null){
	  			for (var photos in item){
	  				$('#carouselIndicators').carousel();		            
		            $('#carousel_park').append('<div class="item"><img src="' + item[photos].imageinfo[0].thumburl + '"></div>');
		            $('.item').first().addClass('active')
		        }
	  		}
	    		     
	    }     
	});

	$("#profile").empty();
	google_user();
	
};

function get_parkings(){
	$.getJSON("json/aparcamientos.json", function(data) {
		$('#get').html('');
		parkings = data.graph
		var list = '<p>parkings found: ' + parkings.length
		 + ' (click on any of them for details)</p>'
		list = list + '<ul>'
		for (var i = 0; i < parkings.length; i++) {
			list = list + '<li no=' + i + '>' + parkings[i].title.split(".")[1] + '</li>';
			var googleplus = [];
			collectionUser[parkings[i].title] = googleplus;
		}
		list = list + '</ul>';
		$('#list').html(list);
		$('li').click(show_parking);
		$('#list li').draggable({revert:true,appendTo:"body",helper:"clone"});
	});
};

function server() {
    try {
    	var host = "ws://localhost:80/";
        console.log("Host:", host);

        var s = new WebSocket(host);

        s.onopen = function(e) {
            console.log("Socket opened.");
        };

        s.onclose = function(e) {
            console.log("Socket closed.");
        };
        s.onmessage = function(e){

        	if(googleId.includes(e.data)){
				if(googleId.length==20){
					s.close();
				}
				return;
			}
			googleId.push(e.data);
        };

        s.onerror = function(e) {
            console.log("Socket error:", e);
        };

    } catch (ex) {
        console.log("Socket exception:", ex);
    }
}


$(document).ready(function() {
	map = L.map('mapid').setView([40.4175, -3.708], 11);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	$("#get").click(get_parkings);


	$("#form_col").submit(function(event) {
		event.preventDefault();
		var new_col = $("#date")[0].value;
		
		$("#date")[0].value = "";
		
		if (new_col == ""){ 
			return;
		}

		$("#attr ul").append("<li>" + new_col + "</li>");
		var aparc = [];
		collection[new_col] = aparc;

		$("#attr").click(function(event){
			var coll = event.target.textContent;
			$("#name_col ul").html(coll);
			$("#list_aparc ul").html("");
			var aparcamiento;
			collection[coll].forEach(function(n){
				aparcamiento = n.title;
				$("#list_aparc ul").append("<li>" + aparcamiento + "</li>");
			});
		});
	});

	$("#list_aparc").droppable({
		accept: "#list li",
		activeClass: "ui-state-hover",
		hoverClass: "ui-state-active",
		drop: function(event, ui) {
			var name = $("#name_col")[0].textContent;

			if (name == ""){
				return;
			}

			var no = ui.draggable[0].attributes[0].value;
			var aparcamiento = parkings[no].title;
			collection[name].push(parkings[no]);
			$("#list_aparc ul").append("<li>" + aparcamiento + "</li>");
		}
	});

	$("#profile").droppable({
		accept: "#perfil li",
		activeClass: "ui-state-hover",
		hoverClass: "ui-state-active",
		drop: function(event, ui) {
			var name = $("#name_prof")[0].textContent;

			if (name == ""){
				return;
			}

			var no = ui.draggable[0].attributes[0].value;
			var users = googleId[no];
			alert(users);
			CollectionUser[name].push(googleId[no]);
			$("#profile ul").append("<li>" + users + "</li>");
		}
	});


	$("#save").click(function(event){
		var token = $("#token_save").val();
		var repo = $("#repo_save").val();
		var file = $("#file_save").val();
		var github = new Github({token:token,auth:"oauth"});
		var texto = JSON.stringify(collection);
		var repository = github.getRepo("Arturo-RB", repo);
		repository.write("master", file, texto, "file", function(err){});
	});


	$("#load").click(function(event){
		var token = $("#token_load").val();
		var repo = $("#repo_load").val();
		var file = $("#file_load").val();https://developers.google.com/apis-explorer/#p/
		var github = new Github({token:token,auth:"oauth"});
		var repository = github.getRepo("Arturo-RB", repo);

		var url = "https://api.github.com/repos/Arturo-RB/" + repo + "/contents/" + file;
		$.getJSON(url).done(function(data){
			var json_parse = JSON.parse(decodeURIComponent(escape(atob(data.content))));
			
			$.each(json_parse,function(key,value){
				collection[key] = value;
				console.log(key);
				$("#attr ul").append("<li>" + key + "</li>");
			});

			$("#attr li").click(function(event){
				var coll = event.target.textContent;
				$("#name_col").html(coll);
				$("#list_aparc ul").html("");
				var hotel;
				collection[coll].forEach(function(n){
					hotel = n.title;
					$("#list_aparc ul").append("<li>" + hotel + "</li>");
				});
			});
		});
	});

	

	$("#usuarios").click(function(event) {
		server();
		$('#perfil').empty();

		for(i = 0; i < googleId.length; i++){
			show_profiles(googleId[i]);
		}	

		$('#perfil').draggable({stack:"#profile",revert:true,containment:"document", appendTo:"body",helper:"clone"});


	});

	$("#conectar").click(function(event) {
		
		for(i = 0; i < 4; i++){
			makeApiCall(googleId[i], "new");
		}	
	});
		
	
	
});
