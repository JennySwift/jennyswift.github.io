export function highlightElement(element) {
    element.classList.add("highlighted-log");

    // Remove the class after animation completes
    setTimeout(() => {
        element.classList.remove("highlighted-log");
    }, 1500);
}