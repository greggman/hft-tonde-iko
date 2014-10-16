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
    '../bower_components/hft-utils/dist/tilemap',
  ], function(
    TileMap) {

  var Level = function(options) {
    var tileset = options.tileset;
    var width = options.width;
    var height = options.height;
    var tiles = options.tiles;

    this.name = options.name;
    this.width = width;
    this.height = height;
    this.tileWidth = tileset.tileWidth;
    this.tileHeight = tileset.tileHeight;
    this.meaningTable = options.meaningTable;

    if (typeof(tiles) == 'string') {
      var t = [];

      if (options.border !== false) {
        /// Add a border
        this.width += 2;
        this.height += 2;
      }

      // Add lines of original plus abounds
      var wallTile = Level.charToTileId['#'].tileId;

      // Add top line
      if (options.border !== false) {
        for (var ii = 0; ii < this.width; ++ii) {
          t.push(wallTile);
        }
      }
      for (var yy = 0; yy < height; ++yy) {
        if (options.border !== false) {
          t.push(wallTile);
        }
        for (var xx = 0; xx < width; ++xx) {
          var ch = tiles.substr(yy * width + xx, 1);
          t.push(Level.charToTileId[ch].tileId);
        }
        if (options.border !== false) {
          t.push(wallTile);
        }
      }
      if (options.border !== false) {
        // Add bottom line
        for (var ii = 0; ii < this.width; ++ii) {
          t.push(wallTile);
        }
      }
      tiles = t;
      this.tiles = new Uint32Array(tiles);
    } else {
      this.tiles = tiles;
    }

    this.uint8view = new Uint8Array(this.tiles.buffer);
    this.uint16view = new Uint16Array(this.tiles.buffer);
    this.tilemap = new TileMap({
      mapTilesAcross: this.width,
      mapTilesDown: this.height,
      tilemap: this.uint8view,
      tileset: tileset,
    });

    this.tileDrawOptions = {
      x: 0,
      y: 0,
      width:  this.width  * this.tileWidth ,
      height: this.height * this.tileHeight,
      canvasWidth: 0, //this.canvas.width,
      canvasHeight: 0, //this.canvas.height,
      scrollX: 0,
      scrollY: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      originX: 0,
      originY: 0,
    };

    this.levelWidth = this.width * this.tileWidth;
    this.levelHeight = this.height * this.tileHeight;
    this.dests = {};
    this.localDests = {};
    this.things = {};
    this.isSetup = false;
  };

  Level.prototype.setup = function(levelManager) {
    if (this.isSetup) {
      return;
    }
    this.isSetup = true;
    // find stuff
    for (var yy = 0; yy < this.height; ++yy) {
      for (var xx = 0; xx < this.width; ++xx) {
        var tileId = this.getTile(xx, yy);
        var info = levelManager.getTileInfo(tileId);
        if (info.thing) {
          var things = this.things[info.thing];
          if (!things) {
            things = {};
            this.things[info.thing] = things;
          };
          var instances = things[info.id];
          if (!instances) {
            instances = [];
            things[info.id] = instances;
          }
          instances.push({ tx: xx, ty: yy, tileInfo: info });
        }
        var teleportDest = info.teleportDest;
        if (teleportDest !== undefined) {
          var destMap = info.local ? this.localDests : this.dests;
          var dests = destMap[teleportDest];
          if (!dests) {
            dests = {};
            destMap[teleportDest] = dests;
          }
          var subDest = info.subDest || 0;
          var subDests = dests[subDest];
          if (!subDests) {
            subDests = [];
            dests[subDest] = subDests;
          }
          subDests.push({tx: xx, ty: yy});
        }
      }
    }
  };

  Level.prototype.getThings = function(thing) {
    return this.things[thing];
  };

  Level.prototype.getDest = function(destId, subDestId) {
    var dests = this.dests[destId];
    if (dests) {
      return dests[subDestId];
    }
  };

  Level.prototype.getLocalDest = function(destId, subDestId) {
    subDestId = subDestId || 0;
    var dests = this.localDests[destId];
    if (dests) {
      return dests[subDestId];
    }
  };

  Level.prototype.getTile = function(tileX, tileY) {
    if (tileX >= 0 && tileX < this.width &&
        tileY >= 0 && tileY < this.height) {
      return this.uint16view[(tileY * this.width + tileX) * 2];
    }
    return -1;
  };

  Level.prototype.getTileByPixel = function(x, y) {
    var tileX = Math.floor(x / this.tileWidth);
    var tileY = Math.floor(y / this.tileHeight);
    return this.getTile(tileX, tileY);
  };

  Level.prototype.getDrawOffset = function(obj) {
    obj.x = ((gl.canvas.width  - this.levelWidth ) / 2) | 0;
    obj.y = ((gl.canvas.height - this.levelHeight) / 2) | 0;
  };

  Level.prototype.setTile = function(tx, ty, tileId) {
    this.uint16view[(ty * this.width + tx) * 2] = tileId;
    this.dirty = true;
  };

  Level.prototype.draw = function(levelManager, options) {
    if (this.dirty) {
      this.tilemap.uploadTilemap();
      this.dirty = false;
    }

    var opt = this.tileDrawOptions;
    opt.scaleX = options.scale || 1;
    opt.scaleY = options.scale || 1;
    opt.width  = this.width  * this.tileWidth  * options.scale;
    opt.height = this.height * this.tileHeight * options.scale;
    this.getDrawOffset(opt);
    opt.canvasWidth = gl.canvas.width;
    opt.canvasHeight = gl.canvas.height;
    this.tilemap.draw(opt);
  };

  Level.charToTileId = {
    ' ': { tileId: 0x0001, },
    '#': { tileId: 0x0002, },
    '0': { tileId: 0x0100, },
    '1': { tileId: 0x0101, },
    '2': { tileId: 0x0102, },
    '3': { tileId: 0x0103, },
    '4': { tileId: 0x0104, },
    'A': { tileId: 0x0200, },
    'B': { tileId: 0x0201, },
    'C': { tileId: 0x0202, },
    'D': { tileId: 0x0203, },
    '8': { tileId: 0x0300, },
    '9': { tileId: 0x0301, },
    'Y': { tileId: 0x0400, },
    'Z': { tileId: 0x0401, },
  };


  return Level;
});

