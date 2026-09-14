/*
 * GIF Performance for Revenge
 *
 * This plugin does not disable animation. It modifies image props used by
 * React Native's Image/Fresco path so animated GIFs can keep playing while
 * avoiding a few common sources of jank:
 *   - transition/fade animation on every image update
 *   - full-size frame decoding when the view is smaller than the source
 *   - non-progressive image rendering
 *
 * The exact Discord component tree changes between Discord releases, so the
 * safest stable interception point is React.createElement. We only touch
 * React Native Image elements and only when the source looks like a GIF.
 */

type AnyRecord = Record<string, any>

type PluginApi = {
  react: AnyRecord
  patcher: AnyRecord
  cleanup: (...fns: (() => unknown)[]) => void
}

function isGifSource(source: any): boolean {
  const candidate = Array.isArray(source) ? source[0] : source
  const uri = typeof candidate === "string" ? candidate : candidate?.uri
  return typeof uri === "string" && /\.gif(?:$|[?#&])/i.test(uri)
}

function looksLikeReactNativeImage(type: any, rn: AnyRecord): boolean {
  if (!type) return false
  if (type === rn?.Image || type === rn?.ImageBackground) return true
  return type?.displayName === "Image" || type?.name === "Image"
}

function optimizeGifProps(props: AnyRecord): AnyRecord {
  const next = { ...props }

  // Prevent a costly opacity transition every time a GIF source/frame updates.
  next.fadeDuration = 0

  // Fresco can resize before handing frames to the UI. This is especially
  // useful for large Tenor/Giphy GIFs displayed as small message previews.
  next.resizeMethod ??= "resize"

  // Allows partial/progressive image delivery where the underlying pipeline
  // supports it. It does not turn the GIF into a static image.
  next.progressiveRenderingEnabled = true

  return next
}

export default plugin({
  start({ react, patcher, cleanup }: PluginApi) {
    const React = react
    const RN = react.native ?? {}
    const createElement = React?.createElement

    if (!createElement || typeof patcher?.instead !== "function") {
      console.warn("[GIF Performance] React or patcher API is unavailable")
      return
    }

    const unpatch = patcher.instead(React, "createElement", (_this: any, args: any[], original: Function) => {
      const [type, props, ...children] = args

      if (props && isGifSource(props.source) && looksLikeReactNativeImage(type, RN)) {
        return original.call(React, type, optimizeGifProps(props), ...children)
      }

      return original.call(React, type, props, ...children)
    })

    cleanup(unpatch)
    console.log("[GIF Performance] enabled; GIF animation remains on")
  },

  stop() {
    console.log("[GIF Performance] stopped")
  },
})
