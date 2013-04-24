/*
TODO:
- map the letter frequency to morse code and get it to choose, function of random dice type thing
- get rhythmic stuff working on the synth level
- figure out what to do melodically; maybe use the textstatistics to determine melodic properties


/**glob**/
var curText = "";
var curStats;

$(document).ready(function () {
	//curText = "asdf";
	main();
});

function main() {
	/**text**/
	$("#poetry").bind("input propertychange", function() {
		curText = $("#poetry").val();
		curStats = textstatistics(curText);
		console.log(curText);
		console.log(curStats);
		console.log(analyze(curText));
		$("#poetry_morse").val(encode(curText));
		$("#fk").text("FK: "+textstatistics(curText).fleschKincaidReadingEase());
	});
	
	/**audio**/
	/*
	var synth = T("saw");
	$("#play").click(function() {
		synth.play();
	});
	$("#pause").click(function() {
		synth.pause();
	});
	*/
	var env = T("perc", {a:50, r:1000});
	var oscenv = T("OscGen", {wave:"pulse", env:env, mul:0.15}).play();
	$("#play").click(function() {
		oscenv.noteOn(60, 64);
	});
	$("#pause").click(function() {
		oscenv.allNoteOff();
	});
}

function getStats() {
	var s = "";
	
}