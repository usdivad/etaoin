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
var curText = "Z";
var curStats;
var morseList = ["_ _ . ."];
var bass_morseIndex = 0;
var beatMult = 1;
var bass_beatMult = 1;
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
var mul = 0.3;
var oscenv = T("OscGen", {osc:osc, env:env, mul:mul}).play();

var bass_oscenv = T("OscGen", {osc:"pulse", env:T("perc", {a:10, r:100}), mul:0.1}).play();
bass_oscenv.wave = "pulse";
var bassFreq = 60;

//lists of scales
/*
var pentatonic = [-12,-10,-8,-5,-3,0,2,4,7,9,12];
var whole = [-12,-10,-8,-6,-4,-2,0,2,4,6,8,10,12];
var bebop = [-12,-10,-8,-7,-5,-3,-2,-1,0,2,4,5,6,7,9,10,11,12]
var east = [-12,-11,-8,-7,-5,-4,-2,-1,0,1,4,5,7,8,10,11,12]
*/

/*
var pentatonic = [48,50,52,55,57,60,62,64,67,69,72,74,76,79,81,84];
var dorian = [48,50,51,53,55,57,58,60,62,63,65,67,69,70,72,74,75,77,79,81,82,84];
var whole = [48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84];
var lydian = [48,50,52,54,55,57,59,60,62,64,66,67,69,71,72,74,76,78,79,81,83,84];
var bebop = [48,50,52,53,54,55,57,58,59,60,62,64,65,66,67,69,70,71,72,74,76,77,78,79,81,82,83,84];
var east = [48,49,52,53,55,56,58,59,60,61,64,65,67,68,70,71,72,73,76,77,79,80,82,83,84];
*/

var pentatonic = [60,62,64,67,69,72,74,76,79,81,84];
var dorian = [60,62,63,65,67,69,70,72,74,75,77,79,81,82,84];
var whole = [60,62,64,66,68,70,72,74,76,78,80,82,84];
//var lydian = [60,62,64,66,67,69,71,72,74,76,78,79,81,83,84];
var lydian = [60,62,64,66,67,69,70,72,74,76,78,79,81,82,84]; //altered
var bebop = [60,62,64,65,66,67,69,70,71,72,74,76,77,78,79,81,82,83,84];
var east = [60,61,64,65,67,68,70,71,72,73,76,77,79,80,82,83,84];

//control variables
var curMorse = ["."];
var bass_curMorse = ["."];
var wordFinished = 1;
var secondBeat = 0;
var bass_secondBeat = 0;
var freq = 60;
var curScale = pentatonic;
var note = 60;
var stepMax = 3;

//percussion
var perc_buffer = 0;
var perc_freq = 14080;
var perc = T("fnoise", {freq:14080, mul:0.15});
//var perc = T("noise", {mul:0.15});

//the octave thing
var effect_oscenv = T("OscGen", {osc:"saw", env:T("perc", {a:2500, r:5000}), mul:0.1}).play();
effect_oscenv.wave = "saw";

//call main
$(document).ready(function () {
	//curText = "asdf";
	main();
});

