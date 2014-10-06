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
    '../bower_components/tdl/tdl/textures',
    '../bower_components/hft-utils/dist/imageloader',
    './level',
    './tiled'
  ], function(
    Textures,
    ImageLoader,
    Level,
    Tiled) {

  var makeLevel = function(gl, map) {
    // convert level to what we need
    // First get tileset. Let's assume just 1
    if (map.tilesets.length != 1) {
      throw "only one tileset allowed: " + url;
    }

    var ts = map.tilesets[0];

    var tileset = {
      tileWidth: ts.tilewidth,
      tileHeight: ts.tileheight,
      tilesAcross: ts.image.width / ts.tilewidth,
      tilesDown: ts.image.height / ts.tileheight,
      texture: Textures.loadTexture(ts.image),
    };

    var createTexture = function(img) {
      var tex = Textures.loadTexture(img);
      tex.setParameter(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      tex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      tex.setParameter(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      tex.setParameter(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };

    var layers = map.layers.map(function(l) {
      return new Level({
        tileset: tileset,
        width: l.width,
        height: l.height,
        tiles: new Uint32Array(l.data),
      });
    });

    return {
      layers: layers,
      tileset: tileset,
    };
  };

  var load = function(gl, url, callback) {
    Tiled.loadMap(url, function(err, map) {
      if (err) {
        console.error(err);
        return;
      }

//console.log(JSON.stringify(map, undefined, "  "));

      var images = {};
      map.tilesets.forEach(function(ts) {
        images[ts.image.source] = { url: "assets/" + ts.image.source };
      });

      ImageLoader.loadImages(images, function() {
        map.tilesets.forEach(function(ts) {
          ts.image = images[ts.image.source].img;
        });

        callback(null, makeLevel(gl, map));
      });
    });
  };

  return {
    load: load,
  };
});


