require('dotenv').config();

const bodyParser = require('body-parser');
const chalk = require('chalk');
const fs = require('fs');

const Keyv = require('keyv');
const storage = new Keyv(process.env.keyvString);

const Express = require('express');
const { generateKeyPair } = require('crypto');
const app = new Express();

app.use(Express.static(`${__dirname}/web`));

var jsonParser = bodyParser.json({ extended: false });

app.get('/:id', async (req, res)=>{
	var r = await storage.get(req.params.id);
	if(r === undefined){
		res.status(404).send('404 Not Found');
		return;
	}
	res.redirect(r);
});

app.post('/api/shorten', jsonParser, async (req, res) => {
	if (typeof (req.body.link) !== 'string' || !req.body.link.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)) {
		debug(`Invalid link: ${typeof (req.body.link) !== 'string' ? 'Not specified' : req.body.link}.`);
		res.json({
			error: true
		});
		return;
	}
	var link = req.body.link;
	var shortened = await shorten(link);
	res.json({
		error: false,
		shortened
	});
});

debug(`Attempting to listen on ${process.env.PORT}...`)
app.listen(process.env.PORT, () => {
	info(`Listening on ${process.env.PORT}.`);
});

async function shorten(link) {
	debug(`Trying to shorten ${link}...`);
	var alreadyExisting;
	alreadyExisting = await storage.get(link);
	if (alreadyExisting === undefined) {
		var short = await generateId();
		// Store both ways, so we can quickly check if the link has been shortened already, without having to loop through all existing links.
		await storage.set(short, link);
		await storage.set(link, short);
		alreadyExisting = short;
	} else {
		debug(`${link} has been shortened before!`);
	}
	debug(`${link} has been shortened to ${alreadyExisting}.`);
	return alreadyExisting;
}

async function generateId() {
	var exists = true;
	var attempt;
	while (exists) {
		attempt = Math.random().toString(36).substring(7);
		debug(`Checking newly generated id: ${attempt}.`);
		exists = await storage.get(attempt) !== undefined;
	}
	return attempt;
}

function info(message) {
	console.log(chalk.blue(message));
}

function debug(message) {
	if (!process.env.debug) return;
	console.log(chalk.yellow(message));
}