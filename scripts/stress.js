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
  [ 'hft/commonui',
    'hft/gameclient',
    'hft/misc/input',
    'hft/misc/misc',
    'hft/misc/mobilehacks',
    'hft/misc/touch',
    './avatars',
  ], function(
    CommonUI,
    GameClient,
    Input,
    Misc,
    MobileHacks,
    Touch,
    avatars) {
  var g_client;

  function $(id) {
    return document.getElementById(id);
  }

  var globals = {
    debug: false,
    numFakes: 25,
    fakes: [],
  };
  Misc.applyUrlSettings(globals);
  MobileHacks.fixHeightHack();

  var FakePlayer = function() {
    var g_client = new GameClient();
    g_client.sendCmd('go', {
      avatar: Misc.randInt(avatars.length),
      name: String.fromCharCode(Misc.randInt(26) + 0x41, Misc.randInt(26) + 0x41),
      color: {
        h: Math.random(),
        s: 0,
        v: 0,
      },
    });

    var handleScore = function() {
    };

    var handleDone = function() {
    };

    var handleConnect = function() {
    };

    g_client.addEventListener('connect', handleConnect);
    g_client.addEventListener('score', handleScore);
    g_client.addEventListener('done', handleDone);

    var dirTable = [0, 1, -1];
    setInterval(function() {
      var i = Misc.randInt(4);
      switch (i) {
        case 0:
        case 1:
        case 2:
          g_client.sendCmd('move', {
              dir: dirTable[i],
          });
          break;
        case 3:
          g_client.sendCmd('jump', {
            jump: Math.random() > 0.5,
          });
          break;
      }
    }, 20);

    this.client = g_client;
  };


  var startClient = function() {

    for (var ii = 0; ii < globals.numFakes; ++ii) {
      globals.fakes.push(new FakePlayer());
    };

    CommonUI.setupStandardControllerUI(globals.fakes[0].client, globals);

    //var g_oldDir;
    //var sendDirCmd = function(dir) {
    //  if (dir !== g_oldDir) {
    //    g_oldDir = dir;
    //    g_client.sendCmd('move', {
    //        dir: dir,
    //    });
    //  }
    //};
    //
    //var newestTouchBits = 0;
    //var oldTouchBits = 0;
    //var bitsToDir = [0, -1, 1, 0];
    //var handleLeftRightTouch = function(bits) {
    //  if (bits == 0x1 || bits == 0x2) {
    //    oldTouchBits = bits ^ 0x3;
    //    sendDirCmd(bitsToDir[bits]);
    //  } else if (bits == 0x3) {
    //    sendDirCmd(bitsToDir[oldTouchBits]);
    //  } else {
    //    sendDirCmd(0);
    //  }
    //};
    //
    //var handleLeftRightKeys = function(pressed, bit) {
    //  g_leftRight = (g_leftRight & ~bit) | (pressed ? bit : 0);
    //  if (g_leftRight != g_oldLeftRight) {
    //    g_oldLeftRight = g_leftRight;
    //    sendDirCmd((g_leftRight & 1) ? -1 : ((g_leftRight & 2) ? 1 : 0));
    //  }
    //};
    //
    //var handleJump = function(pressed) {
    //  if (g_jump != pressed) {
    //    g_jump = pressed;
    //    g_client.sendCmd('jump', {
    //        jump: pressed,
    //    });
    //  }
    //};
  };

  startClient();
});


