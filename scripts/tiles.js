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
  ], function() {



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

  var tileInfoTeleportDest0 = {
    collisions: false,
    teleportDest: 0,
  };

  var tileInfoTeleportDest1 = {
    collisions: false,
    teleportDest: 1,
  };

  var tileInfoTeleportDest2 = {
    collisions: false,
    teleportDest: 2,
  };

  var tileInfoTeleportDest3 = {
    collisions: false,
    teleportDest: 3,
  };

  var tileSlope45L = {
    collisions: true,
    slopeLeft: true,
    lrCollision: [31,30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0],
    rlCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
    udCollision: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
    duCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
  };

  var tileSlope45R = {
    collisions: true,
    slopeRight: true,
    lrCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
    rlCollision: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
    udCollision: [31,30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0],
    duCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
  };

  var nullTile = {
    collisions: false,
  };

  var tileInfos = [
    tileInfoSky,        //  0
    tileInfoWall,       //  1
    tileInfoTeleport0,  //  2
    tileInfoTeleport1,  //  3
    tileInfoTeleport2,  //  4
    tileInfoTeleport3,  //  5
    nullTile, //  6 up-through
    nullTile, //  7 door
    nullTile, //  8 solid-ice
    nullTile, //  9 up-through-ice
    nullTile, // 10
    nullTile, // 11
    nullTile, // 12
    nullTile, // 13
    nullTile, // 14,
    nullTile, // 15,
    tileSlope45L, // 16 slope 45 left
    tileSlope45R, // 17 slope 45 right
    nullTile, // 18 slope 22 left 1-2
    nullTile, // 19 slope 22 left 2-2
    nullTile, // 20 slope 22 right 1-2
    nullTile, // 21 slope 22 right 2-2
    nullTile, // 22 slope 12 left 1-4
    nullTile, // 23 slope 12 left 2-4
    nullTile, // 24 slope 12 left 3-4
    nullTile, // 25 slope 12 left 4-4
    nullTile, // 26 slope 12 right 1-4
    nullTile, // 27 slope 12 right 2-4
    nullTile, // 28 slope 12 right 3-4
    nullTile, // 29 slope 12 right 4-4
    nullTile, // 30
    nullTile, // 31
    nullTile, // 32
    nullTile, // 33
    tileInfoTeleportDest0, // teleport dest 0
    tileInfoTeleportDest1, // teleport dest 1
    tileInfoTeleportDest2, // teleport dest 2
    tileInfoTeleportDest3, // teleport dest 3
  ];

  var getInfo = function(tileId) {
    return tileInfos[tileId] || tileInfoWall;
  };

  return {
    getInfo: getInfo,
  };
});



