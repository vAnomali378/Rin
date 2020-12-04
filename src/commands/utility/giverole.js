function handleError(message) {
	return message.channel.send('', {
		embed: {
			description: `Please follow the format ${message.client.prefix()}giverole user role.`,
			color: colors.error,
		},
	});
}

module.exports = {
	async run(message, args, colors) {
		let member =
			message.mentions.members.first() || (await message.guild.members.cache.get(args[1]));
		let role = message.mentions.roles.first() || (await message.guild.roles.cache.get(args[2]));

		if (!role || !member) {
			return handleError(message);
		}

		if (message.guild.me.roles.highest.position < role.position) {
			return message.channel.send('', {
				embed: {
					description: `I am unable to give the requested role. Please check my position in the role hierarchy.`,
					color: colors.error,
				},
			});
		}

		member.roles.add(role).then(() => {
			message.channel.send('', {
				embed: {
					description: `${member.toString()} has been given the role ${role.toString()}`,
					color: role.color || colors.base,
				},
			});
		});
	},
	description: 'Gives a given user a given role.',
	detailed: 'Gives a given user a given role.',
	examples: (prefix) => `${prefix}giverole @Jihyo#2423 @Cutie`,
	name: 'giverole',
	permissions: ['MANAGE_ROLES'],
};
