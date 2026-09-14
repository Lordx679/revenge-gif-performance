(function (exports, api, metro) {
  "use strict";

  var unpatch;

  function isGifSource(source) {
    var item = Array.isArray(source) ? source[0] : source;
    var uri = typeof item === "string" ? item : item && item.uri;
    return typeof uri === "string" && /\.gif(?:$|[?#&])/i.test(uri);
  }

  function isImage(type, ReactNative) {
    if (!type) return false;
    if (ReactNative && (type === ReactNative.Image || type === ReactNative.ImageBackground)) return true;
    return type.displayName === "Image" || type.name === "Image";
  }

  var plugin = {
    onLoad: function () {
      var common = (metro && metro.common) || {};
      var React = common.React;
      var ReactNative = common.ReactNative;

      if (!React || typeof React.createElement !== "function") {
        console.warn("[GIF Performance] React API unavailable");
        return;
      }

      unpatch = api.patcher.instead("createElement", React, function (args, orig) {
        var type = args[0];
        var props = args[1];
        var children = args.slice(2);

        if (props && isGifSource(props.source) && isImage(type, ReactNative)) {
          props = Object.assign({}, props, {
            fadeDuration: 0,
            resizeMethod: props.resizeMethod || "resize",
            progressiveRenderingEnabled: true
          });
        }

        return orig.apply(React, [type, props].concat(children));
      });

      console.log("[GIF Performance] enabled; GIF animation remains on");
    },
    onUnload: function () {
      if (unpatch) unpatch();
      unpatch = undefined;
    }
  };

  exports.default = plugin;
  Object.defineProperty(exports, "__esModule", { value: true });
})({}, bunny.api, bunny.metro);
