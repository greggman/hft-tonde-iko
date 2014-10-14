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
   * DoorSwitch
   * @constructor
   */
  var DoorSwitch = function(services, door, data) {
    this.services = services;
    this.door = door;
    var globals = services.globals;

    services.entitySystem.addEntity(this);
    services.drawSystem.addEntity(this);

    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    this.width = level.tileWidth;
    this.height = level.tileHeight;
    this.position = [
      (data.tx + 0.5) * level.tileWidth,
      (data.ty +   1) * level.tileHeight
    ];

    this.anim = this.services.images.switch.frames;
    this.sprite = this.services.spriteManager.createSprite();
    this.sprite.uniforms.u_hsvaAdjust = [data.tileInfo.id / 3, 0, 0, 0];
    this.setState("up");
  };

  DoorSwitch.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  DoorSwitch.prototype.init_up = function() {
  };

  DoorSwitch.prototype.state_up = function() {
  };

  DoorSwitch.prototype.draw = function(ctx) {
    var globals = this.services.globals;
    var spriteRenderer = this.services.spriteRenderer;
    var images = this.services.images;
    var img = this.anim[0];

    var sprite = this.sprite;
    sprite.uniforms.u_texture = img;
    sprite.x = globals.drawOffset.x + (this.position[0]                  ) * globals.scale;
    sprite.y = globals.drawOffset.y + (this.position[1] - this.height / 2) * globals.scale;
    sprite.width  = this.width  * globals.scale;
    sprite.height = this.height * globals.scale;
  };

  /**
   * Door
   * @constructor
   */
  var Door = function(services, data) {
    this.services = services;
    var globals = services.globals;

    services.entitySystem.addEntity(this);
    services.drawSystem.addEntity(this);

    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    this.width = level.tileWidth;
    this.height = level.tileHeight * 2;
    this.position = [
      (data.tx + 0.5) * level.tileWidth,
      (data.ty +   1) * level.tileHeight
    ];

    // Find the corresponding swtich
    var switches = level.getThings("switch");
    var sw = switches[data.tileInfo.id];
    if (!sw) {
      return this.kill("Missing switch for door id: " + data.tileInfo.id);
    } else if (sw.length > 1) {
      return this.kill("Too many switches for door id: " + data.tileInfo.id)
    }

    this.doorSwitch = new DoorSwitch(services, this, sw[0]);


    this.anim = this.services.images.door.frames;
    this.sprite = this.services.spriteManager.createSprite();
    this.sprite.uniforms.u_hsvaAdjust = [data.tileInfo.id / 3, 0, 0, 0];
    this.setState("closed");
  };

  Door.prototype.kill = function(msg) {
    this.process = function() {};
    this.draw = function() {};
    services.gameSupport.log(msg);
  };

  Door.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  Door.prototype.init_closed = function() {
  };

  Door.prototype.state_closed = function() {
  };

  Door.prototype.draw = function(ctx) {
    var globals = this.services.globals;
    var spriteRenderer = this.services.spriteRenderer;
    var images = this.services.images;
    var img = this.anim[0];

    var sprite = this.sprite;
    sprite.uniforms.u_texture = img;
    sprite.x = globals.drawOffset.x + (this.position[0]                  ) * globals.scale;
    sprite.y = globals.drawOffset.y + (this.position[1] - this.height / 2) * globals.scale;
    sprite.width  = this.width  * globals.scale;
    sprite.height = this.height * globals.scale;
  };

  return Door;
});

