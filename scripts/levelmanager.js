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
  ], function(
    Misc,
    Level) {

  var levels = [];

  var initLevels = function(tileset) {
    levels.push(new Level({
      tileset: tileset,
      width:   10,
      height:  15,
      tiles:   [ // 01234567890123456789
          "          ", // 0
          "          ", // 1
          "          ", // 2
          " ###      ", // 3
          "         1", // 4
          "       ###", // 5
          "          ", // 6
          "          ", // 7
          "   ###    ", // 8
          "          ", // 9
          "          ", // 10
          " ##    ## ", // 11
          "      ####", // 12
          "0    #####", // 13
          "#   ######", // 14
      ].join("")}));

    levels.push(new Level({
      tileset: tileset,
      width:   20,
      height:  10,
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

  var tileInfoSky = {
    collisions: false,
  };

  var tileInfoWall = {
    collisions: true,
    color: "white",
    imgName: "brick",
  };

  var tileInfoTeleport0 = {
    collisions: false,
    teleport: true,
    dest: 0,
  };

  var tileInfoTeleport1 = {
    collisions: false,
    teleport: true,
    dest: 1,
  };

  var tileInfoTeleport2 = {
    collisions: false,
    teleport: true,
    dest: 2,
  };

  var tileInfoTeleport3 = {
    collisions: false,
    teleport: true,
    dest: 3,
  };

  var tileInfoTeleport4 = {
    collisions: false,
    teleport: true,
    dest: 4,
  };

  var tileInfoMap = {};
  tileInfoMap[Level.charToTileId[' '].tileId] = tileInfoSky;
  tileInfoMap[Level.charToTileId['#'].tileId] = tileInfoWall;
  tileInfoMap[Level.charToTileId['0'].tileId] = tileInfoTeleport0;
  tileInfoMap[Level.charToTileId['1'].tileId] = tileInfoTeleport1;
  tileInfoMap[Level.charToTileId['2'].tileId] = tileInfoTeleport2;
  tileInfoMap[Level.charToTileId['3'].tileId] = tileInfoTeleport3;
  tileInfoMap[Level.charToTileId['4'].tileId] = tileInfoTeleport4;

  var LevelManager = function(services, tileset) {
    this.services = services;
    this.tileset = tileset;
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
      level = largestLeve;
    }
    this.level = level;
    this.level.dirty = true;
  };

  LevelManager.prototype.getTileInfo = function(tileId) {
    return tileInfoMap[tileId] || { collisions: false };
  };

  LevelManager.prototype.getTileInfoByPixel = function(x, y) {
    var tileId = this.level.getTileByPixel(x, y);
    return this.getTileInfo(tileId);
  }

  LevelManager.prototype.draw = function(options) {
    this.level.draw(this, options);
  };

  LevelManager.prototype.getLevel = function() {
    return this.level;
  };

  LevelManager.prototype.getDrawOffset = function(obj) {
    this.level.getDrawOffset(obj);
  };

  LevelManager.prototype.getRandomOpenPosition = function() {
    var count = 0;
    var level = this.level;
    var found = false;
    while (!found) {
      var x = (2 + Misc.randInt(level.width  - 4)) * level.tileWidth;
      var y = (2 + Misc.randInt(level.height - 4)) * level.tileHeight;
      var tile = this.getTileInfoByPixel(x, y);
      found = !tile.collisions;
      if (++count > 10000) {
        throw("something's wrong with level data");
      }
    }
    return {x: x, y: y};
  };

  return LevelManager;
});

