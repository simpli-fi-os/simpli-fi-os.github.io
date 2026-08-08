const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/
const FRAGMENT_PATTERN = /^#token=([A-Za-z0-9_-]{43,128})$/

export function reviewAccessTokenFromFragment(fragment) {
  const match = FRAGMENT_PATTERN.exec(fragment)
  return match && TOKEN_PATTERN.test(match[1]) ? match[1] : null
}

function initializeReviewAccessPage() {
  const originalFragment = window.location.hash

  // URL fragments are never included in the HTTP request. Remove the capability
  // from browser history before changing visible state. The token stays in this
  // function's closure only: never DOM, storage, logs, or analytics.
  window.history.replaceState(null, '', window.location.pathname)

  const panel = document.querySelector('.join-panel')
  const message = document.querySelector('#review-message')
  const helpButton = document.querySelector('#open-family-app')
  const token = reviewAccessTokenFromFragment(originalFragment)

  if (!panel || !message || !helpButton) return

  panel.setAttribute('aria-busy', 'false')
  if (!token) {
    message.textContent = 'This App Review access link is incomplete or invalid. Use the exact link supplied in App Store Connect, or contact the developer listed in the review notes.'
    return
  }

  message.textContent = 'This App Review access link is ready. Open it on the iPhone or iPad where Simpli-FI Family is installed, and the app will present the synthetic review household.'
  helpButton.textContent = 'It did not open in the app'
  helpButton.hidden = false
  helpButton.addEventListener('click', () => {
    // This page only renders when iOS did NOT hand the link to the app, and the
    // most common reason is not a missing install: iOS never activates a
    // universal link for an address typed or pasted into Safari, which is how a
    // reviewer reaches a URL printed in App Store Connect. Telling them to
    // reinstall first sends them round a loop that cannot resolve.
    message.textContent = 'If Simpli-FI Family is already installed, iOS did not hand this link to the app. Press and hold the link in the review notes and choose Open in “Simpli-FI Family”; a pasted address never opens an app. If that does not work, delete and reinstall the build under review so iOS fetches the site association again, then press and hold the link once more. If the app is not installed, install the TestFlight or App Store build under review first. If it still does not open, contact the developer listed in the review notes.'
    helpButton.hidden = true
  })
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initializeReviewAccessPage()
}
