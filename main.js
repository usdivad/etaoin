
$(document).ready(function () {
	var curText = "";
	var curStats;
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