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
    message.textContent = 'Install Simpli-FI Family from TestFlight or the App Store build under review, then open the original HTTPS link again from App Store Connect. If it still does not open in the app, contact the developer listed in the review notes for a fresh link.'
    helpButton.hidden = true
  })
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initializeReviewAccessPage()
}
