/**
 * The app's scroll container, <main> in Layout. The window itself never scrolls: in iOS home-screen
 * apps a scrolling document makes fixed and sticky bars drift and shake.
 */
export const scroller = () => document.getElementById("scroller") as HTMLElement
