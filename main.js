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
	});
	
	/**audio**/
	var synth = T("saw");
	$("#play").click(function() {
		synth.play();
	});
	$("#pause").click(function() {
		synth.pause();
	});
}

function getStats() {
	var s = "";
	
}