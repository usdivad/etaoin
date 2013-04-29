/*
TODO:
- make the scales absolute midi pitches instead of intervallic relations?
- amp clipping

- map the letter frequency to morse code and get it to choose, function of random dice type thing
- get rhythmic stuff working on the synth level
- figure out what to do melodically; maybe use the textstatistics to determine melodic properties
- have morse/pitch/etc. range increase as text you type increases. also maybe increased rhythm although that won't work for long texts.. so yeah, range is a good one of expansion. the more text you type the greater range of xyz
*/

/**glob text**/
var curText = "";
var curStats;
var morseList = ["."];
var beatMult = 1;
var soundOn = 0;
var char_count = [1,0];

//letter lists
var cons_nasal = [13,12,17,11,22]; //n,m,r,l,w
var cons_stop = [15,1,10,6,3,19,2,16] //p,b,k,g,d,t,c,q
var cons_fricative = [18,25,5,21,23,7,9] //s,z,f,v,x,h,j
var vowels = [14,20,0,4,8,24] //o,u,a,e,i,y

/**glob audio**/
//initial vars + sounds
var msec = timbre.timevalue("BPM120 L8");
var osc = T("pulse");
var env = T("perc", {a:50, r:1000});
var mul = 0.1;
var oscenv = T("OscGen", {osc:osc, env:env, mul:mul}).play();

//lists of scales
var pentatonic = [-12,-10,-8,-5,-3,0,2,4,7,9,12];
var whole = [-12,-10,-8,-6,-4,-2,0,2,4,6,8,10,12];
var bebop = [-12,-10,-8,-7,-5,-3,-2,-1,0,2,4,5,6,7,9,10,11,12]
var east = [-12,-11,-8,-7,-5,-4,-2,-1,0,1,4,5,7,8,10,11,12]

//control variables
var curMorse = ["."];
var wordFinished = 1;
var secondBeat = 0;
var freq = 60;
var curScale = pentatonic;
var note = 60;

$(document).ready(function () {
	//curText = "asdf";
	main();
});

function main() {
	/**text**/
	
	//updating info
	$("#poetry").bind("input propertychange", function() {
		curText = $("#poetry").val();
		curStats = textstatistics(curText);
		console.log(curText);
		console.log(curStats);
		char_count = analyze(curText);
		console.log(char_count);
		//$("#poetry_morse").val(encode(curText));
		morseList = encode(curText);
		$("#poetry_morse").val(morseList.toString());
		$("#fk").text("FK: "+textstatistics(curText).fleschKincaidReadingEase());
	});
	
	//detect sentence completion
	$('#poetry').bind('keypress', function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 33 || code == 46 || code == 63) { //?.!
			console.log("sentence complete");
			var dice = Math.floor(Math.random()*4);
			if (dice == 0) {
				curScale = pentatonic;
				console.log("pentatonic");
			}
			else if (dice == 1) {
				curScale = whole;
				console.log("whole");

			}
			else if (dice == 2) {
				curScale = bebop;
				console.log("bebop");

			}
			else { //if (dice == 3)
				curScale = east;
				console.log("east");

			}
		}
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
	
	//metronome of bangs
	var bangs = T("interval", {interval:msec*beatMult}, function() {
	
		//setting the note
		var freq =  60;
		
		//no trigger when secondBeat==1 and beatMult==2
		//also the setting of flags for secondBeat occur here too
		if (secondBeat == 0) {
			oscenv = setOsc();
			freq = pickNote();
			oscenv.noteOn(freq, 64);
			//oscenv.noteOn(60+Math.random()*40, 64);
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
	});
	
	$("#play").click(function() {
		//oscenv.noteOn(60, 64);
		bangs.start();
	});
	$("#pause").click(function() {
		//oscenv.allNoteOff();
		bangs.stop();
	});
}

function pickNote() {
	index = Math.floor(Math.random()*curScale.length);
	note = note+curScale[index];
	//range consideration
	if (note < 48) {
		//note = Math.floor((Math.random()*12)+60);
		note += 12;
	}
	else if (note > 96) {
		//note = Math.floor((Math.random()*12)+60);
		note -= 12;
	}
	return note;
	//return 60;
}

function setOsc() {
	var numChars = 0;
	for (var i=0; i<char_count.length; i++) {
		numChars += char_count[i];
	}
	var dice = Math.floor((Math.random()*(numChars-1))+1);
	var letter;
	//var i=0;
	//while (dice > 0) {
	for (var i=0; i<char_count.length; i++) {
		if (char_count[i]>1) {
			dice = dice-char_count[i];
		}
		if (dice <= 0) {
			break;
		}
	}
	letter = i;
	console.log(letter);
	
	if (cons_nasal.indexOf(letter) >= 0) {
		console.log("nasal");
		
		env = T("perc", {a:Math.floor((Math.random()*100)+100), r:Math.floor((Math.random()*1000)+1000)});
		oscenv = T("OscGen", {osc:osc, env:env, mul:mul}).play();
	
	}
	else if (cons_stop.indexOf(letter) >= 0) {
		console.log("stop");
		
		env = T("perc", {a:Math.floor(Math.random()*50), r:Math.floor((Math.random()*900)+100)});
		oscenv = T("OscGen", {osc:osc, env:env, mul:mul}).play();
	}
	else if (cons_fricative.indexOf(letter) >= 0) {
		console.log("fricative");

		env = T("perc", {a:Math.floor((Math.random()*500)+500), r:Math.floor((Math.random()*500)+500)});
		oscenv = T("OscGen", {osc:osc, env:env, mul:mul}).play();
	}
	else { //vowels.indexOf(letter) >= 0)
		console.log("vowel");
		
		if (vowels.indexOf(letter) == 14) { //o
			osc = T("sin");
			//mul = 0.25;
		}
		else if (vowels.indexOf(letter) == 20) { //u
			osc = T("tri");
			//mul = 0.25;
		}
		else if (vowels.indexOf(letter) == 0) { //a
			osc = T("fami");
			//mul = 0.25;
		}
		else if (vowels.indexOf(letter) == 4) { //e
			osc = T("saw");
			//mul = 0.2;
		}
		else { //if (vowels.indexOf(letter) == 8) { //i
			osc = T("pulse");
			//mul = 0.15;
		}
		/*else if (vowels.indexOf(letter) == 24) { //y
		
		}*/
		
		oscenv = T("OscGen", {osc:osc, env:env, mul:mul}).play();
	}

	var theOsc = T("OscGen", {osc:osc, env:env, mul:0.15}).play()
	
	return theOsc;
}