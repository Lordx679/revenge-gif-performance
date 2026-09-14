// js/index.ts
function isGifSource(source) {
  const candidate = Array.isArray(source) ? source[0] : source;
  const uri = typeof candidate === "string" ? candidate : candidate?.uri;
  return typeof uri === "string" && /\.gif(?:$|[?#&])/i.test(uri);
}
function looksLikeReactNativeImage(type, rn) {
  if (!type) return false;
  if (type === rn?.Image || type === rn?.ImageBackground) return true;
  return type?.displayName === "Image" || type?.name === "Image";
}
function optimizeGifProps(props) {
  const next = { ...props };
  next.fadeDuration = 0;
  next.resizeMethod ?? (next.resizeMethod = "resize");
  next.progressiveRenderingEnabled = true;
  return next;
}
var index_default = plugin({
  start({ react, patcher, cleanup }) {
    const React = react;
    const RN = react.native ?? {};
    const createElement = React?.createElement;
    if (!createElement || typeof patcher?.instead !== "function") {
      console.warn("[GIF Performance] React or patcher API is unavailable");
      return;
    }
    const unpatch = patcher.instead(React, "createElement", (_this, args, original) => {
      const [type, props, ...children] = args;
      if (props && isGifSource(props.source) && looksLikeReactNativeImage(type, RN)) {
        return original.call(React, type, optimizeGifProps(props), ...children);
      }
      return original.call(React, type, props, ...children);
    });
    cleanup(unpatch);
    console.log("[GIF Performance] enabled; GIF animation remains on");
  },
  stop() {
    console.log("[GIF Performance] stopped");
  }
});
export {
  index_default as default
};
