import {
	Command,
	type CommandContext,
	createStringOption,
	Declare,
	Options,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { CacheService } from "../../services/cacheService";
import { Embeds } from "../../utils/embeds";

const options = {
	sugerencia: createStringOption({
		description: "Escribe aqui el contenido de tu sugerencia",
		required: true,
		min_length: 40,
	}),
};

@Declare({
	name: "suggest",
	description: "Haz una sugerencia al servidor",
})
@Options(options)
export default class SuggestCommand extends Command {
	override async run(ctx: CommandContext<typeof options>) {
		const { sugerencia } = ctx.options;
		const userId = ctx.author.id;
		const cacheKey = `ratelimit:suggest:${userId}`;

		const currentUsage = (await CacheService.get<number>(cacheKey)) || 0;

		if (currentUsage >= 2) {
			return ctx.write({
				content: "❌ Has alcanzado el límite de 2 sugerencias por día.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const suggestion = await ctx.client.messages.write(ctx.channelId, {
			embeds: [Embeds.suggestionEmbed(ctx, sugerencia)],
		});

		await suggestion.react("✅");
		await suggestion.react("❌");

		await ctx.client.messages.thread(suggestion.channelId, suggestion.id, {
			name: `Sugerencia de ${ctx.author.username}`,
		});

		await CacheService.set(cacheKey, currentUsage + 1, 86400);

		return ctx.write({
			content:
				"Tu sugerencia se ha enviado con exito." +
				`\n\n` +
				`Puedes verla ahora en: https://discord.com/channels/${ctx.guildId}/${ctx.channelId}/${suggestion.id}`,
			flags: MessageFlags.Ephemeral,
		});
	}
}
