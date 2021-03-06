module.exports = {
	async run(message, args, colors) {
		let content = args.splice(2).join(' ');

		if (!content) {
			return message.channel.send('', {
				embed: {
					description: `Please follow this format: ${message.client.prefix()}sayc #channel text`,
					color: colors.error,
				},
			});
		}

		if (message.mentions.channels.first()) {
			const channel = message.mentions.channels.first();
			return channel.send(content).catch(() => {
				return message.channel.send('', {
					embed: {
						description: `Unable to send message. Please ensure I have the sufficent permission to send messages to the given channel.`,
						color: colors.error,
					},
				});
			});
		}
	},
	description: 'Says a given message in a given channel.',
	detailed: 'Has the bot say a message in a given channel.',
	examples: (prefix) => `${prefix}sayc 676143854365310980 Tarren is an epic gamer!`,
	name: 'SayC',
	permissions: ['ADMINISTRATOR'],
};
