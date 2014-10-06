/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

define([
    './io',
  ], function(
    IO) {

  var parseStr = function(v) { return v; };
  var applyAttributes = function(typeMap, node, dest) {
    dest = dest || {};
    for (var ii = 0; ii < node.attributes.length; ++ii) {
      var attr = node.attributes[ii];
      var parseFn = typeMap[attr.name] ? typeMap[attr.name] : parseStr;
      dest[attr.name] = parseFn(attr.value);
    }
    return dest;
  };

  var parseChildren = function(node, handlers) {
    for (var ii = 0; ii < node.childNodes.length; ++ii) {
      var child = node.childNodes[ii];
      var handler = handlers[child.nodeName];
      if (!handler) {
        console.warn("unknown nodeName: " + child.nodeName);
      } else {
        handler(child);
      }
    }
  };

  var noop = function() { };

  var layerTypeMap = {
    width: parseInt,
    height: parseInt,
  };
  var parseLayer = function(node) {
    var layer = applyAttributes(layerTypeMap, node);
    parseChildren(node, {
      data: function(node) {
        if (layer.data) {
          throw("more than one <data> element in layer");
        }
        var data = node.childNodes[0].nodeValue.split(",").map(function(str) {
          return Math.max(0, parseInt(str.trim()) - 1);
        });
        layer.data = data;
      },
      "#text": noop,
    });
    return layer;
  };

  var tilesetTypeMap = {
    firstgid: parseInt,
    tilewidth: parseInt,
    tileheight: parseInt,
  };
  var imageTypeMap = {
    width: parseInt,
    height: parseInt,
  };
  var parseTileset = function(node) {
    var tilemap = applyAttributes(tilesetTypeMap, node);
    parseChildren(node, {
      image: function(node) {
        if (tilemap.image) {
          throw("more than one <image> element in tilemap");
        }
        tilemap.image = applyAttributes(imageTypeMap, node);
      },
      "#text": noop,
    });
    return tilemap;
  };

  var parsePoints = function(str) {
    var points = [];
    str.split(" ").forEach(function(point) {
      var coords = point.split(",");
      points.push(parseFloat(coords[0], parseFloat(coords[1])));
    });
    return points;
  };

  var objectTypeMap = {
    x: parseFloat,
    y: parseFloat,
    width: parseFloat,
    height: parseFloat,
    rotation: parseFloat,
    gid: parseInt,
  };
  var polygonTypeMap = {
    points: parsePoints,
  };
  var polylineTypeMap = {
    points: parsePoints,
  };
  var parseObject = function(node) {
    var ob = applyAttributes(objectTypeMap, node);
    parseChildren(node, {
      ellipse: function(node) {
        ob.type = "ellipse";
      },
      polygon: function(node) {
        ob.type = "polygon";
        applyAttributes(polygonTypeMap, node, ob);
      },
      polyline: function(node) {
        ob.type = "polyline";
        applyAttributes(polyLineTypeMap, node, ob);
      },
      "#text": noop,
    });
    if (!ob.type) {
      if (ob.gid) {
        ob.type = "tile";
      } else if (ob.width && ob.height) {
        ob.type = "rectangle";
      }
    }
    return ob;
  }

  var objectGroupTypeMap = {
  };
  var parseObjectGroup = function(node) {
    var og = {
      objects: [],
    };
    applyAttributes(objectGroupTypeMap, node, og);
    parseChildren(node, {
      object: function(node) {
        og.objects.push(parseObject(node));
      },
      "#text": noop,
    });
    return og;
  };

  var mapTypeMap = {
    width: parseInt,
    height: parseInt,
    tilewidth: parseInt,
    tileheight: parseInt,
  };
  var loadMap = function(url, callback) {
    var onLoad = function(err, str) {
      if (err) {
        callback(err);
      }

      var map = {
        tilesets: [],
        layers: [],
        objectGroups: [],
        order: [],
      };

      try {
        var xml = (new window.DOMParser()).parseFromString(str, "text/xml");
        var mapNode = xml.childNodes[0];
        applyAttributes(mapTypeMap, mapNode, map);
        parseChildren(mapNode, {
          tileset: function(node) {
            map.tilesets.push(parseTileset(node));
          },
          layer: function(node) {
            var layer = parseLayer(node);
            map.layers.push(layer);
            map.order.push(layer);
          },
          objectgroup: function(node) {
            var objectGroup = parseObjectGroup(node);
            map.objectGroups.push(objectGroup);
            map.order.push(objectGroup);
          },
          "#text": noop,
        });
      } catch (e) {
        return callback(e);
      }
      callback(null, map);
    };

    var options = {
      inMimeType: "text/xml",
    };

    IO.get(url, "", onLoad, options);
  };


  return {
    loadMap: loadMap,
  }
});


