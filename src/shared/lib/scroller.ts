/**
 * The app's scroll container, <main> in Layout. The window itself never scrolls: in iOS home-screen
 * apps a scrolling document makes fixed and sticky bars drift and shake.
 */
// The id deliberately differs from this function's name: every element id is also a window global,
// so a file that forgot the import would otherwise call the <main> element instead of failing clearly.
export const scroller = () => document.getElementById("page-scroll") as HTMLElement
