import { useState, useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'

import getMessages from '../../messages'

import { InReplyToModalCloseTimeout, InReplyToModalScrollToTopAndFocus } from '../../components/InReplyToModal'

import { notify } from 'webapp-frontend/src/redux/notifications'
// import { getViewportHeight } from 'webapp-frontend/src/utility/dom'

export default function useThreadNavigation({
	getCommentById,
	locale
}) {
	const dispatch = useDispatch()
	const [threadNavigationHistory, setThreadNavigationHistory] = useState([])
	// `threadNavigationHistoryRef` is only used in `onNavigateToComment()`
	// to prevent changing `itemComponentProps` when `threadNavigationHistory` changes
	// which would happen if `onNavigateToComment()` used `threadNavigationHistory` directly.
	// This results in not re-rendering the whole comments list
	// when clicking "Show previous" button.
	const threadNavigationHistoryRef = useRef(threadNavigationHistory)
	const onSetThreadNavigationHistory = useCallback((history) => {
		setThreadNavigationHistory(history)
		threadNavigationHistoryRef.current = history
	}, [
		setThreadNavigationHistory,
		threadNavigationHistoryRef
	])
	const resetThreadNavigationHistoryTimeout = useRef()
	const [isThreadHistoryModalShown, setThreadHistoryModalShown] = useState()
	const onShowThreadHistoryModal = useCallback(() => {
		clearTimeout(resetThreadNavigationHistoryTimeout.current)
		setThreadHistoryModalShown(true)
	}, [
		setThreadHistoryModalShown,
		resetThreadNavigationHistoryTimeout
	])
	const onHideThreadHistoryModal = useCallback(() => {
		clearTimeout(resetThreadNavigationHistoryTimeout.current)
		resetThreadNavigationHistoryTimeout.current = setTimeout(() => {
			onSetThreadNavigationHistory([])
		}, InReplyToModalCloseTimeout)
		setThreadHistoryModalShown(false)
	}, [
		setThreadHistoryModalShown,
		onSetThreadNavigationHistory,
		resetThreadNavigationHistoryTimeout
	])
	// // `thread` object reference changes on every auto-update.
	// // A `ref` is used instead of a dependency on `thread` itself
	// // so that `onNavigateToComment()` itself doesn't change on
	// // thread auto-update. Otherwise, `itemComponentProps` would change,
	// // and then `<VirtualScroller/>` would re-render all comments on
	// // thread auto-update (instead of updating just the comments that changed).
	// const threadRef = useRef()
	// threadRef.current = thread
	// This function is called when a user is veiwing comment with ID
	// `fromCommentId` and clicks a link to comment with ID `commentId`.
	const onNavigateToComment = useCallback((commentId, fromCommentId) => {
		// const getCommentById = (id) => {
		// 	return threadRef.current.comments.find(_ => _.id === id)
		// }
		const comment = getCommentById(commentId)
		if (!comment) {
			dispatch(notify(getMessages(locale).noSearchResults))
			console.error(`Comment #${commentId} not found`)
			return
		}
		// Displaying a modal with comment content is used
		// instead of scrolling to the comment.
		// // `fromIndexRef` is used instead of `fromIndex`
		// // to avoid having `fromIndex` in the list of dependencies
		// // which would result in re-rendering all comments
		// // when a user clicks "Show previous" button.
		// const fromIndex = fromIndexRef.current
		// if (index < fromIndex) {
		// 	dispatch(notify('Comment not rendered'))
		// 	return
		// }
		// const { top } = virtualScroller.current.getItemCoordinates(index - fromIndex)
		// const headerHeight = document.querySelector('.Header').offsetHeight
		// window.scrollTo(0, top - headerHeight)
		onShowThreadHistoryModal(true)
		let history = threadNavigationHistoryRef.current
		// This turned out to feel inconsistent, so this feature was disabled.
		// // Don't add an entry to the history if the comment with the
		// // `post-link` being clicked is still visible after scrolling
		// // to the quoted comment (with some bottom margin).
		// const fromCommentIndex = thread.comments.findIndex(_ => _.id === fromCommentId);
		// const { top: fromCommentTop } = virtualScroller.current.getItemCoordinates(fromCommentIndex - fromIndex)
		// if (fromCommentTop > top - headerHeight + getViewportHeight() * 0.9) {
			// onSetThreadNavigationHistory(history.concat({ commentId: fromCommentId }))
			// Add the initial "from" history entry.
			if (history.length === 0) {
				history = history.concat(getCommentById(fromCommentId))
			}
			// `.hasContentBeenParsed` flag is set by the `parseContent()`
			// function that the `imageboard` library has created.
			// Don't set this flag manually. Only read it.
			if (!comment.hasContentBeenParsed) {
				comment.parseContent({ getCommentById })
			}
			onSetThreadNavigationHistory(history.concat(comment))
			// Scroll comment history modal to top.
			InReplyToModalScrollToTopAndFocus()
		// }
	},
	// This dependencies list should be such that
	// comments aren't re-rendered when they don't need to.
	// (`itemComponentProps` depends on `onNavigateToComment`)
	[
		getCommentById,
		dispatch,
		locale,
		onShowThreadHistoryModal,
		threadNavigationHistoryRef,
		onSetThreadNavigationHistory
	])
	const onGoBackInThreadNavigationHistory = useCallback(() => {
		const newThreadNavigationHistory = threadNavigationHistory.slice()
		newThreadNavigationHistory.pop()
		onSetThreadNavigationHistory(newThreadNavigationHistory)
		// Scroll comment history modal to top.
		InReplyToModalScrollToTopAndFocus()
	}, [onSetThreadNavigationHistory, threadNavigationHistory])
	// const onBackToPreviouslyViewedComment = useCallback(() => {
	// 	const latest = threadNavigationHistory.pop()
	// 	// onNavigateToComment(latest.commentId)
	// 	onNavigateToComment(latest.id)
	// 	onSetThreadNavigationHistory(threadNavigationHistory.slice())
	// }, [onNavigateToComment, threadNavigationHistory])
	return [
		threadNavigationHistory,
		onNavigateToComment,
		onGoBackInThreadNavigationHistory,
		isThreadHistoryModalShown,
		onHideThreadHistoryModal
	]
}