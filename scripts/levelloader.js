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
    'hft/misc/strings',
    '../bower_components/tdl/tdl/textures',
    '../bower_components/hft-utils/dist/imageloader',
    './level',
    './tiledloader'
  ], function(
    Strings,
    Textures,
    ImageLoader,
    Level,
    TiledLoader) {

  var makeLevel = function(gl, map, callback) {
    // convert level to what we need
    // First get tileset. Let's assume just 1
    if (map.tilesets.length != 1) {
      throw "only one tileset allowed: " + url;
    }

    var ts = map.tilesets[0];
    var meaningUrl = ts.image.src.substring(0, ts.image.src.length - 4) + "-meaning.tmx";

    TiledLoader.loadMap(meaningUrl, function(err, meaningMap) {
      if (err) {
        console.error(err);
        return;
      }

      var tileset = {
        tileWidth: ts.tilewidth,
        tileHeight: ts.tileheight,
        tilesAcross: ts.image.width / ts.tilewidth,
        tilesDown: ts.image.height / ts.tileheight,
        texture: Textures.loadTexture(ts.image),
      };

      var numTiles = tileset.tilesAcross * tileset.tilesDown;
      var meaningTable = [];

      var meaningTS;
      var visualTS;
      meaningMap.tilesets.forEach(function(ts) {
        if (Strings.endsWith(ts.image.source, "meaning-icons.png")) {
          meaningTS = ts;
        } else {
          visualTS = ts;
        }
      });

      var layer = meaningMap.layers[0];
      for (var y = 0; y < layer.height - 1; y += 2) {
        for (var x = 0; x < layer.width; ++x) {
          var tileId    = layer.data[(y + 0) * layer.width + x];
          var meaningId = layer.data[(y + 1) * layer.width + x];
          if (tileId && meaningId) {
            var tile    = tileId    - visualTS.firstgid;
            var meaning = meaningId - meaningTS.firstgid;
//console.log("" + x + ", " + y + ": tileId" + tileId + ", meaningId: " + meaningId + ", tile: " + tile + ", meaning: " + meaning);
            if (meaningTable[tile] == undefined) {
              meaningTable[tile] = meaning;
            } else if (meaningTable[tile] != meaning) {
              console.error("tile " + tile + " assigned more than one meaning, A = " + meaningTable[tile] + ", B = " + meaning);
            }
          }
        }
      }

      // Fill out mising
      for (var ii = 0; ii < numTiles; ++ii) {
        if (!meaningTable[ii]) {
          meaningTable[ii] = 0;
        }
      }

      var createTexture = function(img) {
        var tex = Textures.loadTexture(img);
        tex.setParameter(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        tex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        tex.setParameter(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        tex.setParameter(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return tex;
      };

      var layers = map.layers.map(function(l) {
        // Tiled is 1 based (0 = no tile). We're 0 based so subtract 1.
        var data = new Uint32Array(l.data.length);
        for (var ii = 0; ii < l.data.length; ++ii) {
          data[ii] = Math.max(0, l.data[ii] - 1);
        }
        return new Level({
          tileset: tileset,
          width: l.width,
          height: l.height,
          tiles: data,
          meaningTable: meaningTable,
        });
      });

      callback(null, {
        layers: layers,
        tileset: tileset,
        meaningTable: meaningTable,
      });
    });
  };


  var load = function(gl, url, callback) {
    TiledLoader.loadMap(url, function(err, map) {
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

        makeLevel(gl, map, callback);
      });
    });
  };

  return {
    load: load,
  };
});


