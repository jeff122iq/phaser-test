let config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: {y: 0}
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);

function preload() {
    this.load.image("airplane", "assets/F4f-4.png")
    this.load.image("otherPlayer", "assets/Tbm-3.png")
}

function create() {
    let self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });
    this.socket.on('newPlayer', function (playerInfo) {
        addOtherPlayers(self, playerInfo);
    });
    this.socket.on('disconnect', function (playerId) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
            }
        });
    });
    this.socket.on('playerMoved', function (playerInfo) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
                otherPlayer.setRotation(playerInfo.rotation);
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            }
        });
    });
    this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
    if (this.airplane) {
        if (this.cursors.left.isDown) {
            this.airplane.setAngularVelocity(-150);
        } else if (this.cursors.right.isDown) {
            this.airplane.setAngularVelocity(150);
        } else {
            this.airplane.setAngularVelocity(0);
        }

        if (this.cursors.up.isDown) {
            this.physics.velocityFromRotation(this.airplane.rotation - 1.5, 100, this.airplane.body.acceleration);
        } else if (this.cursors.down.isDown) {
            this.physics.velocityFromRotation(this.airplane.rotation + 1.5, 100, this.airplane.body.acceleration);
        } else {
            this.airplane.setAcceleration(0);
        }

        this.physics.world.wrap(this.airplane, 5);
        let x = this.airplane.x;
        let y = this.airplane.y;
        let r = this.airplane.rotation;
        if (this.airplane.oldPosition && (x !== this.airplane.oldPosition.x || y !== this.airplane.oldPosition.y || r !== this.airplane.oldPosition.rotation)) {
            this.socket.emit('playerMovement', { x: this.airplane.x, y: this.airplane.y, rotation: this.airplane.rotation });
        }
        this.airplane.oldPosition = {
            x: this.airplane.x,
            y: this.airplane.y,
            rotation: this.airplane.rotation
        };
    }

}

function addPlayer(self, playerInfo) {
    self.airplane = self.physics.add.image(playerInfo.x, playerInfo.y, 'airplane').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
        self.airplane.setTint(0x0000ff);
    } else {
        self.airplane.setTint(0xff0000);
    }
    self.airplane.setDrag(100);
    self.airplane.setAngularDrag(100);
    self.airplane.setMaxVelocity(200);
}

function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
        otherPlayer.setTint(0x0000ff);
    } else {
        otherPlayer.setTint(0xff0000);
    }
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
}
