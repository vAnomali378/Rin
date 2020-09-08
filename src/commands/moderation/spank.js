const { mute, startMuteCheck } = require('../../utils').mute;
const { convertTime } = require('../../utils');

startMuteCheck();

module.exports = {
	async run(message, args) {
		let time = convertTime(`1m`);
		let reason = 'No reason provided';
		let member = message.mentions.members.first() || await message.guild.members.fetch(`${args[1]}`)
		.catch(e => {
			message.channel.send('', {
				embed: {
					title: 'Incorrect command usage',
					description: 'Please provide a user to spank.',
					color: colors.error
				}
			});
		});
		if (member == undefined) return;

		mute(message.guild, member, time, reason, message.author, message.channel)
		.then(()=>
			message.channel.send({embed:{
				title: 'User spanked',
				description: `${member.toString()}has been spanked by ${message.author.toString()}`,
				color: colors.negative,
				timestamp: time
			}})
		)
		.catch(e=>
			message.channel.send({embed:{
				title: 'Unable to spank user',
				description: e.message||e,
				color: colors.error
			}})
		);
},
	description: 'Mutes a given member for one minute.',
	detailed: 'Mutes a given member for one minute. Mutes are checked twice a minute meaning that an automatic unmute can be up to half a minute late.',
	examples: prefix => `${prefix}spank @Jihyo#2423`,
	name: 'spank',
	perms: ['MANAGE_ROLES'],
	botPerms: ['MANAGE_ROLES', 'MANAGE_CHANNELS'],
	guildOnly: true
}