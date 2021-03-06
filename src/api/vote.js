import Imageboard from './Imageboard'

export default async function vote({
	http,
	up,
	channelId,
	threadId,
	commentId
}) {
	const provider = getProvider()
	if (provider.imageboard) {
		return await Imageboard({ http }).vote({
			boardId: channelId,
			threadId,
			commentId,
			up
		})
	} else {
		return await provider.api.vote({
			channelId,
			threadId,
			commentId,
			up
		})
	}
}
