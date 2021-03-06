import hasAttachmentPicture from 'social-components/commonjs/utility/attachment/hasPicture'
import getThumbnailSize from 'social-components/commonjs/utility/attachment/getThumbnailSize'

import UserData from '../UserData/UserData'

export default function createTrackedThreadRecord(thread, channel) {
	const latestComment = thread.comments[thread.comments.length - 1]
	const trackedThread = {
		id: thread.id,
		// The `#${thread.id}` part is just in case the thread
		// both doesn't have a title and a title wasn't autogenerated
		// for some reason (perhaps missing `messages` for "Picture", etc).
		title: thread.titleCensored || thread.title,
		channel: {
			id: channel.id,
			title: channel.title
		},
		// "rolling" thread status is not stored in a "tracked thread"
		// record because it might change in future: for example, a thread
		// could be a regular one, but then a moderator makes it into a
		// rolling thread. So, `trackedThreadRecord.rolling` flag could
		// become stale, and, therefore, it's not used.
		// rolling: thread.isRolling,
		latestComment: createTrackedThreadRecordLatestComment(latestComment, {
			isRolling: thread.isRolling
		})
	}
	// "Rolling" threads are threads in which older comments get erased
	// by newer once, hence there's no point in storing their `commentsCount`.
	if (!thread.isRolling) {
		trackedThread.commentsCount = thread.comments.length
	}
	const thumbnailAttachment = thread.comments[0].attachments &&
			thread.comments[0].attachments.filter(hasAttachmentPicture)[0]
	if (thumbnailAttachment) {
		const thumbnail = getThumbnailSize(thumbnailAttachment)
		trackedThread.thumbnail = {
			type: thumbnail.type,
			url: thumbnail.url,
			width: thumbnail.width,
			height: thumbnail.height
		}
		if (thumbnailAttachment.spoiler) {
			trackedThread.thumbnail.spoiler = true
		}
	}
	return trackedThread
}

export function createTrackedThreadRecordLatestComment(latestComment, { isRolling }) {
	const latestCommentInfo = {
		id: latestComment.id,
		createdAt: latestComment.createdAt.getTime()
	}
	if (!isRolling) {
		latestCommentInfo.i = latestComment.indexForLatestReadCommentDetection
	}
	return latestCommentInfo
}

/**
 * Tells if there're any new (unread) comments in a tracked thread.
 * @param  {object} trackedThread ??? Tracked thread record from `UserData`.
 * @return {boolean} [areThereAnyNewComments] Returns `undefined` if it's unknown whether there're any new comments.
 */
function _areThereAnyNewComments(trackedThread) {
	const latestReadComment = UserData.getLatestReadComment(
		trackedThread.channel.id,
		trackedThread.id
	)
	// If the thread's "original comment" is very long and non-limited,
	// or if the screen height is small, then the "original comment"'s
	// bottom border might not have been visible when the user added
	// the thread to the list of tracked threads. So, technically,
	// a thread might be tracked without any comment of it being read.
	// But those would be weird edge cases.
	if (!latestReadComment) {
		return true
	}
	// Sometimes, only `trackedThread.latestComment.i` exists, and not the `.id`.
	// The reason is that `/catalog.json` API response doesn't provide any comment ids,
	// but does provide the overall comments count, from which the
	// `trackedThread.latestComment.i` is calculated.
	//
	// "Rolling" tracked threads don't have comment indexes stored
	// because those're pointless because old comments get erased
	// as new comments are added.
	//
	if (trackedThread.latestComment.id > latestReadComment.id) {
		return true
	}
	// If a thread is "rolling", then both `trackedThread.commentsCount`
	// and `latestReadComment.i` are supposed to be `undefined`.
	// Still, using the redundant check here to check if both of them
	// aren't `undefined` just in case anything weird happens.
	// (but nothing weird should ever happen).
	// In normal circumstances, just one of these two checks would have sufficed.
	if (trackedThread.commentsCount !== undefined && latestReadComment.i !== undefined) {
		if (trackedThread.commentsCount > latestReadComment.i) {
			return true
		}
	}
}