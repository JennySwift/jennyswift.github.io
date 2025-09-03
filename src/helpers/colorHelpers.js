// Convert a hex color to rgba string with given alpha
export function hexToRgba(hex, alpha = 1) {
    if (!hex?.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
        console.warn(`[hexToRgba] Invalid hex: ${hex}`)
        return `rgba(0,0,0,${alpha})`
    }

    let r, g, b
    if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16)
        g = parseInt(hex.slice(3, 5), 16)
        b = parseInt(hex.slice(5, 7), 16)
    } else {
        // support shorthand like #f00
        r = parseInt(hex[1] + hex[1], 16)
        g = parseInt(hex[2] + hex[2], 16)
        b = parseInt(hex[3] + hex[3], 16)
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Read a CSS variable from the :root
export function getCssVar(varName) {
    if (!varName?.startsWith('--')) {
        console.warn(`[getCssVar] Invalid CSS variable name: ${varName}`)
        return null
    }
    return getComputedStyle(document.documentElement).getPropertyValue(varName)?.trim()
}

// Convert a CSS variable to rgba string
export function cssVarToRgba(varName, alpha = 1) {
    const hex = getCssVar(varName)
    return hexToRgba(hex, alpha)
}