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
    'hft/misc/misc',
    './level',
    './math',
    './tiles',
  ], function(
    Misc,
    Level,
    gmath,
    Tiles) {

  var levels = [];

  var meaningTable = [];
  meaningTable[0x0001] = 0;
  meaningTable[0x0002] = 1;
  meaningTable[0x0100] = 0x20;
  meaningTable[0x0101] = 0x21;
  meaningTable[0x0102] = 0x22;
  meaningTable[0x0103] = 0x23;
  meaningTable[0x0200] = 0x30;
  meaningTable[0x0201] = 0x31;
  meaningTable[0x0202] = 0x32;
  meaningTable[0x0203] = 0x33;
  meaningTable[0x0300] = 0x40;
  meaningTable[0x0301] = 0x41;
  meaningTable[0x0400] = 0x50;
  meaningTable[0x0401] = 0x51;

  for (var ii = 0; ii < meaningTable.length; ++ii) {
    if (meaningTable[ii] === undefined) {
      meaningTable[ii] = 0;
    }
  }

  var initLevels = function(tileset) {
    levels.push(new Level({
      meaningTable: meaningTable,
      tileset: tileset,
      width:   10,
      height:  15,
      border: false,
      tiles:   [ // 01234567890123456789
          "          ", // 0
          "          ", // 1
          "          ", // 2
          " ###      ", // 3
          "          ", // 4
          "#      ###", // 5
          "          ", // 6
          "          ", // 7
          "   ###    ", // 8
          "          ", // 9
          "          ", // 10
          " ##   ##  ", // 11
          "     #### ", // 12
          "    ##### ", // 13
          "#  #######", // 14
      ].join("")}));

//    tiles:   [ // 01234567890123456789
//        " YYY      ", // 0
//        "          ", // 1
//        "          ", // 2
//        " ###      ", // 3
//        "       A 1", // 4
//        "#      ###", // 5
//        "       ZZZ", // 6
//        "          ", // 7
//        "   ###    ", // 8
//        "          ", // 9
//        " B        ", // 10
//        " ##   ##  ", // 11
//        "    9#### ", // 12
//        "0   ##### ", // 13
//        "# 8###### ", // 14
//    ].join("")}));

    levels.push(new Level({
      meaningTable: meaningTable,
      tileset: tileset,
      width:   20,
      height:  10,
      border: false,
      tiles:   [ // 01234567890123456789
          "                    ", // 0
          "                    ", // 1
          "                    ", // 2
          "         #####      ", // 3
          "                    ", // 4
          "                    ", // 5
          "     ####      ##   ", // 6
          "              ####  ", // 7
          "0#           ######1", // 8
          "###         ########", // 9
      ].join("")}));

    levels.push(new Level({
      meaningTable: meaningTable,
      tileset: tileset,
      width:   30,
      height:  15,
      tiles:   [ // 012345678901234567890123456789
          "                              ", // 0
          "                              ", // 1
          "                              ", // 2
          "         #####                ", // 3
          "                   ######     ", // 4
          "                              ", // 5
          "     ####                     ", // 6
          "             ##########       ", // 7
          "0#                            ", // 8
          "###                           ", // 9
          "#####                 ###     ", //
          "#######              #####    ", //
          "########            #######   ", //
          "#####      ###     #########  ", //
          "###               ###########1", //
      ].join("")}));

    levels.push(new Level({
      tileset: tileset,
      width:   40,
      height:  20,
      tiles:   [ // 0123456789012345678901234567890123456789
          "                                        ", // 0
          "                                        ", // 1
          "                                        ", // 2
          "         #####                          ", // 3
          "                           ####         ", // 4
          "                                        ", // 5
          "     ####      ##                       ", // 6
          "                      #####             ", // 7
          "0                                       ", // 8
          "###    ########                         ", // 9
          "                           #####        ", //
          "                                        ", //
          "     #####                              ", //
          "                               #######  ", //
          "                                        ", //
          "                                        ", //
          "                           ###          ", //
          "  #    ########          #######        ", //
          " ###                   ###########      ", //
          "#####                ################  1", //
      ].join("")}));
  };

  var LevelManager = function(services, tileset, options) {
    options = options || {};
    this.services = services;
    this.tileset = tileset;
    this.offEdgeTileId = options.offEdgeTileId !== undefined ? options.offEdgeTileId : 13;
    this.offTopBottomTileID = options.offTopBottomTileId !== undefined ? options.offTopBottomTileId : 1;
    initLevels(tileset);
  };

  LevelManager.prototype.reset = function(canvasWidth, canvasHeight, level) {
    // pick the largest level that fits
    if (!level) {
      var largestLevel = levels[0];
      var largestSize = 0;
      for (var ii = 0; ii < levels.length; ++ii) {
        var level = levels[ii];
        var hSpace = canvasWidth  - level.levelWidth;
        var vSpace = canvasHeight - level.levelHeight;
        if (hSpace >= 0 && vSpace >= 0) {
          var size = level.levelWidth * level.levelHeight;
          if (size > largestSize) {
            largestSize = size;
            largestLevel = level;
          }
        }
      }
      level = largestLevel;
    }

    // find the desinations

    this.level = level;
    level.setup(this);
    this.level.dirty = true;
  };

  LevelManager.prototype.getTileInfo = function(tileId) {
    if (this.level.meaningTable) {
      tileId = this.level.meaningTable[tileId];
    }
    return Tiles.getInfo(tileId);
  };

  LevelManager.prototype.getTileInfoByPixel = function(x, y) {
    if (y < 0 || y >= this.level.levelHeight) {
      return Tiles.getInfo(this.offTopBottomTileID);
    } else if (x < 0) {
      var tileId = this.level.getTileByPixel(0, y);
      var info = this.getTileInfo(tileId);
      return info.collisions ? info : Tiles.getInfo(this.offEdgeTileId);
    } else if (x >= this.level.levelWidth) {
      var tileId = this.level.getTileByPixel(this.level.levelWidth - 1, y);
      var info = this.getTileInfo(tileId);
      return info.collisions ? info : Tiles.getInfo(this.offEdgeTileId);
    }
    var tileId = this.level.getTileByPixel(x, y);
    return this.getTileInfo(tileId);
  }

  LevelManager.prototype.draw = function(options) {
    this.level.draw(this, options);
  };

  LevelManager.prototype.getLevel = function() {
    return this.level;
  };

  LevelManager.prototype.getGroundHeight = function(x, y, tile) {
    if (!tile) {
      tile = this.getTileInfoByPixel(x, y);
    }
    if (!tile || !tile.collisions || !tile.udCollision) {
      return;
    }
    var level = this.level;
    var xPixel = Math.floor(gmath.emod(x, level.tileWidth));
    var tileY = gmath.unitdiv(y, level.tileHeight) * level.tileHeight;
    var off = tile.udCollision[xPixel];
    return off >= 0 ? tileY + off : undefined;
  };

  LevelManager.prototype.getCeilingHeight = function(x, y, tile) {
    if (!tile) {
      tile = this.getTileInfoByPixel(x, y);
    }
    if (!tile || !tile.collisions || !tile.duCollision) {
      return;
    }
    var level = this.level;
    var xPixel = Math.floor(gmath.emod(x, level.tileWidth));
    var tileY = gmath.unitdiv(y, level.tileHeight) * level.tileHeight;
    var off = tile.duCollision[xPixel];
    return off >= 0 ? tileY + off : undefined;
  };

  LevelManager.prototype.getWallPosition = function(x, y, right, tile) {
    if (!tile) {
      tile = this.getTileInfoByPixel(x, y);
    }
    if (!tile || !tile.collisions) {
      return;
    }

    var level = this.level;
    var yPixel = Math.floor(gmath.emod(y, level.tileHeight));
    var tileX = gmath.unitdiv(x, level.tileWidth) * level.tileWidth;
    if (right) {
      if (tile.rlCollision) {
        var off = tile.rlCollision[yPixel];
        if (off >= 0) {
          return tileX + off ;
        }
      }
    } else {
      if (tile.lrCollision) {
        var off = tile.lrCollision[yPixel];
        if (off >= 0) {
          return tileX + off;
        }
      }
    }
  };


  LevelManager.prototype.getDrawOffset = function(obj) {
    this.level.getDrawOffset(obj);
  };

  LevelManager.prototype.getRandomOpenPosition = function() {
    var count = 0;
    var level = this.level;
    var found = false;
    while (!found) {
      if (++count > 10000) {
        throw("something's wrong with level data");
      }
      var x = (2 + Misc.randInt(level.width  - 4));
      var y = (2 + Misc.randInt(level.height - 4));
      var tile = this.getTileInfoByPixel(
        x * level.tileWidth,
        y * level.tileHeight);
      found = tile.open;
    }
    return {
      x: (x + 0.5) * level.tileWidth,
      y: (y +   1) * level.tileHeight - 1,
    };
  };

  return LevelManager;
});

