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

// Start the main app logic.
requirejs(
  [ 'hft/misc/misc',
    '../bower_components/hft-utils/dist/imageloader',
    '../bower_components/hft-utils/dist/imageutils',
    './avatars',
    './canvas-utils',
    './image-cutter',
  ], function(
    Misc,
    ImageLoader,
    ImageUtils,
    avatars,
    CanvasUtils,
    ImageCutter) {
  var g_state = "select";
  var g_client;
  var g_audioManager;
  var g_avatarImage;
  var g_avatar;
  var ctx;
  var g_canvas;
  var g_update;
  var g_oldAvatarButton = [];

  function $(id) {
    return document.getElementById(id);
  }

  var globals = {
    debug: false,
  };
  Misc.applyUrlSettings(globals);

  globals.save = {
    avatar: Misc.randInt(avatars.length),
    name: String.fromCharCode(Misc.randInt(26) + 0x41, Misc.randInt(26) + 0x41),
    color: {
      h: 0,
      s: 0,
      v: 0,
    },
  };
  g_avatar = avatars[globals.save.avatar];

  var startClient = function() {

    var maxWidth = 0;
    var maxHeight = 0;
    avatars.forEach(function(avatar) {
      var name = avatar.name + "-idle";
      ImageCutter.cutImage(images[name], { numFrames: 1 });
      avatar.idleImg = images[name].frames[0];
      maxWidth = Math.max(avatar.idleImg.width * avatar.scale, maxWidth);
      maxHeight = Math.max(avatar.idleImg.height * avatar.scale, maxHeight);
    });

    g_canvas = $("c");
    g_canvas.style.border = "1px solid black";
    g_canvas.style.backgroundColor = "#444";
    g_canvas.width = maxWidth * avatars.length;
    g_canvas.height = maxHeight + 2;
    ctx = g_canvas.getContext("2d");

    avatars.forEach(function(avatar, ndx) {
      ctx.save()
      ctx.translate(ndx * maxWidth, 0);
//      ctx.fillStyle = ndx % 2 ? "red" : "blue";
//      ctx.fillRect(0, 0, maxWidth, ctx.canvas.height);
      ctx.translate(maxWidth / 2, maxHeight);
      var img = avatar.idleImg;
      ctx.scale(avatar.scale, avatar.scale);
      ctx.translate(img.width / -2, -img.height);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    });

  };

  var images = { };

  avatars.forEach(function(avatar) {
    var name = avatar.name + "-idle";
    var idle = avatar.anims.idle;
    if (idle.urls) {
      var p = { url: idle.urls[0] };
      images[name] = p
      avatar.anims.idle = p;
    } else {
      images[name] = idle;
    }
  });

  ImageLoader.loadImages(images, startClient);
});



