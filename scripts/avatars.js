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
    '../bower_components/hft-utils/dist/imageutils',
  ], function(ImageUtils) {

  var avatars = [
    { name: "blocky",
      baseColor: [0x17, 0x7C, 0x69],  // the base color of the part that changes colors
      range: [0.4, 0.6],              // the hue range to adjust. Only hues in this range will be affected
      scale: 1,                       // Can be used to slightly scale a sprite that's too small
      idleAnimSpeed: 4,
      moveAnimSpeed: 0.2,

      // for the animations:
      //   scale:  how much to scale UP the sprite using nearest neighbor
      //   slices: how large each slice is before it's scaled. Now this can also be an array
      //           in which case each entry is the width of a slice starting from the left.
      //   if slices is NOT specifed the entire file is just one frame.

      anims: {
        move: { url: "assets/avatars/blocky/blocky_walkright.png", scale: 2, slices: 16, },
        idle: { url: "assets/avatars/blocky/blocky_right.png",     scale: 2, slices: 16, },
        jump: { url: "assets/avatars/blocky/blocky_walkright.png", scale: 2, slices: 16, },
      },
    },
    { name: "miyamoto",
      baseColor: [0x8A, 0x56, 0x24],
      range: [0.078, 0.1],
      scale: 32/27,
      idleAnimSpeed: 4,
      moveAnimSpeed: 0.2,
      anims: {
        move: { url: "assets/avatars/miyamoto/run.png", scale: 1, slices: 20, },
        idle: { url: "assets/avatars/miyamoto/idle.png", },
        jump: { url: "assets/avatars/miyamoto/jump.png", scale: 1, slices: 19, },
      },
    },
    { name: "bird",
      baseColor: [0x00, 0x98, 0xCC],
      range: [180 / 360, 275 / 360],  // color range for colorizing duck but not beak
      scale: 1,
      idleAnimSpeed: 4,
      moveAnimSpeed: 0.1,
      anims: {
        idle:  { url: "assets/spr_idle.png",    scale: 2, slices: 16, },
        move:  { url: "assets/spr_run.png",     scale: 2, slices: 16, },
        jump:  { url: "assets/spr_jump.png",    scale: 2, slices: [16, 17, 17, 18, 16, 16] },
      },
    },
  ];

  avatars.forEach(function(avatar) {
    var c = avatar.baseColor;
    avatar.baseHSV = ImageUtils.rgbToHsv(c[0], c[1], c[2]);
  });

  return avatars;
});


