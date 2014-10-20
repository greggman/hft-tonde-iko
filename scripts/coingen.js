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
    '../bower_components/hft-utils/dist/2d',
  ], function(
    Misc, M2D) {

  /**
   * CoinGen represnt a coin that regenerates.
   * @constructor
   */
  var CoinGen = (function() {
    return function(services, data) {
      this.services = services;
      this.data = data;
      var globals = services.globals;

      services.entitySystem.addEntity(this);
      services.drawSystem.addEntity(this);

      this.animTimer = 0;
      this.anim = this.services.images.gem.frames;
      this.animSpeed = globals.coinAnimSpeed + Math.random() * globals.coinAnimSpeedRange;

      var levelManager = this.services.levelManager;
      var level = levelManager.getLevel();

      this.width = level.tileWidth;
      this.height = level.tileHeight;

      this.sprites = [];
      for (var ii = 0; ii < 3; ++ii) {
        var sprite = this.services.spriteManager.createSprite();
        this.sprites.push(sprite);
      }
      this.position = [
        (data.tx + 0.5) * level.tileWidth,
        (data.ty + 1) * level.tileHeight
      ];

      this.setState("idle");
    };
  }());

  CoinGen.prototype.setVisible = function(visible) {
    this.visible = visible;
    this.sprites.forEach(function(sprite) {
      sprite.visible = visible;
    });
  };

  CoinGen.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
    this.drawFn = this["draw_" + state] || this.defaultDraw;
  };

  CoinGen.prototype.checkCollected = function() {
    if (!this.checkPlayer) {
      this.checkPlayer = function(player) {
        var dx = player.position[0] - this.position[0];
        var dy = player.position[1] - this.position[1];
        var distSq = dx * dx + dy * dy;
        var radiusSq = 16 * 16;
        if (distSq < radiusSq) {
          this.setState("collected");
          player.addPoints(10);
          return true;
        }
      }.bind(this);
    }
    this.services.playerManager.forEachPlayer(this.checkPlayer);
  };

  CoinGen.prototype.init_collected = function() {
    this.collectTime = 0;
    this.services.audioManager.playSound('coin');
    this.setVisible(true);
  };

  CoinGen.prototype.state_collected = function() {
    var globals = this.services.globals;
    this.animTime += globals.elapsedTime * this.animSpeed;
    this.collectTime += globals.elapsedTime;
    if (this.collectTime > 0.125) {
      this.setState("off");
    }
  };

  CoinGen.prototype.draw_collected = function(ctx) {
    var spriteRenderer = this.services.spriteRenderer;
    var frameNumber = Math.floor(this.animTimer % this.anim.length);
    var img = this.anim[frameNumber];
    var off = {};
    this.services.levelManager.getDrawOffset(off);

    var numSprites = this.sprites.length;
    var start = -(numSprites / 2 | 0);
    for (var ii = 0; ii < numSprites; ++ii) {
      var sprite = this.sprites[ii];
      var b = ii - start;
      var a = -Math.PI / 4 + (ii / (numSprites - 1)) * Math.PI / 2;
      var x =  Math.sin(a) * 512 * this.collectTime;
      var y = -Math.cos(a) * 512 * this.collectTime;
      sprite.uniforms.u_texture = img;
      sprite.x = off.x + x + this.position[0];
      sprite.y = off.y + y + this.position[1] - this.height / 2;
      sprite.width = this.width;
      sprite.height = this.height;
    }
  };

  CoinGen.prototype.init_idle = function() {
    this.setVisible(false);
    this.sprites[0].visible = true;
    this.visible = true;
  };
  CoinGen.prototype.state_idle = function() {
    var globals = this.services.globals;
    this.animTimer += globals.elapsedTime * this.animSpeed;

    if (this.checkCollected()) {
      this.setState("collected");
      return;
    }
  };


  CoinGen.prototype.init_off = function() {
    this.setVisible(false);
    this.collectTime = 0;
  };

  CoinGen.prototype.state_off = function() {
    this.collectTime += this.services.globals.elapsedTime;
    if (this.collectTime > 2) {
      this.setState("idle");
    }
  };

  CoinGen.prototype.chooseNewPosition = function() {
    var levelManager = this.services.levelManager;
    var position = levelManager.getRandomOpenPosition();
    this.position = [position.x, position.y];
    this.velocity = [0, 0];
    this.falling = true;
    this.setState("fall");
  };

  CoinGen.prototype.defaultDraw = function(ctx) {
    var globals = this.services.globals;
    var spriteRenderer = this.services.spriteRenderer;
    var images = this.services.images;
    var frameNumber = Math.floor(this.animTimer % this.anim.length);
    var img = this.anim[frameNumber];

    var off = {};
    this.services.levelManager.getDrawOffset(off);

    var sprite = this.sprites[0];
    sprite.uniforms.u_texture = img;
    sprite.x = off.x + (this.position[0]                  ) * globals.scale;
    sprite.y = off.y + (this.position[1] - this.height / 2) * globals.scale;
    sprite.width  = this.width  * globals.scale;
    sprite.height = this.height * globals.scale;
  };

  CoinGen.prototype.draw = function(ctx) {
    if (this.visible) {
      this.drawFn(ctx);
    }
  };

  return CoinGen;
});

