(function (exports, api, metro) {
  "use strict";

  var unpatch;

  function isGifSource(source) {
    var item = Array.isArray(source) ? source[0] : source;
    var uri = typeof item === "string" ? item : item && item.uri;
    return typeof uri === "string" && /\.gif(?:$|[?#&])/i.test(uri);
  }

  function displaySize(props) {
    var style = props && props.style;
    var styles = Array.isArray(style) ? style : [style];
    var width = Number(props && props.width);
    var height = Number(props && props.height);
    styles.forEach(function (item) {
      if (!item || typeof item !== "object") return;
      if (!width && Number.isFinite(Number(item.width))) width = Number(item.width);
      if (!height && Number.isFinite(Number(item.height))) height = Number(item.height);
    });
    var size = Math.ceil(Math.max(width || 0, height || 0));
    return Math.max(96, Math.min(size || 320, 512));
  }

  function resizeDiscordGifSource(source, props) {
    var item = Array.isArray(source) ? source[0] : source;
    var uri = typeof item === "string" ? item : item && item.uri;
    if (typeof uri !== "string" || !/https?:\/\/(?:cdn\.|media\.)?discord(?:app\.com|\.com)\//i.test(uri)) {
      return source;
    }
    if (/[?&](?:width|height)=/i.test(uri)) return source;
    var separator = uri.indexOf("?") === -1 ? "?" : "&";
    var size = displaySize(props);
    var resized = uri + separator + "width=" + size + "&height=" + size;
    if (typeof item === "string") return resized;
    var next = Object.assign({}, item, { uri: resized });
    return Array.isArray(source) ? [next] : next;
  }

  function isImage(type, ReactNative) {
    if (!type) return false;
    if (ReactNative && (type === ReactNative.Image || type === ReactNative.ImageBackground)) return true;
    return /^(?:Image|FastImage|AnimatedImage|GifImage)$/i.test(String(type.displayName || type.name || ""));
  }

  function isFavoritePreview(props) {
    if (!props) return false;
    if (props.isFavorite === true || props.favorite === true || props.inFavorites === true) return true;
    if (props.isGifPicker === true || props.gifPicker === true || props.isPicker === true) return true;
    var label = String(props.accessibilityLabel || props.testID || props.dataTestId || "");
    return /(?:favorite|favourite|gif.?picker)/i.test(label);
  }

  function sourceUrl(source) {
    var item = Array.isArray(source) ? source[0] : source;
    return typeof item === "string" ? item : item && (item.uri || item.url || item.src);
  }

  function addFavoriteLongPress(props, metro) {
    var oldLongPress = props.onLongPress;
    var remove = props.onRemoveFavorite || props.removeFavorite || props.onUnfavorite;
    return Object.assign({}, props, {
      onLongPress: function () {
        var url = sourceUrl(props.source);
        try {
          if (typeof remove === "function") {
            remove(url, props.gifId || props.id);
            return;
          }
          var find = metro && metro.findByPropsLazy;
          var modules = ["removeFavoriteGif", "removeFavoriteGIF", "removeFavorite"];
          for (var i = 0; i < modules.length; i++) {
            if (typeof find !== "function") break;
            var module = find(modules[i]);
            var method = module && module[modules[i]];
            if (typeof method === "function") {
              method.call(module, props.gifId || props.id || url);
              return;
            }
          }
        } catch (error) {
          console.warn("[GIF Performance] could not remove favorite GIF", error);
        }
        if (typeof oldLongPress === "function") oldLongPress.apply(this, arguments);
      }
    });
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
            progressiveRenderingEnabled: true,
            source: resizeDiscordGifSource(props.source, props)
          });

          if (isFavoritePreview(props)) {
            props = addFavoriteLongPress(props, metro);
          }

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
