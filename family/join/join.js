const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,200}$/
const FRAGMENT_PATTERN = /^#token=([A-Za-z0-9_-]{32,200})$/

export function invitationTokenFromFragment(fragment) {
  const match = FRAGMENT_PATTERN.exec(fragment)
  return match && TOKEN_PATTERN.test(match[1]) ? match[1] : null
}

function initializeInvitationPage() {
  const originalFragment = window.location.hash

  // URL fragments are never included in the HTTP request. Remove the capability
  // from browser history before changing visible state. The token stays in this
  // function's closure only: never DOM, storage, logs, or analytics.
  window.history.replaceState(null, '', window.location.pathname)

  const panel = document.querySelector('.join-panel')
  const message = document.querySelector('#join-message')
  const openButton = document.querySelector('#open-family-app')
  const token = invitationTokenFromFragment(originalFragment)

  if (!panel || !message || !openButton) return

  panel.setAttribute('aria-busy', 'false')
  if (!token) {
    message.textContent = 'This invitation is incomplete or invalid. Ask the adult who invited you to create a new link.'
    return
  }

  message.textContent = 'This invitation is ready. Open it on the iPhone or iPad that will use this family profile.'
  openButton.textContent = 'How to open securely'
  openButton.hidden = false
  openButton.addEventListener('click', () => {
    message.textContent = 'Open the original HTTPS invitation again from Messages or Mail after Simpli-FI Family is installed. If it still does not open in the app, ask the household adult for a fresh invitation.'
    openButton.hidden = true
  })
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initializeInvitationPage()
}
