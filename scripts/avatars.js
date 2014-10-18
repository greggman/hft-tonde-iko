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
    { name: "wasler",
      baseColor: [0xFF,0x00,0x00],
      range: [0.00, 0.02],
      scale: 0.5,
      idleAnimSpeed: 4,
      moveAnimSpeed: 0.2,
      filter: false,
      anims: {
        move: {
          urls: [
            "assets/avatars/wasler/walk/r/1.png",
            "assets/avatars/wasler/walk/r/2.png",
            "assets/avatars/wasler/walk/r/3.png",
          ],
        },
        idle: {
          urls: [
            "assets/avatars/wasler/idle/r/1.png",
            "assets/avatars/wasler/idle/r/2.png",
            "assets/avatars/wasler/idle/r/3.png",
          ],
        },
        jump: {
          urls: [
            "assets/avatars/wasler/jump/r/1.png",
            "assets/avatars/wasler/jump/r/2.png",
            "assets/avatars/wasler/jump/r/3.png",
          ],
        },
      },
    },
    { name: "sara",
      baseColor: [0x25,0x41,0x89],
      range: [0.2, 0.9],
      scale: 0.5,
      idleAnimSpeed: 4,
      moveAnimSpeed: 0.2,
      filter: false,
      anims: {
        move: {
          urls: [
            "assets/avatars/sara/walk/r/1.png",
            "assets/avatars/sara/walk/r/2.png",
            "assets/avatars/sara/walk/r/3.png",
          ],
        },
        idle: {
          urls: [
            "assets/avatars/sara/idle/r/1.png",
            "assets/avatars/sara/idle/r/2.png",
            "assets/avatars/sara/idle/r/3.png",
          ],
        },
        jump: {
          urls: [
            "assets/avatars/sara/jump/r/1.png",
            "assets/avatars/sara/jump/r/2.png",
            "assets/avatars/sara/jump/r/3.png",
          ],
        },
      },
    },
    { name: "gnu",
      baseColor: [0xB6, 0x7A, 0x3D],
      range: [0, 0.05],
      scale: 0.5,
      idleAnimSpeed: 4,
      moveAnimSpeed: 0.2,
      filter: false,
      anims: {
        move: {
          urls: [
            "assets/avatars/gnu/walk/r/1.png",
            "assets/avatars/gnu/walk/r/2.png",
            "assets/avatars/gnu/walk/r/3.png",
          ],
        },
        idle: {
          urls: [
            "assets/avatars/gnu/idle/r/1.png",
            "assets/avatars/gnu/idle/r/2.png",
            "assets/avatars/gnu/idle/r/3.png",
          ],
        },
        jump: {
          urls: [
            "assets/avatars/gnu/jump/r/1.png",
            "assets/avatars/gnu/jump/r/2.png",
            "assets/avatars/gnu/jump/r/3.png",
          ],
        },
      },
    },
    { name: "wilber",
      baseColor: [0x6D,0x4C,0x10],
      range: [0.1, 0.2],
      scale: 0.5,
      idleAnimSpeed: 4,
      moveAnimSpeed: 0.2,
      filter: false,
      anims: {
        move: {
          urls: [
            "assets/avatars/wilber/walk/r/1.png",
            "assets/avatars/wilber/walk/r/2.png",
            "assets/avatars/wilber/walk/r/3.png",
          ],
        },
        idle: {
          urls: [
            "assets/avatars/wilber/idle/r/1.png",
            "assets/avatars/wilber/idle/r/2.png",
            "assets/avatars/wilber/idle/r/3.png",
          ],
        },
        jump: {
          urls: [
            "assets/avatars/wilber/jump/r/1.png",
            "assets/avatars/wilber/jump/r/2.png",
            "assets/avatars/wilber/jump/r/3.png",
          ],
        },
      },
    },
    { name: "kisi",
      baseColor: [0x00,0x32,0x66],
      range: [0.5, 1],
      scale: 0.5,
      idleAnimSpeed: 4,
      moveAnimSpeed: 0.2,
      filter: false,
      anims: {
        move: {
          urls: [
            "assets/avatars/kisi/walk/r/1.png",
            "assets/avatars/kisi/walk/r/2.png",
            "assets/avatars/kisi/walk/r/3.png",
          ],
        },
        idle: {
          urls: [
            "assets/avatars/kisi/idle/r/1.png",
            "assets/avatars/kisi/idle/r/2.png",
            "assets/avatars/kisi/idle/r/3.png",
          ],
        },
        jump: {
          urls: [
            "assets/avatars/kisi/jump/r/1.png",
            "assets/avatars/kisi/jump/r/2.png",
            "assets/avatars/kisi/jump/r/3.png",
          ],
        },
      },
    },
    { name: "tux",
      baseColor: [0xFF,0xA4,0x04],
      range: [0.05, 1],
      scale: 0.5,
      idleAnimSpeed: 4,
      moveAnimSpeed: 0.2,
      filter: false,
      anims: {
        move: {
          urls: [
            "assets/avatars/tux/walk/r/1.png",
            "assets/avatars/tux/walk/r/2.png",
            "assets/avatars/tux/walk/r/3.png",
          ],
        },
        idle: {
          urls: [
            "assets/avatars/tux/idle/r/1.png",
            "assets/avatars/tux/idle/r/2.png",
            "assets/avatars/tux/idle/r/3.png",
          ],
        },
        jump: {
          urls: [
            "assets/avatars/tux/jump/r/1.png",
            "assets/avatars/tux/jump/r/2.png",
            "assets/avatars/tux/jump/r/3.png",
          ],
        },
      },
    },
    { name: "kit",
      baseColor: [0xFF,0x57,0x00],
      range: [0, 1],
      scale: 0.5,
      idleAnimSpeed: 4,
      moveAnimSpeed: 0.2,
      filter: false,
      anims: {
        move: {
          urls: [
            "assets/avatars/kit/walk/r/1.png",
            "assets/avatars/kit/walk/r/2.png",
            "assets/avatars/kit/walk/r/3.png",
          ],
        },
        idle: {
          urls: [
            "assets/avatars/kit/idle/r/1.png",
            "assets/avatars/kit/idle/r/2.png",
            "assets/avatars/kit/idle/r/3.png",
          ],
        },
        jump: {
          urls: [
            "assets/avatars/kit/jump/r/1.png",
            "assets/avatars/kit/jump/r/2.png",
            "assets/avatars/kit/jump/r/3.png",
          ],
        },
      },
    },
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
        move: { url: "assets/avatars/blocky/blocky_walkright.png", scale: 2, slices: 17, },
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


