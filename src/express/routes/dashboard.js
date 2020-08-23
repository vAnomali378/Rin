const router = require('express').Router();
const fs = require('fs');
const dashboard = fs.readFileSync(__dirname+'/dashboard.html');
const sqlite3 = require('sqlite3').verbose();
let logDB = new sqlite3.Database('./databases/logs.db', (err) => {
	if(err)
		throw err;
});

const perms = require('../../utils').permissionsFlags;

let warningsDB = new sqlite3.Database('./databases/warnings.db', (err) => {
	if(err)
		throw err;
});

let handlerDB = new sqlite3.Database('./databases/handler.db', (err) => {
	if(err)
		throw err;
});

async function fetchPerms(guild, user){
	//console.log((guild.members.cache.get(user) || await guild.members.fetch(user)))
	return guild.members.cache.get(user).permissions.bitfield||0;
}

const {run, get, all} = require('../../utils').asyncDB;

let permsCheck = perms.kick_members | perms.ban_members | perms.administrator | perms.manage_guild | perms.manage_messages;

router.get('/', async (req, res)=>{
	if(!req.user)
		return res.render('error', {req: req, title: '403', content: 'You must be logged in to see this, you can login at the top right.'});
	let guilds = '';
	req.user.guilds.forEach(g=>{
		let guild = client.guilds.cache.get(g.id);
		if(!guild||fetchPerms(req.user.discordID)&permsCheck) return;
		const icon = guild.iconURL({size: 128});
		guilds+=`<li>${icon?`<img src="${icon}" />`:''}<a href="/dashboard/${guild.id}/">${guild.name}</a></li>`
	});
	let content = `<h1>Available dashboards</h1><hr /><ul class="guilds">${guilds}</ul>`;
	res.render('index', {req: req, content, title: 'Dashboard'})
});

router.get('/:guild/', (req, res)=>{
	let guild = client.guilds.cache.get(req.params.guild);
	if(!guild) return res.render('error', {req: req, title: '404', content: 'Guild not found'});
	res.redirect(`/dashboard/${req.params.guild}/settings`);
});

router.get('/:guild/:page/', (req, res)=>{
	let guild = client.guilds.cache.get(req.params.guild);
	if(!guild) return res.render('error', {req: req, title: '404', content: 'Guild not found'});
	if(!req.user||!fetchPerms(guild, req.user.discordID)&permsCheck)
		return res.render('error', {req: req, title: '403', content: ' forbidden'});
	switch(req.params.page){
		case 'warnings': case 'logs': case 'settings':
			break;
		default:
			return res.render('error', {req: req, title: '404', content: 'Page not found'});
	}
	res.render('index', {req: req, content: dashboard, title: `Guild ${guild.name}`});
});

router.get('/:guild/get/:type/', async(req, res)=>{
	let guild = client.guilds.cache.get(req.params.guild);
	if(!req.user||!fetchPerms(guild, req.user.discordID)&(perms.administrator|perms.manage_guild)){
		console.log(err);
		res.status(403);
		return res.send();
	}
	switch (req.params.type){
		case 'warnings':
			warningsDB.all('SELECT id, user, moderator, reason, time, active FROM warnings WHERE guild = (?) ORDER BY time DESC;', [req.params.guild], async (err, rows)=>{
				if(err){
					console.log(err);
					res.status(500);
					return res.send();
				}
				let users = {};
				rows.forEach(async (row)=>{
					let mod = users[row.moderator]||client.users.cache.get(row.moderator)||await client.users.fetch(row.moderator)||{tag: 'Unable to fetch'};
					row.moderator = {id: row.moderator, name: mod.tag};
					let user = users[row.user]||client.users.cache.get(row.user)||await client.users.fetch(row.user)||{tag: 'Unable to fetch'};
					row.user = {id: row.user, name: user.tag};
				});
				res.send(`{"name": "${guild.name.replace(/'/g, '\'')}", "warnings": ${JSON.stringify(rows)}}`);
			});
			break;
		case 'logs':
			logDB.get('SELECT * FROM logs WHERE guild = (?);', [req.params.guild], (err, row)=>{
				if(err)
					console.log(err);
				if(!guild || !row) return res.sendStatus(404);
				res.send(`{"name":"${guild.name.replace(/'/g, '\'')}","settings":${JSON.stringify(row)}}`);
			});
			break;
		case 'settings':
			let prefix = (await get(handlerDB, 'SELECT * FROM prefixes WHERE guild = (?);', [req.params.guild])||{}).prefix||client.prefix;
			let commands = (await all(handlerDB, 'SELECT command FROM disabledCommands WHERE guild = (?);', [req.params.guild])||{})
			commands.forEach((c,i)=>commands[i] = c.command);
			res.send(`{"name":"${guild.name.replace(/'/g, '\'')}","settings":${JSON.stringify({
				prefix: prefix,
				disabled: commands
			})}}`);
			break;
	}
});

const logProperties = require('../../JSONStorage/logProperties.json');
const prefix = require('../../handler/prefix');
const logSQL = `UPDATE logs SET ${logProperties.join('=(?),')}=(?) WHERE guild=(?);`;

router.post('/:guild/save/:type/', async(req, res)=>{
	let guild = client.guilds.cache.get(req.params.guild);
	switch (req.params.type){
		case 'logs':
			if(!req.user||!fetchPerms(guild, req.user.discordID)&(perms.administrator|perms.manage_guild)){
				return res.sendStatus(403);
			}
			let args = [];
			try{
				logProperties.forEach(property => {
					args.push(req.body[property]);
				});
				args.push(req.params.guild);
			}catch{
				return res.sendStatus(400);
			}
			logDB.get(logSQL, args, (err, row)=>{
				if(err){
					console.log(err);
					return res.sendStatus(500);
				}
				res.sendStatus(200);
			});	
			break;
		case 'prefix':
			if(!req.user||!fetchPerms(guild, req.user.discordID)&(perms.administrator|perms.manage_guild)){
				return res.sendStatus(403);
			}
			if(!req.body.prefix&&typeof(prefix)=='string')
				return res.sendStatus(400);
			handlerDB.get('INSERT OR REPLACE INTO prefixes(guild, prefix) VALUES((?), (?));', [req.params.guild, req.body.prefix], (err)=>{
				if(err){
					console.log(err);
					return res.sendStatus(500);
				}
				res.sendStatus(200);
			});	
			break;
	}
});

module.exports = router;