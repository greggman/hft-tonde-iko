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
    'hft/misc/strings',
  ], function(
    Strings
  ) {
  /**
   * Manages the high score list.
   */

  function ScoreManager(services, topTodayElement, topHourElement, top10Mins) {
    this.services = services;
    this.maxScores_ = 6;
    this.orderedPlayers_ = [];
    this.zeros_ = "";

    this.tops = [
      { element: topTodayElement,
        timeLimit: 60 * 60 * 24,
        players: [],
        lines: [],
      },
      { element: topHourElement,
        timeLimit: 60 * 60,
        players: [],
        lines: [],
      },
      { element: top10Mins,
        timeLimit: 60 * 10,
        players: [],
        lines: [],
      },
    ];

    this.tops.forEach(function(top) {
      for (var ii = 0; ii < this.maxScores_; ++ii) {
        var line = this.createScoreLine();
        top.element.appendChild(line.line);
        top.lines.push(line);
        line.setName(ii & 1 ? "WW" : "ii");
        line.setMsg(": " + Strings.padLeft(Math.pow(7,ii + 1), 7, "0"));
        line.ctx.drawImage(this.services.images.idle.frames[0].img, 0, 0);
      }
    }.bind(this));
  }

  ScoreManager.prototype.createScoreLine = function(player, color) {
    return this.createElement(player, color);
  };

  ScoreManager.prototype.deleteScoreLine = function(scoreLine) {
    this.deleteElement(scoreLine);
  };

  ScoreManager.prototype.calculateScores = function() {
    var orderedPlayers = [];
    var maxScore = 0;
    this.services.playerManager.forEachPlayer(function(player) {
      orderedPlayers.push(player);
      maxScore = Math.max(maxScore, player.score);
    });

    orderedPlayers.sort(function(a, b) {
      if (a.score > b.score)
        return -1;
      else if (a.score < b.score)
        return 1;
      else if (a.playerName < b.playerName)
        return -1;
      else
        return 1;
    });

    if (orderedPlayers.length > this.maxScores_) {
      orderedPlayers.length = this.maxScores_;
    }

    var numDigits = maxScore.toString().length;
    if (numDigits < this.zeros_.length) {
      this.zeros_ = this.zeros_.substr(0, numDigits);
    } else {
      while (this.zeros_.length < numDigits) {
        this.zeros_ += "0";
      }
    }

    this.orderedPlayers_ = orderedPlayers;
  };

  ScoreManager.prototype.drawScores = function() {
    // remove all the elements.
    while (this.element_.firstChild) {
      this.element_.removeChild(this.element_.firstChild);
    }

    // Add back all the elements in the current order
    for (var ii = 0; ii < this.orderedPlayers_.length; ++ii) {
      var player = this.orderedPlayers_[ii];
      this.element_.appendChild(player.scoreLine.line);
    }
  };

  ScoreManager.prototype.update = function() {
    this.calculateScores();
    this.drawScores();
  };

  ScoreManager.prototype.createElement = function() {
    var line = document.createElement("div");
    line.className = "scoreline";
    var span = document.createElement("div");
    span.className = "scorespan";
    var img = document.createElement("canvas");
    img.width = 32;
    img.height = 32;
    var ctx = img.getContext("2d");
    var info = document.createElement("div");
    info.className = "info";
    var name = document.createElement("span");
    var nameNode = document.createTextNode("");
    name.className = "name";
    var msg = document.createElement("span");
    var msgNode = document.createTextNode("");
    msg.className = "msg";
    msg.appendChild(msgNode);
    name.appendChild(nameNode);
    info.appendChild(name);
    info.appendChild(msg);
    line.appendChild(span);
    line.appendChild(img);
    line.appendChild(info);
    var element = {
      line: line,
      span: span,
      img: img,
      ctx: ctx,
      msg: msg,
      msgNode: msgNode,
      name: name,
      nameNode: nameNode,
      setName: function(s) {
        nameNode.nodeValue = s;
      },
      setMsg: function(s) {
        msgNode.nodeValue = s;
      },
    };
    if (!this.elementHeight_) {
      this.elementHeight_ = line.clientHeight;
    }
    return element;
  };

  ScoreManager.prototype.deleteElement = function(element) {
    if (element.line.parentNode) {
      element.line.parentNode.removeChild(element.line);
    }
  };

  return ScoreManager;
});

