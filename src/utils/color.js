
/**
 * Determines whether white or black text provides better contrast for a given background color.
 * Uses the YIQ luminance formula for perceived brightness.
*/
export function getContrastColor(bgColor) {
    bgColor = bgColor.startsWith('#') ? bgColor.slice(1) : bgColor;

    const components = {
        r: parseInt(bgColor.substring(0, 2), 16),
        g: parseInt(bgColor.substring(2, 4), 16),
        b: parseInt(bgColor.substring(4, 6), 16)
    };

    // Calculate perceived brightness (YIQ formula)
    const brightness = (
        (components.r * 299) +
        (components.g * 587) +
        (components.b * 114)
    ) / 1000;

    // Use a threshold (e.g., 128) to decide between black or white overlay text.
    return brightness >= 128 ? 'black' : 'white';
}
