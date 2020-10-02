function shorten() {
	var linkToShorten = document.getElementById("link").value;
	if (!linkToShorten.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)) {
		document.getElementById("link").classList.add("uk-form-danger");
		alert("That is not a valid url!");
		return;
	}
	hide("step1");
	show("step2");

	fetch("/api/shorten", {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			link: linkToShorten
		})
	}).then(async function (response) {
		var data = await response.json();
		// Trigger the error code below.
		if(data.error) throw new Error();
		document.getElementById("short").innerText = window.location.host + "/" + data.shortened;
		hide("step2");
		show("step3");
	}).catch(function (e) {
		alert("Something went wrong. Please try again.");
		hide("step2");
		show("step1");
	});
}

function checkHits() {
	document.getElementById("short").innerText = "";
	document.getElementById("id").classList.remove("uk-form-danger");
	var linkId = document.getElementById("id").value;

	fetch("/api/hits/" + linkId, {
		method: "GET"
	}).then(async function (response) {
		var data = await response.json();
		// Trigger the error code below.
		if(data.error) throw new Error();
		document.getElementById("short").innerText = "Your link has been hit " + data.hits + " times.";
	}).catch(function (e) {
		document.getElementById("id").classList.add("uk-form-danger");
		alert("Link ID does not exist. Please try again.");
	});
}

function again(){
	hide("step3");
		show("step1");
}

function show(id) {
	document.getElementById(id).style.display = "block";
}

function hide(id) {
	document.getElementById(id).style.display = "none";
}