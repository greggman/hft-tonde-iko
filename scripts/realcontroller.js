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
define(
  [ 'hft/commonui',
    'hft/gameclient',
    'hft/misc/cookies',
    'hft/misc/gameclock',
    'hft/misc/input',
    'hft/misc/misc',
    'hft/misc/mobilehacks',
    'hft/misc/touch',
    '../bower_components/hft-utils/dist/audio',
    '../bower_components/hft-utils/dist/imageloader',
    '../bower_components/hft-utils/dist/imageutils',
    './avatars',
    './canvas-utils',
    './canvas-wrapper',
    './image-cutter',
  ], function(
    CommonUI,
    GameClient,
    Cookie,
    GameClock,
    Input,
    Misc,
    MobileHacks,
    Touch,
    AudioManager,
    ImageLoader,
    ImageUtils,
    avatars,
    CanvasUtils,
    CanvasWrapper,
    ImageCutter) {
  var g_state = "select";
  var g_client;
  var g_audioManager;
  var g_clock = new GameClock();
  var g_elapsedTime;
  var g_grid;
  var g_instrument;
  var g_leftRight = 0;
  var g_oldLeftRight = 0;
  var g_pointDuration = 1;
  var g_jump = false;
  var g_avatarImage;
  var g_avatar;
  var ctx;
  var g_canvas;
  var g_update;
  var g_oldOrientation;
  var g_spinner;
  var g_score = 0;
  var g_playerCookie = new Cookie("hft-tondeiko-player");
  var g_points = [];
  var g_oldLetter = [
    {},
    {},
  ];
  var g_oldAvatarButton = [];

  function $(id) {
    return document.getElementById(id);
  }

  // check for old android
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  var isaosp = (rxaosp && rxaosp[1]<537);

  if (isaosp) {
    $("android").style.display = "block";
    return;
  }

  var globals = {
    debug: false,
  };
  Misc.applyUrlSettings(globals);
  MobileHacks.fixHeightHack();

  var assert = function(g) {
    if (!g) {
      throw "assert";
    }
  };

  var assert01 = function(v) {
    assert(typeof(v) === 'number');
    assert(v >= 0 && v <= 1);
  };

  var preventStuff = function(e) {
      e.preventDefault();
  };

  var disableTouch = function() {
    document.addEventListener('touchstart', preventStuff, false);
  };
  var enableTouch = function() {
    document.removeEventListener('touchstart', preventStuff, false);
  };
  disableTouch();

  var readCookie = function() {
    var s = g_playerCookie.get();
    try {
      var d = JSON.parse(s);
      assert(typeof d.avatar == 'number');
      assert(d.avatar >= 0 && d.avatar < avatars.length);
      assert(typeof d.name == 'string');
      assert(d.name.length == 2);
      assert(d.name.substr(0, 1) >= 'A' && d.name.substr(0, 1) <= 'Z');
      assert(d.name.substr(1, 1) >= 'A' && d.name.substr(1, 1) <= 'Z');
      assert01(d.color.h);
      assert01(d.color.s);
      assert01(d.color.v);
      globals.save = d;
    }  catch (e) {
      console.error("bad cookie: " + s);
      console.error(e);
      globals.save = {
        avatar: Misc.randInt(avatars.length),
        name: String.fromCharCode(Misc.randInt(26) + 0x41, Misc.randInt(26) + 0x41),
        color: {
          h: Math.random(),
          s: 0,
          v: 0,
        },
      };
    }
    g_avatar = avatars[globals.save.avatar];
  };

  var saveCookie = function() {
    g_playerCookie.set(JSON.stringify(globals.save), 1000);
  };

  readCookie();

  var startClient = function() {

    g_canvas = $("buttons");
    ctx = CanvasWrapper.wrap(g_canvas.getContext("2d"));
    g_client = new GameClient();

    var handleScore = function(data) {
      g_points.push({
        time: 0,
        points: data.points,
        x: Math.random() * 64 - 32,
        y: Math.random() * 10,
        xv: Math.random() * 40 - 20,
        yv: Math.random() * 30 - 60,
      });
      g_score += data.points;
      g_update = true;
      g_audioManager.playSound('coin');
    };

    var handleDone2 = function() {
      $("end0").style.display = "none";
      $("end1").style.display = "block";
      $("next1").addEventListener('click', function() {
        window.location.reload();
      }, false);
    };

    var handleDone = function(data) {
      MobileHacks.fixHeightHack();
      enableTouch();
      $("end0").style.display = "block";
      $("score").appendChild(document.createTextNode(data.score));
      $("next0").addEventListener('click', handleDone2, false);
      data.places.forEach(function(place, ndx) {
        $("rank" + ndx).appendChild(document.createTextNode(place + 1));
      });
      var ctx = $("avatar").getContext("2d");
      ctx.save();
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
      drawAvatar(ctx);
      ctx.restore();
    };

    var drawAvatar = function(ctx) {
      ctx.scale(0.5, 0.5);
      ctx.translate(-g_avatarImage.width / 2, -g_avatarImage.height / 2);
      ctx.drawImage(g_avatarImage, 0, 0);
    };

    var makeAvatar = function() {
      var srcImg = images.avatars.img;
      var width  = srcImg.width / avatars.length;
      var height = srcImg.height;
      var img = ImageUtils.cropImage(srcImg, width * globals.save.avatar, 0, width, height);
      img = ImageUtils.adjustHSV(img, globals.save.color.h, globals.save.color.s, globals.save.color.v, g_avatar.range);
      g_avatarImage = ImageUtils.scaleImage(img, img.width * 4, img.height * 4);
      saveCookie();
    };

    g_client.addEventListener('score', handleScore);
    g_client.addEventListener('done', handleDone);
    makeAvatar();

    // test done
    //handleDone({places: [4343, 3, 5455]});

    var sounds = {
      coin:              { jsfx: ["square",0.0000,0.4000,0.0000,0.0240,0.4080,0.3480,20.0000,909.0000,2400.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.2540,0.1090,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    };
    g_audioManager = new AudioManager(sounds);

    CommonUI.setupStandardControllerUI(g_client, globals);

    var g_oldDir;
    var sendDirCmd = function(dir) {
      if (dir !== g_oldDir) {
        g_oldDir = dir;
        g_client.sendCmd('move', {
            dir: dir,
        });
      }
    };

    var newestTouchBits = 0;
    var oldTouchBits = 0;
    var bitsToDir = [0, -1, 1, 0];
    var handleLeftRightTouch = function(bits) {
      if (bits == 0x1 || bits == 0x2) {
        oldTouchBits = bits ^ 0x3;
        sendDirCmd(bitsToDir[bits]);
      } else if (bits == 0x3) {
        sendDirCmd(bitsToDir[oldTouchBits]);
      } else {
        sendDirCmd(0);
      }
    };

    var handleLeftRightKeys = function(pressed, bit) {
      g_leftRight = (g_leftRight & ~bit) | (pressed ? bit : 0);
      if (g_leftRight != g_oldLeftRight) {
        g_oldLeftRight = g_leftRight;
        sendDirCmd((g_leftRight & 1) ? -1 : ((g_leftRight & 2) ? 1 : 0));
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
    keys[Input.cursorKeys.kLeft]  = function(e) { handleLeftRightKeys(e.pressed, 0x1); }
    keys[Input.cursorKeys.kRight] = function(e) { handleLeftRightKeys(e.pressed, 0x2); }
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

//window.addEventListener('orientationchange', function(e) {
//  g_update = true;
//}, false);

    var pointers = {
    };

    var setPointer = function(id, pos, pressed) {
      var pointer = pointers[id];
      if (!pointer) {
        pointer = { };
        pointers[id] = pointer;
      }
      pointer.pos = pos;
      if (pressed) {
        pointer.pressed = true;
      }
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
      setPointer(e.pointerId, pos, true);
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

    var getRainbowGradient = (function() {
      var rainbowGrad;
      var rainbowGradWidth;

      return function(width) {
        if (!rainbowGrad || width != rainbowGradWidth) {
          rainbowGradWidth = width;
          rainbowGrad = ctx.createLinearGradient(0.0, 0.0, width, 0);
          var baseHSV = g_avatar.baseHSV;
          for (var ii = 0; ii <= 12; ++ii) {
            var color = ImageUtils.hsvToRgb(
              (baseHSV[0] * 0 + ii / 12) % 1,
              1 /* baseHSV[1] */,
              1 /* baseHSV[2] */);
            rainbowGrad.addColorStop(ii / 12, "rgb(" + color.join(",") + ")");
          }
        }
        return rainbowGrad;
      };
    }());

    var inRect = function(ctx, width, height, x, y) {
      x = x || 0;
      y = y || 0;
      var inv = ctx.currentTransform.duplicate();
      inv.invert();
      ctx.save();
//      ctx.strokeStyle = "#0F0";
//      ctx.strokeRect(x, y, width, height);
      ctx.restore();
      for (var id in pointers) {
        if (pointers.hasOwnProperty(id)) {
          var p = pointers[id];
          if (p.pressed) {
            var pnt = inv.transformPoint(p.pos.x, p.pos.y);
            if (pnt[0] >= x && pnt[0] < x + width &&
                pnt[1] >= y && pnt[1] < y + height) {
              return {
                x: (pnt[0] - x) / width,
                y: (pnt[1] - y) / height,
              };
            }
          }
        }
      }
    };

    var drawRect = function(ctx, x, y, width, height) {
//      CanvasUtils.roundedRect(ctx, x, y, width, height, width / 10);
      var x2 = x + width;
      var y2 = y + height;
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x, y2);
      ctx.lineTo(x, y);
      ctx.closePath();
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

      ctx.fillStyle = "black";
      ctx.strokeStyle = "none";

      var inLeftButton = inRect(ctx, width / 2, height * 5, 0, -height * 2);
      ctx.fillStyle = inLeftButton ? "red" : "black";
      ctx.save();
      ctx.translate(20, height / 2);
      drawTriangle(ctx, (width - 40) * 0.45, height * 0.7);

      //if (width > 200) {
      //  ctx.translate(70, 0);
      //  drawTriangle(ctx, height * 0.6, height * 0.7);
      //}
      ctx.restore();

      var inRightButton = inRect(ctx, width / 2, height * 5, width / 2, -height * 2);
      ctx.fillStyle = inRightButton ? "red" : "black";
      ctx.save();
      ctx.translate(width - 20, height / 2);
      ctx.rotate(Math.PI);
      drawTriangle(ctx, (width - 40) * 0.45, height * 0.7);
      //if (width > 200) {
      //  ctx.translate(70, 0);
      //  drawTriangle(ctx, height * 0.6, height * 0.7);
      //}
      ctx.restore();

      return (inLeftButton ? 0x1 : 0x0) | (inRightButton ? 0x2 : 0x0);
    };

    var drawUpButton = function(ctx, width, height, depth) {
      drawDepthRect(ctx, width, height, depth, "black", "gray", metalGrad);
      var inButton = inRect(ctx, width, height * 5, 0, -height * 2);

      ctx.fillStyle = inButton ? "red" : "black";
      ctx.strokeStyle = "none";

      ctx.save();
      ctx.translate(width / 2, 20);
      ctx.rotate(Math.PI / 2);
      drawTriangle(ctx, height * 0.6, width * 0.7);
      ctx.restore();

      return inButton ? 0x4 : 0x0;
    };

    var drawLetterSelector = function(ctx, width, height, letter) {
      ctx.fillStyle = "#6C9";
      ctx.strokeStyle = 'black';

      ctx.beginPath();
      drawRect(ctx, -width / 2, -height / 2, width, height);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold " + (width * 0.8).toFixed(0) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "black";

      ctx.fillText(letter, 0, 2);

      var color = "#3C6";
      var hColor = "white";
      ctx.fillStyle = color;
      ctx.strokeStyle = "black";

      var buttonBits = 0;
      var tWidth = width * 0.9;

      ctx.save();
      ctx.translate(0, -width * 1.55);
      ctx.rotate(Math.PI / 2);
      var inTop = inRect(ctx, tWidth, tWidth, 0, -tWidth * 0.5);
      ctx.fillStyle = inTop ? hColor : color;
      drawTriangle(ctx, tWidth, tWidth);
      ctx.restore();

      ctx.save();
      ctx.translate(0, width * 1.55);
      ctx.rotate(-Math.PI / 2);
      var inBottom = inRect(ctx, tWidth, tWidth, 0, -tWidth * 0.5);
      ctx.fillStyle = inBottom ? hColor : color;
      drawTriangle(ctx, tWidth, tWidth);
      ctx.restore();

      return (inTop ? 0x1 : 0) | (inBottom ? 0x2 : 0);
    };

    var foo = 0;
    var render = function() {
//      ++foo;
//      window.scrollTo(0, foo % 2);
      g_update = hackedResizeBecauseFuckedupIOSSucksDonkeyShit(g_canvas) || g_update;

      if (window.orientation !== g_oldOrientation) {
        g_oldOrientation = window.orientation;
        g_update = true;
      }

      if (g_update) {
        g_update = false;
        g_elapsedTime = g_clock.getElapsedTime();

        var drawController = function() {
          var depth = 5;

          var xOffset  = 40;
          var innerWidth = Math.min(500, virtualWidth - xOffset * 2);
          var lrWidth  = innerWidth / 18 * (12 - 0.5);
          var lrHeight = 100;
          var lrX      = xOffset;
          var lrY      = virtualHeight - 40 - lrHeight;
          var upWidth  = innerWidth / 18 * (6 - 0.5);
          var upHeight = lrHeight;
          var upX      = virtualWidth - xOffset - upWidth;
          var upY      = lrY;

          var avatarWidth  = g_avatarImage.width;
          var avatarHeight = g_avatarImage.height;
          var avatarX = upX + upWidth / 2; //lrX + lrWidth + (upX - (lrX + lrWidth)) / 2;
          var avatarY = lrY - avatarHeight + 20;

          ctx.save();
          {
            ctx.translate(lrX + lrWidth / 2, avatarY + avatarWidth / 2);
            ctx.font = "bold 40px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "white";
            ctx.fillText("PTS:" + g_score, 0, 0);
          }
          ctx.restore();


          var buttonBits = 0;

          ctx.save();
          {
            ctx.translate(lrX, lrY);
            buttonBits |= drawLRButton(ctx, lrWidth, lrHeight, depth);
          }
          ctx.restore();

          ctx.save();
          {
            ctx.translate(upX, upY);
            buttonBits |= drawUpButton(ctx, upWidth, upHeight, depth);

            handleLeftRightTouch(buttonBits & 0x3);
            handleJump(buttonBits & 0x4);
          }
          ctx.restore();

          if (g_avatarImage) {
            ctx.save();
            ctx.translate(avatarX, avatarY);
            ctx.save();
//            ctx.scale(g_avatar.scale, g_avatar.scale);
//            ctx.scale(0.5, 0.5);
            ctx.drawImage(g_avatarImage, -avatarWidth / 2, 0);
            ctx.restore();

            g_points = g_points.filter(function(pnt) {
              return pnt.time < g_pointDuration;
            });

            // Draw points
            for (var ii = 0; ii < g_points.length; ++ii) {
              var pnt = g_points[ii];
              pnt.time += g_elapsedTime;
              var lerp = Math.min(1, pnt.time / g_pointDuration);
              ctx.font = "bold 40px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "rgba(255,255,255," + (1 - lerp) + ")";
              ctx.fillText(pnt.points,
                pnt.x + pnt.xv * pnt.time,
                pnt.y + pnt.yv * pnt.time)
            }

            if (g_points.length) {
              g_update = true;
            }

            ctx.restore();
          }

        };

        var drawBoldText = function(text, x, y) {
          ctx.font = "bold 40px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, x, y);
        };

        var adjustLetter = function(b, ndx) {
          var dir = ((b & 0x1) ? 1 : 0) + ((b & 0x2) ? -1 : 0);
          if (dir && g_oldLetter[ndx].oldDir != dir) {
            var letterCode = (globals.save.name.charCodeAt(ndx) + dir - 0x41 + 26) % 26 + 0x41;
            var letters = [globals.save.name.substr(0, 1), globals.save.name.substr(1, 1)];
            letters[ndx] = String.fromCharCode(letterCode);
            globals.save.name = letters[0] + letters[1];
            saveCookie();
          }
          g_oldLetter[ndx].oldDir = dir;
        };

        var selectAvatar = function(button, ndx, dir) {
          if (button && button != g_oldAvatarButton[ndx]) {
            globals.save.color.h = (globals.save.color.h + 1 + g_avatar.baseHSV[0]) % 1;
            globals.save.avatar = (globals.save.avatar + dir + avatars.length) % avatars.length;
            g_avatar = avatars[globals.save.avatar];
            globals.save.color.h = (globals.save.color.h + 1 - g_avatar.baseHSV[0]) % 1;
            makeAvatar();
          }
          g_oldAvatarButton[ndx] = button;
        };

        var drawOptionScreen = function() {

          var drawInitialsInput = function() {

            ctx.fillStyle = "white";
            drawBoldText("Initials", virtualWidth / 10 * 2, virtualHeight / 10 * 1);

            // letter left
            ctx.save();
              ctx.translate(virtualWidth / 10 * 1.1, virtualHeight / 2);
              var b = drawLetterSelector(ctx, width, height, globals.save.name.substr(0, 1));
              adjustLetter(b, 0);
            ctx.restore();

            // letter right
            ctx.save();
              ctx.translate(virtualWidth / 10 * 2.9, virtualHeight / 2);
              var b = drawLetterSelector(ctx, width, height, globals.save.name.substr(1, 1));
              adjustLetter(b, 1);
            ctx.restore();
          };

          var drawAvatarSelection = function() {

            ctx.fillStyle = "white";
            drawBoldText("Avatar", virtualWidth / 10 * 7, virtualHeight / 20 * 1);

            ctx.save();
            ctx.translate(0, -avatarHeight * 1.1);
            {
              ctx.translate(virtualWidth / 10 * 7, virtualHeight / 2);
              ctx.beginPath();
              drawRect(ctx, -avatarWidth / 2, -avatarHeight / 2, avatarWidth, avatarHeight);
              var color = "#24A";
              var hColor = "white";
              ctx.fillStyle = color;
              ctx.strokeStyle = "black";
              ctx.fill();
              ctx.stroke();

              // left avatar tri
              var tHeight = avatarWidth * 0.8;
              var tWidth  = tHeight * 0.9
              var offset = 1.33;
              ctx.save();
              {
                ctx.translate(-avatarWidth * offset, 0);
                var inLeft = inRect(ctx, tWidth, tHeight, 0, tHeight * -0.5);
                selectAvatar(inLeft, 0, -1);
                ctx.fillStyle = inLeft ? hColor : color;
                drawTriangle(ctx, tWidth, tHeight);
              }
              ctx.restore();

              // right avatar tri
              ctx.save();
              {
                ctx.translate(avatarWidth * offset, 0);
                ctx.rotate(Math.PI);
                var inRight = inRect(ctx, tWidth, tHeight, 0, tHeight * -0.5);
                selectAvatar(inRight, 1, 1);
                ctx.fillStyle = inRight ? hColor : color;
                drawTriangle(ctx, tWidth, tHeight);
              }
              ctx.restore();

              if (g_avatarImage) {
                ctx.save();
                {
                  drawAvatar(ctx);
                }
                ctx.restore();
              }

              ctx.save()
              {
                ctx.translate(-avatarWidth * 1.3, avatarHeight * 0.6);
                ctx.beginPath();
                var rWidth = avatarWidth * 2.6;
                var rHeight = avatarHeight * 0.8;
                var rYOff = avatarHeight / 10;
                var inHue = inRect(ctx, rWidth, rHeight, 0, rYOff);
                if (inHue) {
                  globals.save.color.h = (inHue.x + 1 - g_avatar.baseHSV[0]) % 1;
                  makeAvatar();
                }
                ctx.fillStyle = getRainbowGradient(rWidth);
                ctx.strokeStyle = "black";
                drawRect(ctx, 0, rYOff, rWidth, rHeight);
                ctx.fill();
                ctx.stroke();

                ctx.lineWidth = 5;
                ctx.beginPath();
                var adjustedHue = (globals.save.color.h + g_avatar.baseHSV[0]) % 1;
                ctx.translate(rWidth * adjustedHue, avatarHeight / 10);
                drawRect(ctx, -5, -5, 10, rHeight + 10);
//                drawRect(ctx, 0, 0, 1, rHeight);
                ctx.strokeStyle = "white";
                ctx.stroke();
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#444";
                ctx.stroke();
              }
              ctx.restore();
            }
            ctx.restore();

            return {
              left: inLeft,
              right: inRight,
              hue: inHue,
            }
          };

          var drawGoButton = function() {
            ctx.save();
            {
              ctx.translate(virtualWidth / 10 * 7, virtualHeight / 10 * 8.5);
              ctx.beginPath();
              var width = virtualWidth / 10 * 6 * 0.84;
              var height = virtualHeight / 10 * 2;
              drawRect(ctx, -width / 2, -height / 2, width, height);
              var inGo = inRect(ctx, width, height, -width / 2, -height / 2);
              ctx.fillStyle = inGo ? "white" : "#F80";
              ctx.strokeStyle = "black";
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = "white";
              ctx.strokeStyle = "black";
              drawBoldText("GO!", 0, 0);
            }
            ctx.restore();
            return inGo;
          };

          ctx.save();
          ctx.fillStyle = "#888";
          ctx.fillRect(0, 0, virtualWidth, virtualHeight);

          var xScale = virtualWidth / 456;
          var yScale = virtualHeight / 368;
          virtualWidth = 456;
          virtualHeight = 368;
          ctx.scale(xScale, yScale);

          var width = virtualWidth / 5 * 0.8;
          var height = width;
          var avatarWidth = width * 1.2;
          var avatarHeight = height * 1.2;

          ctx.fillStyle = "#444";
          ctx.fillRect(0, 0, virtualWidth / 10 * 4, virtualHeight);
          ctx.fillStyle = "#666";
          ctx.fillRect(virtualWidth / 10 * 4, 0, virtualWidth, virtualHeight / 10 * 7);
          ctx.fillStyle = "#000";
          ctx.fillRect(virtualWidth / 10 * 4, 0, 6, virtualHeight);
          ctx.fillRect(virtualWidth / 10 * 4, virtualHeight / 10 * 7, virtualWidth, 6);

          ctx.save();
          ctx.translate(0, virtualHeight / 20 + 1);
          drawInitialsInput();
          ctx.restore();

          ctx.save();
          ctx.translate(0, virtualHeight / 20 + 1);
          drawAvatarSelection();
          ctx.restore();

          var inGo =drawGoButton();

          ctx.restore();
          return inGo;
        };


        ctx.fillStyle = "blue";
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);


//        ctx.fillStyle = "yellow";
//        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//        ctx.fillRect(5, 5, ctx.canvas.width - 10, ctx.canvas.height - 10);

        // orientation:   0 = portrait
        //              -90 = rotate left
        //               90 = rotate right

        ctx.save();
        {
          var virtualWidth;
          var virtualHeight;
          var extraFuckedIPhoneYOffset = 0;
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

              if (MobileHacks.isIOS8OrNewerAndiPhone4OrIPhone5 && virtualHeight == 320) {
                virtualHeight -= 90;
              } else if (isIOS) {
                virtualHeight -= 45;
              }
              //ctx.translate(ctx.canvas.width - 1, ctx.canvas.height - 1);
              //ctx.rotate(Math.PI);
              break;
            default:  // rotate left
              virtualWidth = ctx.canvas.width;
              virtualHeight = ctx.canvas.height;
              break;
          }

          ctx.virtualWidth = virtualWidth;
          ctx.virtualHeight = virtualHeight;

          switch (g_state) {
            case "select":
              if (drawOptionScreen()) {
                g_client.sendCmd('go', globals.save);
                g_state = "control";
              }
              break;
            case "control":
              ctx.save()
              {
                ctx.translate(0, extraFuckedIPhoneYOffset);
                drawController();
              }
              ctx.restore();
              break;
          }

          //   ctx.fillStyle = "red";
          //   Object.keys(pointers).forEach(function(id) {
          //     var p = pointers[id];
          //     if (p.pressed) {
          //       ctx.fillRect(p.pos.x - 5, p.pos.y - 5, 10, 10);
          //     }
          //   });

        }
        ctx.restore();

//        ctx.fillStyle = "black";
//        ctx.fillRect(0, 80, ctx.canvas.width, 60);
//        ctx.fillStyle = "white";
//        ctx.font = "10px monospace";
//        var s = "w:" + window.innerWidth + "," + window.innerHeight + " s:" + window.screenX + "," + window.screenY +
//          " atl: " +   window.screen.availLeft + "," + window.screen.availTop + " awh: " + window.screen.availWidth + "," + window.screen.availHeight +
//          " or: " + window.orientation + " po:" + window.pageXOffset + "," + window.pageYOffset +
//          " sc: " + window.scrollX + "," + window.scrollY;
//        ctx.fillText(s, 10, 100);
//        var s = "fc:" + document.hasFocus();
//        ctx.fillText(s, 10, 120);
//      //        ctx.fillText(JSON.stringify(pointers), 10, 120);


        ctx.validateTransformStack();
      }
      requestAnimationFrame(render);
    };
    render();
//  handleDone({places:[20,34,12], score: 1234});
  };

  // You can generate this image with makeimage.html
  var images = {
    avatars: { url: "assets/avatars/avatars.png" },
  };

  ImageLoader.loadImages(images, startClient);
  return {};
});


