5/*
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
  [ 'hft/commonui',
    'hft/gameclient',
    'hft/misc/input',
    'hft/misc/misc',
    'hft/misc/mobilehacks',
    'hft/misc/touch',
    '../bower_components/hft-utils/dist/audio',
    '../bower_components/hft-utils/dist/imageloader',
    '../bower_components/hft-utils/dist/imageutils',
    './canvas-wrapper',
  ], function(
    CommonUI,
    GameClient,
    Input,
    Misc,
    MobileHacks,
    Touch,
    AudioManager,
    ImageLoader,
    ImageUtils,
    CanvasWrapper) {
  var g_client;
  var g_audioManager;
  var g_clock;
  var g_grid;
  var g_instrument;
  var g_leftRight = 0;
  var g_oldLeftRight = 0;
  var g_jump = false;
  var g_avatar;
  var ctx;
  var g_canvas;
  var g_update;
  var g_oldOrientation;

  var globals = {
    debug: false,
  };
  Misc.applyUrlSettings(globals);
  MobileHacks.fixHeightHack();

  function $(id) {
    return document.getElementById(id);
  }

  var startClient = function() {

    g_canvas = $("buttons");
    ctx = CanvasWrapper.wrap(g_canvas.getContext("2d"));
    g_client = new GameClient();
//    $("foo").innerHTML = navigator.appVersion;

    //
    var handleScore = function() {
    };

    var handleDeath = function() {
    };

    var handleSetColor = function(msg) {
      var coloredImage = ImageUtils.adjustHSV(images.idle.img, msg.h, msg.s, msg.v, msg.range)
      var frame = ImageUtils.cropImage(coloredImage, 0, 0, 16, 16);
      var frame = ImageUtils.scaleImage(frame, 128, 128);
      g_avatar = frame;
      g_update = true;
    };

    g_client.addEventListener('score', handleScore);
    g_client.addEventListener('die', handleDeath);
    g_client.addEventListener('setColor', handleSetColor);

    var sounds = {};
    g_audioManager = new AudioManager(sounds);

    CommonUI.setupStandardControllerUI(g_client, globals);

    var handleLeftRight = function(pressed, bit) {
      g_leftRight = (g_leftRight & ~bit) | (pressed ? bit : 0);
      if (g_leftRight != g_oldLeftRight) {
        g_oldLeftRight = g_leftRight;
        g_client.sendCmd('move', {
            dir: (g_leftRight & 1) ? -1 : ((g_leftRight & 2) ? 1 : 0),
        });
      }
    };

    var handleJump = function(pressed) {
      if (g_jump != pressed) {
        g_jump = pressed;
        g_client.sendCmd('jump', {
            jump: pressed,
        });
      }
    };

    var keys = { };
    keys[Input.cursorKeys.kLeft]  = function(e) { handleLeftRight(e.pressed, 0x1); }
    keys[Input.cursorKeys.kRight] = function(e) { handleLeftRight(e.pressed, 0x2); }
    keys[Input.cursorKeys.kUp]    = function(e) { handleJump(e.pressed);           }
    keys["Z".charCodeAt(0)]       = function(e) { handleJump(e.pressed);           }
    Input.setupKeys(keys);

//    Touch.setupButtons({
//      inputElement: $("buttons"),
//      buttons: [
//        { element: $("left"),  callback: function(e) { handleLeftRight(e.pressed, 0x1); }, },
//        { element: $("right"), callback: function(e) { handleLeftRight(e.pressed, 0x2); }, },
//        { element: $("up"),    callback: function(e) { handleJump(e.pressed);           }, },
//      ],
//    });

document.addEventListener('touchstart', function(e) {
  e.preventDefault();
}, false);
//window.addEventListener('orientationchange', function(e) {
//  g_update = true;
//}, false);

    var pointers = {
    };

    var setPointer = function(id, pos) {
      var pointer = pointers[id];
      if (!pointer) {
        pointer = { };
        pointers[id] = pointer;
      }
      pointer.pos = pos;
      pointer.pressed = true;
    };

    var clearPointer = function(id, pos) {
      var pointer = pointers[id];
      if (!pointer) {
        pointer = { };
        pointers[id] = pointer;
      }
      pointer.pos = pos;
      pointer.pressed = false;
    };
window.p = pointers;
    $("buttons").addEventListener('pointerdown', function(e) {
      var pos = Input.getRelativeCoordinates(e.target, e);
      setPointer(e.pointerId, pos);
      g_update = true;
    }, false);

    $("buttons").addEventListener('pointermove', function(e) {
      var pos = Input.getRelativeCoordinates(e.target, e);
      setPointer(e.pointerId, pos);
      g_update = true;
    }, false);

    $("buttons").addEventListener('pointerup', function(e) {
      var pos = Input.getRelativeCoordinates(e.target, e);
      clearPointer(e.pointerId, pos);
      g_update = true;
    }, false);

    var hackedResizeBecauseFuckedupIOSSucksDonkeyShit = function(canvas) {
      var width  = window.innerWidth;
      var height = window.innerHeight;
      if (canvas.width != width || canvas.height != height) {
        canvas.width  = width;
        canvas.height = height;
        canvas.style.width  = width + "px";
        canvas.style.height = height + "px";
        return true;
      }
      return false;
    };

    var metalGrad = ctx.createLinearGradient(0.000, 98.000, 300.000, 202.00);

    // Add colors
    metalGrad.addColorStop(0.000, 'rgba(190, 190, 190, 1.000)');
    metalGrad.addColorStop(0.200, 'rgba(100, 100, 100, 1.000)');
    metalGrad.addColorStop(0.300, 'rgba(198, 198, 198, 1.000)');
    metalGrad.addColorStop(0.460, 'rgba(255, 255, 255, 1.000)');
    metalGrad.addColorStop(0.600, 'rgba(198, 198, 198, 1.000)');
    metalGrad.addColorStop(1.000, 'rgba(100, 100, 100, 1.000)');

    var inRect = function(ctx, width, height) {
      var inv = ctx.currentTransform.duplicate();
      inv.invert();
      for (var id in pointers) {
        if (pointers.hasOwnProperty(id)) {
          var p = pointers[id];
          if (p.pressed) {
            var pnt = inv.transformPoint(p.pos.x, p.pos.y);
            if (pnt[0] >= 0 && pnt[0] < width &&
                pnt[1] >= 0 && pnt[1] < height) {
              return true;
            }
          }
        }
      }
      return false;
    };

    var drawTriangle = function(ctx, width, height) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, -height / 2);
      ctx.lineTo(width,  height / 2);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.stroke();
    };

    var drawDepthRect = function(ctx, width, height, depth, strokeStyle, backStyle, frontStyle) {
      ctx.fillStyle = backStyle;
      ctx.strokeStyle = strokeStyle;
      ctx.beginPath();
      ctx.moveTo(width, 0);
      ctx.lineTo(width + depth, depth);
      ctx.lineTo(width + depth, height + depth);
      ctx.lineTo(depth, height + depth);
      ctx.lineTo(0, height);
      ctx.lineTo(width, 0);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width, height);
      ctx.lineTo(width + depth, height + depth);
      ctx.stroke();

      ctx.fillStyle = frontStyle;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeRect(0, 0, width, height);
    };

    var drawLRButton = function(ctx, width, height, depth) {
      // draw L-R button

      drawDepthRect(ctx, width, height, depth, "black", "gray", metalGrad);
      var inButton = inRect(ctx, width, height);

      ctx.fillStyle = inButton ? "red" : "black";
      ctx.strokeStyle = "none";

      ctx.save();
      ctx.translate(20, height / 2);
      drawTriangle(ctx, height * 0.6, height * 0.7);
      ctx.restore();

      ctx.save();
      ctx.translate(width - 20, height / 2);
      ctx.rotate(Math.PI);
      drawTriangle(ctx, height * 0.6, height * 0.7);
      ctx.restore();
    };

    var drawUpButton = function(ctx, width, height, depth) {
      drawDepthRect(ctx, width, height, depth, "black", "gray", metalGrad);
      var inButton = inRect(ctx, width, height);

      ctx.fillStyle = inButton ? "red" : "black";
      ctx.strokeStyle = "none";

      ctx.save();
      ctx.translate(width / 2, 20);
      ctx.rotate(Math.PI / 2);
      drawTriangle(ctx, height * 0.6, height * 0.7);
      ctx.restore();
    };

    var render = function() {

      g_update = hackedResizeBecauseFuckedupIOSSucksDonkeyShit(g_canvas) || g_update;

      if (window.orientation !== g_oldOrientation) {
        g_oldOrientation = window.orientation;
        g_update = true;
      }

      if (g_update) {
        g_update = false;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "yellow";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "blue";
        ctx.fillRect(5, 5, ctx.canvas.width - 10, ctx.canvas.height - 10);
        ctx.fillStyle = "white";
        var s = "w:" + window.innerWidth + "," + window.innerHeight + " s:" + window.screenX + "," + window.screenY +
          " atl: " +   window.screen.availLeft + "," + window.screen.availTop + " awh: " + window.screen.availWidth + "," + window.screen.availHeight +
          " or: " + window.orientation;
        ctx.fillText(s, 10, 20);
        ctx.fillText(JSON.stringify(pointers), 10, 40);

        // orientation:   0 = portrait
        //              -90 = rotate left
        //               90 = rotate right

        ctx.save();
        var virtualWidth;
        var virtualHeight;
        switch (window.orientation) {
          case 0:  // portrait
            virtualWidth = ctx.canvas.height;
            virtualHeight = ctx.canvas.width;
            ctx.translate(ctx.canvas.width - 1, 0);
            ctx.rotate(Math.PI / 2);
            break;
          case  90:  // rotate right
            virtualWidth = ctx.canvas.width;
            virtualHeight = ctx.canvas.height;
            //ctx.translate(ctx.canvas.width - 1, ctx.canvas.height - 1);
            //ctx.rotate(Math.PI);
            break;
          default:  // rotate left
            virtualWidth = ctx.canvas.width;
            virtualHeight = ctx.canvas.height;
            break;
        }

        var depth = 5;

        var xOffset  = 40;
        var lrWidth  = 250;
        var lrHeight = 100;
        var lrX      = xOffset;
        var lrY      = virtualHeight - 40 - lrHeight;
        var upWidth  = lrHeight;
        var upHeight = lrHeight;
        var upX      = virtualWidth - xOffset - upWidth;
        var upY      = lrY;

        var avatarWidth = 128;
        var avatarHeight = 128;
        var avatarX = lrX + lrWidth + (upX - (lrX + lrWidth)) / 2;
        var avatarY = lrY / 2 - avatarHeight / 2;

        if (g_avatar) {
          ctx.save();
          ctx.translate(avatarX, avatarY);
          ctx.drawImage(g_avatar, -avatarWidth / 2, 0, avatarWidth, avatarHeight);
          ctx.restore();
        }


        ctx.save();
        ctx.translate(lrX, lrY);
        drawLRButton(ctx, lrWidth, lrHeight, depth);
        ctx.restore();

        ctx.save();
        ctx.translate(upX, upY);
        drawUpButton(ctx, upWidth, upHeight, depth);
        ctx.restore();

        ctx.restore();

        ctx.fillStyle = "red";
        Object.keys(pointers).forEach(function(id) {
          var p = pointers[id];
          if (p.pressed) {
            ctx.fillRect(p.pos.x - 5, p.pos.y - 5, 10, 10);
          }
        });
      }
      requestAnimationFrame(render);
    };
    render();
  };

  var images = {
    idle:  { url: "assets/spr_idle.png", },
  };

  ImageLoader.loadImages(images, startClient);
});