function main() {
	/**text**/
	
	//updating info
	$("#poetry").bind("input propertychange", function() {
		curText = $("#poetry").val();
		if (curText == "") {
			$("#poetry").val("Z");
			curText = "Z";
			morseList = ["_ _ . ."];
		}
		curStats = textstatistics(curText);
		console.log(curText);
		console.log(curStats);
		char_count = analyze(curText);
		console.log(char_count);
		curScale = pickScale(char_count);
		//$("#poetry_morse").val(encode(curText));
		morseList = encode(curText);
		$("#poetry_morse").val(morseList.toString());
		$("#fk").text("FK: "+textstatistics(curText).fleschKincaidReadingEase());
	});
	
	//detect keypress: combination aeiou and etaoin -> ouaneit
	$("#poetry").bind("keypress", function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		console.log("code is"+code);
		if (code == 79 || code == 111) { //o
			perc_freq = 220;
		}
		else if (code == 85 || code == 117) { //u
			perc_freq = 440;
		}
		else if (code == 65 || code == 97) { //a
			perc_freq = 880;
		}
		else if (code == 78 || code == 110) { //n
			perc_freq = 1760;
		}
		else if (code == 69 || code == 101) { //e
			perc_freq = 3520;
		}
		else if (code == 73 || code == 105) { //i
			perc_freq = 7040;		
		}
		else if (code == 84 || code == 116) { //t
			perc_freq = 14080;
		}
		//sentence completions
		else if (code == 33) { // ! - octave above bass
			console.log("!");
			var freak = bassFreq + 12;
			effect_oscenv.noteOn(freak, 64);
		}
		else if (code == 46) { // . - same octave
			var freak = bassFreq + 0;
			effect_oscenv.noteOn(freak, 64);
		}
		else if (code == 63) { // ? - anywhere in between!
			var freak = bassFreq + Math.random()*12;
			effect_oscenv.noteOn(freak, 64);
		}
		perc_buffer++;
		perc.freq = perc_freq;
	});
	
	//detect sentence completion
	/*$('#poetry').bind('keypress', function(e) {
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
	});*/


	
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
			//oscenv = setOsc();
			setOsc();
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
	
	//metronome for bass bangs
	//note the bass ITERATES through the entire morse list, not random like the above
	//also it's at a rate of 1:3
	var bass_bangs = T("interval", {interval:msec*beatMult*3}, function() {
	
		//setting the note
		var freq =  60;
		
		//no trigger when secondBeat==1 and beatMult==2
		//also the setting of flags for secondBeat occur here too
		if (bass_secondBeat == 0) {
			//oscenv = setOsc();
			//setOsc();
			freq = pickNote();
			bassFreq = freq;
			bass_oscenv.noteOn(freq-24, 64);
			//oscenv.noteOn(60+Math.random()*40, 64);
			//console.log("note on");
			if (bass_beatMult == 2) {
				bass_secondBeat = 1;
			}
		}
		else {
			bass_secondBeat = 0;
			//console.log("set");
		}
		
		//console.log("beatMult is"+beatMult+" and secondBeat is "+secondBeat);
		
		//choosing next beat duration
		var curBeat = bass_curMorse.pop();
		if (curBeat == ".") {
			bass_beatMult = 1;
			bass_oscenv.env = T("perc", {a:10, r:Math.floor((Math.random()*100)+90)})
			console.log(".");
		}
		else {
			bass_beatMult = 2;
			bass_oscenv.env = T("perc", {a:10, r:Math.floor((Math.random()*700)+900)})
			console.log("_");
		}
		//reset morse letter if necessary
		if (bass_curMorse.length<=0) {
			bass_curMorse = morseList[bass_morseIndex].split(" ");
			bass_morseIndex++;
			if (bass_morseIndex >= morseList.length-1) {
				bass_morseIndex = 0;
			}
		}
	});
	
	//percussion bangs
	var perc_bangs = T("interval", {interval:msec*beatMult/4}, function() {
		var coin = Math.random();
		if (coin > 0.5) {
			//silence = wait for next sound
			perc.pause();
			if (perc_buffer > 0) {
				perc_buffer--;
			}
			else {
				perc_buffer = 0;
			}
		}
		else {
			
			if (perc_buffer > 0) {
				perc.play();
			}
		}
	});
	
	$("#play").click(function() {
		//oscenv.noteOn(60, 64);
		bangs.start();
		bass_bangs.start();
		perc_bangs.start();
	});
	$("#pause").click(function() {
		//oscenv.allNoteOff();
		bangs.stop();
		bass_bangs.stop();
		perc_bangs.stop();
	});
}

