import Imageboard from './Imageboard'
import { getProvider } from '../provider'
import addCommentProps from './utility/addCommentProps'
import addThreadProps from './utility/addThreadProps'
import getMessages from './utility/getMessages'
import configuration from '../configuration'
import UserData from '../UserData/UserData'
import getCommentLengthLimit from '../utility/getCommentLengthLimit'

import getPostText from 'social-components/commonjs/utility/post/getPostText'
import trimText from 'social-components/commonjs/utility/post/trimText'

export default async function getThread({
	channelId,
	threadId,
	grammarCorrection,
	censoredWords,
	messages,
	locale,
	http
}) {
	let thread
	let hasMoreComments
	const provider = getProvider()
	if (provider.imageboard) {
		const imageboard = Imageboard({ messages, http })
		thread = await imageboard.getThread({
			boardId: channelId,
			threadId
		}, {
			// The parser parses thread comments up to 4x faster without parsing their content.
			// Example: when parsing comments content — 650 ms, when not parsing comments content — 200 ms.
			parseContent: false,
			// Add `.parseContent()` function to each `comment`.
			addParseContent: true,
			commentLengthLimit: getCommentLengthLimit('thread')
		})
	} else {
		thread = await provider.api.getThread({
			channelId,
			threadId
		})
		hasMoreComments = thread.hasMoreComments
	}
	addCommentProps(thread, {
		mode: 'thread',
		// Check the user's votes to mark some comments as "already voted"
		// for comments that the user has already voted for.
		votes: UserData.getCommentVotes(channelId, threadId),
		// messages,
		locale,
		grammarCorrection,
		censoredWords
	})
	// The "opening" post of a thread is always parsed
	// when showing thread page because it's always immediately visible
	// and also because `title` is autogenerated from it.
	thread.comments[0].parseContent()
	// Add `thread` properties.
	addThreadProps(thread, {
		locale,
		grammarCorrection,
		censoredWords
	})
	// Generate text preview which is used for `<meta description/>` on the thread page.
	generateTextPreview(thread.comments[0], messages)
	// Return the thread.
	return thread
}

/**
 * Generates a text preview of a comment.
 * Text preview is used for `<meta description/>`.
 * @param {object} comment
 * @return {string} [preview]
 */
function generateTextPreview(comment, messages) {
	const textPreview = getPostText(comment, {
		ignoreAttachments: true,
		softLimit: 150,
		messages: messages.contentType
	})
	if (textPreview) {
		comment.textPreview = trimText(textPreview, 150)
	}
}