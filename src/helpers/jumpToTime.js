export function jumpToTime(at, source = 'any') {
    window.dispatchEvent(new CustomEvent('jump-to-time', { detail: { at, source } }))
    console.log('[jumpToTime] dispatched', { at, source })
}