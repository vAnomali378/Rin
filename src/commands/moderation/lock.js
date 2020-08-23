module.exports = {
	async run(message, args) {
		if(args[1] != 'off') {
			message.channel.overwritePermissions([{
					id: message.guild.id,
					deny: ['SEND_MESSAGES']
			}]).then(channel => {
				message.channel.send('', {
					embed: {
						title: 'Channel Locked',
						color: colors.negative
					}
				});
			});
		} else {
			message.channel.overwritePermissions([{
				id: message.guild.id,
				SEND_MESSAGES: null
			}]).then(channel => {
				message.channel.send('', {
					embed: {
						title: 'Channel Unlocked',
						color: colors.success
					}
				});
			});
		}
	},
	description: 'Locks a channel',
	detailed: 'Overwrites permissions to speak in channel it is called in',
	examples: prefix => `${prefix} lock, prefix => ${prefix} lock off`,
	name: 'lock',
	perms: ['MANAGE_CHANNELS'],
	botPerms: ['MANAGE_CHANNELS'],
	guildOnly: true
}