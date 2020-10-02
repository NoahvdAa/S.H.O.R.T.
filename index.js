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
	
	//Update hit count by 1 everytime the someone hits the shortened link
	var hitProp = `hit-${req.params.id}`
	var hitCount = await storage.get(hitProp)
	//Check if the hit prop exist for the link(as the older existing links wont have the hit prop)
	if(hitCount === undefined){
		//Edge Case: For the older existing links create hit prop counter
		await storage.set(hitProp, 1);
	} else {
		hitCount++;
		await storage.set(hitProp, hitCount);
	}

	debug(`This link has been hit: ${hitCount} times.`)

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
		
		//Creating an initial hit counter for the link
		var hitProp = `hit-${short}`
		await storage.set(hitProp, 0);

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