/*
TODO:
- map the letter frequency to morse code and get it to choose, function of random dice type thing
- get rhythmic stuff working on the synth level
- figure out what to do melodically; maybe use the textstatistics to determine melodic properties


/**glob**/
var curText = "";
var curStats;
var morseList = [];
var beatMult = 1;

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
		//$("#poetry_morse").val(encode(curText));
		morseList = encode(curText);
		$("#poetry_morse").val(morseList.toString());
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
	
	//initial vars + sounds
	var msec = timbre.timevalue("BPM120 L8");
	var env = T("perc", {a:50, r:1000});
	var oscenv = T("OscGen", {wave:"pulse", env:env, mul:0.15}).play();
	
	//control variables
	var curMorse = [];
	var wordFinished = 1;
	var secondBeat = 0;
	
	//metronome of bangs
	T("interval", {interval:msec*beatMult}, function() {
		//no trigger when secondBeat==1 and beatMult==2
		//also the setting of flags for secondBeat occur here too
		if (secondBeat == 0) {
			oscenv.noteOn(60+Math.random()*40, 64);
			//console.log("note on");
			if (beatMult == 2) {
				secondBeat = 1;
			}
		}
		else {
			secondBeat = 0;
			//console.log("set");
		}
		
		//console.log("beatMult is"+beatMult+" and secondBeat is "+secondBeat);
		
		//choosing next beat duration
		var curBeat = curMorse.pop();
		if (curBeat == ".") {
			beatMult = 1;
			console.log(".");
		}
		else {
			beatMult = 2;
			console.log("_");
		}
		//reset morse letter if necessary
		if (curMorse.length==0) {
			curMorse = morseList[Math.floor(Math.random()*morseList.length)].split(" ");	
		}
	}).start();
	
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