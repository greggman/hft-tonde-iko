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

  var lrSolidCollision = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var rlSolidCollision = [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31];
  var udSolidCollision = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var duSolidCollision = [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31];
  var solidLines = [
    [{x:  0, y:  0}, {x: 32, y:  0}],
    [{x: 32, y:  0}, {x: 32, y: 32}],
    [{x: 32, y: 32}, {x:  0, y: 32}],
    [{x:  0, y: 32}, {x:  0, y:  0}],
  ];

  // NOTE: These collisions don't match up. The LR collisions go from 8-31
  // but the UD collisions go from 16-31
  var lrLowerHalfSolidCollision = [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var rlLowerHalfSolidCollision = [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31];
  var lrLowerHalfSolidCollision = [-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var rlLowerHalfSolidCollision = [-1,-1,-1,-1,-1,-1,-1,-1,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31];
  var udLowerHalfSolidCollision = [16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16];
  var duLowerHalfSolidCollision = [31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31];
  var lowerHalfSolidLines = [
    [{x:  0, y: 15}, {x: 32, y: 15}],
    [{x: 32, y: 15}, {x: 32, y: 32}],
    [{x: 32, y: 32}, {x:  0, y: 32}],
    [{x:  0, y: 32}, {x:  0, y: 15}],
  ];


  var tileInfoSky = {
    collisions: false,
    open: true,
  };

  var tileInfoEdge = {
    solidForAI: true,
  };

  var tileInfoLadder = {
    collisions: false,
    open: true,
    ladder: true,
  };

  var tileInfoWall = {
    collisions: true,
    solidForAI: true,
    lrCollision: lrSolidCollision,
    rlCollision: rlSolidCollision,
    udCollision: udSolidCollision,
    duCollision: duSolidCollision,
    lines: solidLines,
    color: "white",
    imgName: "brick",
  };

  var tileInfoOneWay = {
    collisions: true,
    solidForAI: true,
    sideBits: 0x8,  // UDLR
    oneWay: true,
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
    solidForAI: true,
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
    sideBits: 0x8,  // UDLR
    oneWay: true,
    solidForAI: true,
    udCollision: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    color: "white",
    imgName: "brick",
    lines: [
      [{x:  0, y:  0}, {x: 32, y:  0}],
    ],
  };

  var tileInfoEnd = { teleport: true, thing: "end", id: 0, end: true, };

  var tileInfoDoor1 = {
    thing: "door", id: 0, collisions: true,
    solidForAI: true,
    lrCollision: lrSolidCollision,
    rlCollision: rlSolidCollision,
    udCollision: udSolidCollision,
    duCollision: duSolidCollision,
    lines: solidLines,
  };
  var tileInfoDoor2 = {
    thing: "door", id: 1, collisions: true,
    solidForAI: true,
    lrCollision: lrSolidCollision,
    rlCollision: rlSolidCollision,
    udCollision: udSolidCollision,
    duCollision: duSolidCollision,
    lines: solidLines,
  };
  var tileInfoDoor3 = {
    thing: "door", id: 2, collisions: true,
    solidForAI: true,
    lrCollision: lrSolidCollision,
    rlCollision: rlSolidCollision,
    udCollision: udSolidCollision,
    duCollision: duSolidCollision,
    lines: solidLines,
  };

  var switchTop = 7;
  var switchFriction = 0.5;
  var tileInfoSwitch1 = {
    thing: "switch", id: 0, collisions: true,
    top: switchTop,
    stopFriction: switchFriction,
    solidForAI: true,
    lrCollision: lrLowerHalfSolidCollision,
    rlCollision: rlLowerHalfSolidCollision,
    udCollision: udLowerHalfSolidCollision,
    duCollision: duLowerHalfSolidCollision,
    lines: lowerHalfSolidLines,
  };
  var tileInfoSwitch2 = {
    thing: "switch", id: 1, collisions: true,
    solidForAI: true,
    top: switchTop,
    stopFriction: switchFriction,
    lrCollision: lrLowerHalfSolidCollision,
    rlCollision: rlLowerHalfSolidCollision,
    udCollision: udLowerHalfSolidCollision,
    duCollision: duLowerHalfSolidCollision,
    lines: lowerHalfSolidLines,
  };
  var tileInfoSwitch3 = {
    thing: "switch", id: 2, collisions: true,
    solidForAI: true,
    top: switchTop,
    stopFriction: switchFriction,
    lrCollision: lrLowerHalfSolidCollision,
    rlCollision: rlLowerHalfSolidCollision,
    udCollision: udLowerHalfSolidCollision,
    duCollision: duLowerHalfSolidCollision,
    lines: lowerHalfSolidLines,
  };

  var tileInfoSuperCoin = { thing: "supercoin", id: 0, };
  var tileInfoBall = { thing: "ball", id: 0, };
  var tileInfoCoinGen = { thing: "coingen", id: 0, };
  var tileInfoFlyingPortal0 = { thing: "flyingportal", id: 0, dest: 0};
  var tileInfoFlyingPortal1 = { thing: "flyingportal", id: 0, dest: 1};
  var tileInfoFlyingPortal2 = { thing: "flyingportal", id: 0, dest: 2};
  var tileInfoFlyingPortal3 = { thing: "flyingportal", id: 0, dest: 3};
  var tileInfoCandle = { thing: "candle", id: 0, };
  var tileInfoGift = {   collisions: false,
    open: false, gift:true, };

  var tileInfoArea1 = { open: true, thing: "area", id: 0, };
  var tileInfoArea2 = { open: true, thing: "area", id: 1, };
  var tileInfoArea3 = { open: true, thing: "area", id: 2, };

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

  var tileInfoLocalTeleport0 = { thing: "teleport", teleport: true, dest: 0, local: true, open: true}; // to allow coins from balls to go through it.
  var tileInfoLocalTeleport1 = { thing: "teleport", teleport: true, dest: 1, local: true, };
  var tileInfoLocalTeleport2 = { thing: "teleport", teleport: true, dest: 2, local: true, };
  var tileInfoLocalTeleport3 = { thing: "teleport", teleport: true, dest: 3, local: true, };

  var tileInfoLocalTeleportDest0 = { thing: "teleportDest", teleportDest: 0, local: true, };
  var tileInfoLocalTeleportDest1 = { thing: "teleportDest", teleportDest: 1, local: true, };
  var tileInfoLocalTeleportDest2 = { thing: "teleportDest", teleportDest: 2, local: true, };
  var tileInfoLocalTeleportDest3 = { thing: "teleportDest", teleportDest: 3, local: true, };

  var tileInfoTeleportDest0  = { thing: "teleportDest", teleportDest: 0, subDest: 0, };
  var tileInfoTeleportDest1  = { thing: "teleportDest", teleportDest: 1, subDest: 0, };
  var tileInfoTeleportDest2  = { thing: "teleportDest", teleportDest: 2, subDest: 0, };
  var tileInfoTeleportDest3  = { thing: "teleportDest", teleportDest: 3, subDest: 0, };
  var tileInfoTeleportDest0b = { thing: "teleportDest", teleportDest: 0, subDest: 1, };
  var tileInfoTeleportDest1b = { thing: "teleportDest", teleportDest: 1, subDest: 1, };
  var tileInfoTeleportDest2b = { thing: "teleportDest", teleportDest: 2, subDest: 1, };
  var tileInfoTeleportDest3b = { thing: "teleportDest", teleportDest: 3, subDest: 1, };
  var tileInfoTeleportDest0c = { thing: "teleportDest", teleportDest: 0, subDest: 2, };
  var tileInfoTeleportDest1c = { thing: "teleportDest", teleportDest: 1, subDest: 2, };
  var tileInfoTeleportDest2c = { thing: "teleportDest", teleportDest: 2, subDest: 2, };
  var tileInfoTeleportDest3c = { thing: "teleportDest", teleportDest: 3, subDest: 2, };
  var tileInfoTeleportDest0d = { thing: "teleportDest", teleportDest: 0, subDest: 3, };
  var tileInfoTeleportDest1d = { thing: "teleportDest", teleportDest: 1, subDest: 3, };
  var tileInfoTeleportDest2d = { thing: "teleportDest", teleportDest: 2, subDest: 3, };
  var tileInfoTeleportDest3d = { thing: "teleportDest", teleportDest: 3, subDest: 3, };

  var tileSlope45L = {
    collisions: true,
    solidForAI: true,
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
    solidForAI: true,
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
    tileInfoLadder,          //  3 ladder
    tileInfoCoinGen,         //  4
    tileInfoBall,            //  5 ball
    tileInfoOneWay,          //  6 up-through
    tileInfoDoor1,           //  7 door1
    tileInfoDoor2,           //  8 door2
    tileInfoDoor3,           //  9 door3
    tileInfoSwitch1,         // 10 switch1
    tileInfoSwitch2,         // 11 switch2
    tileInfoSwitch3,         // 12 switch3
    tileInfoEdge,            // 13 used for off the edge of the level left or right
    tileInfoSlippery,        // 14 solid-ice
    tileInfoSlipperyOneWay,  // 15 up-through-ice

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
    tileInfoArea1,            // 0x44
    tileInfoArea2,            // 0x45
    tileInfoArea3,            // 0x46
    tileInfoGift,             // 0x47
    tileInfoCandle,           // 0x48
    tileInfoFlyingPortal0,    // 0x49
    tileInfoFlyingPortal1,    // 0x4A
    tileInfoFlyingPortal2,    // 0x4B
    tileInfoFlyingPortal3,    // 0x4C
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



