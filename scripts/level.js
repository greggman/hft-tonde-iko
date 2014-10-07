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
    this.levelWidth = this.width * this.tileWidth;
    this.levelHeight = this.height * this.tileHeight;
    this.outOfBoundsTile = Level.charToTileId['#'].tileId;
    this.meaningTable = options.meaningTable;

    if (typeof(tiles) == 'string') {
      var t = [];
      /// Add a border
      this.width += 2;
      this.height += 2;
      // Add top line
      for (var ii = 0; ii < this.width; ++ii) {
        t.push(this.outOfBoundsTile);
      }
      // Add lines of original plus abounds
      for (var yy = 0; yy < height; ++yy) {
        t.push(this.outOfBoundsTile);
        for (var xx = 0; xx < width; ++xx) {
          t.push(Level.charToTileId[tiles.substr(yy * width + xx, 1)].tileId);
        }
        t.push(this.outOfBoundsTile);
      }
      // Add bottom line
      for (var ii = 0; ii < this.width; ++ii) {
        t.push(this.outOfBoundsTile);
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
  };

  Level.prototype.getTile = function(tileX, tileY) {
    if (tileX >= 0 && tileX < this.width &&
        tileY >= 0 && tileY < this.height) {
      return this.uint16view[(tileY * this.width + tileX) * 2];
    }
    return this.outOfBoundsTile;
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
    '0': { tileId: 0x0003, },
    '1': { tileId: 0x0004, },
    '2': { tileId: 0x0005, },
    '3': { tileId: 0x0006, },
    '4': { tileId: 0x0007, },
  };


  return Level;
});

