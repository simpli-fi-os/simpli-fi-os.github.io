const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,200}$/

export function invitationTokenFromSearch(search) {
  const entries = [...new URLSearchParams(search).entries()]
  if (entries.length !== 1 || entries[0][0] !== 'token') return null
  return TOKEN_PATTERN.test(entries[0][1]) ? entries[0][1] : null
}

export function appInvitationURL(token) {
  if (!TOKEN_PATTERN.test(token)) return null
  return `simplififamily://join?token=${encodeURIComponent(token)}`
}

function initializeInvitationPage() {
  const originalSearch = window.location.search

  // Remove the capability from browser history before changing visible state.
  // The token stays in this function's closure only: never DOM, storage, logs, or analytics.
  window.history.replaceState(null, '', window.location.pathname)

  const panel = document.querySelector('.join-panel')
  const message = document.querySelector('#join-message')
  const openButton = document.querySelector('#open-family-app')
  const token = invitationTokenFromSearch(originalSearch)

  if (!panel || !message || !openButton) return

  panel.setAttribute('aria-busy', 'false')
  if (!token) {
    message.textContent = 'This invitation is incomplete or invalid. Ask the adult who invited you to create a new link.'
    return
  }

  message.textContent = 'This invitation is ready. Open it on the iPhone or iPad that will use this family profile.'
  openButton.hidden = false
  openButton.addEventListener('click', () => {
    const destination = appInvitationURL(token)
    if (!destination) return

    window.location.assign(destination)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        message.textContent = 'The app did not open. Install Simpli-FI Family, then ask the household adult for a fresh invitation.'
      }
    }, 1400)
  })
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initializeInvitationPage()
}
