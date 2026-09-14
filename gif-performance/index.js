(function (exports, api, metro) {
  "use strict";

  var unpatch;

  function sourceValue(source) {
    var item = Array.isArray(source) ? source[0] : source;
    if (typeof item === "string") return item;
    if (!item) return "";
    return String(item.uri || item.url || item.src || item.source || "");
  }

  function isAnimatedSource(source) {
    var item = Array.isArray(source) ? source[0] : source;
    var value = sourceValue(source);
    return Boolean(
      (item && (item.format === "gif" || item.type === "image/gif" || item.isAnimated === true)) ||
      /(?:\.gif(?:$|[?#&])|format=gif(?:$|[&#]))/i.test(value)
    );
  }

  function isImage(type, ReactNative) {
    if (!type) return false;
    if (ReactNative && (type === ReactNative.Image || type === ReactNative.ImageBackground)) return true;
    var name = String(type.displayName || type.name || "");
    return /(?:image|fastimage|animatedimage|gif)/i.test(name);
  }

  function visibleProps(props) {
    var next = Object.assign({}, props, {
      fadeDuration: 0,
      resizeMethod: props.resizeMethod || "resize",
      progressiveRenderingEnabled: true,
      collapsable: false
    });

    // Keep the original dimensions and add visibility last so a Discord style
    // such as opacity: 0 cannot accidentally hide a GIF thumbnail.
    if (props.style) {
      next.style = Array.isArray(props.style)
        ? props.style.concat([{ opacity: 1 }])
        : [props.style, { opacity: 1 }];
    } else {
      next.style = { opacity: 1 };
    }

    return next;
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

        if (props && isAnimatedSource(props.source) && isImage(type, ReactNative)) {
          props = visibleProps(props);
        }

        return orig.apply(React, [type, props].concat(children));
      });

      console.log("[GIF Performance] enabled; animated GIFs forced visible");
    },
    onUnload: function () {
      if (unpatch) unpatch();
      unpatch = undefined;
    }
  };

  exports.default = plugin;
  Object.defineProperty(exports, "__esModule", { value: true });
})({}, bunny.api, bunny.metro);
