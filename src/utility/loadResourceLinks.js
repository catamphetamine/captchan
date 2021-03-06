// import ResourceCache from 'webapp-frontend/src/utility/cache/ResourceCache'
// import loadResourceLinks from 'social-components/commonjs/utility/post/loadResourceLinks'

// import getCommentLengthLimit from './getCommentLengthLimit'
// import configuration from '../configuration'

// Eventually, it was decided that perhaps `loadResourceLinksSync()`
// function isn't that useful and can be removed.
// export function loadResourceLinksSync(comment, { mode, messages, getCommentById }) {
// 	loadResourceLinks(comment, {
// 		youTubeApiKey: configuration.youtubeApiKey,
// 		cache: ResourceCache,
// 		messages: getResourceMessages(messages),
// 		contentMaxLength: getCommentLengthLimit(mode),
// 		onContentChange: () => onCommentContentChange(comment, { getCommentById }),
// 		// And maybe the `sync: true` flag can be removed
// 		// from `social-components` too, because it was added
// 		// specifically for this use case.
// 		sync: true
// 	})
// }

export function getResourceMessages(messages) {
	return {
		videoNotFound: messages && messages.post && messages.post.videoNotFound,
		contentType: messages && messages.contentType
	}
}

export function onCommentContentChange(comment, { getCommentById, renderComment }) {
	// When data is fetched from an imageboard via the `imageboard` library,
	// each comment has an `.onContentChange()` function added by that library.
	// It can be used to update autogenerated quotes in all replies to this comment.
	// For each "descendant" reply to the `comment`, it would update all
	// `post-link` quotes to the comment with the new `.content` that is
	// autogenerated from the updated comment content.
	//
	// The `.onContentChange()` function would walk all "descendant" replies
	// and update their `content`, but it wouldn't re-render them.
	// To re-render the affected "descendant" replies, `renderComment(id)`
	// function is called.
	//
	if (comment.onContentChange) {
		for (const id of comment.onContentChange({ getCommentById })) {
			// Since the affected replies' autogenerated quotes have been re-generated,
			// the affected replies should now be re-rendered.
			// This is only required if they have already been rendered.
			// If they haven't yet, then there's no need for any re-rendering.
			if (renderComment) {
				renderComment(id)
			}
		}
	}
}