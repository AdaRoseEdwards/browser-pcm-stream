/* global Promise, BinaryClient, Int16Array */
/* eslint no-var: 0 */

'use strict';

var recording = false;

function convertoFloat32ToInt16(buffer) {
	var l = buffer.length;
	var buf = new Int16Array(l)

	while (l--) {
		buf[l] = buffer[l] * 0xFFFF; //convert to 16 bit
	}
	return buf.buffer
}

window.startRecording = function () {

	var client = new BinaryClient('ws://localhost:9001');
	recording = true;
	var stream;

	Promise.all([
		new Promise(function (resolve) {
			if (!navigator.getUserMedia)
				navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
				navigator.mozGetUserMedia || navigator.msGetUserMedia;

			if (navigator.getUserMedia) {
				navigator.getUserMedia({
					audio: true
				}, resolve, function () {
					alert('Error capturing audio.');
				});
			} else alert('getUserMedia not supported in this browser.');
		}),
		new Promise(function (resolve) {
			client.on('open', resolve);
		}),
	]).then(function (e) {

		var AudioContext = window.AudioContext || window.webkitAudioContext;
		var context = new AudioContext();
		console.log(context.sampleRate);

		// the sample rate is in context.sampleRate
		var audioInput = context.createMediaStreamSource(e[0]);

		var bufferSize = 256;
		var recorder = context.createScriptProcessor(bufferSize, 1, 1);

		stream = client.createStream();
		recorder.onaudioprocess = function (e) {
			if (!recording) return;
			console.log('recording');
			var left = e.inputBuffer.getChannelData(0);
			stream.write(convertoFloat32ToInt16(left));
		}

		audioInput.connect(recorder)
		recorder.connect(context.destination);
	});
}