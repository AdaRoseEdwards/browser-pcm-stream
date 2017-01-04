'use strict';
/* eslint-env es6 */

const express = require('express');
const binaryServer = require('binaryjs').BinaryServer;
const lame = require('lame');
const PassThrough = require('stream').PassThrough;

const port = process.env.PORT || 3700;
const app = express();

app.use(express.static(__dirname + '/public'));

let out = new PassThrough();

app.get('/', function(req, res){
	res.render('index');
});

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", '*');
	res.header("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.get('/stream.mp3', function (req, res) {

	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	res.header('Expires', '-1');
	res.header('Pragma', 'no-cache');

	res.writeHead(200, {
		'Transfer-Encoding': 'chunked',
		'Content-Type': 'audio/mpeg',
		'Accept-Ranges': 'bytes'
	});

	out.on('data', function (data) {
		console.log('data');
		res.write(data);
	});

});

app.listen(port);

console.log('server open on port ' + port);
const myBinaryServer = binaryServer({port: 9001});

myBinaryServer.on('connection', function(client) {
	console.log('new connection');
	client.on('stream', function (stream, meta) {

		console.log('new stream');
		const encoder = new lame.Encoder({
			// input
			channels: 1,
			sampleRate: 44100,
			bitDepth: 16,

			// output
			bitRate: 128,
			outSampleRate: 22050,
			mode: lame.MONO // STEREO (default), JOINTSTEREO, DUALCHANNEL or MONO
		});

		stream.pipe(encoder);
		encoder.on('data', function (data) {
			out.write(data);
		});
	});
});