//chooses note from the scale array, next note to play
//used in both bass and "default" synths
function pickNote() {
	/*index = Math.floor(Math.random()*curScale.length);
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
	*/
	
	//we move at most "stepMax" scale degrees away
	var prevNoteIndex = curScale.indexOf(note);
	var index = 0;
	if (prevNoteIndex<0) {
		note = curScale[Math.floor(Math.random()*curScale.length)];
	}
	else {
		var step = Math.floor(Math.random()*stepMax);
		var up_down = Math.random();
		if (up_down>0.5) { //up
			index = prevNoteIndex + step;
			if (index >= curScale.length-1) { //prevent arrayindexoutofbounds
				//index = prevNoteIndex - step;
				index = curScale.length - step;
			}
		}
		else { //down
			index = prevNoteIndex - step;
			if (index < 0) { //prevent arrayindexoutofbounds
				//index = prevNoteIndex + step;
				index = 0 + step;
			}
		}
	}
	note = curScale[index];
	return note;
	//return 60;
}

//picks scale based on the zipf values of etaoin
function pickScale(etaoin) {
	count_e = etaoin[4];
	count_t = etaoin[19];
	count_a = etaoin[0];
	count_o = etaoin[14];
	count_i = etaoin[8];
	count_n = etaoin[13];
	
	//var i = arr.indexOf(Math.max.apply(Math, arr));
	
	var expectedFreq = [12.702,9.056,8.167,7.057,6.966,6.749];
	var curFreq = [count_e, count_t, count_a, count_o, count_i, count_n];
	var quality = [0,0,0,0,0];
	
	for (var i=0; i<expectedFreq.length; i++) {
		quality[i] = curFreq[i]/expectedFreq[i];
	}
	
	var commonest = quality.indexOf(Math.max.apply(Math, quality));
	
	if (commonest == 0) { //e
		$("#sc").text("pentatonic");
		return pentatonic;
	}
	else if (commonest == 1) { //t
		$("#sc").text("dorian");
		return dorian;
	}
	else if (commonest == 2) { //a
		$("#sc").text("whole");
		return whole;
	}
	else if (commonest == 3) { //o
		$("#sc").text("lydian");
		return lydian;
	}
	else if (commonest == 4) { //i
		$("#sc").text("bebop");
		return bebop;
	}
	else if (commonest == 5) { //n
		$("#sc").text("east");
		return east;
	}
}

//vowels and consonants determine the timbre
//this is a random vowel/consonant being chosen
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
	else if (vowels.indexOf(letter) >= 0) {
		console.log("vowel");
		
		if (vowels.indexOf(letter) == 0) { //o
			//osc = T("sin");
			oscenv.wave = "sin";
			oscenv.mul = 0.5;
			console.log("o=sin");
		}
		else if (vowels.indexOf(letter) == 1) { //u
			//osc = T("tri");
			oscenv.wave = "tri";
			oscenv.mul = 0.5;
			console.log("u=tri");
		}
		else if (vowels.indexOf(letter) == 2) { //a
			//osc = T("fami");
			oscenv.wave = "fami";
			oscenv.mul = 0.5;
			console.log("a=fami");
		}
		else if (vowels.indexOf(letter) == 3) { //e
			//osc = T("saw");
			oscenv.wave = "tri";
			oscenv.mul = 0.4;
			console.log("e=tri");
		}
		else if (vowels.indexOf(letter) == 4) { //i
			//osc = T("pulse");
			oscenv.wave = "fami";
			oscenv.mul = 0.3;
			console.log("i=fami");
		}
		/*else if (vowels.indexOf(letter) == 24) { //y
		
		}*/
		
		//oscenv = T("OscGen", {osc:osc, env:env, mul:mul}).play();
	}

	//var theOsc = T("OscGen", {osc:osc, env:env, mul:mul}).play();
	//oscenv = T("OscGen", {osc:osc, env:env, mul:mul}).play();
	
	//return theOsc;
}