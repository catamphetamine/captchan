import { render } from 'react-pages/client'

import settings from './react-pages'
import configuration from './configuration'

import { hideSidebar } from './redux/app'
import { closeSlideshow } from 'webapp-frontend/src/redux/slideshow'
// import { areCookiesAccepted } from 'webapp-frontend/src/utility/cookiePolicy'

import UserData from './UserData/UserData'

export default async function() {
	let isFirstRender = true
	let currentRoute
	// Renders the webpage on the client side
	const result = await render(settings, {
		onBeforeNavigate({ dispatch, location, params }) {
			// Hide sidebar pop up on navigation (only on small screens).
			dispatch(hideSidebar())
		},
		onNavigate(url, location, { dispatch, getState }) {
			// `window._previouslyVisitedRoute` is used in `<SideNavMenuButton/>`.
			// `window._previouslyVisitedRoute` could alternatively be stored somewhere in Redux state.
			window._previouslyVisitedRoute = currentRoute
			currentRoute = getState().found.match
			// Close slideshow on "Back"/"Forward" navigation.
			dispatch(closeSlideshow())
			// Focus the page on subsequent renders.
			// (for screen readers and accessibility).
			if (isFirstRender) {
				isFirstRender = false
			} else {
				// Focus the `<main/>` content if no page element has been focused yet.
				// P.S.: NVDA won't announce the focused region.
				// https://github.com/nvaccess/nvda/issues/6606
				// `document.activeElement` is supported in all browsers, even very old ones.
				// https://developer.mozilla.org/docs/Web/API/Document/activeElement
				if (!document.activeElement ||
					document.activeElement === document.body ||
					!document.querySelector('main').contains(document.activeElement)) {
					document.querySelector('main').focus()
				}
			}
			// Flush cached `localStorage`.
			// (writes cached `latestReadComments` and `latestSeenThreads`).
			UserData.storage.flush()
			// Set up Google Analytics.
			// A simple Google Analytics setup with anonymized IP addresses
			// and without any "Demographics" tracking features
			// seems to comply with GDPR.
			// Google Analytics cookie violates GDPR.
			if (configuration.googleAnalyticsId && process.env.NODE_ENV === 'production') {
				// Set up Google Analytics via `gtag`.
				gtag('config', configuration.googleAnalyticsId, {
					// Anonymize IP for all Google Analytics events.
					// https://developers.google.com/analytics/devguides/collection/gtagjs/ip-anonymization
					// This makes Google Analytics compliant with GDPR:
					// https://www.jeffalytics.com/gdpr-ip-addresses-google-analytics/
					'anonymize_ip': true,
					// Google Analytics can get users' "Demographics" (age, sex)
					// from "3rd party" data sources if "Advertising Reporting Features"
					// are enabled in Google Analytics admin panel.
					// Such data could be considered "Personal Identifiable Information"
					// which falls under the terms of GDPR.
					// There's also "Remarketing" feature that could also
					// fall under the terms of GDPR.
					'allow_display_features': false,
					// Specifies what percentage of users should be tracked.
					// This defaults to 100 (no users are sampled out) but
					// large sites may need to use a lower sample rate
					// to stay within Google Analytics processing limits.
					// 'sample_rate': 1,
					// Report "page view" event to Google Analytics.
					// https://stackoverflow.com/questions/37655898/tracking-google-analytics-page-views-in-angular2
					// https://developers.google.com/analytics/devguides/collection/gtagjs/single-page-applications
					'page_path': location.pathname
				})
			}
		}
	})
	// If there was an error during the initial rendering
	// then `result` will be `undefined`.
	if (result) {
		const { store, rerender } = result
		// Webpack "Hot Module Replacement"
		if (module.hot) {
			// Because `./redux/app.js` is imported in this file,
			// changing `./redux/app.js` won't hot reload.
			module.hot.accept('./react-pages', () => {
				store.hotReload(settings.reducers)
				rerender()
			})
		}
	}
}