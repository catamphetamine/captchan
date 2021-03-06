import configuration from '../configuration'
import {
	shouldIncludeProviderInPath,
	getProviderId,
	getProviderAlias,
	addProviderIdToPath
} from '../provider'

/**
 * Returns "base" path of the application.
 * For example, on `catamphetamine.github.io/captchan`
 * the "base" path was "/captchan".
 * @return {string}
 */
export default function getBasePath({ providerId } = {}) {
	if (shouldIncludeProviderInPath()) {
		providerId = providerId || getProviderAlias() || getProviderId()
		if (providerId) {
			return addBasePath(addProviderIdToPath('', providerId))
		}
	}
	return _getBasePath() || ''
}

export function addBasePath(path) {
	const basePath = _getBasePath()
	if (basePath) {
		return basePath + path
	}
	return path
}

export function removeBasePath(path) {
	const basePath = _getBasePath()
	if (basePath) {
		if (path.indexOf(basePath) === 0) {
			return path.slice(basePath.length)
		}
	}
	return path
}

function _getBasePath() {
	if (configuration.path) {
		return configuration.path
	}
	// if (typeof window !== 'undefined') {
	// 	if (window.location.hostname === 'catamphetamine.github.io') {
	// 		// A special case just so that there's no need to use
	// 		// two different configuration files for `captchan.surge.sh`
	// 		// and `catamphetamine.github.io/captchan` (legacy demo).
	// 		return '/captchan'
	// 	}
	// }
}