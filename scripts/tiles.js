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
    open: true,
  };

  var tileInfoWall = {
    collisions: true,
    lrCollision: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    rlCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
    udCollision: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    duCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
    lines: [
      [{x:  0, y:  0}, {x: 32, y:  0}],
      [{x: 32, y:  0}, {x: 32, y: 32}],
      [{x: 32, y: 32}, {x:  0, y: 32}],
      [{x:  0, y: 32}, {x:  0, y:  0}],
    ],
    color: "white",
    imgName: "brick",
  };

  var tileInfoOneWay = {
    collisions: true,
    udCollision: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    color: "white",
    imgName: "brick",
    lines: [
      [{x:  0, y:  0}, {x: 32, y:  0}],
    ],
  };

  var tileInfoSlippery = {
    stopFriction: 0.99,
    walkAcceleration: 200,
    collisions: true,
    lrCollision: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    rlCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
    udCollision: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    duCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
    lines: [
      [{x:  0, y:  0}, {x: 32, y:  0}],
      [{x: 32, y:  0}, {x: 32, y: 32}],
      [{x: 32, y: 32}, {x:  0, y: 32}],
      [{x:  0, y: 32}, {x:  0, y:  0}],
    ],
    color: "white",
    imgName: "brick",
  };

  var tileInfoSlipperyOneWay = {
    stopFriction: 0.99,
    walkAcceleration: 200,
    collisions: true,
    udCollision: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    color: "white",
    imgName: "brick",
    lines: [
      [{x:  0, y:  0}, {x: 32, y:  0}],
    ],
  };

  var tileInfoEnd = { thing: "end", id: 0, end: true, };

  var tileInfoDoor1 = { thing: "door", id: 0, };
  var tileInfoDoor2 = { thing: "door", id: 1, };
  var tileInfoDoor3 = { thing: "door", id: 2, };

  var tileInfoSwitch1 = { thing: "switch", id: 0, };
  var tileInfoSwitch2 = { thing: "switch", id: 1, };
  var tileInfoSwitch3 = { thing: "switch", id: 2, };

  var tileInfoTeleport0  = { thing: "teleport", teleport: true, dest: 0, subDest: 0, };
  var tileInfoTeleport1  = { thing: "teleport", teleport: true, dest: 1, subDest: 0, };
  var tileInfoTeleport2  = { thing: "teleport", teleport: true, dest: 2, subDest: 0, };
  var tileInfoTeleport3  = { thing: "teleport", teleport: true, dest: 3, subDest: 0, };
  var tileInfoTeleport0b = { thing: "teleport", teleport: true, dest: 0, subDest: 1, };
  var tileInfoTeleport1b = { thing: "teleport", teleport: true, dest: 1, subDest: 1, };
  var tileInfoTeleport2b = { thing: "teleport", teleport: true, dest: 2, subDest: 1, };
  var tileInfoTeleport3b = { thing: "teleport", teleport: true, dest: 3, subDest: 1, };
  var tileInfoTeleport0c = { thing: "teleport", teleport: true, dest: 0, subDest: 2, };
  var tileInfoTeleport1c = { thing: "teleport", teleport: true, dest: 1, subDest: 2, };
  var tileInfoTeleport2c = { thing: "teleport", teleport: true, dest: 2, subDest: 2, };
  var tileInfoTeleport3c = { thing: "teleport", teleport: true, dest: 3, subDest: 2, };
  var tileInfoTeleport0d = { thing: "teleport", teleport: true, dest: 0, subDest: 3, };
  var tileInfoTeleport1d = { thing: "teleport", teleport: true, dest: 1, subDest: 3, };
  var tileInfoTeleport2d = { thing: "teleport", teleport: true, dest: 2, subDest: 3, };
  var tileInfoTeleport3d = { thing: "teleport", teleport: true, dest: 3, subDest: 3, };

  var tileInfoLocalTeleport0 = { teleport: true, dest: 0, local: true, };
  var tileInfoLocalTeleport1 = { teleport: true, dest: 1, local: true, };
  var tileInfoLocalTeleport2 = { teleport: true, dest: 2, local: true, };
  var tileInfoLocalTeleport3 = { teleport: true, dest: 3, local: true, };

  var tileInfoLocalTeleportDest0 = { teleportDest: 0, local: true, };
  var tileInfoLocalTeleportDest1 = { teleportDest: 1, local: true, };
  var tileInfoLocalTeleportDest2 = { teleportDest: 2, local: true, };
  var tileInfoLocalTeleportDest3 = { teleportDest: 3, local: true, };

  var tileInfoTeleportDest0  = { teleportDest: 0, subDest: 0, };
  var tileInfoTeleportDest1  = { teleportDest: 1, subDest: 0, };
  var tileInfoTeleportDest2  = { teleportDest: 2, subDest: 0, };
  var tileInfoTeleportDest3  = { teleportDest: 3, subDest: 0, };
  var tileInfoTeleportDest0b = { teleportDest: 0, subDest: 1, };
  var tileInfoTeleportDest1b = { teleportDest: 1, subDest: 1, };
  var tileInfoTeleportDest2b = { teleportDest: 2, subDest: 1, };
  var tileInfoTeleportDest3b = { teleportDest: 3, subDest: 1, };
  var tileInfoTeleportDest0c = { teleportDest: 0, subDest: 2, };
  var tileInfoTeleportDest1c = { teleportDest: 1, subDest: 2, };
  var tileInfoTeleportDest2c = { teleportDest: 2, subDest: 2, };
  var tileInfoTeleportDest3c = { teleportDest: 3, subDest: 2, };
  var tileInfoTeleportDest0d = { teleportDest: 0, subDest: 3, };
  var tileInfoTeleportDest1d = { teleportDest: 1, subDest: 3, };
  var tileInfoTeleportDest2d = { teleportDest: 2, subDest: 3, };
  var tileInfoTeleportDest3d = { teleportDest: 3, subDest: 3, };

  var tileSlope45L = {
    collisions: true,
    slopeLeft: true,
    lrCollision: [31,30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0],
    rlCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
    udCollision: [31,30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0],
    duCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
    lines: [
      [{x:  0, y: 32}, {x: 32, y:  0}],
      [{x: 32, y:  0}, {x: 32, y: 32}],
      [{x: 32, y: 32}, {x:  0, y: 32}],
    ],
  };

  var tileSlope45R = {
    collisions: true,
    slopeRight: true,
    lrCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
    rlCollision: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
    udCollision: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
    duCollision: [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
    lines: [
      [{x:  0, y:  0}, {x: 32, y: 32}],
      [{x: 32, y: 32}, {x:  0, y: 32}],
      [{x:  0, y: 32}, {x:  0, y:  0}],
    ],
  };

  var nullTile = {
    collisions: false,
  };

  var tileInfos = [
    tileInfoSky,             //  0
    tileInfoWall,            //  1 solid
    tileInfoEnd,             //  2 end
    nullTile,                //  3
    nullTile,                //  4
    nullTile,                //  5
    tileInfoOneWay,          //  6 up-through
    tileInfoDoor1,           //  7 door1
    tileInfoDoor2,           //  8 door2
    tileInfoDoor3,           //  9 door3
    tileInfoSwitch1,         // 10 switch1
    tileInfoSwitch2,         // 11 switch2
    tileInfoSwitch3,         // 12 switch3
    nullTile,                // 13
    tileInfoSlippery,        //  14 solid-ice
    tileInfoSlipperyOneWay,  //  15 up-through-ice

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

    tileInfoTeleport0,   // 0x20
    tileInfoTeleport1,   // 0x21
    tileInfoTeleport2,   // 0x22
    tileInfoTeleport3,   // 0x23
    tileInfoTeleport0b,  // 0x24
    tileInfoTeleport1b,  // 0x25
    tileInfoTeleport2b,  // 0x26
    tileInfoTeleport3b,  // 0x27
    tileInfoTeleport0c,  // 0x28
    tileInfoTeleport1c,  // 0x29
    tileInfoTeleport2c,  // 0x2A
    tileInfoTeleport3c,  // 0x2B
    tileInfoTeleport0d,  // 0x2C
    tileInfoTeleport1d,  // 0x2D
    tileInfoTeleport2d,  // 0x2E
    tileInfoTeleport3d,  // 0x2F

    tileInfoTeleportDest0,   // 0x30
    tileInfoTeleportDest1,   // 0x31
    tileInfoTeleportDest2,   // 0x32
    tileInfoTeleportDest3,   // 0x33
    tileInfoTeleportDest0b,  // 0x34
    tileInfoTeleportDest1b,  // 0x35
    tileInfoTeleportDest2b,  // 0x36
    tileInfoTeleportDest3b,  // 0x37
    tileInfoTeleportDest0c,  // 0x38
    tileInfoTeleportDest1c,  // 0x39
    tileInfoTeleportDest2c,  // 0x3A
    tileInfoTeleportDest3c,  // 0x3B
    tileInfoTeleportDest0d,  // 0x3C
    tileInfoTeleportDest1d,  // 0x3D
    tileInfoTeleportDest2d,  // 0x3E
    tileInfoTeleportDest3d,  // 0x3F

    tileInfoLocalTeleport0,   // 0x40
    tileInfoLocalTeleport1,   // 0x41
    tileInfoLocalTeleport2,   // 0x42
    tileInfoLocalTeleport3,   // 0x43
    nullTile,            // 0x44
    nullTile,            // 0x45
    nullTile,            // 0x46
    nullTile,            // 0x47
    nullTile,            // 0x48
    nullTile,            // 0x49
    nullTile,            // 0x4A
    nullTile,            // 0x4B
    nullTile,            // 0x4C
    nullTile,            // 0x4D
    nullTile,            // 0x4E
    nullTile,            // 0x4F

    tileInfoLocalTeleportDest0,   // 0x50
    tileInfoLocalTeleportDest1,   // 0x51
    tileInfoLocalTeleportDest2,   // 0x52
    tileInfoLocalTeleportDest3,   // 0x53
    nullTile,            // 0x54
    nullTile,            // 0x55
    nullTile,            // 0x56
    nullTile,            // 0x57
    nullTile,            // 0x58
    nullTile,            // 0x59
    nullTile,            // 0x5A
    nullTile,            // 0x5B
    nullTile,            // 0x5C
    nullTile,            // 0x5D
    nullTile,            // 0x5E
    nullTile,            // 0x5F
  ];

  var getInfo = function(tileId) {
    return tileInfos[tileId] || tileInfoWall;
  };

  return {
    getInfo: getInfo,
  };
});



